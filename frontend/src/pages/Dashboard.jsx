import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  PlusCircle,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Eye,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const roleLabel = user?.role === 'host' ? 'Anfitrión' : 'Huésped';

  const fetchMyProperties = async (currentPage = 1) => {
    if (user?.role !== 'host') return;

    setPropertiesLoading(true);
    setPropertiesError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${API_URL}/properties/my`, {
        params: { page: currentPage, limit: 12 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties(res.data.properties || res.data.data?.properties || []);
      setTotalPages(res.data.pages || res.data.data?.pages || 1);
      setTotalCount(res.data.total || res.data.data?.total || 0);
    } catch (err) {
      setPropertiesError('No pudimos cargar tus propiedades. Inténtalo de nuevo más tarde.');
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties(page);
  }, [user, page]);

  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Top Header Banner & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Banner (Left 2 cols) */}
          <div className="lg:col-span-2 glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/25">
                  {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 tracking-tight">
                    ¡Hola, {user?.firstName}! 👋
                  </h1>
                  <p className="text-dark-500 text-sm mt-0.5">
                    Bienvenido/a a tu panel de control de {roleLabel}
                  </p>
                </div>
              </div>
              <span className="badge badge-emerald py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cuenta Activa
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-dark-100/80">
              <div className="p-3.5 rounded-2xl bg-dark-50/70 border border-dark-100">
                <span className="text-xs text-dark-400 font-medium block">Tus Propiedades</span>
                <span className="text-xl sm:text-2xl font-extrabold text-dark-900 mt-0.5 block">
                  {totalCount}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-dark-50/70 border border-dark-100">
                <span className="text-xs text-dark-400 font-medium block">Estado Anfitrión</span>
                <span className="text-sm font-bold text-primary-600 mt-1 block">
                  {user?.role === 'host' ? 'Anfitrión Verificado' : 'Huésped Registrado'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-dark-50/70 border border-dark-100 col-span-2 sm:col-span-1">
                <span className="text-xs text-dark-400 font-medium block">Identidad</span>
                <span className="text-sm font-bold text-emerald-600 mt-1 block flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  {user?.identityStatus === 'verified' ? 'Verificada' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Info Card (Right 1 col) */}
          <div className="glass-card p-6 flex flex-col justify-between space-y-4">
            <h3 className="font-display font-bold text-dark-800 text-lg flex items-center gap-2 border-b border-dark-100 pb-3">
              <User className="w-5 h-5 text-primary-500" />
              <span>Tu Perfil de Usuario</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-dark-400 text-xs font-medium">Nombre:</span>
                <span className="font-semibold text-dark-800">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400 text-xs font-medium">Email:</span>
                <span className="font-semibold text-dark-800 text-xs truncate max-w-[180px]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400 text-xs font-medium">Teléfono:</span>
                <span className="font-medium text-dark-700">{user?.phone || 'No registrado'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dark-100">
                <span className="text-dark-400 text-xs font-medium">Verificación:</span>
                <Link
                  to="/profile/verify"
                  className={`text-xs font-bold px-3 py-1 rounded-xl border transition-all ${
                    user?.identityStatus === 'verified'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : user?.identityStatus === 'rejected'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  {user?.identityStatus === 'verified' ? '✓ Verificado' : '🛡️ Verificar'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Banner for Hosts */}
        {user?.role === 'host' && (
          <div className="glass-card p-6 border-l-4 border-l-primary-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-display font-bold text-dark-800 text-lg">
                ¿Quieres publicar una nueva propiedad? 🏡
              </h4>
              <p className="text-dark-400 text-sm mt-0.5">
                Crea un nuevo anuncio con fotos, ubicación y calendario de tarifas.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/host/reservations"
                className="px-4 py-2.5 rounded-xl border border-dark-200 text-dark-700 text-xs font-bold hover:bg-dark-100 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-primary-500" />
                Ver Reservas Recibidas
              </Link>
              <Link
                to="/host/properties/create"
                className="btn-primary py-2.5 px-5 text-xs whitespace-nowrap shadow-md shadow-primary-500/20 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Publicar Propiedad
              </Link>
            </div>
          </div>
        )}

        {/* Host Properties Grid Section */}
        {user?.role === 'host' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-dark-900 text-2xl tracking-tight flex items-center gap-2.5">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  <span>Tus Anuncios y Disponibilidad</span>
                </h3>
                <p className="text-dark-500 text-sm mt-0.5">
                  {totalCount} hospedajes registrados en tu cuenta
                </p>
              </div>

              <Link
                to="/host/properties/create"
                className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Nueva Propiedad
              </Link>
            </div>

            {propertiesLoading ? (
              <div className="py-20 text-center glass-card flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                <span className="text-dark-500 font-semibold text-sm">Cargando tus hospedajes...</span>
              </div>
            ) : propertiesError ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {propertiesError}
              </div>
            ) : properties.length === 0 ? (
              <div className="glass-card text-center py-16 px-4 space-y-4">
                <Building2 className="w-14 h-14 text-dark-300 mx-auto" />
                <h3 className="text-xl font-bold text-dark-800">Aún no tienes propiedades registradas</h3>
                <p className="text-dark-500 text-sm max-w-md mx-auto">
                  Comienza a recibir huéspedes publicando tu primer hospedaje en Yucatán.
                </p>
                <Link to="/host/properties/create" className="btn-primary py-2.5 px-6 text-sm inline-block mt-2">
                  Publicar primera propiedad
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((prop) => {
                    const photoUrl = prop.photos?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
                    return (
                      <div
                        key={prop.id}
                        className="glass-card overflow-hidden hover-lift flex flex-col justify-between group transition-all duration-300"
                      >
                        <div>
                          {/* Image Banner */}
                          <div className="h-44 w-full relative overflow-hidden bg-dark-100">
                            <img
                              src={photoUrl}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="badge bg-dark-900/80 text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                                {prop.propertyType}
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-dark-900 text-xs font-extrabold px-2.5 py-1 rounded-xl shadow-md">
                              ${Math.round(prop.pricePerNight)} / noche
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-2">
                            <h4 className="font-bold text-dark-900 text-base line-clamp-1 group-hover:text-primary-600 transition-colors">
                              {prop.title}
                            </h4>
                            <p className="text-dark-500 text-xs flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                              <span className="truncate">{prop.city}, {prop.country}</span>
                            </p>
                          </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
                          <Link
                            to={`/properties/${prop.id}`}
                            className="py-2 px-3 rounded-xl border border-dark-200 text-dark-700 font-bold text-xs hover:bg-dark-100 transition-colors flex items-center justify-center gap-1 text-center"
                          >
                            <Eye className="w-3.5 h-3.5 text-dark-500" />
                            Ver Detalle
                          </Link>
                          <Link
                            to={`/host/properties/${prop.id}/availability`}
                            className="py-2 px-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-1 text-center"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Calendario
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="p-2.5 rounded-xl border border-dark-200 bg-white text-dark-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-dark-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl border border-dark-200 bg-white text-dark-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;