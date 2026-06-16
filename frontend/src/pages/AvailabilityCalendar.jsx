import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Trash2, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AvailabilityCalendar = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selection state
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  // Selected cell for unblocking
  const [selectedBlock, setSelectedBlock] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Load property and availability dates
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Get property details
      const propRes = await axios.get(`${API_URL}/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperty(propRes.data.property || propRes.data.data.property);

      // Get blocked dates
      const availRes = await axios.get(`${API_URL}/availability/${id}`);
      setBlockedDates(availRes.data.blockedDates || availRes.data.data.blockedDates || []);
    } catch (err) {
      setError('Error al cargar la disponibilidad de la propiedad. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Index blocked dates for quick lookup
  const blockedMap = useMemo(() => {
    const map = {};
    blockedDates.forEach((record) => {
      // Normalise date string to YYYY-MM-DD
      const dateStr = record.blockedDate || record.blocked_date;
      if (dateStr) {
        // Cut the time part if it exists (e.g. YYYY-MM-DDT00:00:00.000Z)
        const key = dateStr.split('T')[0];
        map[key] = record;
      }
    });
    return map;
  }, [blockedDates]);

  // Generate month data
  const months = useMemo(() => {
    const firstMonthYear = currentDate.getFullYear();
    const firstMonthIndex = currentDate.getMonth();

    const secondMonthYear = firstMonthIndex === 11 ? firstMonthYear + 1 : firstMonthYear;
    const secondMonthIndex = firstMonthIndex === 11 ? 0 : firstMonthIndex + 1;

    const generateMonthDays = (year, monthIdx) => {
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const firstDayIdx = new Date(year, monthIdx, 1).getDay(); // 0 is Sunday
      const days = [];

      // Add empty cells for padding before the first day of month
      for (let i = 0; i < firstDayIdx; i++) {
        days.push({ day: null, dateStr: null });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const m = String(monthIdx + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${m}-${d}`;
        days.push({ day, dateStr });
      }

      return {
        name: new Date(year, monthIdx).toLocaleString('es-MX', { month: 'long', year: 'numeric' }),
        days,
        year,
        monthIdx,
      };
    };

    return [
      generateMonthDays(firstMonthYear, firstMonthIndex),
      generateMonthDays(secondMonthYear, secondMonthIndex),
    ];
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() - 1);
      return copy;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() + 1);
      return copy;
    });
  };

  // Check if date is in selection range
  const isInSelectionRange = (dateStr) => {
    if (!rangeStart) return false;
    if (rangeStart === dateStr) return true;
    if (!rangeEnd) return false;
    return dateStr >= rangeStart && dateStr <= rangeEnd;
  };

  const handleDayClick = (dateStr, blockRecord) => {
    if (!dateStr) return;

    // Check if it's already blocked
    if (blockRecord) {
      if (blockRecord.reason === 'reservation') {
        toast.error('No puedes modificar fechas ocupadas por reservas activas.');
        return;
      }
      if (blockRecord.reason === 'host_block') {
        setSelectedBlock(blockRecord);
        return;
      }
    }

    // Start or finish range selection
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateStr);
      setRangeEnd(null);
      setSelectedBlock(null);
    } else {
      // We have a start date but no end date
      if (dateStr < rangeStart) {
        setRangeStart(dateStr);
      } else {
        // Verify no reservations exist in between
        let hasReservationBetween = false;
        let current = new Date(rangeStart);
        const target = new Date(dateStr);
        
        while (current <= target) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          const checkKey = `${y}-${m}-${d}`;
          if (blockedMap[checkKey] && blockedMap[checkKey].reason === 'reservation') {
            hasReservationBetween = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }

        if (hasReservationBetween) {
          toast.error('El rango seleccionado se cruza con una reserva confirmada. Selecciona otro rango.');
        } else {
          setRangeEnd(dateStr);
        }
      }
    }
  };

  // Action: Block Range
  const handleBlockDates = async () => {
    if (!rangeStart) return;
    const end = rangeEnd || rangeStart;
    
    // Generate dates range array
    const datesToBlock = [];
    let current = new Date(rangeStart);
    const target = new Date(end);

    while (current <= target) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesToBlock.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/availability`, {
        propertyId: id,
        dates: datesToBlock,
        reason: 'host_block',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Se bloquearon ${res.data.created} fechas exitosamente.`);
      
      // Reset selection and reload data
      setRangeStart(null);
      setRangeEnd(null);
      
      // Reload availability list
      const availRes = await axios.get(`${API_URL}/availability/${id}`);
      setBlockedDates(availRes.data.blockedDates || availRes.data.data.blockedDates || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al bloquear fechas.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Unblock Date
  const handleUnblockDate = async () => {
    if (!selectedBlock) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/availability/${selectedBlock.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Fecha desbloqueada correctamente.');
      setSelectedBlock(null);

      // Reload availability list
      const availRes = await axios.get(`${API_URL}/availability/${id}`);
      setBlockedDates(availRes.data.blockedDates || availRes.data.data.blockedDates || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al desbloquear fecha.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <span className="text-dark-500 font-semibold">Cargando calendario de disponibilidad...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="glass-card max-w-md text-center p-8 shadow-xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-dark-800 mt-4 mb-2">Error de Carga</h2>
          <p className="text-dark-500 text-sm mb-6">{error || 'No se encontró la propiedad.'}</p>
          <Link to="/dashboard" className="btn-primary py-2.5 px-6">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-500 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Dashboard</span>
        </Link>

        {/* Header Block */}
        <div className="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-primary-500/25">
              🏡
            </div>
            <div>
              <h1 className="text-2xl font-display font-extrabold text-dark-900 leading-tight">
                Disponibilidad y Bloqueos
              </h1>
              <p className="text-dark-500 text-xs font-semibold mt-0.5">
                {property.title} &middot; {property.city}, {property.state || 'Yucatán'}
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-dark-800 bg-white border border-dark-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary-500" />
            <span>${Math.round(property.pricePerNight)} / noche</span>
          </div>
        </div>

        {/* Layout: Calendar + Side control details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left / Center: Interactive Double Month Calendar */}
          <div className="lg:col-span-2 glass-card p-6 border border-dark-200/50 shadow-lg space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-dark-100">
              <h3 className="font-display font-bold text-dark-800 text-lg flex items-center gap-2">
                <span>📅</span> Calendario de Reservaciones
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-dark-200 hover:bg-dark-50 text-dark-600 transition-colors"
                >
                  &larr;
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-dark-200 hover:bg-dark-50 text-dark-600 transition-colors"
                >
                  &rarr;
                </button>
              </div>
            </div>

            {/* Double Month Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {months.map((m, mIdx) => (
                <div key={mIdx} className="space-y-4">
                  <h4 className="font-bold text-dark-800 text-sm capitalize text-center py-1 bg-dark-50 rounded-xl">
                    {m.name}
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Weekday headers */}
                    {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map((d) => (
                      <span key={d} className="text-[10px] uppercase font-bold text-dark-400 select-none">
                        {d}
                      </span>
                    ))}

                    {/* Month cells */}
                    {m.days.map((dObj, idx) => {
                      const { day, dateStr } = dObj;
                      if (!day) {
                        return <div key={`empty_${idx}`} className="aspect-square" />;
                      }

                      // Check blocking record
                      const block = blockedMap[dateStr];
                      const isBlocked = !!block;
                      const isReservation = isBlocked && block.reason === 'reservation';
                      const isHostBlock = isBlocked && block.reason === 'host_block';
                      const isSelected = isInSelectionRange(dateStr);
                      const isToday = new Date().toDateString() === new Date(dateStr + 'T12:00:00').toDateString();

                      let cellClass = 'hover:bg-dark-50 text-dark-800';
                      if (isReservation) {
                        cellClass = 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold';
                      } else if (isHostBlock) {
                        cellClass = 'bg-rose-50 border border-rose-200 text-rose-700 line-through font-semibold';
                      } else if (isSelected) {
                        cellClass = 'bg-primary-500 text-white font-bold rounded-lg shadow-md shadow-primary-500/20';
                      }

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDayClick(dateStr, block)}
                          className={`aspect-square text-xs font-semibold rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${cellClass} ${
                            isToday && !isSelected && !isBlocked ? 'border border-primary-500 text-primary-600' : ''
                          }`}
                        >
                          <span>{day}</span>
                          {/* Tooltip Indicators */}
                          {isReservation && (
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute bottom-1.5" />
                          )}
                          {isHostBlock && (
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full absolute bottom-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Colors Legend */}
            <div className="pt-4 border-t border-dark-100 flex flex-wrap gap-4 text-xs font-medium text-dark-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-lg border border-dark-200 bg-white" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-lg border border-primary-500 bg-primary-50" />
                <span>Hoy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-lg border border-indigo-200 bg-indigo-50" />
                <span>Reservado (Pasajero)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-lg border border-rose-200 bg-rose-50 line-through" />
                <span>Bloqueado (Mantenimiento / Host)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Actions panel */}
          <div className="space-y-6">
            
            {/* Create manual block panel */}
            <div className="glass-card p-6 border border-dark-200/50 shadow-lg space-y-4">
              <h3 className="font-display font-bold text-dark-800 text-base flex items-center gap-2">
                <span>🔒</span> Bloquear Fechas
              </h3>
              
              {!rangeStart ? (
                <div className="bg-dark-50/50 border border-dark-100 rounded-2xl p-4 text-xs text-dark-400 font-semibold leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                  <span>Haz clic en una fecha de inicio y una de fin en el calendario para seleccionar un rango de bloqueo.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-xs text-primary-800 space-y-1">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-primary-500">Rango Seleccionado</div>
                    <div className="text-sm font-bold flex items-center gap-2 mt-1">
                      <span>{new Date(rangeStart + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                      {rangeEnd && (
                        <>
                          <span>&rarr;</span>
                          <span>{new Date(rangeEnd + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRangeStart(null); setRangeEnd(null); }}
                      className="flex-1 py-2.5 rounded-xl bg-dark-50 hover:bg-dark-100 text-dark-600 font-bold text-xs transition-colors"
                      disabled={actionLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBlockDates}
                      className="flex-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs transition-all shadow-md shadow-primary-500/15 flex items-center justify-center gap-1.5"
                      disabled={actionLoading}
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Bloquear Fechas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Unblock individual date panel */}
            {selectedBlock && (
              <div className="glass-card p-6 border border-dark-200/50 shadow-lg space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-dark-800 text-base flex items-center gap-2">
                    <span>🔓</span> Desbloquear Fecha
                  </h3>
                  <button
                    onClick={() => setSelectedBlock(null)}
                    className="p-1 rounded-full hover:bg-dark-100 text-dark-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-rose-500">Fecha Bloqueada</div>
                  <div className="text-sm font-bold mt-1">
                    {new Date((selectedBlock.blockedDate || selectedBlock.blocked_date) + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-rose-500 font-semibold mt-1">Motivo: Bloqueo manual (Host)</div>
                </div>

                <button
                  onClick={handleUnblockDate}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Eliminar Bloqueo
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AvailabilityCalendar;
