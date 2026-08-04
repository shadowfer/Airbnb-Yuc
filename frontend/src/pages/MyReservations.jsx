import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Loader2,
  Building2,
  CreditCard,
  User,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Modal Cancel state
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Review state
  const [reviewModalData, setReviewModalData] = useState(null); // reservation object
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${API_URL}/reservations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(res.data.reservations || []);
    } catch (err) {
      setError('No pudimos cargar tus reservaciones. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancellingId) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.patch(
        `${API_URL}/reservations/${cancellingId}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Reservación cancelada con éxito.');
      setCancellingId(null);
      setCancelReason('');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar la reservación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!reviewModalData || !comment.trim()) return;

    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(
        `${API_URL}/reviews`,
        {
          reservationId: reviewModalData.id,
          rating,
          comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('¡Gracias por tu reseña!');
      setReviewModalData(null);
      setComment('');
      setRating(5);
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar la reseña.');
    } finally {
      setReviewLoading(false);
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter((r) => {
    const checkOutDate = new Date(r.checkOut + 'T23:59:59');
    return r.status !== 'cancelled' && checkOutDate >= now;
  });

  const pastReservations = reservations.filter((r) => {
    const checkOutDate = new Date(r.checkOut + 'T23:59:59');
    return r.status === 'cancelled' || checkOutDate < now;
  });

  const displayedList = activeTab === 'upcoming' ? upcomingReservations : pastReservations;

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-dark-600 font-medium">Cargando tus reservaciones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-dark-900 tracking-tight">Mis Reservaciones</h1>
            <p className="text-dark-500 text-sm mt-1">
              Gestiona tus próximos viajes y revisa tu historial de hospedajes.
            </p>
          </div>
          <Link to="/search" className="btn-primary py-2.5 px-5 text-sm inline-flex items-center gap-2 self-start">
            <Building2 className="w-4 h-4" />
            Explorar más hospedajes
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-200 gap-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === 'upcoming'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-dark-500 hover:text-dark-800'
            }`}
          >
            Próximas y Activas ({upcomingReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === 'past'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-dark-500 hover:text-dark-800'
            }`}
          >
            Pasadas y Canceladas ({pastReservations.length})
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {displayedList.length === 0 ? (
          <div className="glass-card text-center py-16 px-4 space-y-4">
            <Calendar className="w-14 h-14 text-dark-300 mx-auto" />
            <h3 className="text-xl font-bold text-dark-800">
              {activeTab === 'upcoming' ? 'No tienes reservaciones próximas' : 'No tienes reservaciones pasadas'}
            </h3>
            <p className="text-dark-500 text-sm max-w-md mx-auto">
              {activeTab === 'upcoming'
                ? 'Explora increíbles destinos en Yucatán y haz tu próxima reserva.'
                : 'Tus viajes completados o cancelados aparecerán aquí.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link to="/search" className="btn-primary py-2 px-6 text-sm inline-block mt-2">
                Buscar viajes
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {displayedList.map((res) => {
              const mainPhoto = res.property?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
              const isCancelled = res.status === 'cancelled';
              const isPast = new Date(res.checkOut + 'T23:59:59') < now;

              return (
                <div
                  key={res.id}
                  className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 p-4 md:p-6"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden relative shrink-0">
                    <img
                      src={mainPhoto}
                      alt={res.property?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      {isCancelled ? (
                        <span className="badge badge-rose inline-flex items-center gap-1 shadow-md">
                          <XCircle className="w-3.5 h-3.5" /> Cancelada
                        </span>
                      ) : isPast ? (
                        <span className="badge bg-dark-800/80 text-white backdrop-blur-md inline-flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completada
                        </span>
                      ) : (
                        <span className="badge badge-emerald inline-flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                            {res.property?.propertyType}
                          </span>
                          <h3 className="text-xl font-bold text-dark-900 hover:text-primary-600 transition-colors">
                            <Link to={`/properties/${res.propertyId}`}>{res.property?.title}</Link>
                          </h3>
                          <p className="text-dark-500 text-sm flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-dark-400" />
                            {res.property?.address}, {res.property?.city}, {res.property?.country}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-primary-600">${res.totalPrice}</span>
                          <span className="text-xs text-dark-400 block">Total con comisión</span>
                        </div>
                      </div>

                      {/* Dates & Guests Grid */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-dark-50/70 p-3 rounded-xl border border-dark-100 text-sm">
                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Llegada (Check-in)</span>
                          <span className="font-semibold text-dark-800 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                            {res.checkIn}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Salida (Check-out)</span>
                          <span className="font-semibold text-dark-800 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                            {res.checkOut}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-dark-400 font-medium block">Huéspedes</span>
                          <span className="font-semibold text-dark-800 flex items-center gap-1 mt-0.5">
                            <User className="w-3.5 h-3.5 text-primary-500" />
                            {res.guestsCount} {res.guestsCount === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-dark-100 gap-3">
                      <div className="text-xs text-dark-400">
                        Anfitrión: <span className="font-semibold text-dark-700">{res.property?.host?.firstName} {res.property?.host?.lastName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/properties/${res.propertyId}`}
                          className="px-3.5 py-1.5 rounded-lg border border-dark-200 text-dark-700 text-xs font-semibold hover:bg-dark-100 transition-colors"
                        >
                          Ver propiedad
                        </Link>

                        {!isCancelled && !isPast && (
                          <button
                            onClick={() => setCancellingId(res.id)}
                            className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors"
                          >
                            Cancelar reserva
                          </button>
                        )}

                        {isPast && !isCancelled && (
                          <button
                            onClick={() => setReviewModalData(res)}
                            className="btn-primary py-1.5 px-3.5 text-xs inline-flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            Dejar reseña
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-dark-100">
            <h3 className="text-xl font-bold text-dark-900">¿Cancelar esta reservación?</h3>
            <p className="text-sm text-dark-500">
              Las fechas quedarán nuevamente disponibles en la plataforma. Por favor dinos el motivo de tu cancelación:
            </p>
            <form onSubmit={handleCancel} className="space-y-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo (opcional)..."
                className="input-field min-h-[90px] text-sm"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancellingId(null)}
                  className="px-4 py-2 text-sm text-dark-600 font-semibold hover:bg-dark-100 rounded-xl"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-dark-100">
            <h3 className="text-xl font-bold text-dark-900">Cuéntanos sobre tu estancia</h3>
            <p className="text-sm text-dark-500">
              Evalúa tu experiencia en <span className="font-semibold">{reviewModalData.property?.title}</span>:
            </p>
            <form onSubmit={handleCreateReview} className="space-y-4">
              {/* Star Rating picker */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-dark-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué fue lo que más te gustó? ¿Cómo estuvo la atención del anfitrión?..."
                required
                className="input-field min-h-[110px] text-sm"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalData(null)}
                  className="px-4 py-2 text-sm text-dark-600 font-semibold hover:bg-dark-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading || !comment.trim()}
                  className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                >
                  {reviewLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publicar Reseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
