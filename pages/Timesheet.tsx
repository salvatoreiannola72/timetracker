import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight, Plus, X, CalendarClock, Calendar as CalendarIcon } from 'lucide-react';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

type ViewType = 'week' | 'month' | 'year';

export const Timesheet: React.FC = () => {
  const { user, entries, projects, clients, addEntry, deleteEntry } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string>('');
  
  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    hours: 4,
    description: '',
    recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY',
    recurrenceEnd: ''
  });

  // Calculate Start of Week (Monday)
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }, [currentDate]);

  // Generate Week Dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [startOfWeek]);

  // Generate Month Dates (calendar grid)
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = firstDay.getDay();
    const startDay = firstDayWeekday === 0 ? -6 : 1 - firstDayWeekday; // Adjust for Monday start
    
    // Generate 6 weeks (42 days) to ensure we show complete calendar
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(year, month, startDay + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  // Generate Year Data (12 months)
  const yearMonths = useMemo(() => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      return {
        date: monthDate,
        name: MONTH_NAMES[i],
        month: i,
        year: year
      };
    });
  }, [currentDate]);

  // Filter entries based on view
  const filteredEntries = useMemo(() => {
    if (viewType === 'week') {
      const startStr = weekDates[0].toISOString().split('T')[0];
      const endStr = weekDates[6].toISOString().split('T')[0];
      return entries.filter(e => 
        e.userId === user?.id && 
        e.date >= startStr && 
        e.date <= endStr
      );
    } else if (viewType === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return entries.filter(e => {
        if (e.userId !== user?.id) return false;
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === year && entryDate.getMonth() === month;
      });
    } else {
      // year view
      const year = currentDate.getFullYear();
      return entries.filter(e => {
        if (e.userId !== user?.id) return false;
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === year;
      });
    }
  }, [entries, user, weekDates, currentDate, viewType]);

  // Filter projects by selected client
  const filteredProjectsByClient = useMemo(() => {
    if (!formData.clientId) return projects;
    return projects.filter(p => p.client_id === formData.clientId);
  }, [projects, formData.clientId]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewType === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewType === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewType === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewType === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const getDateLabel = () => {
    if (viewType === 'week') {
      return `${weekDates[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    } else if (viewType === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return `${currentDate.getFullYear()}`;
    }
  };

  const openAddModal = (dateStr: string) => {
    setSelectedDateForAdd(dateStr);
    // Default end date to 2 weeks from now if needed
    const defaultEnd = new Date(dateStr);
    defaultEnd.setDate(defaultEnd.getDate() + 14);
    
    setFormData({ 
        clientId: '',
        projectId: '', 
        hours: 4, 
        description: '',
        recurrence: 'NONE',
        recurrenceEnd: defaultEnd.toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateForAdd || !user) return;

    const createEntry = (date: string) => {
        addEntry({
            userId: user.id,
            projectId: formData.projectId,
            date: date,
            hours: Number(formData.hours),
            description: formData.description
        });
    };

    if (formData.recurrence === 'NONE') {
        createEntry(selectedDateForAdd);
    } else {
        const startParts = selectedDateForAdd.split('-').map(Number);
        const endParts = formData.recurrenceEnd.split('-').map(Number);
        
        // Create dates using local time constructor to avoid timezone issues
        const current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        const startDayOfWeek = current.getDay(); // 0-6

        while (current <= end) {
            const day = current.getDay();
            let shouldAdd = false;

            if (formData.recurrence === 'DAILY') {
                // Daily (Mon-Fri) - Skip Weekends (0 is Sun, 6 is Sat)
                if (day !== 0 && day !== 6) shouldAdd = true;
            } else if (formData.recurrence === 'WEEKLY') {
                // Same day of week
                if (day === startDayOfWeek) shouldAdd = true;
            }

            if (shouldAdd) {
                // Format YYYY-MM-DD manually to ensure local consistency
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                createEntry(`${y}-${m}-${d}`);
            }

            // Next day
            current.setDate(current.getDate() + 1);
        }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timesheet</h1>
          <p className="text-slate-500 text-sm">Gestisci le tue ore settimanali</p>
        </div>
        
        {/* View Selector */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewType === 'week'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settimana
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewType === 'month'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setViewType('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewType === 'year'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anno
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <div className="px-4 font-bold text-slate-700 min-w-[180px] text-center">
          {getDateLabel()}
        </div>
        <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* WEEK VIEW */}
      {viewType === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = filteredEntries.filter(e => e.date === dateStr);
            const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={dateStr} className={`flex flex-col gap-3 min-h-[300px] md:min-h-[500px] rounded-xl p-3 border transition-colors
                  ${isToday ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'}`}>
                
                {/* Day Header */}
                <div className="text-center pb-2 border-b border-slate-100/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{WEEK_DAYS[index]}</p>
                  <div className={`mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                     {date.getDate()}
                  </div>
                  <div className="mt-1 h-5">
                      {totalHours > 0 && (
                          <span className="text-xs font-medium text-slate-400">{totalHours}h</span>
                      )}
                  </div>
                </div>

                {/* Entries List */}
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {dayEntries.map(entry => {
                    const project = projects.find(p => p.id === entry.projectId);
                    return (
                      <div key={entry.id} className="group relative bg-white border border-slate-200 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                         <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg" style={{ backgroundColor: project?.color || '#ccc' }}></div>
                         <div className="pl-2">
                             <p className="text-xs font-bold text-slate-700 truncate">{project?.name}</p>
                             <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.description}</p>
                             <div className="mt-2 flex justify-between items-center">
                                 <span className="text-xs font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{entry.hours}h</span>
                                 <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
                                     <X size={12} />
                                 </button>
                             </div>
                         </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Button */}
                <button 
                  onClick={() => openAddModal(dateStr)}
                  className="mt-auto w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEK_DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEntries = filteredEntries.filter(e => e.date === dateStr);
              const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && openAddModal(dateStr)}
                  className={`min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer
                    ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'border-slate-200'}
                    ${isCurrentMonth ? 'bg-white hover:shadow-md' : 'bg-slate-50 opacity-40'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                    {totalHours > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {totalHours}h
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEntries.slice(0, 3).map(entry => {
                      const project = projects.find(p => p.id === entry.projectId);
                      return (
                        <div
                          key={entry.id}
                          className="text-xs p-1 rounded truncate"
                          style={{ backgroundColor: `${project?.color}20`, borderLeft: `2px solid ${project?.color}` }}
                        >
                          <span className="font-medium">{entry.hours}h</span> {project?.name}
                        </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-xs text-slate-400 font-medium">
                        +{dayEntries.length - 3} altre
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YEAR VIEW */}
      {viewType === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {yearMonths.map((monthData) => {
            const monthEntries = filteredEntries.filter(e => {
              const entryDate = new Date(e.date);
              return entryDate.getMonth() === monthData.month;
            });
            const totalHours = monthEntries.reduce((sum, e) => sum + e.hours, 0);
            const isCurrentMonth = monthData.month === new Date().getMonth() && monthData.year === new Date().getFullYear();

            return (
              <div
                key={monthData.month}
                onClick={() => {
                  setCurrentDate(new Date(monthData.year, monthData.month, 1));
                  setViewType('month');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg
                  ${isCurrentMonth ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-slate-200'}
                `}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-bold ${isCurrentMonth ? 'text-blue-600' : 'text-slate-700'}`}>
                    {monthData.name}
                  </h3>
                  <CalendarIcon size={18} className="text-slate-400" />
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-slate-900">{totalHours}h</div>
                  <div className="text-xs text-slate-500">{monthEntries.length} registrazioni</div>
                </div>

                {/* Mini calendar preview */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasEntry = monthEntries.some(e => e.date === dateStr);
                    
                    try {
                      const testDate = new Date(monthData.year, monthData.month, day);
                      if (testDate.getMonth() !== monthData.month) return null;
                    } catch {
                      return null;
                    }

                    return (
                      <div
                        key={day}
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasEntry ? 'bg-blue-500' : 'bg-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="font-semibold text-slate-900">Registra Ore</h3>
                    <p className="text-xs text-slate-500">Per il {selectedDateForAdd}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                    <select 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.clientId}
                        onChange={e => setFormData({...formData, clientId: e.target.value, projectId: ''})}
                    >
                        <option value="">Seleziona cliente...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Progetto</label>
                    <select 
                        required
                        disabled={!formData.clientId}
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        value={formData.projectId}
                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                    >
                        <option value="">
                            {formData.clientId ? 'Seleziona progetto...' : 'Prima seleziona un cliente'}
                        </option>
                        {filteredProjectsByClient.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Durata (Ore)</label>
                        <input 
                            type="number" 
                            min="0.5" 
                            step="0.5" 
                            max="24"
                            required
                            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.hours}
                            onChange={e => setFormData({...formData, hours: Number(e.target.value)})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                    <textarea 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                        placeholder="Su cosa hai lavorato?"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                {/* Recurrence Section */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarClock size={16} className="text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Ricorrenza</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Frequenza</label>
                            <select 
                                className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.recurrence}
                                onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                            >
                                <option value="NONE">Non si ripete</option>
                                <option value="DAILY">Giornaliero (Lun-Ven)</option>
                                <option value="WEEKLY">Settimanale</option>
                            </select>
                        </div>
                        
                        {formData.recurrence !== 'NONE' && (
                             <div className="animate-in fade-in slide-in-from-left-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Fino a</label>
                                <input 
                                    type="date"
                                    required
                                    className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.recurrenceEnd}
                                    min={selectedDateForAdd}
                                    onChange={e => setFormData({...formData, recurrenceEnd: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                    <Button type="submit" className="flex-1">Salva Registrazione</Button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};