import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const HostReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHostReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${API_URL}/reservations/host`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(res.data.reservations || []);
    } catch (err) {
      setError('Error al cargar las reservaciones de tus propiedades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostReservations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-dark-600 font-medium">Cargando reservaciones recibidas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-900 tracking-tight">Reservas Recibidas</h1>
          <p className="text-dark-500 text-sm mt-1">
            Revisa las reservaciones activas e historial de huéspedes en tus hospedajes.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="glass-card text-center py-16 px-4 space-y-4">
            <Building2 className="w-14 h-14 text-dark-300 mx-auto" />
            <h3 className="text-xl font-bold text-dark-800">Aún no has recibido reservaciones</h3>
            <p className="text-dark-500 text-sm max-w-md mx-auto">
              Cuando los huéspedes reserven tus propiedades, sus detalles y fechas aparecerán listados aquí.
            </p>
            <Link to="/dashboard" className="btn-primary py-2 px-6 text-sm inline-block mt-2">
              Volver a mi Panel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reservations.map((res) => {
              const mainPhoto =
                res.property?.photos?.[0]?.url ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
              const isCancelled = res.status === 'cancelled';

              return (
                <div
                  key={res.id}
                  className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 p-4 md:p-6"
                >
                  {/* Property Image */}
                  <div className="w-full md:w-56 h-44 rounded-xl overflow-hidden relative shrink-0">
                    <img
                      src={mainPhoto}
                      alt={res.property?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      {isCancelled ? (
                        <span className="badge badge-rose inline-flex items-center gap-1 shadow-md">
                          <XCircle className="w-3.5 h-3.5" /> Cancelada
                        </span>
                      ) : (
                        <span className="badge badge-emerald inline-flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                            {res.property?.title}
                          </span>
                          <h3 className="text-lg font-bold text-dark-900">
                            Huésped: {res.guest?.firstName} {res.guest?.lastName}
                          </h3>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-xl font-extrabold text-emerald-600">${res.subtotal}</span>
                          <span className="text-xs text-dark-400 block">Ganancia Anfitrión</span>
                        </div>
                      </div>

                      {/* Guest Contact info & Dates */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-dark-50/70 p-3 rounded-xl border border-dark-100 text-sm">
                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Check-in — Check-out</span>
                          <span className="font-semibold text-dark-800 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                            {res.checkIn} → {res.checkOut}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Correo Huésped</span>
                          <span className="font-medium text-dark-700 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-dark-400" />
                            {res.guest?.email}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Huéspedes</span>
                          <span className="font-semibold text-dark-800 flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-primary-500" />
                            {res.guestsCount} personas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dark-100 text-xs text-dark-400">
                      <span>Reservado el: {new Date(res.createdAt).toLocaleDateString('es-MX')}</span>
                      <Link
                        to={`/host/properties/${res.propertyId}/availability`}
                        className="text-primary-600 font-semibold hover:underline"
                      >
                        Ver Calendario de Disponibilidad →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostReservations;
