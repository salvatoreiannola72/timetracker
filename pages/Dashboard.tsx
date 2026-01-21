import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { EntryType, Role, TimesheetEntry } from '../types';
import { Card, CardContent, CardHeader } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Briefcase, TrendingUp, Calendar, Users, Umbrella, Stethoscope, Clock as PermitIcon } from 'lucide-react';
import { COLORS } from '../constants';
import { TimesheetsService } from '@/services/timesheets';

type ViewType = 'monthly' | 'yearly';
type DisplayUnit = 'hours' | 'days';
const HOURS_PER_DAY = 8;

export const Dashboard: React.FC = () => {
  const { user, projects, users } = useStore();
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('hours');
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  const getEntryType = (item: any): EntryType => {
    if (item.holiday) return EntryType.VACATION;
    if (item.illness) return EntryType.SICK_LEAVE;
    if (item.permits_hours && item.permits_hours > 0 && (!item.hours || item.hours === 0)) {
      return EntryType.PERMIT;
    }
    return EntryType.WORK;
  };

  const loadEntries = async (employeeId?: number, isAdmin: boolean = false, month?: number, year?: number) => {
    if (!employeeId && !isAdmin) return;

    try {
      // Per admin carichiamo tutte le entries, per utenti normali solo le proprie
      const data = await TimesheetsService.getTimesheetEntries(
        undefined,
        month, // month - undefined per caricare tutti i mesi
        year,  // year - undefined per caricare tutti gli anni
        isAdmin
      );

      if (!data) {
        setEntries([]);
        return;
      }

      const entriesData = data.flatMap((item: any) => {
        const baseEntry = {
          id: item.id,
          userId: item.employee_id,
          projectId: item.project_id,
          date: item.day,
          hours: item.hours || 0,
          description: item.description || '',
          entry_type: getEntryType(item),
        };

        const entries = [];

        // Entry separata per i permessi (se presenti)
        if (item.permits_hours !== null && item.permits_hours > 0) {
          entries.push({
            id: `${item.id}-permit`, // ID univoco per l'entry del permesso
            userId: item.employee_id,
            projectId: item.project_id,
            date: item.day,
            hours: item.permits_hours,
            description: baseEntry.description,
            entry_type: EntryType.PERMIT
          });
        } else {
          entries.push(baseEntry);
        }

        return entries;
      });

      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]);
    }
  };

  useEffect(() => {
    if (user) {
      const month = viewType === 'monthly' ? selectedDate.month : undefined;
      const year = selectedDate.year;
      
      loadEntries(user.id, user.is_staff, month, year);
    }
  }, [user, viewType, selectedDate]);

  // Helper function to convert hours to display unit
  const convertToDisplayUnit = (hours: number): number => {
    return displayUnit === 'days' ? hours / HOURS_PER_DAY : hours;
  };

  const getUnitLabel = (value: number, short: boolean = false): string => {
    const formatted = value.toFixed(1);
    if (displayUnit === 'days') {
      return short ? `${formatted}g` : `${formatted} ${value === 1 ? 'giorno' : 'giorni'}`;
    }
    return short ? `${formatted}h` : `${formatted} ${value === 1 ? 'ora' : 'ore'}`;
  };

  // Compute KPIs
  const kpis = useMemo(() => {
    const totalHours = entries.reduce((acc, curr) => acc + curr.hours, 0);
    const activeProjectCount = new Set(entries.map(e => e.projectId)).size;
    const activeUsersCount = new Set(entries.map(e => e.userId)).size;

    // Chart Data: Hours per Project
    const projectHours: Record<string, number> = {};
    entries.forEach(e => {
      const pName = projects.find(p => p.id === e.projectId)?.name || 'Unknown';
      projectHours[pName] = (projectHours[pName] || 0) + e.hours;
    });

    const chartData = Object.entries(projectHours)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Trend data based on view type
    let trendData: { label: string; hours: number }[] = [];

    if (viewType === 'monthly') {
      // Days in selected month
      const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
      trendData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hours = entries
          .filter(e => e.date === dateStr)
          .reduce((sum, e) => sum + e.hours, 0);
        return { label: String(day), hours };
      });
    } else {
      // Months in selected year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      trendData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const hours = entries
          .filter(e => {
            const entryDate = new Date(e.date);
            return entryDate.getMonth() + 1 === month;
          })
          .reduce((sum, e) => sum + e.hours, 0);
        return { label: monthNames[i], hours };
      });
    }

    const daysInPeriod = viewType === 'monthly'
      ? new Date(selectedDate.year, selectedDate.month, 0).getDate()
      : 365;

    const avgDailyHours = totalHours / daysInPeriod;

    return {
      totalHours,
      activeProjectCount,
      activeUsersCount,
      chartData,
      trendData,
      avgDailyHours
    };
  }, [entries, projects, viewType, selectedDate]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: color }}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-slate-900 mb-1">{value}</h4>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="p-4 bg-slate-50 rounded-xl" style={{ color }}>
          <Icon size={28} strokeWidth={2} />
        </div>
      </div>
    </Card>
  );

  // Leave tracking card with progress bar
  const LeaveCard = ({ title, used, total, icon: Icon, color, bgColor }: any) => {
    const remaining = total - used;
    const percentage = (used / total) * 100;

    // Color based on usage
    let barColor = '#10b981'; // green
    if (percentage > 80) barColor = '#ef4444'; // red
    else if (percentage > 50) barColor = '#f59e0b'; // yellow

    return (
      <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: color }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
              <div className="flex items-baseline gap-1.5">
                <h4 className="text-2xl font-bold text-slate-900">{remaining}</h4>
                <span className="text-xs text-slate-500">/ {total}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: bgColor }}>
              <Icon size={22} strokeWidth={2} style={{ color }} />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Utilizzati: {used}</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: barColor
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Generate year and month options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = convertToDisplayUnit(payload[0].value);
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">{payload[0].payload.label}</p>
          <p className="text-sm text-slate-600">
            <span className="font-medium">{getUnitLabel(value, true)}</span> logged
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => {
        const displayValue = convertToDisplayUnit(entry.payload.value);
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-700 font-medium">
              {entry.value} ({getUnitLabel(displayValue, true)})
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {user?.is_staff ? 'Admin Dashboard' : 'Dashboard Personale'}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Display Unit Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setDisplayUnit('hours')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${displayUnit === 'hours'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Ore
            </button>
            <button
              onClick={() => setDisplayUnit('days')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${displayUnit === 'days'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Giorni
            </button>
          </div>

          {/* View Type Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewType === 'monthly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Mensile
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewType === 'yearly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Annuale
            </button>
          </div>

          {/* Month Selector (only for monthly view) */}
          {viewType === 'monthly' && (
            <select
              value={selectedDate.month}
              onChange={(e) => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          )}

          {/* Year Selector */}
          <select
            value={selectedDate.year}
            onChange={(e) => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Label */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar size={16} />
        <span className="font-medium">
          Periodo visualizzato: {viewType === 'monthly'
            ? `${months[selectedDate.month - 1].label} ${selectedDate.year}`
            : `Anno ${selectedDate.year}`
          }
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={displayUnit === 'hours' ? 'Ore Totali' : 'Giorni Totali'}
          value={getUnitLabel(convertToDisplayUnit(kpis.totalHours), true)}
          subtitle={`${entries.length} registrazioni`}
          icon={Clock}
          color="#3b82f6"
        />
        <StatCard
          title="Progetti Attivi"
          value={kpis.activeProjectCount}
          subtitle={`${projects.length} totali`}
          icon={Briefcase}
          color="#10b981"
        />
        <StatCard
          title="Media Giornaliera"
          value={getUnitLabel(convertToDisplayUnit(kpis.avgDailyHours), true)}
          subtitle={viewType === 'monthly' ? 'per giorno' : 'per giorno'}
          icon={TrendingUp}
          color="#f59e0b"
        />
        {user?.is_staff && (
          <StatCard
            title="Collaboratori Attivi"
            value={kpis.activeUsersCount}
            subtitle={`${users.length} totali`}
            icon={Users}
            color="#8b5cf6"
          />
        )}
      </div>

      {/* Leave Tracking Section - Only for regular users */}
      {!user?.is_staff && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Gestione Assenze</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LeaveCard
              title="Ferie Rimanenti"
              used={user?.vacation_days_used || 0}
              total={user?.vacation_days_total || 22}
              icon={Umbrella}
              color="#10b981"
              bgColor="#d1fae5"
            />
            <LeaveCard
              title="Malattia Rimanenti"
              used={user?.sick_days_used || 0}
              total={user?.sick_days_total || 180}
              icon={Stethoscope}
              color="#ef4444"
              bgColor="#fee2e2"
            />
            <LeaveCard
              title="Permessi Rimanenti (ore)"
              used={user?.permit_hours_used || 0}
              total={user?.permit_hours_total || 32}
              icon={PermitIcon}
              color="#f59e0b"
              bgColor="#fef3c7"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution Chart */}
        <Card className="h-[500px]">
          <CardHeader title="Distribuzione Ore per Progetto" />
          <CardContent className="h-[440px]">
            {kpis.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis.chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {kpis.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const displayValue = convertToDisplayUnit(value);
                      return [
                        getUnitLabel(displayValue, true),
                        `${props.payload.name} (${((value / kpis.totalHours) * 100).toFixed(1)}%)`
                      ];
                    }}
                  />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Briefcase size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nessun dato disponibile per questo periodo</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="h-[500px]">
          <CardHeader title={viewType === 'monthly' ? 'Attività Giornaliera' : 'Attività Mensile'} />
          <CardContent className="h-[440px]">
            {kpis.trendData.some(d => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpis.trendData.map(d => ({
                    ...d,
                    displayValue: convertToDisplayUnit(d.hours)
                  }))}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <XAxis
                    dataKey="label"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b' }}
                    label={{
                      value: displayUnit === 'hours' ? 'Ore' : 'Giorni',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: 12 }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="displayValue"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={viewType === 'monthly' ? 20 : 32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nessuna attività registrata per questo periodo</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Team Overview - After Charts */}
      {user?.is_staff && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Panoramica Team - Gestione Assenze</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map(teamMember => {
              const vacationPercentage = ((teamMember.vacation_days_used || 0) / (teamMember.vacation_days_total || 22)) * 100;
              const sickPercentage = ((teamMember.sick_days_used || 0) / (teamMember.sick_days_total || 180)) * 100;
              const permitPercentage = ((teamMember.permit_hours_used || 0) / (teamMember.permit_hours_total || 32)) * 100;

              return (
                <Card key={teamMember.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-5">
                    {/* User Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                        <span className="text-lg font-bold">
                          {teamMember.first_name?.[0]?.toUpperCase()}{teamMember.last_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{teamMember.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{teamMember.email}</p>
                        {teamMember.job_title && (
                          <p className="text-xs text-blue-600 font-medium truncate">{teamMember.job_title}</p>
                        )}
                      </div>
                    </div>

                    {/* Leave Stats */}
                    <div className="space-y-4">
                      {/* Vacation Days */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Umbrella size={16} className="text-green-600" />
                            <span className="text-xs font-medium text-slate-700">Ferie</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-900">
                              {(teamMember.vacation_days_total || 22) - (teamMember.vacation_days_used || 0)}
                            </span>
                            <span className="text-xs text-slate-500">/ {teamMember.vacation_days_total || 22}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${Math.min(vacationPercentage, 100)}%`,
                              backgroundColor: vacationPercentage > 80 ? '#ef4444' : vacationPercentage > 50 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Utilizzati: {teamMember.vacation_days_used || 0} ({vacationPercentage.toFixed(0)}%)
                        </p>
                      </div>

                      {/* Sick Days */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Stethoscope size={16} className="text-red-600" />
                            <span className="text-xs font-medium text-slate-700">Malattia</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-900">
                              {(teamMember.sick_days_total || 180) - (teamMember.sick_days_used || 0)}
                            </span>
                            <span className="text-xs text-slate-500">/ {teamMember.sick_days_total || 180}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${Math.min(sickPercentage, 100)}%`,
                              backgroundColor: sickPercentage > 80 ? '#ef4444' : sickPercentage > 50 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Utilizzati: {teamMember.sick_days_used || 0} ({sickPercentage.toFixed(0)}%)
                        </p>
                      </div>

                      {/* Permits */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <PermitIcon size={16} className="text-amber-600" />
                            <span className="text-xs font-medium text-slate-700">Permessi (ore)</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-900">
                              {(teamMember.permit_hours_total || 32) - (teamMember.permit_hours_used || 0)}
                            </span>
                            <span className="text-xs text-slate-500">/ {teamMember.permit_hours_total || 32}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${Math.min(permitPercentage, 100)}%`,
                              backgroundColor: permitPercentage > 80 ? '#ef4444' : permitPercentage > 50 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Utilizzate: {teamMember.permit_hours_used || 0}h ({permitPercentage.toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};