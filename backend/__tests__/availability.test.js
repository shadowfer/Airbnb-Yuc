const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Property, Availability, Review } = require('../src/models');
const { generateToken } = require('../src/utils/tokenUtils');

require('dotenv').config();
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Availability & Search Integration Tests', () => {
  let hostUser, guestUser;
  let hostToken, guestToken;
  let createdProperty;

  beforeEach(async () => {
    await Availability.destroy({ where: {}, force: true });
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    hostUser = await User.create({
      firstName: 'Anfitrion',
      lastName: 'Perez',
      email: 'host@test.com',
      password: 'password123',
      role: 'host',
    });
    hostToken = generateToken(hostUser);

    guestUser = await User.create({
      firstName: 'Huesped',
      lastName: 'Gomez',
      email: 'guest@test.com',
      password: 'password123',
      role: 'guest',
    });
    guestToken = generateToken(guestUser);

    createdProperty = await Property.create({
      hostId: hostUser.id,
      title: 'Hermosa Cabaña del Bosque',
      description: 'Disfruta de la tranquilidad del bosque en esta cabaña acogedora.',
      propertyType: 'cabin',
      address: 'Km 12 Carretera Central',
      city: 'Valle de Bravo',
      state: 'Estado de México',
      country: 'México',
      lat: 19.1234567,
      lng: -99.1234567,
      pricePerNight: 1200.00,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['wifi', 'parking', 'kitchen'],
      houseRules: 'No fumar.',
      status: 'active',
    });
  });

  describe('GET /api/availability/:propertyId', () => {
    test('obtiene las fechas bloqueadas para una propiedad', async () => {
      await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-01',
        reason: 'host_block',
      });

      const res = await request(app)
        .get(`/api/availability/${createdProperty.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.blockedDates.length).toBe(1);
      expect(res.body.blockedDates[0].blockedDate).toBe('2026-07-01');
    });
  });

  describe('POST /api/availability', () => {
    test('permite bloquear fechas si el usuario es el dueño', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          propertyId: createdProperty.id,
          dates: ['2026-07-01', '2026-07-02'],
          reason: 'host_block',
        });

      expect(res.status).toBe(201);
      expect(res.body.created).toBe(2);
      expect(res.body.skipped).toBe(0);

      const dbRecords = await Availability.findAll({ where: { propertyId: createdProperty.id } });
      expect(dbRecords.length).toBe(2);
    });

    test('ignora fechas duplicadas silenciosamente', async () => {
      await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-01',
        reason: 'host_block',
      });

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          propertyId: createdProperty.id,
          dates: ['2026-07-01', '2026-07-02'],
          reason: 'host_block',
        });

      expect(res.status).toBe(201);
      expect(res.body.created).toBe(1);
      expect(res.body.skipped).toBe(1);
    });

    test('prohibe bloquear fechas si el usuario no es el dueño', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: createdProperty.id,
          dates: ['2026-07-01'],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/availability/:id', () => {
    test('desbloquea una fecha manual', async () => {
      const record = await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-01',
        reason: 'host_block',
      });

      const res = await request(app)
        .delete(`/api/availability/${record.id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      const exists = await Availability.findByPk(record.id);
      expect(exists).toBeNull();
    });

    test('prohíbe desbloquear si la fecha tiene una reserva activa', async () => {
      const record = await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-01',
        reason: 'reservation',
      });

      const res = await request(app)
        .delete(`/api/availability/${record.id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/availability/:propertyId/check', () => {
    test('confirma disponibilidad si rango está libre', async () => {
      const res = await request(app)
        .get(`/api/availability/${createdProperty.id}/check`)
        .query({ checkIn: '2026-07-01', checkOut: '2026-07-05' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    test('retorna conflictDates si rango está ocupado', async () => {
      await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-02',
        reason: 'host_block',
      });

      const res = await request(app)
        .get(`/api/availability/${createdProperty.id}/check`)
        .query({ checkIn: '2026-07-01', checkOut: '2026-07-05' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.conflictDates).toContain('2026-07-02');
    });
  });

  describe('GET /api/properties/search', () => {
    test('excluye propiedades con solapamientos de fechas', async () => {
      // Bloquear una fecha de la propiedad
      await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-07-02',
        reason: 'host_block',
      });

      // Búsqueda con rango que incluye el 07-02
      const res = await request(app)
        .get('/api/properties/search')
        .query({ checkIn: '2026-07-01', checkOut: '2026-07-05' });

      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBe(0);

      // Búsqueda con rango que NO incluye el 07-02
      const resFree = await request(app)
        .get('/api/properties/search')
        .query({ checkIn: '2026-07-10', checkOut: '2026-07-15' });

      expect(resFree.status).toBe(200);
      expect(resFree.body.properties.length).toBe(1);
    });
  });
});
