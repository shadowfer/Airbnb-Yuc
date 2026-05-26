
const { verifyToken, generateToken, generateResetToken } = require('../src/utils/tokenUtils');


process.env.JWT_SECRET = 'test_secret_key_for_testing_purposes';
process.env.JWT_EXPIRES_IN = '1h';

describe('Token Utils', () => {
  const mockUser = { id: 1, email: 'test@test.com', role: 'guest' };

  test('genera un token JWT válido', () => {
    const token = generateToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('verifica y decodifica un token válido', () => {
    const token = generateToken(mockUser);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });

  test('lanza error con token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow();
  });

  test('lanza error con token vacío', () => {
    expect(() => verifyToken('')).toThrow();
  });

  test('genera token de reset único', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    expect(token1).toBeDefined();
    expect(typeof token1).toBe('string');
    expect(token1.length).toBe(64);
    expect(token1).not.toBe(token2);
  });
});


const authMiddleware = require('../src/middlewares/authMiddleware');


jest.mock('../src/models/User', () => {
  const mockUser = {
    id: 1,
    email: 'test@test.com',
    role: 'guest',
    toSafeObject: () => ({ id: 1, email: 'test@test.com', role: 'guest' }),
  };
  return {
    findByPk: jest.fn().mockResolvedValue(mockUser),
  };
});

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('rechaza petición sin header Authorization', async () => {
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza petición con header Authorization sin Bearer', async () => {
    req.headers.authorization = 'NotBearer token123';
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('rechaza token inválido', async () => {
    req.headers.authorization = 'Bearer tokeninvalido';
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('acepta token válido y adjunta usuario', async () => {
    const token = generateToken({ id: 1, email: 'test@test.com', role: 'guest' });
    req.headers.authorization = `Bearer ${token}`;
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});