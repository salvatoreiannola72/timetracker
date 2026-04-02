import { useState, useEffect, useCallback } from 'react';
import { TimesheetsService } from '@/services/timesheets';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/Card';
import { useStore } from '../context/Store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HolidayEntry {
  id: number;
  employee_id: number;
  employee_name: string;
  day: string; // 'YYYY-MM-DD'
}

type ViewMode = 'week' | 'month' | 'year';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

const WEEK_DAYS_IT    = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS_IT       = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const MONTHS_SHORT    = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { bg: 'bg-green-100',  text: 'text-green-700'  },
  { bg: 'bg-pink-100',   text: 'text-pink-700'   },
  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  { bg: 'bg-rose-100',   text: 'text-rose-700'   },
];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function heatLevel(days: number): number {
  if (days === 0) return 0;
  if (days <= 3)  return 1;
  if (days <= 6)  return 2;
  if (days <= 9)  return 3;
  return 4;
}

const HEAT_CLASSES: Record<number, string> = {
  0: 'bg-slate-100 text-slate-400',
  1: 'bg-blue-100  text-blue-700',
  2: 'bg-blue-300  text-blue-800',
  3: 'bg-blue-500  text-white',
  4: 'bg-blue-700  text-white',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, id, size = 'md' }: { name: string; id: number; size?: 'sm' | 'md' }) {
  const { bg, text } = avatarColor(id);
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sizeClass} ${bg} ${text} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ entries, monday, isMobile }: { entries: HolidayEntry[]; monday: Date; isMobile: boolean }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const byDay = (d: Date) => entries.filter(e => e.day === formatDate(d));

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 pb-4">
        {days.map((d, i) => {
          const people = byDay(d);
          const weekend = isWeekend(d);
          const todayFlag = isSameDay(d, today);
          return (
            <div
              key={i}
              className={`rounded-xl border overflow-hidden transition-shadow hover:shadow-md
                ${weekend ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}
                ${todayFlag ? '!border-blue-500 !border-2' : ''}
              `}
            >
              <div className={`flex items-center justify-between px-4 py-3
                ${people.length > 0 ? `border-b ${weekend ? 'border-red-200' : 'border-slate-100'}` : ''}
              `}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide
                    ${weekend ? 'text-red-500' : todayFlag ? 'text-blue-500' : 'text-slate-500'}
                  `}>
                    {WEEK_DAYS_IT[i]}
                  </p>
                  {todayFlag
                    ? <div className="mt-0.5 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{d.getDate()}</div>
                    : <p className={`mt-0.5 text-base font-bold ${weekend ? 'text-red-500' : 'text-slate-900'}`}>{d.getDate()}</p>
                  }
                </div>
                {people.length > 0
                  ? <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">{people.length} in ferie</span>
                  : !weekend && <span className="text-xs text-slate-400">Nessuno in ferie</span>
                }
              </div>
              {people.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2">
                  {people.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar name={p.employee_name} id={p.employee_id} size="sm" />
                      <span className="text-sm text-slate-700 font-medium">{p.employee_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop
  const empMap = new Map<number, string>();
  entries.forEach(e => empMap.set(e.employee_id, e.employee_name));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}>
        <div className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-200">
          Dipendente
        </div>
        {days.map((d, i) => (
          <div key={i} className={`px-2 py-3 text-xs font-semibold text-center uppercase tracking-wide
            ${isWeekend(d) ? 'text-red-400' : 'text-slate-500'}
          `}>
            {WEEK_DAYS_SHORT[i]} {d.getDate()}
          </div>
        ))}
      </div>

      {empMap.size === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">Nessuna ferie questa settimana</div>
      ) : (
        Array.from(empMap.entries()).map(([empId, empName]) => (
          <div key={empId} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: '180px repeat(7, 1fr)' }}>
            <div className="flex items-center gap-2.5 px-4 py-3 border-r border-slate-200">
              <Avatar name={empName} id={empId} />
              <span className="text-sm font-medium text-slate-700 truncate">{empName}</span>
            </div>
            {days.map((d, i) => {
              const onHoliday = entries.some(e => e.employee_id === empId && e.day === formatDate(d));
              const weekend = isWeekend(d);
              return (
                <div key={i} className={`flex items-center justify-center px-1.5 py-3 min-h-[52px]
                  ${weekend ? 'bg-red-50' : ''}
                  ${i < 6 ? 'border-r border-slate-100' : ''}
                `}>
                  {onHoliday && (
                    <span className="w-full text-center text-xs font-semibold bg-blue-100 text-blue-700 rounded-md px-1.5 py-1">
                      Ferie
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ entries, year, month, isMobile }: { entries: HolidayEntry[]; year: number; month: number; isMobile: boolean }) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const byDay = (dayNum: number) => {
    const key = formatDate(new Date(year, month, dayNum));
    return entries.filter(e => e.day === key);
  };

  if (isMobile) {
    const daysWithHolidays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .map(d => ({ d, people: byDay(d) }))
      .filter(x => x.people.length > 0);

    return (
      <div className="flex flex-col gap-3 pb-4">
        {daysWithHolidays.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">Nessuna ferie questo mese</div>
        )}
        {daysWithHolidays.map(({ d, people }) => {
          const date = new Date(year, month, d);
          const weekend = isWeekend(date);
          const todayFlag = isSameDay(date, today);
          const dowIdx = (date.getDay() + 6) % 7;
          return (
            <div key={d} className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow
              ${todayFlag ? 'border-blue-500 border-2' : 'border-slate-200'}
            `}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${weekend ? 'text-red-500' : 'text-slate-500'}`}>
                    {WEEK_DAYS_IT[dowIdx]}
                  </p>
                  <p className={`text-base font-bold ${weekend ? 'text-red-500' : 'text-slate-900'}`}>
                    {d} {MONTHS_SHORT[month]}
                  </p>
                </div>
                <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                  {people.length} in ferie
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {people.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar name={p.employee_name} id={p.employee_id} size="sm" />
                    <span className="text-sm text-slate-700 font-medium">{p.employee_name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEK_DAYS_SHORT.map((d, i) => (
          <div key={d} className={`py-3 text-xs font-semibold text-center uppercase tracking-wide
            ${i >= 5 ? 'text-red-400' : 'text-slate-500'}
          `}>{d}</div>
        ))}
      </div>
      {Array.from({ length: totalCells / 7 }, (_, week) => (
        <div key={week} className={`grid grid-cols-7 ${week < totalCells / 7 - 1 ? 'border-b border-slate-100' : ''}`}>
          {Array.from({ length: 7 }, (_, dow) => {
            const cellIdx = week * 7 + dow;
            const dayNum = cellIdx - startOffset + 1;
            const valid = dayNum >= 1 && dayNum <= daysInMonth;
            const date = valid ? new Date(year, month, dayNum) : null;
            const weekend = dow >= 5;
            const todayFlag = date ? isSameDay(date, today) : false;
            const people = valid ? byDay(dayNum) : [];
            return (
              <div key={dow} className={`min-h-[88px] p-2
                ${dow < 6 ? 'border-r border-slate-100' : ''}
                ${!valid ? 'bg-slate-50' : weekend ? 'bg-red-50' : 'bg-white'}
              `}>
                {valid && (
                  <>
                    {todayFlag
                      ? <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mb-1">{dayNum}</div>
                      : <p className={`text-xs font-semibold mb-1 ${weekend ? 'text-red-400' : 'text-slate-400'}`}>{dayNum}</p>
                    }
                    <div className="flex flex-col gap-0.5">
                      {people.map(p => (
                        <div key={p.id} className="text-xs font-medium bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 truncate">
                          {p.employee_name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Year View ────────────────────────────────────────────────────────────────

function YearView({ entries, year, isMobile }: { entries: HolidayEntry[]; year: number; isMobile: boolean }) {
  const empMap = new Map<number, { name: string; months: number[]; total: number }>();
  entries.forEach(e => {
    const m = parseInt(e.day.slice(5, 7), 10) - 1;
    if (!empMap.has(e.employee_id)) {
      empMap.set(e.employee_id, { name: e.employee_name, months: Array(12).fill(0), total: 0 });
    }
    const rec = empMap.get(e.employee_id)!;
    rec.months[m]++;
    rec.total++;
  });
  const employees = Array.from(empMap.entries()).map(([id, rec]) => ({ id, ...rec }));

  const totalDays = employees.reduce((s, e) => s + e.total, 0);
  const avgDays = employees.length > 0 ? Math.round(totalDays / employees.length) : 0;
  const monthlyCounts = Array(12).fill(0).map((_, i) =>
    entries.filter(e => parseInt(e.day.slice(5, 7), 10) - 1 === i).length
  );
  const peakMonthIdx = monthlyCounts.indexOf(Math.max(...monthlyCounts));
  const peakMonth = totalDays > 0 ? MONTHS_SHORT[peakMonthIdx] : '—';
  const todayStr = formatDate(new Date());
  const inFerieOggi = new Set(entries.filter(e => e.day === todayStr).map(e => e.employee_id)).size;

  const stats = [
    { label: 'Totale giorni',     value: totalDays,  sub: `nel ${year}`,     color: 'border-l-blue-500'   },
    { label: 'Media per persona', value: avgDays,     sub: 'giorni / anno',   color: 'border-l-green-500'  },
    { label: 'Mese più caldo',    value: peakMonth,   sub: 'più ferie',       color: 'border-l-amber-500'  },
    { label: 'In ferie oggi',     value: inFerieOggi, sub: 'dipendenti',      color: 'border-l-purple-500' },
  ];

  const Legend = () => (
    <div className="flex items-center justify-end gap-2 mt-4">
      <span className="text-xs text-slate-400">Meno</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className={`w-5 h-4 rounded-sm ${l === 0 ? 'bg-slate-100 border border-slate-200' : HEAT_CLASSES[l].split(' ')[0]}`} />
        ))}
      </div>
      <span className="text-xs text-slate-400">Di più</span>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <Card key={s.label} className={`border-l-4 ${s.color} hover:shadow-lg transition-shadow`}>
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Per dipendente</p>

        <div className="flex flex-col gap-3">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Avatar name={emp.name} id={emp.id} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.total} giorni totali</p>
                </div>
              </div>
              <div className="px-4 pb-3">
                <div className="grid grid-cols-12 gap-0.5 mb-1">
                  {MONTHS_SHORT.map(m => (
                    <p key={m} className="text-center text-slate-400" style={{ fontSize: 7 }}>{m}</p>
                  ))}
                </div>
                <div className="grid grid-cols-12 gap-0.5">
                  {emp.months.map((cnt, mi) => {
                    const lv = heatLevel(cnt);
                    return (
                      <div key={mi} className={`aspect-square rounded-sm flex items-center justify-center ${HEAT_CLASSES[lv]}`}>
                        {lv > 0 && <span style={{ fontSize: 8 }} className="font-semibold">{cnt}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Legend />
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <Card key={s.label} className={`border-l-4 ${s.color} hover:shadow-lg transition-shadow`}>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{s.label}</p>
                <h4 className="text-3xl font-bold text-slate-900 mb-1">{s.value}</h4>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '200px repeat(12, 1fr)' }}>
          <div className="px-4 py-3 border-r border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Dipendente
          </div>
          {MONTHS_SHORT.map(m => (
            <div key={m} className="py-3 text-xs font-semibold text-center text-slate-500 uppercase tracking-wide">{m}</div>
          ))}
        </div>
        {employees.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Nessuna ferie quest'anno</div>
        ) : (
          employees.map((emp, ei) => (
            <div key={emp.id}
              className={`grid ${ei < employees.length - 1 ? 'border-b border-slate-100' : ''}`}
              style={{ gridTemplateColumns: '200px repeat(12, 1fr)' }}
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-r border-slate-200">
                <Avatar name={emp.name} id={emp.id} />
                <span className="text-sm font-medium text-slate-700 truncate">{emp.name}</span>
              </div>
              {emp.months.map((cnt, mi) => {
                const lv = heatLevel(cnt);
                return (
                  <div key={mi} className="flex items-center justify-center py-3 px-1">
                    <div className={`w-9 h-7 rounded flex items-center justify-center text-xs font-semibold ${HEAT_CLASSES[lv]}`}>
                      {lv > 0 ? cnt : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      <Legend />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HolidayCalendar() {
  const today = new Date();
  const [view, setView]               = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(today);
  const [entries, setEntries]         = useState<HolidayEntry[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);
  const { users } = useStore();


  async function fetchHolidays(startDate: string, endDate: string): Promise<HolidayEntry[]> {
    const data = await TimesheetsService.getTimesheetEntries(
      undefined, undefined, undefined, true, startDate, endDate
    );
    const items: any[] = Array.isArray(data) ? data : data.results ?? [];
    return items
      .filter((item: any) => Boolean(item.holiday))
      .map((item: any) => ({
        id: item.id,
        employee_id: item.employee,
        employee_name: users.filter((u: any) => u.id === item.employee)[0].name ?? `Dipendente ${item.employee}`,
        day: item.day,
      }));
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dateRange = useCallback((): { start: string; end: string } => {
    if (view === 'week') {
      const monday = getMondayOf(currentDate);
      return { start: formatDate(monday), end: formatDate(addDays(monday, 6)) };
    }
    if (view === 'month') {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      return { start: formatDate(new Date(y, m, 1)), end: formatDate(new Date(y, m + 1, 0)) };
    }
    const y = currentDate.getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }, [view, currentDate]);

  useEffect(() => {
    let cancelled = false;
    const { start, end } = dateRange();
    setLoading(true);
    setError(null);
    fetchHolidays(start, end)
      .then(data  => { if (!cancelled) setEntries(data); })
      .catch(err  => { if (!cancelled) setError(err.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dateRange]);

  const navigate = (dir: 1 | -1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'week')  d.setDate(d.getDate() + dir * 7);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      if (view === 'year')  d.setFullYear(d.getFullYear() + dir);
      return d;
    });
  };

  const navLabel = () => {
    if (view === 'week') {
      const monday = getMondayOf(currentDate);
      const sunday = addDays(monday, 6);
      const fmt = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
      return `${fmt(monday)} – ${fmt(sunday)}`;
    }
    if (view === 'month') return `${MONTHS_IT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    return `${currentDate.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header — mirrors Dashboard header style */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Ferie Team</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle — same pattern as Monthly/Yearly in Dashboard */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(['week', 'month', 'year'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${view === v
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {v === 'week' ? 'Settimana' : v === 'month' ? 'Mese' : 'Anno'}
              </button>
            ))}
          </div>

          {/* Period navigation */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[150px] text-center px-1">
              {navLabel()}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="py-16 text-center text-sm text-slate-400">Caricamento…</div>
      )}
      {error && (
        <div className="py-16 text-center text-sm text-red-500">{error}</div>
      )}
      {!loading && !error && view === 'week' && (
        <WeekView entries={entries} monday={getMondayOf(currentDate)} isMobile={isMobile} />
      )}
      {!loading && !error && view === 'month' && (
        <MonthView entries={entries} year={currentDate.getFullYear()} month={currentDate.getMonth()} isMobile={isMobile} />
      )}
      {!loading && !error && view === 'year' && (
        <YearView entries={entries} year={currentDate.getFullYear()} isMobile={isMobile} />
      )}
    </div>
  );
}
