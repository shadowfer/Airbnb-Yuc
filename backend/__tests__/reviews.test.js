const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Property, Reservation, Review } = require('../src/models');
const { generateToken } = require('../src/utils/tokenUtils');

require('dotenv').config();
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Reviews API Integration Tests', () => {
  let hostUser, guestUser;
  let hostToken, guestToken;
  let createdProperty, confirmedReservation;

  beforeEach(async () => {
    await Review.destroy({ where: {}, force: true });
    await Reservation.destroy({ where: {}, force: true });
    await Property.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    hostUser = await User.create({
      firstName: 'Lucia',
      lastName: 'Mendoza',
      email: 'host@reviews.com',
      password: 'password123',
      role: 'host',
    });
    hostToken = generateToken(hostUser);

    guestUser = await User.create({
      firstName: 'Mateo',
      lastName: 'Lopez',
      email: 'guest@reviews.com',
      password: 'password123',
      role: 'guest',
    });
    guestToken = generateToken(guestUser);

    createdProperty = await Property.create({
      hostId: hostUser.id,
      title: 'Casa Maya en Mérida',
      description: 'Hermosa propiedad colonial en el centro histórico.',
      propertyType: 'house',
      address: 'Calle 60 #450',
      city: 'Mérida',
      country: 'México',
      lat: 20.9676,
      lng: -89.6237,
      pricePerNight: 1500.00,
      maxGuests: 4,
      status: 'active',
    });

    confirmedReservation = await Reservation.create({
      guestId: guestUser.id,
      propertyId: createdProperty.id,
      checkIn: '2026-05-01',
      checkOut: '2026-05-05',
      guestsCount: 2,
      pricePerNight: 1500.00,
      subtotal: 6000.00,
      serviceFee: 720.00,
      totalPrice: 6720.00,
      status: 'confirmed',
    });
  });

  describe('POST /api/reviews', () => {
    test('permite al huésped publicar una reseña para una reservación', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          reservationId: confirmedReservation.id,
          rating: 5,
          comment: '¡Una experiencia inolvidable! Excelente ubicación y atención.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.review.rating)).toBe(5);
      expect(res.body.review.comment).toContain('inolvidable');
    });

    test('no permite publicar doble reseña para la misma reservación', async () => {
      await Review.create({
        reservationId: confirmedReservation.id,
        reviewerId: guestUser.id,
        revieweeId: hostUser.id,
        propertyId: createdProperty.id,
        rating: 5,
        comment: 'Primera reseña',
        type: 'guest_to_property',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          reservationId: confirmedReservation.id,
          rating: 4,
          comment: 'Segunda reseña intento',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Ya has publicado una reseña');
    });
  });

  describe('GET /api/reviews', () => {
    test('obtiene las reseñas y calcula el promedio avgRating correctamente', async () => {
      await Review.create({
        reservationId: confirmedReservation.id,
        reviewerId: guestUser.id,
        revieweeId: hostUser.id,
        propertyId: createdProperty.id,
        rating: 5,
        comment: 'Increíble estancia',
        type: 'guest_to_property',
      });

      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: createdProperty.id });

      expect(res.status).toBe(200);
      expect(res.body.reviews.length).toBe(1);
      expect(res.body.avgRating).toBe(5.0);
      expect(res.body.totalReviews).toBe(1);
    });
  });
});
