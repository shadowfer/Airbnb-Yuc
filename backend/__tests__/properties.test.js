const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Property } = require('../src/models');
const { generateToken } = require('../src/utils/tokenUtils');

require('dotenv').config();
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Properties CRUD API', () => {
  let hostUser, guestUser, otherHostUser;
  let hostToken, guestToken, otherHostToken;
  let createdProperty;

  beforeEach(async () => {
    // Clean up
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test users
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

    otherHostUser = await User.create({
      firstName: 'Otro',
      lastName: 'Host',
      email: 'otherhost@test.com',
      password: 'password123',
      role: 'host',
    });
    otherHostToken = generateToken(otherHostUser);

    // Initial property for detail/edit/delete tests
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
      houseRules: 'No fumar dentro de la cabaña. Horas de silencio a partir de las 10 PM.',
      status: 'active',
    });
  });

  describe('POST /api/properties', () => {
    const validPropertyData = {
      title: 'Apartamento de Lujo con Vista al Mar',
      description: 'Lujoso apartamento de 3 habitaciones frente a la playa.',
      propertyType: 'apartment',
      address: 'Av. Costera 100',
      city: 'Cancún',
      state: 'Quintana Roo',
      country: 'México',
      lat: 21.1234567,
      lng: -86.1234567,
      pricePerNight: 3500.00,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 3,
      amenities: ['wifi', 'pool', 'parking', 'ac'],
      houseRules: 'No se permiten fiestas.',
    };

    test('permite crear una propiedad si el usuario es anfitrion (host)', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.property).toBeDefined();
      expect(res.body.property.title).toBe(validPropertyData.title);
      expect(res.body.property.hostId).toBe(hostUser.id);
      expect(res.body.property.status).toBe('active');
    });

    test('rechaza la creacion si el usuario es huesped (guest)', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validPropertyData);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('rechaza la creacion si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ title: 'Solo Titulo' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('rechaza si el precio por noche es menor o igual a 0', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ ...validPropertyData, pricePerNight: 0 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/properties/my', () => {
    test('obtiene las propiedades del anfitrion autenticado', async () => {
      const res = await request(app)
        .get('/api/properties/my')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.properties).toBeDefined();
      expect(res.body.properties.length).toBe(1);
      expect(res.body.properties[0].id).toBe(createdProperty.id);
    });

    test('retorna vacio si el anfitrion no tiene propiedades', async () => {
      const res = await request(app)
        .get('/api/properties/my')
        .set('Authorization', `Bearer ${otherHostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBe(0);
    });
  });

  describe('GET /api/properties/:id', () => {
    test('retorna el detalle publico de la propiedad por id', async () => {
      const res = await request(app)
        .get(`/api/properties/${createdProperty.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.property.title).toBe(createdProperty.title);
      expect(res.body.property.host).toBeDefined();
      expect(res.body.property.host.email).toBe(hostUser.email);
    });

    test('retorna 404 si la propiedad no existe', async () => {
      const res = await request(app)
        .get('/api/properties/99999');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/properties/:id', () => {
    test('permite actualizar la propiedad si el usuario es el dueño (host)', async () => {
      const res = await request(app)
        .put(`/api/properties/${createdProperty.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ title: 'Titulo Actualizado', pricePerNight: 1500.00 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.property.title).toBe('Titulo Actualizado');
      expect(Number(res.body.property.pricePerNight)).toBe(1500); 
    });

    test('rechaza la actualizacion si el usuario no es el dueño', async () => {
      const res = await request(app)
        .put(`/api/properties/${createdProperty.id}`)
        .set('Authorization', `Bearer ${otherHostToken}`)
        .send({ title: 'Intento de Hackeo' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/properties/:id', () => {
    test('realiza soft delete de la propiedad (marca status como deleted)', async () => {
      const res = await request(app)
        .delete(`/api/properties/${createdProperty.id}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify detail is no longer accessible
      const detailRes = await request(app)
        .get(`/api/properties/${createdProperty.id}`);
      expect(detailRes.status).toBe(404);
    });
  });
});
