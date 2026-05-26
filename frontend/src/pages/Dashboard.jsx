import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const roleLabel = user?.role === 'host' ? 'Anfitrión' : 'Huésped';
  const roleIcon = user?.role === 'host' ? '🏡' : '🧳';

  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-fade-in-up">
          {}
          <div className="glass-card p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/25">
                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold text-dark-900 mb-1">
                  ¡Hola, {user?.firstName}! 👋
                </h1>
                <p className="text-dark-500">Bienvenido/a a tu panel de control</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-600 font-semibold">
                <span>{roleIcon}</span>
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-dark-800 mb-4 flex items-center gap-2">
                <span className="text-xl">👤</span> Tu Perfil
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-dark-100">
                  <span className="text-dark-500">Nombre</span>
                  <span className="font-medium text-dark-800">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dark-100">
                  <span className="text-dark-500">Email</span>
                  <span className="font-medium text-dark-800">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dark-100">
                  <span className="text-dark-500">Rol</span>
                  <span className="font-medium text-dark-800">{roleLabel}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-dark-500">Teléfono</span>
                  <span className="font-medium text-dark-800">{user?.phone || 'No registrado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;