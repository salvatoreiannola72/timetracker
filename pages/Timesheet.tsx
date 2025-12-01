import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight, Plus, X, CalendarClock } from 'lucide-react';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Timesheet: React.FC = () => {
  const { user, entries, projects, addEntry, deleteEntry } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string>('');
  
  // Form State
  const [formData, setFormData] = useState({
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

  // Filter entries for this week
  const weekEntries = useMemo(() => {
    const startStr = weekDates[0].toISOString().split('T')[0];
    const endStr = weekDates[6].toISOString().split('T')[0];
    return entries.filter(e => 
      e.userId === user?.id && 
      e.date >= startStr && 
      e.date <= endStr
    );
  }, [entries, user, weekDates]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const openAddModal = (dateStr: string) => {
    setSelectedDateForAdd(dateStr);
    // Default end date to 2 weeks from now if needed
    const defaultEnd = new Date(dateStr);
    defaultEnd.setDate(defaultEnd.getDate() + 14);
    
    setFormData({ 
        projectId: projects[0]?.id || '', 
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
          <p className="text-slate-500 text-sm">Manage your weekly hours</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
             <ChevronLeft size={20} />
           </button>
           <div className="px-4 font-medium text-slate-700 min-w-[140px] text-center">
             {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </div>
           <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayEntries = weekEntries.filter(e => e.date === dateStr);
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
                <Plus size={16} /> Add
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="font-semibold text-slate-900">Log Time</h3>
                    <p className="text-xs text-slate-500">For {selectedDateForAdd}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                    <select 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.projectId}
                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Hours)</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                        placeholder="What did you work on?"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                {/* Recurrence Section */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarClock size={16} className="text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Recurrence</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
                            <select 
                                className="w-full rounded-md border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.recurrence}
                                onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                            >
                                <option value="NONE">Does not repeat</option>
                                <option value="DAILY">Daily (Mon-Fri)</option>
                                <option value="WEEKLY">Weekly</option>
                            </select>
                        </div>
                        
                        {formData.recurrence !== 'NONE' && (
                             <div className="animate-in fade-in slide-in-from-left-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Until</label>
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
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1">Save Entry</Button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};