import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);

  const roleLabel = user?.role === 'host' ? 'Anfitrión' : 'Huésped';
  const roleIcon = user?.role === 'host' ? '🏡' : '🧳';

  useEffect(() => {
    if (user?.role !== 'host') return;

    const fetchMyProperties = async () => {
      setPropertiesLoading(true);
      setPropertiesError(null);
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/properties/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProperties(res.data.properties || res.data.data.properties || []);
      } catch (err) {
        setPropertiesError('No pudimos cargar tus propiedades. Inténtalo de nuevo más tarde.');
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchMyProperties();
  }, [user]);

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
          <div className="max-w-2xl mx-auto mb-8 space-y-6">
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
                <div className="flex justify-between py-2 border-b border-dark-100">
                  <span className="text-dark-500">Teléfono</span>
                  <span className="font-medium text-dark-800">{user?.phone || 'No registrado'}</span>
                </div>
                {user?.role === 'host' && (
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-dark-500 font-semibold">Verificación</span>
                    <Link
                      to="/profile/verify"
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        user?.identityStatus === 'verified'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : user?.identityStatus === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          : user?.identityStatus === 'pending' || user?.identityStatus === 'processing'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100'
                      }`}
                    >
                      {user?.identityStatus === 'verified'
                        ? '✓ Verificado'
                        : user?.identityStatus === 'rejected'
                        ? '✗ Rechazado (Reintentar)'
                        : user?.identityStatus === 'pending' || user?.identityStatus === 'processing'
                        ? '🕒 En revisión'
                        : '🛡️ Verificar Identidad'}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions for Host */}
            {user?.role === 'host' && (
              <div className="glass-card p-6 border-l-4 border-l-primary-500 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                <div>
                  <h4 className="font-display font-bold text-dark-800 text-lg">
                    ¿Listo para recibir huéspedes? 🏡
                  </h4>
                  <p className="text-dark-400 text-sm mt-0.5">
                    Publica un anuncio completo con fotos, mapa y servicios.
                  </p>
                </div>
                <Link
                  to="/host/properties/create"
                  className="btn-primary py-2.5 px-5 text-sm whitespace-nowrap shadow-md shadow-primary-500/10"
                >
                  + Publicar Propiedad
                </Link>
              </div>
            )}

            {/* Host Properties List */}
            {user?.role === 'host' && (
              <div className="mt-8 space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-dark-800 text-xl flex items-center gap-2">
                    <span>📋</span> Tus Anuncios y Disponibilidad
                  </h3>
                </div>

                {propertiesLoading ? (
                  <div className="text-center py-12 bg-white/50 backdrop-blur-md rounded-3xl border border-dark-100 shadow-sm flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-dark-500 text-sm font-semibold">Cargando tus anuncios...</span>
                  </div>
                ) : propertiesError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">
                    {propertiesError}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white/50 backdrop-blur-md rounded-3xl border border-dark-100 shadow-sm">
                    <span className="text-4xl mb-3 block font-normal">🏡</span>
                    <p className="font-bold text-dark-800 text-sm animate-pulse">Aún no tienes propiedades registradas</p>
                    <p className="text-dark-400 text-xs mt-1 max-w-sm mx-auto">
                      Comienza a ganar dinero publicando tu primer hospedaje en Yucatán.
                    </p>
                    <Link
                      to="/host/properties/create"
                      className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
                    >
                      <span>Publicar ahora</span> &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map((prop) => {
                      const photoUrl = prop.photos?.[0]?.url || 'https://via.placeholder.com/400x300?text=Sin+Foto';
                      return (
                        <div key={prop.id} className="glass-card hover-lift overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-all duration-300">
                          <div className="w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto sm:h-full overflow-hidden bg-dark-50 relative min-h-[120px]">
                            <img
                              src={photoUrl}
                              alt={prop.title}
                              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 bg-primary-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md">
                              {prop.propertyType === 'apartment' ? 'Apto' : prop.propertyType === 'house' ? 'Casa' : prop.propertyType === 'room' ? 'Hab' : prop.propertyType === 'villa' ? 'Villa' : 'Cabaña'}
                            </div>
                          </div>
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div>
                              <h4 className="font-display font-bold text-dark-800 text-base line-clamp-1 mb-1">
                                {prop.title}
                              </h4>
                              <p className="text-dark-400 text-xs flex items-center gap-1 mb-3">
                                <span>📍</span>
                                <span className="line-clamp-1">{prop.city}, {prop.state || 'Yucatán'}</span>
                              </p>
                              <div className="text-sm font-bold text-dark-900">
                                ${Math.round(prop.pricePerNight)} <span className="text-dark-400 text-xs font-semibold">/ noche</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-100">
                              <Link
                                to={`/properties/${prop.id}`}
                                className="flex-1 text-center py-2.5 rounded-xl bg-dark-50 hover:bg-dark-100 text-dark-600 font-bold text-xs transition-colors"
                              >
                                Ver Detalle
                              </Link>
                              <Link
                                to={`/host/properties/${prop.id}/availability`}
                                className="flex-1 text-center py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-all shadow-md shadow-primary-500/10 flex items-center justify-center gap-1.5"
                              >
                                📅 Disponibilidad
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;