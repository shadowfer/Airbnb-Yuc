
const { sequelize } = require('../src/models');
const User = require('../src/models/User');

require('dotenv').config();
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await User.destroy({ where: {}, force: true });
});

const validData = {
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  password: 'password123',
  role: 'guest',
};

describe('Modelo User', () => {
  test('crea un usuario correctamente', async () => {
    const user = await User.create(validData);
    expect(user.id).toBeDefined();
    expect(user.firstName).toBe('Juan');
    expect(user.role).toBe('guest');
  });

  test('hashea la contraseña automáticamente al crear', async () => {
    const user = await User.create(validData);
    expect(user.password).not.toBe('password123');
    expect(user.password.startsWith('$2b$')).toBe(true);
  });

  test('compara contraseña correctamente con comparePassword', async () => {
    const user = await User.create(validData);
    const isValid = await user.comparePassword('password123');
    expect(isValid).toBe(true);
    const isInvalid = await user.comparePassword('wrongpassword');
    expect(isInvalid).toBe(false);
  });

  test('toSafeObject excluye campos sensibles', async () => {
    const user = await User.create(validData);
    const safe = user.toSafeObject();
    expect(safe.password).toBeUndefined();
    expect(safe.resetPasswordToken).toBeUndefined();
    expect(safe.email).toBe('juan@test.com');
  });

  test('rechaza email duplicado', async () => {
    await User.create(validData);
    await expect(User.create(validData)).rejects.toThrow();
  });

  test('rechaza rol inválido', async () => {
    await expect(
      User.create({ ...validData, role: 'invalid_role' })
    ).rejects.toThrow();
  });

  test('rechaza email inválido', async () => {
    await expect(
      User.create({ ...validData, email: 'no-email' })
    ).rejects.toThrow();
  });

  test('rechaza nombre vacío', async () => {
    await expect(
      User.create({ ...validData, firstName: '' })
    ).rejects.toThrow();
  });

  test('permite crear con rol anfitrion', async () => {
    const user = await User.create({ ...validData, email: 'anf@test.com', role: 'host' });
    expect(user.role).toBe('host');
  });

  test('permite crear con rol admin', async () => {
    const user = await User.create({ ...validData, email: 'admin@test.com', role: 'admin' });
    expect(user.role).toBe('admin');
  });

  test('tiene campos de reset nulos por defecto', async () => {
    const user = await User.create(validData);
    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
  });
});