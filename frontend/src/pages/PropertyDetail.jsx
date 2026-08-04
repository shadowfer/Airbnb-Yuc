import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Users,
  Bed,
  Bath,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  Building2,
  Home,
  Hotel,
  Trees,
  LayoutGrid,
  Wifi,
  Waves,
  Car,
  Wind,
  Flame,
  Utensils,
  Tv,
  Dumbbell,
  Sun,
  Flower2,
  Dog,
  Loader2,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Reservation Form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  // Availability state
  const [blockedDates, setBlockedDates] = useState([]);
  const [availStatus, setAvailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'unavailable'
  const [validationError, setValidationError] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch blocked dates on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/availability/${id}`);
        setBlockedDates(res.data.blockedDates || res.data.data?.blockedDates || []);
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    };

    const fetchReviews = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/reviews?propertyId=${id}`);
        setReviews(res.data.reviews || []);
        setAvgRating(res.data.avgRating || null);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    if (id) {
      fetchAvailability();
      fetchReviews();
    }
  }, [id]);

  // Real-time availability checking logic when dates change
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailStatus('idle');
      setValidationError(null);
      return;
    }

    const inDate = new Date(checkIn + 'T12:00:00');
    const outDate = new Date(checkOut + 'T12:00:00');

    if (outDate <= inDate) {
      setValidationError('La fecha de salida debe ser posterior a la de entrada.');
      setAvailStatus('unavailable');
      return;
    }

    // Client-side quick overlap check
    const datesToCheck = [];
    let current = new Date(inDate);
    const last = new Date(outDate);

    while (current < last) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesToCheck.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    const hasOverlap = datesToCheck.some((dStr) =>
      blockedDates.some((b) => (b.blockedDate || b.blocked_date || '').split('T')[0] === dStr)
    );

    if (hasOverlap) {
      setValidationError('Las fechas seleccionadas incluyen días no disponibles.');
      setAvailStatus('unavailable');
      return;
    }

    // Server-side check
    const checkAvailabilityAPI = async () => {
      setAvailStatus('checking');
      setValidationError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(
          `${API_URL}/availability/${id}/check?checkIn=${checkIn}&checkOut=${checkOut}`
        );
        const data = res.data;
        if (data.available || data.data?.available) {
          setAvailStatus('available');
        } else {
          setValidationError('Las fechas seleccionadas ya no están disponibles.');
          setAvailStatus('unavailable');
        }
      } catch (err) {
        setValidationError('Error al verificar disponibilidad en el servidor.');
        setAvailStatus('unavailable');
      }
    };

    const timer = setTimeout(() => {
      checkAvailabilityAPI();
    }, 400);

    return () => clearTimeout(timer);
  }, [checkIn, checkOut, blockedDates, id]);

  // Fetch property details
  useEffect(() => {
    const fetchPropertyDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        const res = await axios.get(`${API_URL}/properties/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProperty(res.data.property || res.data.data?.property);
      } catch (err) {
        setError('No pudimos cargar los detalles de este hospedaje.');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id]);

  // Amenity icon mapping
  const getAmenityIcon = (amenityId) => {
    const mapping = {
      wifi: Wifi,
      pool: Waves,
      parking: Car,
      ac: Wind,
      heating: Flame,
      kitchen: Utensils,
      washer: Tv,
      tv: Tv,
      gym: Dumbbell,
      balcony: Sun,
      garden: Flower2,
      pets: Dog,
    };
    return mapping[amenityId] || LayoutGrid;
  };

  // Property type icon mapping
  const getPropertyTypeIcon = (typeId) => {
    const mapping = {
      apartment: Building2,
      house: Home,
      room: Bed,
      villa: Hotel,
      cabin: Trees,
    };
    return mapping[typeId] || LayoutGrid;
  };

  // Pricing Summary calculation
  const bookingSummary = useMemo(() => {
    if (!checkIn || !checkOut || !property) return null;

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = outDate - inDate;
    if (diffTime <= 0) return null;

    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const price = parseFloat(property.pricePerNight);
    const subtotal = nights * price;
    const fee = parseFloat((subtotal * 0.12).toFixed(2));
    const total = parseFloat((subtotal + fee).toFixed(2));

    return {
      nights,
      subtotal,
      fee,
      total,
    };
  }, [checkIn, checkOut, property]);

  const handleNextPhoto = () => {
    if (!property?.photos) return;
    setActivePhotoIdx((prev) => (prev + 1) % property.photos.length);
  };

  const handlePrevPhoto = () => {
    if (!property?.photos) return;
    setActivePhotoIdx((prev) => (prev - 1 + property.photos.length) % property.photos.length);
  };

  const handleConfirmReservation = async () => {
    if (!bookingSummary || availStatus !== 'available') return;

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await axios.post(
        `${API_URL}/reservations`,
        {
          propertyId: id,
          checkIn,
          checkOut,
          guestsCount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('¡Reservación realizada con éxito!');
      setCheckoutModalOpen(false);
      navigate('/reservations/my');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar la reservación.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <span className="text-dark-500 font-semibold">Cargando detalles increíbles...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="glass-card max-w-md text-center p-8 shadow-xl space-y-4">
          <h2 className="text-2xl font-bold text-dark-900">Ups, ocurrió un problema</h2>
          <p className="text-dark-500 text-sm">{error || 'Propiedad no encontrada.'}</p>
          <Link to="/search" className="btn-primary py-2 px-6 text-sm inline-block">
            Volver a la búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const primaryPhoto =
    property.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  const photosList = property.photos || [];
  const TypeIcon = getPropertyTypeIcon(property.propertyType);

  return (
    <div className="min-h-screen bg-mesh pb-16">
      {/* Header breadcrumb & Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-3">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-sm font-semibold text-dark-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al mapa de búsqueda</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
              {property.propertyType}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 tracking-tight mt-1">
              {property.title}
            </h1>
            <p className="text-dark-500 text-sm flex items-center gap-1.5 mt-1 font-medium">
              <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
              {property.address}, {property.city}, {property.country}
            </p>
          </div>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[320px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Main big photo */}
          <div
            onClick={() => {
              setActivePhotoIdx(0);
              setLightboxOpen(true);
            }}
            className="md:col-span-2 h-full cursor-pointer relative group overflow-hidden"
          >
            <img
              src={primaryPhoto}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-dark-900/10 group-hover:bg-dark-900/0 transition-colors" />
          </div>

          {/* Secondary mini photos */}
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-3 h-full">
            {photosList.slice(1, 5).map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => {
                  setActivePhotoIdx(idx + 1);
                  setLightboxOpen(true);
                }}
                className="h-full cursor-pointer relative group overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-dark-900/10 group-hover:bg-dark-900/0 transition-colors" />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setActivePhotoIdx(0);
              setLightboxOpen(true);
            }}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-dark-800 font-bold text-xs py-2 px-4 rounded-xl shadow-lg hover:bg-white transition-all flex items-center gap-2"
          >
            <LayoutGrid className="w-4 h-4 text-primary-600" />
            <span>Ver todas las fotos ({photosList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 columns: Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Banner & Key Stats */}
            <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-dark-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-dark-900">
                    Anfitrión: {property.host?.firstName} {property.host?.lastName}
                  </h2>
                  <p className="text-dark-500 text-xs mt-1 flex items-center gap-2">
                    {property.host?.identityStatus === 'verified' && (
                      <span className="badge badge-emerald inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Identidad Verificada
                      </span>
                    )}
                  </p>
                </div>
                {property.host?.avatarUrl ? (
                  <img
                    src={property.host.avatarUrl}
                    alt={property.host.firstName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary-500"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 font-extrabold text-lg flex items-center justify-center border-2 border-primary-500">
                    {property.host?.firstName?.[0]}
                  </div>
                )}
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-4 text-center py-2">
                <div className="p-3 rounded-2xl bg-dark-50/80 border border-dark-100">
                  <Users className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-dark-400 font-medium block">Capacidad</span>
                  <span className="font-bold text-dark-800 text-sm">Hasta {property.maxGuests} huéspedes</span>
                </div>
                <div className="p-3 rounded-2xl bg-dark-50/80 border border-dark-100">
                  <Bed className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-dark-400 font-medium block">Habitaciones</span>
                  <span className="font-bold text-dark-800 text-sm">{property.bedrooms} hab.</span>
                </div>
                <div className="p-3 rounded-2xl bg-dark-50/80 border border-dark-100">
                  <Bath className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <span className="text-xs text-dark-400 font-medium block">Baños</span>
                  <span className="font-bold text-dark-800 text-sm">{property.bathrooms} baños</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="font-display font-bold text-dark-900 text-lg">Acerca de este lugar</h3>
                <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-dark-900 text-lg">Lo que ofrece este lugar</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-3 p-3 rounded-2xl border border-dark-100 bg-dark-50/50">
                        <div className="p-2 rounded-xl bg-white text-primary-600 shadow-sm border border-dark-100">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold capitalize text-dark-800">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map location embed */}
            <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-dark-900 text-lg">¿Dónde te quedarás?</h3>
              <div className="relative rounded-2xl overflow-hidden border border-dark-200 shadow-inner h-[260px]">
                <MapContainer
                  center={[parseFloat(property.lat), parseFloat(property.lng)]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[parseFloat(property.lat), parseFloat(property.lng)]} />
                </MapContainer>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border border-dark-200 rounded-xl px-3 py-1.5 text-xs font-bold text-dark-700 hover:text-primary-500 shadow-lg flex items-center gap-1.5 z-[1000] transition-colors"
                >
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span>Reseñas de huéspedes</span>
                </h3>
                {avgRating && (
                  <span className="badge badge-amber text-sm font-extrabold px-3 py-1">
                    ★ {avgRating} ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 px-4 bg-dark-50/50 rounded-2xl border border-dark-100 border-dashed">
                  <span className="text-3xl mb-2 block">💬</span>
                  <p className="font-bold text-dark-800 text-sm">Este hospedaje aún no tiene reseñas</p>
                  <p className="text-dark-400 text-xs mt-1">¡Sé uno de los primeros huéspedes en reservar y evaluar!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl border border-dark-100 bg-dark-50/60 space-y-2">
                      <div className="flex items-center gap-3">
                        {rev.reviewer?.avatarUrl ? (
                          <img
                            src={rev.reviewer.avatarUrl}
                            alt={rev.reviewer.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">
                            {rev.reviewer?.firstName?.[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-dark-900">
                            {rev.reviewer?.firstName} {rev.reviewer?.lastName}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                            {'★'.repeat(rev.rating)}
                            <span className="text-dark-400 font-normal ml-1">
                              • {new Date(rev.createdAt).toLocaleDateString('es-MX')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-dark-600 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Reservation Widget */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="glass-card p-6 border border-dark-200/60 shadow-xl space-y-6">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-extrabold text-dark-900">${Math.round(property.pricePerNight)}</span>
                  <span className="text-dark-400 text-sm font-semibold"> / noche</span>
                </div>
              </div>

              {/* Form entries */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-dark-500">Llegada</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field py-2 text-xs shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-dark-500">Salida</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="input-field py-2 text-xs shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-dark-500">Huéspedes</label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value, 10))}
                    className="input-field py-2.5 text-xs cursor-pointer shadow-inner"
                  >
                    {Array.from({ length: property.maxGuests }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1} {idx + 1 === 1 ? 'huésped' : 'huéspedes'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time availability indicator badges */}
              {checkIn && checkOut && (
                <div className="pt-2 animate-fade-in">
                  {availStatus === 'checking' && (
                    <div className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando disponibilidad...</span>
                    </div>
                  )}
                  {availStatus === 'available' && (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <span>✓</span>
                      <span>¡Fechas disponibles!</span>
                    </div>
                  )}
                  {availStatus === 'unavailable' && (
                    <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>✗</span>
                        <span>Fechas no disponibles</span>
                      </div>
                      {validationError && (
                        <p className="text-[10px] text-rose-500 font-medium">{validationError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing summary */}
              {bookingSummary && availStatus === 'available' ? (
                <div className="space-y-3 pt-4 border-t border-dark-100 text-sm font-semibold text-dark-700 animate-fade-in">
                  <div className="flex justify-between">
                    <span className="text-dark-500">${Math.round(property.pricePerNight)} x {bookingSummary.nights} noches</span>
                    <span>${bookingSummary.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Comisión de servicio (12%)</span>
                    <span>${bookingSummary.fee}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-dark-900 pt-3 border-t border-dark-100">
                    <span>Total</span>
                    <span>${bookingSummary.total} MXN</span>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 text-center text-xs text-dark-400 font-semibold leading-relaxed">
                  {!checkIn || !checkOut
                    ? 'Ingresa tus fechas para ver el desglose de precios.'
                    : availStatus === 'unavailable'
                    ? 'Corrige las fechas seleccionadas para ver el desglose.'
                    : 'Verificando precios...'}
                </div>
              )}

              {/* Booking Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={availStatus !== 'available'}
                  onClick={() => setCheckoutModalOpen(true)}
                  className={`w-full py-3.5 text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-98 ${
                    availStatus === 'available'
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20 cursor-pointer'
                      : availStatus === 'unavailable'
                      ? 'bg-rose-100 text-rose-500 border border-rose-200 cursor-not-allowed'
                      : 'bg-dark-200 text-dark-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {availStatus === 'available' ? 'Reservar ahora' : availStatus === 'unavailable' ? 'No Disponible' : 'Selecciona Fechas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Checkout Modal */}
      {checkoutModalOpen && bookingSummary && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-dark-100">
            <div className="flex items-center justify-between border-b border-dark-100 pb-4">
              <h3 className="text-xl font-bold text-dark-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>Confirmar y Pagar</span>
              </h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 rounded-full text-dark-400 hover:bg-dark-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Details */}
            <div className="bg-dark-50 p-4 rounded-2xl space-y-3 text-xs border border-dark-100">
              <h4 className="font-bold text-dark-800 text-sm">{property.title}</h4>
              <div className="flex justify-between text-dark-600">
                <span>Fechas:</span>
                <span className="font-bold text-dark-900">{checkIn} → {checkOut} ({bookingSummary.nights} noches)</span>
              </div>
              <div className="flex justify-between text-dark-600">
                <span>Huéspedes:</span>
                <span className="font-bold text-dark-900">{guestsCount} persona(s)</span>
              </div>
              <div className="border-t border-dark-200 pt-2 flex justify-between text-sm font-extrabold text-dark-900">
                <span>Total a pagar:</span>
                <span className="text-primary-600">${bookingSummary.total} MXN</span>
              </div>
            </div>

            {/* Payment options */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-dark-500">Método de pago simulado</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Tarjeta de Débito / Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                  }`}
                >
                  <span>Paypal (Demostración)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2.5 text-sm text-dark-600 font-semibold hover:bg-dark-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleConfirmReservation}
                className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
              >
                {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Pagar y Reservar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col justify-between animate-fade-in">
          <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-black/0 text-white z-10">
            <span className="font-bold text-sm tracking-wide text-white/85 select-none">
              Foto {activePhotoIdx + 1} de {photosList.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between relative px-4 sm:px-12">
            <button
              onClick={handlePrevPhoto}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-90 transition-all z-10 shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[75vh] overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center mx-auto">
              <img
                src={photosList[activePhotoIdx]?.url || primaryPhoto}
                alt={`Foto lightbox ${activePhotoIdx + 1}`}
                className="max-w-full max-h-[75vh] object-contain select-none"
              />
            </div>

            <button
              onClick={handleNextPhoto}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-90 transition-all z-10 shrink-0"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="py-6 flex justify-center gap-1.5 bg-gradient-to-t from-black/80 to-black/0">
            {photosList.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activePhotoIdx === idx ? 'bg-primary-500 w-4' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
