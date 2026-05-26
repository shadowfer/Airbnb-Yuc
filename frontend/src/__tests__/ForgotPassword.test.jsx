
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../pages/ForgotPassword';
import * as authApi from '../api/auth';

vi.mock('../api/auth', () => ({
  forgotPassword: vi.fn(),
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

const renderForgot = () => {
  return render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );
};

describe('Página de Recuperación de Contraseña', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('renderiza el formulario', () => {
    renderForgot();
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
  });

  test('valida email vacío', async () => {
    renderForgot();
    const btn = screen.getByRole('button', { name: /enviar enlace/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument();
    });
  });

  test('valida formato de email', async () => {
    renderForgot();
    const input = screen.getByLabelText('Correo Electrónico');
    await userEvent.type(input, 'noesemail');
    const btn = screen.getByRole('button', { name: /enviar enlace/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
  });

  test('muestra éxito después del envío', async () => {
    authApi.forgotPassword.mockResolvedValue({ data: { success: true } });
    renderForgot();
    const input = screen.getByLabelText('Correo Electrónico');
    await userEvent.type(input, 'test@test.com');
    const btn = screen.getByRole('button', { name: /enviar enlace/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('¡Correo enviado!')).toBeInTheDocument();
    });
  });

  test('tiene link de regreso al login', () => {
    renderForgot();
    expect(screen.getByText('← Volver al Login')).toBeInTheDocument();
  });
});