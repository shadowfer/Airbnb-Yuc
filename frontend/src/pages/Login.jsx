

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Correo electrónico inválido';
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      navigate('/dashboard');
    } catch {

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] bg-cover bg-center relative flex items-center justify-center p-4 sm:p-8 overflow-hidden" style={{ backgroundImage: "url('/cenote.png')" }}>
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/55 to-black/85 backdrop-blur-[2px]" />

      {}
      <div className="relative z-10 w-full max-w-4xl backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-fade-in-up">

        {}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center text-white border-r border-white/10">
          <span className="text-6xl mb-6 drop-shadow-md">🏠</span>
          <h2 className="text-4xl font-display font-bold mb-4 leading-tight drop-shadow-lg">
            Bienvenido<br />de vuelta
          </h2>
          <p className="text-base text-white/90 leading-relaxed max-w-md drop-shadow">
            Inicia sesión para gestionar tus reservaciones, explorar nuevos
            destinos o administrar tus propiedades.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 text-white/90 backdrop-blur-md bg-white/10 px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">✨</div>
              <span className="font-medium text-sm">Miles de propiedades únicas</span>
            </div>
            <div className="flex items-center gap-4 text-white/90 backdrop-blur-md bg-white/10 px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">🔒</div>
              <span className="font-medium text-sm">Pagos seguros y protegidos</span>
            </div>
            <div className="flex items-center gap-4 text-white/90 backdrop-blur-md bg-white/10 px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-all duration-300 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">⭐</div>
              <span className="font-medium text-sm">Reseñas verificadas de la comunidad</span>
            </div>
          </div>
        </div>

        {/* Panel Derecho (Formulario de Login con fondo blanco sólido y esquinas redondeadas) */}
        <div className="flex-1 p-8 sm:p-12 bg-white flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 lg:hidden">
              <span className="text-3xl">🏠</span>
              <span className="text-2xl font-display font-bold text-gradient">Hospedaje</span>
            </Link>
            <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-dark-500">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Error global */}
          {error && (
            <div className="alert-error mb-6" id="login-error">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form" noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="input-label">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="mb-2">
              <label htmlFor="password" className="input-label">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right mb-6">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
                id="link-forgot-password"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full text-lg py-3.5"
              disabled={loading}
              id="btn-login"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Link a Registro */}
          <div className="mt-6 text-center">
            <p className="text-dark-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;