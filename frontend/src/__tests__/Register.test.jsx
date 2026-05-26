
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';


vi.mock('../api/auth', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  getMe: vi.fn().mockRejectedValue(new Error('No token')),
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Página de Registro', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('renderiza el formulario completo', () => {
    renderRegister();
    expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  test('renderiza los dos selectores de rol (huésped y anfitrión)', () => {
    renderRegister();
    expect(screen.getByText('Huésped')).toBeInTheDocument();
    expect(screen.getByText('Anfitrión')).toBeInTheDocument();
  });

  test('permite seleccionar rol huésped', async () => {
    renderRegister();
    const huesped = screen.getByText('Huésped').closest('button');
    await userEvent.click(huesped);
    expect(huesped.className).toContain('role-card-selected');
  });

  test('permite seleccionar rol anfitrión', async () => {
    renderRegister();
    const anfitrion = screen.getByText('Anfitrión').closest('button');
    await userEvent.click(anfitrion);
    expect(anfitrion.className).toContain('role-card-selected');
  });

  test('muestra errores de validación al enviar vacío', async () => {
    renderRegister();
    const btn = screen.getByRole('button', { name: /crear cuenta/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    });
  });

  test('valida formato de email', async () => {
    renderRegister();
    const emailInput = screen.getByLabelText('Correo Electrónico');
    await userEvent.type(emailInput, 'noesunemail');
    const btn = screen.getByRole('button', { name: /crear cuenta/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Correo electrónico inválido')).toBeInTheDocument();
    });
  });

  test('valida que las contraseñas coincidan', async () => {
    renderRegister();
    const pwd = screen.getByLabelText('Contraseña');
    const confirm = screen.getByLabelText('Confirmar');
    await userEvent.type(pwd, 'password123');
    await userEvent.type(confirm, 'different');
    const btn = screen.getByRole('button', { name: /crear cuenta/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });

  test('tiene link para ir al login', () => {
    renderRegister();
    expect(screen.getByText('Inicia Sesión')).toBeInTheDocument();
  });
});