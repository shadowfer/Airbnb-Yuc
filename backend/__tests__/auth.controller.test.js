
const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');


require('dotenv').config();
process.env.NODE_ENV = 'test';

let server;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await User.destroy({ where: {}, force: true });
});


const validUser = {
  firstName: 'María',
  lastName: 'García',
  email: 'maria@test.com',
  password: 'password123',
  role: 'guest',
  phone: '+52 555 1234567',
};




describe('POST /api/auth/register', () => {
  test('registra un usuario exitosamente con rol huesped', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('guest');
    expect(res.body.data.token).toBeDefined();

    expect(res.body.data.user.password).toBeUndefined();
  });

  test('registra un usuario con rol anfitrion', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validUser, email: 'anfitrion@test.com', role: 'host' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('host');
  });

  test('rechaza registro con email duplicado', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza registro sin campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rechaza registro con rol inválido', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validUser, role: 'admin' });
    expect(res.status).toBe(400);
  });

  test('rechaza registro con email inválido', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validUser, email: 'no-es-email' });
    expect(res.status).toBe(400);
  });
});




describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  test('inicia sesión exitosamente con credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  test('rechaza login con contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rechaza login con email no registrado', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'password123' });
    expect(res.status).toBe(404);
  });

  test('rechaza login sin campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});




describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  test('envía email de recuperación para usuario existente', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: validUser.email });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('responde éxito incluso para email no registrado (seguridad)', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'noexiste@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('rechaza solicitud sin email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});




describe('POST /api/auth/reset-password', () => {
  test('rechaza token inválido', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'tokenfalso', newPassword: 'newpass12388' });
    expect(res.status).toBe(400);
  });

  test('rechaza contraseñas que no coinciden', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'anytoken', newPassword: 'newpass12388', confirmPassword: 'otherpass' });
    expect(res.status).toBe(400);
  });

  test('rechaza contraseñas menores de 8 caracteres', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'anytoken', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  test('rechaza sin campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
  });
});




describe('GET /api/auth/me', () => {
  test('retorna datos del usuario autenticado', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(validUser);
    const token = registerRes.body.data.token;

    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  test('rechaza sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rechaza con token inválido', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(401);
  });
});




describe('GET /api/health', () => {
  test('retorna estado del servidor', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});