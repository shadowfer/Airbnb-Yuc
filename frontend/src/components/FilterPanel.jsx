import { X, Minus, Plus, Building2, Home, Bed, Hotel, Trees, LayoutGrid } from 'lucide-react';

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onClear,
}) => {
  if (!isOpen) return null;

  const propertyTypes = [
    { id: 'apartment', name: 'Apartamento', icon: Building2 },
    { id: 'house', name: 'Casa', icon: Home },
    { id: 'room', name: 'Habitación', icon: Bed },
    { id: 'villa', name: 'Villa', icon: Hotel },
    { id: 'cabin', name: 'Cabaña', icon: Trees },
    { id: 'other', name: 'Otro', icon: LayoutGrid },
  ];

  const handleTypeToggle = (typeId) => {
    setFilters((prev) => {
      const currentTypes = prev.propertyType ? prev.propertyType.split(',').filter(Boolean) : [];
      const newTypes = currentTypes.includes(typeId)
        ? currentTypes.filter((t) => t !== typeId)
        : [...currentTypes, typeId];
      return {
        ...prev,
        propertyType: newTypes.join(','),
      };
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuestChange = (change) => {
    setFilters((prev) => {
      const current = parseInt(prev.minGuests, 10) || 1;
      const nextVal = Math.max(1, current + change);
      return {
        ...prev,
        minGuests: nextVal.toString(),
      };
    });
  };

  const activeTypes = filters.propertyType ? filters.propertyType.split(',').filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left z-10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-dark-900">Filtros Avanzados</h3>
            <p className="text-xs text-dark-400 mt-0.5">Refina tu búsqueda de hospedaje</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-dark-50 text-dark-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Price Filters */}
          <div className="space-y-4">
            <h4 className="font-bold text-dark-800 text-sm uppercase tracking-wider">Rango de Precios (MXN)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dark-500 block mb-1.5">Mínimo</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">$</span>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="input-field pl-8 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark-500 block mb-1.5">Máximo</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">$</span>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handlePriceChange}
                    placeholder="Cualquiera"
                    className="input-field pl-8 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '800' }))}
                className="px-3 py-1.5 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:border-primary-500 hover:text-primary-500 transition-all bg-white"
              >
                Económico (&lt; $800)
              </button>
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, minPrice: '800', maxPrice: '1500' }))}
                className="px-3 py-1.5 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:border-primary-500 hover:text-primary-500 transition-all bg-white"
              >
                Moderado ($800 - $1.5k)
              </button>
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, minPrice: '1500', maxPrice: '' }))}
                className="px-3 py-1.5 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:border-primary-500 hover:text-primary-500 transition-all bg-white"
              >
                Lujo (&gt; $1.5k)
              </button>
            </div>
          </div>

          {/* Property Type Filters */}
          <div className="space-y-4">
            <h4 className="font-bold text-dark-800 text-sm uppercase tracking-wider">Tipo de Propiedad</h4>
            <div className="grid grid-cols-2 gap-3">
              {propertyTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTypes.includes(t.id);

                return (
                  <div
                    key={t.id}
                    onClick={() => handleTypeToggle(t.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-md shadow-primary-500/5'
                        : 'border-dark-100 bg-white text-dark-700 hover:border-primary-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isSelected ? 'bg-primary-500 text-white' : 'bg-dark-50 text-dark-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold truncate">{t.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guests Filter */}
          <div className="space-y-4">
            <h4 className="font-bold text-dark-800 text-sm uppercase tracking-wider">Huéspedes Mínimos</h4>
            <div className="flex items-center justify-between p-4 bg-dark-50 rounded-2xl border border-dark-100">
              <div>
                <span className="font-bold text-dark-800 text-base">Capacidad requerida</span>
                <p className="text-xs text-dark-400">Mostrar solo estancias para este número de personas</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleGuestChange(-1)}
                  disabled={(parseInt(filters.minGuests, 10) || 1) <= 1}
                  className="w-9 h-9 rounded-xl bg-white border border-dark-200 flex items-center justify-center text-dark-600 disabled:opacity-40 hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-lg text-dark-800 w-6 text-center">
                  {filters.minGuests || '1'}
                </span>
                <button
                  type="button"
                  onClick={() => handleGuestChange(1)}
                  className="w-9 h-9 rounded-xl bg-white border border-dark-200 flex items-center justify-center text-dark-600 hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-dark-100 flex gap-4 bg-dark-50/50">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 btn-secondary py-3 text-sm font-bold border border-dark-200 hover:bg-white transition-colors"
          >
            Limpiar Filtros
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex-1 btn-primary py-3 text-sm font-bold shadow-lg shadow-primary-500/15"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
