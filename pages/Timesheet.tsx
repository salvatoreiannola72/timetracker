import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight, Plus, X, CalendarClock, Calendar as CalendarIcon, Briefcase, Umbrella, Stethoscope, Clock } from 'lucide-react';
import { EntryType, Timesheet as TimesheetEntry } from '../types';
import { TimesheetsService } from '@/services/timesheets';
import { time } from 'console';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const WEEK_DAYS_SHORT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

type ViewType = 'week' | 'month' | 'year';

export const Timesheet: React.FC = () => {
  const { user, projects, clients, addEntry, deleteEntry } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string>('');
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);

  const getEntryType = (item) =>{
    if (item.permits_hours !== null && item.permits_hours > 0) {
      return EntryType.PERMIT;
    }
    if (item.holiday) {
      return EntryType.VACATION;
    }
    if (item.illness) {
      return EntryType.SICK_LEAVE;
    }
    return EntryType.WORK;
  }

  const loadTimesheets = async (employeeId: number, month?: number, year?: number) => {
    const data = await TimesheetsService.getTimesheetEntries(employeeId, month, year);
    const timesheets: any[] = data?.flatMap((item: any, index: number) => {
      let timesheet = {
        userId: user.id,
        user_id: user.id,
        projectId: item.project_id,
        date : item.day,
        entry_type: getEntryType(item),
        ...item
      }
      //in caso di permesso rimuovo type dall'originale e creo entry per le ore di permesso
      if (item.permits_hours !== null && item.permits_hours > 0) {
        timesheet.entry_type = EntryType.WORK
        const clonedTimesheet = {
          id: `${timesheet.id}`,
          userId: user.id,
          user_id: user.id,
          permits_hours: item.permits_hours,
          hours: 0,
          date : item.day,
          entry_type: EntryType.PERMIT
         
        };
        return [clonedTimesheet];
      }
      
      return [timesheet];
    }) || [];
    setTimesheets(timesheets);
  }

 

  useEffect(() => {
    if (user?.id) {
      //const month = currentDate.getMonth() + 1; // getMonth() returns 0-11, quindi +1
      //const year = currentDate.getFullYear();
      loadTimesheets(user.id);
    }
  }, [user?.id]);
  
  // Form State
  const [formData, setFormData] = useState({
    entryType: EntryType.WORK,
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
    const MONDAY = 1;
    const day = firstDay.getDay();
    let diff = day - MONDAY;
    if (diff < 0) diff += 7;
    const mondayDate = new Date(firstDay);
    mondayDate.setDate(firstDay.getDate() - diff);
    
    // Generate 6 weeks (42 days) to ensure we show complete calendar
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;


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
      return timesheets.filter(e => 
        e.userId === user?.id && 
        e.date >= startStr && 
        e.date <= endStr
      );
    } else if (viewType === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return timesheets.filter(e => {
        if (e.userId !== user?.id) return false;
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === year && entryDate.getMonth() === month;
      });
    } else {
      // year view
      const year = currentDate.getFullYear();
      return timesheets.filter(e => {
        if (e.userId !== user?.id) return false;
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === year;
      });
    }
  }, [timesheets, user, weekDates, currentDate, viewType]);

  // Filter projects by selected client
  const filteredProjects = useMemo(() => {
    if (!formData.clientId) return [];
    return projects.filter(p => p.customer === Number(formData.clientId));
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
        entryType: EntryType.WORK,
        clientId: '',
        projectId: '', 
        hours: 4, 
        description: '',
        recurrence: 'NONE',
        recurrenceEnd: defaultEnd.toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateForAdd || !user) return;

    const createEntry = async (date: string) => {
      await addEntry({
        userId: user.id,
        projectId: formData.entryType === EntryType.WORK ? formData.projectId : null,
        date: date,
        hours: Number(formData.hours),
        entry_type: formData.entryType,
        description: formData.description,
        permits_hours: formData.entryType === EntryType.PERMIT ? Number(formData.hours) : 0,
        illness: formData.entryType === EntryType.SICK_LEAVE,
        holiday: formData.entryType === EntryType.VACATION
      });
    };

    try {
      if (formData.recurrence === 'NONE') {
        await createEntry(selectedDateForAdd);
      } else {
        const startParts = selectedDateForAdd.split('-').map(Number);
        const endParts = formData.recurrenceEnd.split('-').map(Number);
        
        const current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        const startDayOfWeek = current.getDay();

        const promises = [];
        
        while (current <= end) {
          const day = current.getDay();
          let shouldAdd = false;

          if (formData.recurrence === 'DAILY') {
            if (day !== 0 && day !== 6) shouldAdd = true;
          } else if (formData.recurrence === 'WEEKLY') {
            if (day === startDayOfWeek) shouldAdd = true;
          }

          if (shouldAdd) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            promises.push(createEntry(`${y}-${m}-${d}`));
          }

          current.setDate(current.getDate() + 1);
        }
        
        // Attendi che tutte le entry siano create
        await Promise.all(promises);
      }

      // Ricarica i timesheets dopo aver salvato
      await loadTimesheets(user.id);
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      // Gestisci l'errore come preferisci (mostra un messaggio, etc.)
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Timesheet</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Gestisci le tue ore settimanali</p>
        </div>
        
        {/* View Selector - Mobile optimized */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 sm:p-1 w-full sm:w-auto">
          <button
            onClick={() => setViewType('week')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              viewType === 'week'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settimana
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              viewType === 'month'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setViewType('year')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              viewType === 'year'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anno
          </button>
        </div>
      </div>

      {/* Navigation - Mobile optimized */}
      <div className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-lg border border-slate-200 shadow-sm">
        <button onClick={handlePrev} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-md text-slate-600 touch-manipulation">
          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div className="px-2 sm:px-4 font-bold text-slate-700 text-sm sm:text-base text-center flex-1">
          {getDateLabel()}
        </div>
        <button onClick={handleNext} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-md text-slate-600 touch-manipulation">
          <ChevronRight size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* WEEK VIEW - Mobile vertical scroll */}
      {viewType === 'week' && (
        <>
          {/* Mobile: vertical scrolling view */}
          <div className="md:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              {weekDates.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayEntries = filteredEntries.filter(e => e.date === dateStr);
                const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div key={dateStr} className={`flex flex-col gap-2 min-w-[280px] w-[280px] min-h-[400px] rounded-xl p-3 border transition-colors snap-center flex-shrink-0
                      ${isToday ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-200' : 'bg-white border-slate-200'}`}>
                    
                    {/* Day Header */}
                    <div className="text-center pb-2 border-b border-slate-100/50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{WEEK_DAYS[index]}</p>
                      <div className={`mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full text-base font-bold
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
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {dayEntries.map(entry => {
                        const project = projects.find(p => p.id === entry.projectId);
                        const entryConfig = {
                          [EntryType.VACATION]: { icon: Umbrella, label: 'Ferie', color: '#10b981', bgColor: '#d1fae5' },
                          [EntryType.SICK_LEAVE]: { icon: Stethoscope, label: 'Malattia', color: '#ef4444', bgColor: '#fee2e2' },
                          [EntryType.PERMIT]: { icon: Clock, label: 'Permesso', color: '#f59e0b', bgColor: '#fef3c7' },
                          [EntryType.WORK]: { icon: Briefcase, label: project?.name || 'Lavoro', color: project?.color || '#3b82f6', bgColor: '#dbeafe' },
                        };
                        const config = entryConfig[entry.entry_type] || entryConfig[EntryType.WORK];
                        const Icon = config.icon;
                        
                        return (
                          <div key={entry.id} className="group relative bg-white border border-slate-200 p-3 rounded-lg shadow-sm active:shadow-md transition-shadow touch-manipulation">
                             <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg" style={{ backgroundColor: config.color }}></div>
                             <div className={`${entry.entry_type === EntryType.VACATION || entry.entry_type === EntryType.SICK_LEAVE ? "flex flex-row justify-between items-center no-wrap" : "flex justify-between flex-col"} pl-2 gap-2`}>
                                 <div className="flex items-center gap-2">
                                   <Icon size={14} style={{ color: config.color }} />
                                   <p className="text-xs font-bold text-slate-700 truncate flex-1">{config.label}</p>
                                 </div>
                                 {entry.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.description}</p>}
                                 <div className="flex justify-between items-center">  
                                      {(entry.hours > 0 || entry.permits_hours > 0) && (<span className="text-xs font-semibold px-2 py-1 rounded text-slate-600" style={{ backgroundColor: config.bgColor }}>{entry.entry_type === EntryType.PERMIT ? entry.permits_hours : entry.hours}h</span>)}
                                     <button 
                                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                                      className="text-red-400 hover:text-red-600 p-1 touch-manipulation">
                                         <X size={16} />
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
                      className="mt-auto w-full py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 active:border-blue-400 active:text-blue-500 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium touch-manipulation"
                    >
                      <Plus size={18} /> Aggiungi
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Scroll indicator */}
            <p className="text-center text-xs text-slate-400 mt-2">← Scorri per vedere tutti i giorni →</p>
          </div>

          {/* Desktop: Grid view */}
          <div className="hidden md:grid md:grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEntries = filteredEntries.filter(e => e.date === dateStr);
              const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div key={dateStr} className={`flex flex-col gap-3 min-h-[500px] rounded-xl p-3 border transition-colors
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
                      const entryConfig = {
                        [EntryType.VACATION]: { icon: Umbrella, label: 'Ferie', color: '#10b981', bgColor: '#d1fae5' },
                        [EntryType.SICK_LEAVE]: { icon: Stethoscope, label: 'Malattia', color: '#ef4444', bgColor: '#fee2e2' },
                        [EntryType.PERMIT]: { icon: Clock, label: 'Permesso', color: '#f59e0b', bgColor: '#fef3c7' },
                        [EntryType.WORK]: { icon: Briefcase, label: project?.name || 'Lavoro', color: project?.color || '#3b82f6', bgColor: '#dbeafe' },
                      };
                      const config = entryConfig[entry.entry_type] || entryConfig[EntryType.WORK];
                      const Icon = config.icon;
                      
                      return (
                        <div key={entry.id} className="group relative bg-white border border-slate-200 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                           <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg" style={{ backgroundColor: config.color }}></div>
                           <div className={`pl-2 gap-2 ${entry.entry_type === EntryType.VACATION || entry.entry_type === EntryType.SICK_LEAVE ? "flex flex-row justify-between items-center no-wrap" : "flex justify-between flex-col"}`}>
                               <div className="flex items-center gap-2">
                                 <Icon size={12} style={{ color: config.color }} />
                                 <p className="text-xs font-bold text-slate-700 truncate flex-1">{config.label}</p>
                               </div>
                               {entry.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.description}</p>}
                               <div className="flex justify-between  ">
                                {(entry.hours > 0 || entry.permits_hours > 0) && (<span className="text-xs font-semibold px-1.5 py-0.5 rounded text-slate-600" style={{ backgroundColor: config.bgColor }}>{entry.entry_type === EntryType.PERMIT ? entry.permits_hours : entry.hours}h</span>)}
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
        </>
      )}

      {/* MONTH VIEW - Mobile optimized */}
      {viewType === 'month' && (
        <div>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEK_DAYS.map((day, idx) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase py-1 sm:py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{WEEK_DAYS_SHORT[idx]}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar grid - Mobile optimized */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthDates.map((date, index) => {
              const dateStr = formatDate(date);
              const dayEntries = filteredEntries.filter(e => e.date === dateStr);
              const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
              const isToday = isSameDay(date, new Date())
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && openAddModal(dateStr)}
                  className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg border transition-all cursor-pointer touch-manipulation
                    ${isToday ? 'bg-blue-50 border-blue-300 ring-1 sm:ring-2 ring-blue-200' : 'border-slate-200'}
                    ${isCurrentMonth ? 'bg-white active:shadow-md sm:hover:shadow-md' : 'bg-slate-50 opacity-40'}
                  `}
                >
                  <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                    <span className={`text-xs sm:text-sm font-bold ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                    {totalHours > 0 && (
                      <span className="text-[10px] sm:text-xs font-semibold text-blue-600 bg-blue-50 px-1 sm:px-1.5 py-0.5 rounded">
                        {totalHours}h
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayEntries.slice(0, 2).map(entry => {
                      const project = projects.find(p => p.id === entry.projectId);
                      console.log(dayEntries)
                      const entryConfig = {
                        [EntryType.VACATION]: { icon: Umbrella, label: 'Ferie', color: '#10b981', bgColor: '#d1fae5' },
                        [EntryType.SICK_LEAVE]: { icon: Stethoscope, label: 'Malattia', color: '#ef4444', bgColor: '#fee2e2' },
                        [EntryType.PERMIT]: { icon: Clock, label: 'Permesso', color: '#f59e0b', bgColor: '#fef3c7' },
                        [EntryType.WORK]: { icon: Briefcase, label: project?.name || 'Lavoro', color: project?.color || '#3b82f6', bgColor: '#dbeafe' },
                      };
                      const config = entryConfig[entry.entry_type] || entryConfig[EntryType.WORK];
                      const Icon = config.icon;

                      return (
                            <div
                              key={entry.id}
                              className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate"
                              style={{ backgroundColor: `${config.bgColor}`, borderLeft: `2px solid ${config.color}` }}
                            >
                              {(entry.hours > 0 || entry.permits_hours > 0) && (
                                <span className="font-medium">
                                  {entry.entry_type === EntryType.PERMIT ? entry.permits_hours : entry.hours}h
                                </span>
                              )}
                              
                              <span className="hidden sm:inline"> {config.label}</span>
                            </div>
                          );
                    })}
                    {dayEntries.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                        +{dayEntries.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YEAR VIEW - Mobile optimized */}
      {viewType === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer active:shadow-lg sm:hover:shadow-lg touch-manipulation
                  ${isCurrentMonth ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-slate-200'}
                `}
              >
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className={`text-base sm:text-lg font-bold ${isCurrentMonth ? 'text-blue-600' : 'text-slate-700'}`}>
                    {monthData.name}
                  </h3>
                  <CalendarIcon size={16} className="sm:w-[18px] sm:h-[18px] text-slate-400" />
                </div>

                <div className="mb-2 sm:mb-3">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">{totalHours}h</div>
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


      {/* Add Modal - Mobile optimized */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Registra Ore</h3>
                    <p className="text-xs text-slate-500">Per il {selectedDateForAdd}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 touch-manipulation p-1"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEntry} className="flex flex-col flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {/* Entry Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 sm:mb-3">Tipo di Registrazione</label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, entryType: EntryType.WORK, hours: 4})}
                                className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left touch-manipulation ${
                                    formData.entryType === EntryType.WORK
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Briefcase size={16} className={`sm:w-[18px] sm:h-[18px] ${formData.entryType === EntryType.WORK ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className={`font-medium text-xs sm:text-sm ${formData.entryType === EntryType.WORK ? 'text-blue-900' : 'text-slate-600'}`}>Lavoro</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, entryType: EntryType.VACATION, hours: 8, clientId: '', projectId: ''})}
                                className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left touch-manipulation ${
                                    formData.entryType === EntryType.VACATION
                                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                        : 'border-slate-200 hover:border-green-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Umbrella size={16} className={`sm:w-[18px] sm:h-[18px] ${formData.entryType === EntryType.VACATION ? 'text-green-600' : 'text-slate-400'}`} />
                                    <span className={`font-medium text-xs sm:text-sm ${formData.entryType === EntryType.VACATION ? 'text-green-900' : 'text-slate-600'}`}>Ferie</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, entryType: EntryType.SICK_LEAVE, hours: 8, clientId: '', projectId: ''})}
                                className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left touch-manipulation ${
                                    formData.entryType === EntryType.SICK_LEAVE
                                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                        : 'border-slate-200 hover:border-red-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Stethoscope size={16} className={`sm:w-[18px] sm:h-[18px] ${formData.entryType === EntryType.SICK_LEAVE ? 'text-red-600' : 'text-slate-400'}`} />
                                    <span className={`font-medium text-xs sm:text-sm ${formData.entryType === EntryType.SICK_LEAVE ? 'text-red-900' : 'text-slate-600'}`}>Malattia</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, entryType: EntryType.PERMIT, hours: 4, clientId: '', projectId: ''})}
                                className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left touch-manipulation ${
                                    formData.entryType === EntryType.PERMIT
                                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                        : 'border-slate-200 hover:border-orange-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Clock size={16} className={`sm:w-[18px] sm:h-[18px] ${formData.entryType === EntryType.PERMIT ? 'text-orange-600' : 'text-slate-400'}`} />
                                    <span className={`font-medium text-xs sm:text-sm ${formData.entryType === EntryType.PERMIT ? 'text-orange-900' : 'text-slate-600'}`}>Permesso</span>
                                </div>
                            </button>
                        </div>
                        
                        {/* Days/Hours Remaining Info */}
                        {formData.entryType === EntryType.VACATION && (
                            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                📅 Giorni ferie rimanenti: <strong>{user?.vacation_days_remaining || 0}</strong>
                            </div>
                        )}
                        {formData.entryType === EntryType.SICK_LEAVE && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                🏥 Giorni malattia rimanenti: <strong>{user?.sick_days_remaining || 0}</strong>
                            </div>
                        )}
                        {formData.entryType === EntryType.PERMIT && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                ⏰ Ore permesso rimanenti: <strong>{user?.permit_hours_remaining || 0}h</strong>
                            </div>
                        )}
                    </div>

                    {/* Client and Project - Only for WORK type */}
                    {formData.entryType === EntryType.WORK && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                                <select 
                                    required
                                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
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
                                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-sm touch-manipulation"
                                    value={formData.projectId}
                                    onChange={e => setFormData({...formData, projectId: e.target.value})}
                                >
                                    <option value="">
                                        {formData.clientId ? 'Seleziona progetto...' : 'Prima seleziona un cliente'}
                                    </option>
                                    {filteredProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Hours Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {formData.entryType === EntryType.PERMIT ? 'Ore Permesso' : 'Durata (Ore)'}
                        </label>
                        <input 
                            type="number" 
                            min="0.5" 
                            step="0.5" 
                            max="24"
                            required
                            disabled={formData.entryType === EntryType.VACATION || formData.entryType === EntryType.SICK_LEAVE}
                            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed text-sm touch-manipulation"
                            value={formData.hours}
                            onChange={e => setFormData({...formData, hours: Number(e.target.value)})}
                        />
                        {(formData.entryType === EntryType.VACATION || formData.entryType === EntryType.SICK_LEAVE) && (
                            <p className="text-xs text-slate-500 mt-1">Fisso a 8h (1 giorno)</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                        <textarea 
                            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm touch-manipulation"
                            placeholder={formData.entryType === EntryType.WORK ? "Su cosa hai lavorato?" : "Note (opzionale)"}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    {/* Recurrence Section */}
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarClock size={16} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700">Ricorrenza</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Frequenza</label>
                                <select 
                                    className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none touch-manipulation"
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
                                        className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none touch-manipulation"
                                        value={formData.recurrenceEnd}
                                        min={selectedDateForAdd}
                                        onChange={e => setFormData({...formData, recurrenceEnd: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 flex gap-2 sm:gap-3 bg-slate-50 flex-shrink-0">
                    <Button type="button" variant="outline" className="flex-1 touch-manipulation" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                    <Button type="submit" className="flex-1 touch-manipulation">Salva Registrazione</Button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
