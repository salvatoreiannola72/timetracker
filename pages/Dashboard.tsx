import React, { useMemo, useState } from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { Card, CardContent, CardHeader } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Briefcase, TrendingUp, Calendar, Users } from 'lucide-react';
import { COLORS } from '../constants';

type ViewType = 'monthly' | 'yearly';

export const Dashboard: React.FC = () => {
  const { user, entries, projects, users } = useStore();
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  // Filter entries based on selected period
  const filteredEntries = useMemo(() => {
    const relevantEntries = user?.role === Role.ADMIN 
      ? entries 
      : entries.filter(e => e.userId === user?.id);

    return relevantEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      if (viewType === 'yearly') {
        return entryYear === selectedDate.year;
      } else {
        return entryYear === selectedDate.year && entryMonth === selectedDate.month;
      }
    });
  }, [entries, user, viewType, selectedDate]);

  // Compute KPIs
  const kpis = useMemo(() => {
    const totalHours = filteredEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const activeProjectCount = new Set(filteredEntries.map(e => e.projectId)).size;
    const activeUsersCount = new Set(filteredEntries.map(e => e.userId)).size;
    
    // Chart Data: Hours per Project
    const projectHours: Record<string, number> = {};
    filteredEntries.forEach(e => {
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
        const hours = filteredEntries
          .filter(e => e.date === dateStr)
          .reduce((sum, e) => sum + e.hours, 0);
        return { label: String(day), hours };
      });
    } else {
      // Months in selected year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      trendData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const hours = filteredEntries
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
  }, [filteredEntries, projects, viewType, selectedDate]);

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
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">{payload[0].payload.label}</p>
          <p className="text-sm text-slate-600">
            <span className="font-medium">{payload[0].value}h</span> logged
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-700 font-medium">
            {entry.value} ({entry.payload.value}h)
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {user?.role === Role.ADMIN ? 'Admin Dashboard' : 'Dashboard Personale'}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Type Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewType === 'monthly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensile
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewType === 'yearly'
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
          title="Ore Totali" 
          value={`${kpis.totalHours.toFixed(1)}h`}
          subtitle={`${filteredEntries.length} registrazioni`}
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
          value={`${kpis.avgDailyHours.toFixed(1)}h`}
          subtitle={viewType === 'monthly' ? 'per giorno' : 'per giorno'}
          icon={TrendingUp} 
          color="#f59e0b" 
        />
        {user?.role === Role.ADMIN && (
          <StatCard 
            title="Collaboratori Attivi" 
            value={kpis.activeUsersCount}
            subtitle={`${users.length} totali`}
            icon={Users} 
            color="#8b5cf6" 
          />
        )}
      </div>

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
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                    formatter={(value: number) => [`${value}h`, 'Ore']}
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
                <BarChart data={kpis.trendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
                      value: 'Ore', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: 12 }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="hours" 
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
    </div>
  );
};