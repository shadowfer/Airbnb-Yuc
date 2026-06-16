import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SlidersHorizontal,
  Calendar,
  Users,
  Compass,
  Loader2,
  Star,
  Map,
  List,
} from 'lucide-react';
import FilterPanel from '../components/FilterPanel';

// Fix leaflet icon bugs
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Custom price marker creator using Leaflet DivIcon
const createPriceIcon = (price, isHovered) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="px-2 py-1 rounded-lg border text-[11px] font-extrabold shadow-md transition-all duration-300 ${
        isHovered
          ? 'bg-primary-600 text-white border-primary-600 scale-110'
          : 'bg-white text-dark-800 border-dark-200 hover:border-primary-500 hover:scale-105'
      }">
        $${price}
      </div>
    `,
    iconSize: [60, 26],
    iconAnchor: [30, 13],
  });
};

// Component to handle map move/zoom and report bounds
const MapBoundsListener = ({ onBoundsChange }) => {
  const map = useMap();

  const handleBounds = useCallback(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      swLat: bounds.getSouthWest().lat,
      swLng: bounds.getSouthWest().lng,
      neLat: bounds.getNorthEast().lat,
      neLng: bounds.getNorthEast().lng,
    });
  }, [map, onBoundsChange]);

  // Initial bounds
  useEffect(() => {
    handleBounds();
  }, [handleBounds]);

  useMapEvents({
    moveend: handleBounds,
    zoomend: handleBounds,
  });

  return null;
};

// Controller to pan/zoom when bounds or coords change programmatically
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const Search = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // View state for mobile (toggle list vs map)
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  // Map settings
  const [mapCenter, setMapCenter] = useState([20.5076, -86.9442]); // Default Cozumel/Yucatan bounds
  const [bounds, setBounds] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    checkIn: '',
    checkOut: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    minGuests: '1',
    sort: 'newest',
  });

  // Hover sync state
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  // Filters modal/drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.propertyType) count += filters.propertyType.split(',').filter(Boolean).length;
    if (parseInt(filters.minGuests, 10) > 1) count++;
    return count;
  }, [filters]);

  // Handle address/city lookup to center map
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);

  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingCity(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        setError('No pudimos encontrar esa ubicación. Intenta con otra ciudad.');
      }
    } catch (err) {
      console.error('Nominatim error:', err);
    } finally {
      setSearchingCity(false);
    }
  };

  // Fetch properties from API
  const fetchProperties = useCallback(async () => {
    if (!bounds) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const params = {
        swLat: bounds.swLat,
        swLng: bounds.swLng,
        neLat: bounds.neLat,
        neLng: bounds.neLng,
        ...filters,
      };

      const res = await axios.get(`${API_URL}/properties/search`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProperties(res.data.properties || []);
    } catch (err) {
      setError('Error al obtener hospedajes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [bounds, filters]);

  // Trigger search on bounds or filters change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      checkIn: '',
      checkOut: '',
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      minGuests: '1',
      sort: 'newest',
    });
    setSearchQuery('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-dark-50 overflow-hidden relative">
      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b border-dark-100 px-4 py-3 shadow-sm z-30 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* City search input */}
        <form onSubmit={handleCitySearch} className="w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="¿A dónde vas? Ej. Mérida"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 pr-4 py-2 text-sm shadow-inner"
            />
            <Compass className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={searchingCity}
            className="btn-primary py-2 px-4 text-xs whitespace-nowrap"
          >
            {searchingCity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
          </button>
        </form>

        {/* Date Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark-200 bg-dark-50 shadow-inner flex-1 md:flex-initial">
            <Calendar className="w-4 h-4 text-dark-500" />
            <input
              type="date"
              name="checkIn"
              value={filters.checkIn}
              onChange={handleInputChange}
              className="bg-transparent text-xs font-semibold text-dark-700 focus:outline-none border-none p-0 cursor-pointer w-full"
              title="Llegada"
            />
          </div>
          <span className="text-dark-400 text-xs font-bold">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark-200 bg-dark-50 shadow-inner flex-1 md:flex-initial">
            <Calendar className="w-4 h-4 text-dark-500" />
            <input
              type="date"
              name="checkOut"
              value={filters.checkOut}
              onChange={handleInputChange}
              min={filters.checkIn || undefined}
              className="bg-transparent text-xs font-semibold text-dark-700 focus:outline-none border-none p-0 cursor-pointer w-full"
              title="Salida"
            />
          </div>
        </div>

        {/* Sorting and Filters triggers */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            name="sort"
            value={filters.sort}
            onChange={handleInputChange}
            className="input-field py-2 px-3 text-xs w-auto cursor-pointer"
          >
            <option value="newest">Más nuevos</option>
            <option value="price_asc">Precio: de menor a mayor</option>
            <option value="price_desc">Precio: de mayor a menor</option>
          </select>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={`btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-2 border-2 ${
              activeFiltersCount > 0
                ? 'border-primary-500 text-primary-500 bg-primary-50'
                : 'border-dark-200 text-dark-600 hover:border-primary-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-extrabold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main split viewport */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Property Listings List */}
        <div
          className={`flex-1 md:w-1/2 h-full overflow-y-auto px-6 py-6 space-y-6 z-20 bg-dark-50/50 transition-transform ${
            viewMode === 'list' ? 'block' : 'hidden md:block'
          }`}
        >
          {/* List header summary */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-extrabold text-dark-800">
                Hospedajes Disponibles
              </h2>
              <p className="text-xs text-dark-400 font-semibold mt-0.5">
                {loading ? 'Buscando...' : `${properties.length} hospedajes encontrados en esta zona`}
              </p>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {error && <div className="alert-error text-xs p-3.5">{error}</div>}

          {/* Cards listing */}
          {loading && properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <span className="text-sm text-dark-500 font-medium">Buscando estancias espectaculares...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="glass-card text-center py-20 px-8 flex flex-col items-center justify-center max-w-md mx-auto mt-6">
              <span className="text-4xl mb-4">🔍</span>
              <h3 className="font-bold text-dark-800 text-lg mb-1">No hay resultados</h3>
              <p className="text-dark-400 text-xs leading-relaxed max-w-xs mb-6">
                No encontramos propiedades con los filtros aplicados en esta zona. Intenta arrastrar el mapa o limpiar tus filtros.
              </p>
              <button onClick={handleClearFilters} className="btn-primary text-xs py-2 px-6">
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
              {properties.map((p) => {
                const coverPhoto = p.photos?.[0]?.url || 'https://via.placeholder.com/400x300?text=Sin+Foto';
                const isHovered = hoveredPropertyId === p.id;

                return (
                  <Link
                    key={p.id}
                    to={`/properties/${p.id}`}
                    onMouseEnter={() => setHoveredPropertyId(p.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    className={`glass-card p-3 flex flex-col group overflow-hidden border-2 transition-all duration-300 ${
                      isHovered ? 'border-primary-400 scale-[1.01]' : 'border-transparent'
                    }`}
                  >
                    {/* Cover photo */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3.5 border border-dark-100 bg-dark-50">
                      <img
                        src={coverPhoto}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/70 text-white font-extrabold text-[10px] px-2 py-1 rounded-lg backdrop-blur-md">
                        ${Math.round(p.pricePerNight)} MXN
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 flex flex-col justify-between space-y-1">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            {p.propertyType}
                          </span>
                        </div>
                        <h4 className="font-bold text-dark-800 text-sm leading-tight group-hover:text-primary-500 transition-colors truncate">
                          {p.title}
                        </h4>
                      </div>

                      <div className="flex gap-3 text-[11px] font-semibold text-dark-400 pt-2 mt-auto border-t border-dark-100/60">
                        <span>👥 {p.maxGuests}</span>
                        <span>🛏️ {p.bedrooms}</span>
                        <span>🛁 {p.bathrooms}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div
          className={`flex-1 md:w-1/2 h-full z-10 relative ${
            viewMode === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {properties.map((p) => {
              const coverPhoto = p.photos?.[0]?.url || 'https://via.placeholder.com/400x300?text=Sin+Foto';
              const isHovered = hoveredPropertyId === p.id;

              return (
                <Marker
                  key={p.id}
                  position={[parseFloat(p.lat), parseFloat(p.lng)]}
                  icon={createPriceIcon(Math.round(p.pricePerNight), isHovered)}
                  eventHandlers={{
                    mouseover: () => setHoveredPropertyId(p.id),
                    mouseout: () => setHoveredPropertyId(null),
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="w-56 p-1 flex flex-col space-y-2.5">
                      <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border border-dark-100 bg-dark-50">
                        <img
                          src={coverPhoto}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-dark-900 text-xs leading-snug truncate">
                          {p.title}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs text-primary-600">
                            ${Math.round(p.pricePerNight)} MXN
                          </span>
                          <Link
                            to={`/properties/${p.id}`}
                            className="text-[10px] font-bold bg-primary-500 hover:bg-primary-600 text-white px-2.5 py-1 rounded-md transition-colors"
                          >
                            Ver detalle
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            <MapBoundsListener onBoundsChange={setBounds} />
            <MapController center={mapCenter} />
          </MapContainer>

          {/* Skeletons/Indicators while map loading */}
          {loading && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-dark-100 flex items-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-xs font-semibold text-dark-700">Actualizando hospedajes...</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toggle View Button on Mobile */}
      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-extrabold text-sm py-3 px-6 rounded-full flex items-center gap-2 shadow-2xl shadow-primary-500/30 border border-primary-400 active:scale-95 transition-all select-none"
      >
        {viewMode === 'map' ? (
          <>
            <List className="w-4 h-4" />
            <span>Ver Lista</span>
          </>
        ) : (
          <>
            <Map className="w-4 h-4" />
            <span>Ver Mapa</span>
          </>
        )}
      </button>

      {/* Filter panel drawer */}
      <FilterPanel
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={fetchProperties}
        onClear={handleClearFilters}
      />
    </div>
  );
};

export default Search;
