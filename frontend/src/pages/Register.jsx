

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);


  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    else if (formData.firstName.trim().length < 2) newErrors.firstName = 'Mínimo 2 caracteres';

    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    else if (formData.lastName.trim().length < 2) newErrors.lastName = 'Mínimo 2 caracteres';

    if (!formData.email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Correo electrónico inválido';

    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Las contraseñas no coinciden';

    if (!formData.role) newErrors.role = 'Selecciona tu rol en la plataforma';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role === 'huesped' ? 'guest' : 'host',
        phone: formData.phone.trim() || undefined,
      });
      navigate('/dashboard');
    } catch {

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        {}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏠</span>
            <span className="text-2xl font-display font-bold text-gradient">Hospedaje</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-dark-500">
            Únete a nuestra comunidad de viajeros y anfitriones
          </p>
        </div>

        {}
        <div className="glass-card p-8">
          {}
          {error && (
            <div className="alert-error mb-6" id="register-error">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-form" noValidate>
            {/* ── Selector de Rol ──────────────────────────── */}
            <div className="mb-6">
              <label className="input-label">¿Cómo quieres usar Hospedaje?</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('huesped')}
                  className={`role-card ${formData.role === 'huesped' ? 'role-card-selected' : 'role-card-unselected'}`}
                  id="role-huesped"
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🧳</span>
                    <h3 className="font-display font-bold text-dark-800 mb-1">Huésped</h3>
                    <p className="text-xs text-dark-400 leading-relaxed">
                      Busco un lugar para hospedarme
                    </p>
                  </div>
                  {formData.role === 'huesped' && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center animate-fade-in">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Tarjeta Anfitrión */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('anfitrion')}
                  className={`role-card ${formData.role === 'anfitrion' ? 'role-card-selected' : 'role-card-unselected'}`}
                  id="role-anfitrion"
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🏡</span>
                    <h3 className="font-display font-bold text-dark-800 mb-1">Anfitrión</h3>
                    <p className="text-xs text-dark-400 leading-relaxed">
                      Quiero ofrecer mi espacio
                    </p>
                  </div>
                  {formData.role === 'anfitrion' && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center animate-fade-in">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
              {errors.role && <p className="error-msg">{errors.role}</p>}
            </div>

            {}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="input-label">Nombre</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="María"
                />
                {errors.firstName && <p className="error-msg">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="input-label">Apellido</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="García"
                />
                {errors.lastName && <p className="error-msg">{errors.lastName}</p>}
              </div>
            </div>

            {/* ── Email ───────────────────────────────────── */}
            <div className="mb-4">
              <label htmlFor="email" className="input-label">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="maria@ejemplo.com"
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            {}
            <div className="mb-4">
              <label htmlFor="phone" className="input-label">
                Teléfono <span className="text-dark-400 font-normal">(opcional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+52 555 123 4567"
              />
            </div>

            {/* ── Contraseñas ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="password" className="input-label">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="error-msg">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="input-label">Confirmar</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* ── Botón Submit ────────────────────────────── */}
            <button
              type="submit"
              className="btn-primary w-full text-lg py-3.5"
              disabled={loading}
              id="btn-register"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {}
          <div className="mt-6 text-center">
            <p className="text-dark-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;