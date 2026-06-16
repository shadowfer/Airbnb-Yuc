import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PhotoGallery from '../components/PhotoGallery';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  Building2,
  Home,
  Bed,
  Hotel,
  Trees,
  LayoutGrid,
  MapPin,
  Search,
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
  DollarSign,
  Users,
  Compass,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Map controller to pan/zoom when coordinates change programmatically
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14);
    }
  }, [coords, map]);
  return null;
};

// Map click listener to set marker
const MapEventsHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const CreateProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    address: '',
    street: '',
    extNumber: '',
    intNumber: '',
    neighborhood: '',
    zipCode: '',
    city: '',
    state: '',
    country: 'México',
    lat: 19.4326, // Default CDMX
    lng: -99.1332,
    pricePerNight: '',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    houseRules: '',
  });

  const [amenities, setAmenities] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Type definitions
  const propertyTypes = [
    { id: 'apartment', name: 'Apartamento', icon: Building2, desc: 'Pisos o departamentos en edificios' },
    { id: 'house', name: 'Casa', icon: Home, desc: 'Casas completas e independientes' },
    { id: 'room', name: 'Habitación', icon: Bed, desc: 'Cuartos privados en un hogar' },
    { id: 'villa', name: 'Villa', icon: Hotel, desc: 'Propiedades de lujo de gran tamaño' },
    { id: 'cabin', name: 'Cabaña', icon: Trees, desc: 'Refugios rústicos y campestres' },
    { id: 'other', name: 'Otro', icon: LayoutGrid, desc: 'Hospedajes únicos y alternativos' },
  ];

  // Amenities definitions
  const amenitiesList = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'pool', name: 'Piscina', icon: Waves },
    { id: 'parking', name: 'Estacionamiento', icon: Car },
    { id: 'ac', name: 'Aire acondicionado', icon: Wind },
    { id: 'heating', name: 'Calefacción', icon: Flame },
    { id: 'kitchen', name: 'Cocina equipada', icon: Utensils },
    { id: 'washer', name: 'Lavadora', icon: Tv }, // fallback washer icon
    { id: 'tv', name: 'TV', icon: Tv },
    { id: 'gym', name: 'Gimnasio', icon: Dumbbell },
    { id: 'balcony', name: 'Balcón', icon: Sun },
    { id: 'garden', name: 'Jardín', icon: Flower2 },
    { id: 'pets', name: 'Mascotas permitidas', icon: Dog },
  ];

  // Redirection if not logged in or not host
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'host') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Dynamically generate full address string from detailed fields for DB compatibility
  useEffect(() => {
    const streetWithNum = formData.street ? `${formData.street} ${formData.extNumber}`.trim() : '';
    const details = [
      streetWithNum,
      formData.intNumber ? `Depto/Int ${formData.intNumber}` : '',
      formData.neighborhood ? `Col. ${formData.neighborhood}` : '',
      formData.zipCode ? `CP ${formData.zipCode}` : ''
    ].filter(Boolean).join(', ');

    setFormData((prev) => {
      if (prev.address !== details) {
        return { ...prev, address: details };
      }
      return prev;
    });
  }, [formData.street, formData.extNumber, formData.intNumber, formData.neighborhood, formData.zipCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeSelect = (typeId) => {
    setFormData((prev) => ({ ...prev, propertyType: typeId }));
  };

  const handleAmenityToggle = (amenityId) => {
    setAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Draggable marker events
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setFormData((prev) => ({
            ...prev,
            lat: latLng.lat,
            lng: latLng.lng,
          }));
        }
      },
    }),
    []
  );

  const handleMapClick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));
  };

  // Geolocalizacion Nominatim with highly precise detailed search and fallback
  const searchAddressOnMap = async () => {
    const { street, extNumber, neighborhood, city, state, zipCode, country } = formData;
    if (!street || !city) return;

    setSearchingLocation(true);
    setError(null);
    try {
      const streetQuery = `${street} ${extNumber}`.trim();
      const query = encodeURIComponent(
        [streetQuery, neighborhood, city, state, zipCode, country]
          .filter(Boolean)
          .join(', ')
      );
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );

      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setFormData((prev) => ({
          ...prev,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        }));
      } else {
        // Fallback search with less specific query
        const fallbackQuery = encodeURIComponent(`${city}, ${state || ''}, ${country}`);
        const fallbackRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`
        );
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          const { lat, lon } = fallbackRes.data[0];
          setFormData((prev) => ({
            ...prev,
            lat: parseFloat(lat),
            lng: parseFloat(lon),
          }));
          setError('No pudimos localizar la dirección exacta, pero centramos el mapa en tu ciudad. Por favor, arrastra el pin manualmente a la ubicación de tu hospedaje.');
        } else {
          setError('No pudimos localizar esa dirección en el mapa. Intenta buscar de nuevo o coloca el marcador manualmente.');
        }
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Validations per step
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0 && formData.description.trim().length > 0;
      case 2:
        return (
          formData.street.trim().length > 0 &&
          formData.extNumber.trim().length > 0 &&
          formData.neighborhood.trim().length > 0 &&
          formData.zipCode.trim().length > 0 &&
          formData.city.trim().length > 0 &&
          formData.state.trim().length > 0 &&
          formData.country.trim().length > 0
        );
      case 3:
        return photos.length > 0; // Require at least 1 photo for Sprint 2 DoD
      case 4:
        return formData.pricePerNight > 0 && formData.maxGuests >= 1 && formData.bedrooms >= 1 && formData.bathrooms >= 1;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  // Submit everything!
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) return;

    setSubmitting(true);
    setError(null);

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // 1. Create property metadata
      const propertyResponse = await axios.post(
        `${API_URL}/properties`,
        {
          ...formData,
          pricePerNight: parseFloat(formData.pricePerNight),
          amenities,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdProperty = propertyResponse.data.property;
      const propId = createdProperty.id;

      // 2. Upload photos sequentially
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.file) {
          const fileData = new FormData();
          fileData.append('photo', photo.file);

          await axios.post(`${API_URL}/properties/${propId}/photos`, fileData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      // Successful creation
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Ocurrió un error al publicar tu propiedad. Revisa que todos los campos sean correctos.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-dark-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-8 h-8 text-primary-500" />
              <span>Publica tu Hospedaje</span>
            </h1>
            <p className="text-dark-500 mt-1.5 text-base sm:text-lg">
              Crea un anuncio espectacular y empieza a recibir huéspedes de todo el mundo.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-dark-200 text-dark-600 font-semibold hover:bg-dark-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancelar</span>
          </Link>
        </div>

        {/* Stepper */}
        <div className="glass-card px-8 py-6 mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 h-1 bg-dark-100 top-1/2 -translate-y-1/2 -z-10" />
            <div
              className="absolute left-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 top-1/2 -translate-y-1/2 -z-10 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[1, 2, 3, 4].map((num) => {
              const isActive = step >= num;
              const isCurrent = step === num;
              const stepNames = ['Detalles', 'Ubicación', 'Galería y Servicios', 'Precio y Resumen'];

              return (
                <div key={num} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-md ${
                      isCurrent
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 ring-4 ring-primary-100'
                        : isActive
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                        : 'bg-white border-2 border-dark-200 text-dark-400'
                    }`}
                  >
                    {num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden md:inline transition-colors duration-500 ${
                      isActive ? 'text-primary-600' : 'text-dark-400'
                    }`}
                  >
                    {stepNames[num - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {error && <div className="alert-error mb-6">{error}</div>}

        {/* Wizard Form */}
        <div className="glass-card p-8 shadow-xl animate-fade-in-up">
          {/* STEP 1: Type and description */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-dark-800">
                  Paso 1: ¿Qué tipo de hospedaje ofreces?
                </h2>
                <p className="text-dark-400 mt-1">
                  Selecciona la categoría que mejor describa tu propiedad.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {propertyTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = formData.propertyType === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTypeSelect(t.id)}
                      className={`role-card flex flex-col items-center text-center p-6 rounded-3xl cursor-pointer ${
                        isSelected ? 'role-card-selected' : 'role-card-unselected'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl mb-4 transition-colors ${
                          isSelected ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-500'
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-dark-800 text-base">{t.name}</h4>
                      <p className="text-xs text-dark-400 mt-1 hidden sm:block">
                        {t.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="input-label">
                    Título de tu anuncio
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Ej. Increíble cabaña alpina con jacuzzi en el bosque"
                    className="input-field py-3.5"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-xs text-dark-400 font-semibold">
                    <span>Sé claro, directo y resalta lo único.</span>
                    <span>{formData.title.length} / 100</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="input-label">
                    Descripción del espacio
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={1000}
                    rows={6}
                    placeholder="Describe las habitaciones, los servicios y qué hace a tu alojamiento una estancia maravillosa para tus huéspedes..."
                    className="input-field"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-xs text-dark-400 font-semibold">
                    <span>Menciona reglas especiales o vistas destacadas.</span>
                    <span>{formData.description.length} / 1000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location Map */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-dark-800">
                  Paso 2: ¿Dónde está ubicado tu hospedaje?
                </h2>
                <p className="text-dark-400 mt-1">
                  Ingresa los detalles de dirección y ubica el pin exactamente en el mapa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Calle y Números */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="street" className="input-label">
                        Calle
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="Ej. Calle Pino Suárez"
                        className="input-field py-3"
                      />
                    </div>
                    <div>
                      <label htmlFor="extNumber" className="input-label">
                        Num. Ext
                      </label>
                      <input
                        type="text"
                        id="extNumber"
                        name="extNumber"
                        value={formData.extNumber}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="123"
                        className="input-field py-3"
                      />
                    </div>
                  </div>

                  {/* Num Interior y Colonia */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="intNumber" className="input-label">
                        Num. Int (Opt)
                      </label>
                      <input
                        type="text"
                        id="intNumber"
                        name="intNumber"
                        value={formData.intNumber}
                        onChange={handleChange}
                        placeholder="Apt 4B"
                        className="input-field py-3"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="neighborhood" className="input-label">
                        Colonia / Barrio
                      </label>
                      <input
                        type="text"
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="Ej. Centro"
                        className="input-field py-3"
                      />
                    </div>
                  </div>

                  {/* CP y Ciudad */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="zipCode" className="input-label">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="97000"
                        className="input-field py-3"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="city" className="input-label">
                        Ciudad / Municipio
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="Ej. Mérida"
                        className="input-field py-3"
                      />
                    </div>
                  </div>

                  {/* Estado y País */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="state" className="input-label">
                        Estado
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="Ej. Yucatán"
                        className="input-field py-3"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="input-label">
                        País
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        onBlur={searchAddressOnMap}
                        placeholder="Ej. México"
                        className="input-field py-3"
                      />
                    </div>
                  </div>

                  {/* Botón Buscar en Mapa */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={searchAddressOnMap}
                      disabled={searchingLocation}
                      className="btn-secondary w-full py-3.5 text-sm flex items-center justify-center gap-2 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 font-bold transition-all rounded-2xl"
                    >
                      {searchingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>Validar y Buscar en Mapa</span>
                    </button>
                  </div>
                </div>

                {/* Leaflet Map */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-dark-100 shadow-inner h-[280px] md:h-auto min-h-[280px]">
                  <MapContainer
                    center={[formData.lat, formData.lng]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      draggable={true}
                      eventHandlers={eventHandlers}
                      position={[formData.lat, formData.lng]}
                      ref={markerRef}
                    />
                    <ChangeMapView coords={[formData.lat, formData.lng]} />
                    <MapEventsHandler onMapClick={handleMapClick} />
                  </MapContainer>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-dark-200 text-[10px] text-dark-500 font-semibold shadow-md z-[1000] select-none">
                    Coordenadas: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)} (Haz clic en el mapa o arrastra el pin)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Photos, amenities, rules */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-dark-800">
                  Paso 3: Fotos, servicios y reglas
                </h2>
                <p className="text-dark-400 mt-1">
                  Muestra la calidad de tu hospedaje y define qué ofreces.
                </p>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3">
                <label className="input-label">Fotos de tu hospedaje (Mínimo 1)</label>
                <PhotoGallery photos={photos} setPhotos={setPhotos} />
              </div>

              {/* Amenities Checks */}
              <div className="space-y-4 pt-4 border-t border-dark-100">
                <label className="input-label">¿Qué amenidades ofreces?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {amenitiesList.map((a) => {
                    const Icon = a.icon;
                    const isChecked = amenities.includes(a.id);

                    return (
                      <div
                        key={a.id}
                        onClick={() => handleAmenityToggle(a.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary-500 bg-primary-50/50 shadow-md shadow-primary-500/5'
                            : 'border-dark-100 bg-white hover:border-primary-300'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg ${
                            isChecked ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-dark-700 truncate">
                          {a.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* House Rules */}
              <div className="space-y-3 pt-4 border-t border-dark-100">
                <label htmlFor="houseRules" className="input-label">
                  Reglas de la casa (Opcional)
                </label>
                <textarea
                  id="houseRules"
                  name="houseRules"
                  value={formData.houseRules}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={4}
                  placeholder="Ej. No fiestas, no fumar en interiores, silencio después de las 10 PM..."
                  className="input-field"
                />
                <div className="flex justify-between items-center text-xs text-dark-400 font-semibold">
                  <span>Define pautas claras para una sana convivencia.</span>
                  <span>{formData.houseRules.length} / 1000</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Pricing and final summary */}
          {step === 4 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-display font-bold text-dark-800">
                  Paso 4: Precio y Resumen final
                </h2>
                <p className="text-dark-400 mt-1">
                  Establece tu precio de hospedaje y haz una revisión final antes de publicar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="pricePerNight" className="input-label">
                      Precio por noche (MXN)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="pricePerNight"
                        name="pricePerNight"
                        value={formData.pricePerNight}
                        onChange={handleChange}
                        min="1"
                        placeholder="1200"
                        className="input-field pl-10"
                      />
                      <DollarSign className="w-5 h-5 text-dark-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="maxGuests" className="input-label">
                        Huéspedes
                      </label>
                      <input
                        type="number"
                        id="maxGuests"
                        name="maxGuests"
                        value={formData.maxGuests}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="bedrooms" className="input-label">
                        Cuartos
                      </label>
                      <input
                        type="number"
                        id="bedrooms"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="bathrooms" className="input-label">
                        Baños
                      </label>
                      <input
                        type="number"
                        id="bathrooms"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleChange}
                        min="1"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Listing Summary Preview */}
                <div className="bg-dark-50/50 rounded-3xl border-2 border-dark-100 p-6 space-y-4 shadow-inner">
                  <h3 className="font-bold text-dark-800 flex items-center gap-2">
                    👀 Vista Previa del Anuncio
                  </h3>

                  {photos.length > 0 && (
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-dark-200">
                      <img
                        src={photos[0].url}
                        alt="Portada de anuncio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md">
                        {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-100 text-primary-700">
                      {formData.propertyType}
                    </span>
                    <h4 className="font-display font-bold text-dark-800 text-lg leading-tight truncate">
                      {formData.title || 'Título de Hospedaje'}
                    </h4>
                    <p className="text-dark-500 text-xs truncate">
                      📍 {formData.address}, {formData.city}, {formData.country}
                    </p>

                    <div className="flex gap-4 text-xs font-semibold text-dark-600 py-1.5 border-y border-dark-100">
                      <span className="flex items-center gap-1">
                        👥 {formData.maxGuests} huéspedes
                      </span>
                      <span>•</span>
                      <span>🛏️ {formData.bedrooms} habs</span>
                      <span>•</span>
                      <span>🛁 {formData.bathrooms} baños</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <span className="text-xs text-dark-400 font-semibold block">Precio por noche</span>
                        <span className="text-xl font-extrabold text-dark-900">
                          ${formData.pricePerNight || '0'} MXN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper controls */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-dark-100 gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="btn-secondary py-3.5 px-6 flex items-center gap-2 font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="btn-secondary py-3.5 px-6 flex items-center gap-2 font-bold border-2 border-dark-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Salir</span>
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary py-3.5 px-6 flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid() || submitting}
                className="btn-primary py-4 px-8 flex items-center gap-2.5 shadow-xl shadow-primary-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publicando Anuncio...</span>
                  </>
                ) : (
                  <>
                    <span>Publicar Hospedaje</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProperty;
