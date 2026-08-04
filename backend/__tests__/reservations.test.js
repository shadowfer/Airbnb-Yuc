const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Property, Availability, Reservation } = require('../src/models');
const { generateToken } = require('../src/utils/tokenUtils');

require('dotenv').config();
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Reservations API Integration Tests', () => {
  let hostUser, guestUser;
  let hostToken, guestToken;
  let createdProperty;

  beforeEach(async () => {
    await Availability.destroy({ where: {}, force: true });
    await Reservation.destroy({ where: {}, force: true });
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    hostUser = await User.create({
      firstName: 'Carlos',
      lastName: 'Anfitrion',
      email: 'host@reservations.com',
      password: 'password123',
      role: 'host',
    });
    hostToken = generateToken(hostUser);

    guestUser = await User.create({
      firstName: 'Maria',
      lastName: 'Huesped',
      email: 'guest@reservations.com',
      password: 'password123',
      role: 'guest',
    });
    guestToken = generateToken(guestUser);

    createdProperty = await Property.create({
      hostId: hostUser.id,
      title: 'Villa Tropical en Tulum',
      description: 'Lujosa villa con alberca privada.',
      propertyType: 'villa',
      address: 'Zona Hotelera Km 5',
      city: 'Tulum',
      country: 'México',
      lat: 20.1234,
      lng: -87.1234,
      pricePerNight: 2000.00,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      status: 'active',
    });
  });

  describe('POST /api/reservations', () => {
    test('crea reservación exitosamente y bloquea fechas en disponibilidad', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: createdProperty.id,
          checkIn: '2026-08-10',
          checkOut: '2026-08-13',
          guestsCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reservation.status).toBe('confirmed');
      expect(parseFloat(res.body.reservation.totalPrice)).toBe(6720.00); // 3 noches x 2000 = 6000 + 12% (720) = 6720

      // Verify availability records created for 3 nights (10, 11, 12)
      const blockedDates = await Availability.findAll({
        where: { propertyId: createdProperty.id },
      });
      expect(blockedDates.length).toBe(3);
      expect(blockedDates.map((b) => b.reason).every((r) => r === 'reservation')).toBe(true);
    });

    test('rechaza si las fechas ya están bloqueadas', async () => {
      await Availability.create({
        propertyId: createdProperty.id,
        blockedDate: '2026-08-11',
        reason: 'host_block',
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: createdProperty.id,
          checkIn: '2026-08-10',
          checkOut: '2026-08-13',
          guestsCount: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ya no están disponibles');
    });

    test('anfitrión no puede reservar su propia propiedad', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          propertyId: createdProperty.id,
          checkIn: '2026-08-10',
          checkOut: '2026-08-13',
          guestsCount: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('propia propiedad');
    });
  });

  describe('GET /api/reservations/my', () => {
    test('obtiene la lista de reservaciones del huésped autenticado', async () => {
      await Reservation.create({
        guestId: guestUser.id,
        propertyId: createdProperty.id,
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        guestsCount: 2,
        pricePerNight: 2000.00,
        subtotal: 4000.00,
        serviceFee: 480.00,
        totalPrice: 4480.00,
        status: 'confirmed',
      });

      const res = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reservations.length).toBe(1);
      expect(res.body.reservations[0].property.title).toBe('Villa Tropical en Tulum');
    });
  });

  describe('PATCH /api/reservations/:id/cancel', () => {
    test('cancela la reservación y libera las fechas en disponibilidad', async () => {
      const reservation = await Reservation.create({
        guestId: guestUser.id,
        propertyId: createdProperty.id,
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        guestsCount: 2,
        pricePerNight: 2000.00,
        subtotal: 4000.00,
        serviceFee: 480.00,
        totalPrice: 4480.00,
        status: 'confirmed',
      });

      await Availability.bulkCreate([
        { propertyId: createdProperty.id, blockedDate: '2026-08-10', reason: 'reservation', reservationId: reservation.id },
        { propertyId: createdProperty.id, blockedDate: '2026-08-11', reason: 'reservation', reservationId: reservation.id },
      ]);

      const res = await request(app)
        .patch(`/api/reservations/${reservation.id}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Cambio de planes' });

      expect(res.status).toBe(200);
      expect(res.body.reservation.status).toBe('cancelled');

      // Verify availability records are deleted
      const remainingAvail = await Availability.findAll({
        where: { reservationId: reservation.id },
      });
      expect(remainingAvail.length).toBe(0);
    });
  });
});
