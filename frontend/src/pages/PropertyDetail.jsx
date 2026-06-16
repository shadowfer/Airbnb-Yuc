import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
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
  const [availLoading, setAvailLoading] = useState(false);
  const [availStatus, setAvailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'unavailable'
  const [validationError, setValidationError] = useState(null);

  // Fetch blocked dates on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/availability/${id}`);
        setBlockedDates(res.data.blockedDates || res.data.data.blockedDates || []);
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    };
    if (id) {
      fetchAvailability();
    }
  }, [id]);

  // Real-time checking logic when dates change
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

    // Client-side quick overlap validation: check dates range day-by-day (excluding checkOut day)
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

    // Compare with blockedDates retrieved
    const hasOverlap = datesToCheck.some((dStr) =>
      blockedDates.some((b) => (b.blockedDate || b.blocked_date || '').split('T')[0] === dStr)
    );

    if (hasOverlap) {
      setValidationError('Las fechas seleccionadas incluyen días no disponibles.');
      setAvailStatus('unavailable');
      return;
    }

    // Call API /check for definitive confirmation
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
    }, 450); // Debounce to prevent rapid calls on typing

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
        setProperty(res.data.property || res.data.data.property);
      } catch (err) {
        setError('No pudimos cargar los detalles de este hospedaje.');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id]);

  // Icons mapping for amenities
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

  // Calculations
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
    const total = subtotal + fee;

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
        <div className="glass-card max-w-md text-center p-8 shadow-xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-dark-800 mt-4 mb-2">Error de carga</h2>
          <p className="text-dark-500 text-sm mb-6">{error || 'No se encontró la propiedad.'}</p>
          <Link to="/search" className="btn-primary py-2.5 px-6">
            Volver a la Búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const photosList = property.photos || [];
  const primaryPhoto = photosList[0]?.url || 'https://via.placeholder.com/800x600?text=Sin+Foto';
  const sidePhotos = photosList.slice(1, 5);

  const TypeIcon = getPropertyTypeIcon(property.propertyType);

  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-500 font-semibold transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span>Volver a la búsqueda</span>
        </Link>

        {/* Title Block */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-dark-900 tracking-tight leading-tight">
            {property.title}
          </h1>
          <p className="text-dark-500 text-sm mt-1.5 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
            <span>
              {property.address}, {property.city}, {property.state}, {property.country}
            </span>
          </p>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden border border-dark-200 bg-white shadow-md mb-8">
          {/* Main big cover */}
          <div className="md:col-span-2 relative aspect-[4/3] overflow-hidden group cursor-pointer" onClick={() => { setActivePhotoIdx(0); setLightboxOpen(true); }}>
            <img
              src={primaryPhoto}
              alt="Foto principal"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            {photosList.length > 5 && (
              <button
                type="button"
                className="absolute bottom-4 right-4 bg-black/75 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md hover:bg-black transition-colors"
              >
                Ver todas las fotos ({photosList.length})
              </button>
            )}
          </div>

          {/* Right grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3 p-3 bg-white">
            {sidePhotos.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => { setActivePhotoIdx(idx + 1); setLightboxOpen(true); }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-dark-100 bg-dark-50"
              >
                <img
                  src={p.url}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
            {/* Fallback place holders if < 5 photos */}
            {Array.from({ length: Math.max(0, 4 - sidePhotos.length) }).map((_, idx) => (
              <div
                key={`placeholder_${idx}`}
                className="aspect-[4/3] rounded-xl bg-dark-50 border-2 border-dashed border-dark-200 flex items-center justify-center text-dark-300 font-semibold text-xs"
              >
                Hospedaje 🏡
              </div>
            ))}
          </div>
        </div>

        {/* Layout details 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: General Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host info and stats */}
            <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {property.host?.firstName?.[0]?.toUpperCase()}{property.host?.lastName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-dark-800 text-lg">
                    Hospedado por {property.host?.firstName}
                  </h3>
                  <p className="text-xs text-dark-400 font-semibold mt-0.5">
                    Anfitrión desde {new Date(property.host?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {property.host?.identityStatus === 'verified' && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs select-none">
                  <ShieldCheck className="w-4 h-4 fill-emerald-100" />
                  <span>Identidad Verificada</span>
                </div>
              )}
            </div>

            {/* Capacity specs */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-2xl border border-dark-100 shadow-sm flex flex-col items-center">
                <Users className="w-6 h-6 text-primary-500 mb-1" />
                <span className="text-sm font-bold text-dark-800">{property.maxGuests} huéspedes</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-dark-100 shadow-sm flex flex-col items-center">
                <Bed className="w-6 h-6 text-primary-500 mb-1" />
                <span className="text-sm font-bold text-dark-800">{property.bedrooms} habitaciones</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-dark-100 shadow-sm flex flex-col items-center">
                <Bath className="w-6 h-6 text-primary-500 mb-1" />
                <span className="text-sm font-bold text-dark-800">{property.bathrooms} baños</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-dark-900 text-lg">Acerca de este hospedaje</h3>
              <p className="text-dark-600 text-sm leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities list */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-dark-900 text-lg">¿Qué ofrece este lugar?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.amenities.map((a, idx) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-dark-700">
                        <div className="p-2 rounded-xl bg-dark-50 text-dark-500 border border-dark-100">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold capitalize">{a}</span>
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
                {/* Click overlay to open in google maps */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border border-dark-200 rounded-xl px-3 py-1.5 text-xs font-bold text-dark-700 hover:text-primary-500 shadow-lg flex items-center gap-1.5 z-[1000] select-none transition-colors"
                >
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Reviews list ("Sin reseñas aún") */}
            <div className="bg-white p-6 rounded-3xl border border-dark-100 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-dark-900 text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
                <span>Reseñas del hospedaje</span>
              </h3>
              <div className="text-center py-10 px-4 bg-dark-50/50 rounded-2xl border border-dark-100 border-dashed">
                <span className="text-3xl mb-2 block">💬</span>
                <p className="font-bold text-dark-800 text-sm">Este hospedaje aún no tiene reseñas</p>
                <p className="text-dark-400 text-xs mt-1">¡Sé uno de los primeros huéspedes en dejar tu comentario!</p>
              </div>
            </div>
          </div>

          {/* Right: Reservation Widget */}
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
                    ? 'Ingresa tus fechas para ver el desglose de precios y tarifas de servicio.' 
                    : availStatus === 'unavailable' 
                    ? 'Corrige las fechas seleccionadas para ver las tarifas de servicio.' 
                    : 'Verificando precios...'}
                </div>
              )}

              {/* Booking Button (disabled/interactive based on availability in Sprint 3) */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={availStatus !== 'available'}
                  className={`w-full py-3.5 text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-98 ${
                    availStatus === 'available'
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20 cursor-pointer'
                      : availStatus === 'unavailable'
                      ? 'bg-rose-100 text-rose-500 border border-rose-200 cursor-not-allowed'
                      : 'bg-dark-200 text-dark-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {availStatus === 'available' ? 'Reservar (Próximamente)' : availStatus === 'unavailable' ? 'No Disponible' : 'Selecciona Fechas'}
                </button>
                <p className="text-[10px] text-center text-dark-400 font-semibold mt-1">
                  {availStatus === 'available' 
                    ? 'Todavía no se te cobrará ningún importe. Lógica real en Sprint 4.'
                    : 'Debes seleccionar fechas válidas y disponibles para proceder.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col justify-between animate-fade-in">
          {/* Header */}
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

          {/* Carousel Slider body */}
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

          {/* Footer dots */}
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
