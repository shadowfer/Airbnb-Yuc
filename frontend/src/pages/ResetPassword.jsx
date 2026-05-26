import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++; if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const labels = ['','Muy débil','Débil','Aceptable','Fuerte','Muy fuerte'];
  const colors = ['','bg-red-500','bg-orange-500','bg-yellow-500','bg-emerald-400','bg-emerald-500'];
  const str = getStrength(formData.password);

  const validate = () => {
    const e = {};
    if (!formData.password) e.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!formData.confirmPassword) e.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('El enlace de recuperación es inválido o ha expirado.');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏠</span>
            <span className="text-2xl font-display font-bold text-gradient">Hospedaje</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Nueva Contraseña</h1>
          <p className="text-dark-500">Crea una contraseña segura</p>
        </div>
        <div className="glass-card p-8">
          {success ? (
            <div className="text-center animate-fade-in" id="reset-success">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-2">Contraseña actualizada, inicia sesión</h2>
              <p className="text-dark-500 mb-6">Redirigiendo al login...</p>
              <Link to="/login" className="btn-primary inline-flex">Ir al Login</Link>
            </div>
          ) : (
            <>
              {error && <div className="alert-error mb-6" id="reset-error"><span>{error}</span></div>}
              <form onSubmit={handleSubmit} id="reset-password-form" noValidate>
                <div className="mb-2">
                  <label htmlFor="password" className="input-label">Nueva Contraseña</label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={`input-field ${errors.password?'input-error':''}`} placeholder="••••••••" />
                  {errors.password && <p className="error-msg">{errors.password}</p>}
                </div>
                {formData.password && (
                  <div className="mb-4 animate-fade-in">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(l=><div key={l} className={`h-1.5 flex-1 rounded-full transition-all ${l<=str?colors[str]:'bg-dark-200'}`}/>)}
                    </div>
                    <p className={`text-xs font-medium ${str<=2?'text-red-500':'text-emerald-500'}`}>{labels[str]}</p>
                  </div>
                )}
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="input-label">Confirmar</label>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`input-field ${errors.confirmPassword?'input-error':''}`} placeholder="••••••••" />
                  {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
                </div>
                <button type="submit" className="btn-primary w-full py-3.5" disabled={loading} id="btn-reset-submit">
                  {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
