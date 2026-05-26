

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏠</span>
            <span className="text-2xl font-display font-bold text-gradient">Hospedaje</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-dark-500">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {}
        <div className="glass-card p-8">
          {success ? (

            <div className="text-center animate-fade-in" id="forgot-success">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-dark-900 mb-2">
                ¡Correo enviado!
              </h2>
              <p className="text-dark-500 mb-6 leading-relaxed">
                Si el correo <strong className="text-dark-700">{email}</strong> está
                registrado, recibirás un enlace para restablecer tu contraseña.
                Revisa también tu carpeta de spam.
              </p>
              <Link to="/login" className="btn-primary inline-flex">
                Volver al Login
              </Link>
            </div>
          ) : (
            /* ── Formulario ──────────────────────────────── */
            <>
              {error && (
                <div className="alert-error mb-6" id="forgot-error">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} id="forgot-password-form" noValidate>
                <div className="mb-6">
                  <label htmlFor="email" className="input-label">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className={`input-field ${error ? 'input-error' : ''}`}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full text-lg py-3.5"
                  disabled={loading}
                  id="btn-forgot-submit"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-dark-500 hover:text-primary-500 font-medium transition-colors">
                  ← Volver al Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;