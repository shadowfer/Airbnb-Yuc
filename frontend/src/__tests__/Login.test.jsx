
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getMe: vi.fn().mockRejectedValue(new Error('No token')),
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Página de Login', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('renderiza el formulario de login', () => {
    renderLogin();
    const headings = screen.getAllByText('Iniciar Sesión');
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  test('muestra error si se envía sin email', async () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /iniciar sesión/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
    });
  });

  test('valida formato de email', async () => {
    renderLogin();
    const email = screen.getByLabelText('Correo Electrónico');
    await userEvent.type(email, 'invalido');
    const btn = screen.getByRole('button', { name: /iniciar sesión/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Correo electrónico inválido')).toBeInTheDocument();
    });
  });

  test('tiene link a recuperación de contraseña', () => {
    renderLogin();
    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
  });

  test('tiene link a registro', () => {
    renderLogin();
    expect(screen.getByText('Regístrate gratis')).toBeInTheDocument();
  });

  test('muestra elementos del panel decorativo', () => {
    renderLogin();
    expect(screen.getByText(/Bienvenido/)).toBeInTheDocument();
  });
});