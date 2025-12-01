import React, { useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { Card, CardContent, CardHeader } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Briefcase, TrendingUp } from 'lucide-react';
import { COLORS } from '../constants';

export const Dashboard: React.FC = () => {
  const { user, entries, projects } = useStore();

  // Compute KPIs
  const kpis = useMemo(() => {
    // Filter entries based on role
    const relevantEntries = user?.role === Role.ADMIN 
      ? entries 
      : entries.filter(e => e.userId === user?.id);

    const totalHours = relevantEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const activeProjectCount = new Set(relevantEntries.map(e => e.projectId)).size;
    
    // Chart Data: Hours per Project
    const projectHours: Record<string, number> = {};
    relevantEntries.forEach(e => {
      const pName = projects.find(p => p.id === e.projectId)?.name || 'Unknown';
      projectHours[pName] = (projectHours[pName] || 0) + e.hours;
    });

    const chartData = Object.entries(projectHours).map(([name, value]) => ({ name, value }));

    // Weekly trend (last 7 days)
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const trendData = last7Days.map(date => {
        const hours = relevantEntries
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + e.hours, 0);
        return { date: date.slice(5), hours };
    });

    return { totalHours, activeProjectCount, chartData, trendData, relevantEntries };
  }, [entries, user, projects]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <div className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        </div>
        <div className="p-3 bg-slate-50 rounded-full" style={{ color }}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === Role.ADMIN ? 'Admin Dashboard' : 'My Dashboard'}
        </h1>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Hours Logged" value={`${kpis.totalHours}h`} icon={Clock} color="#3b82f6" />
        <StatCard title="Active Projects" value={kpis.activeProjectCount} icon={Briefcase} color="#10b981" />
        <StatCard title="Avg Daily Hours" value={(kpis.totalHours / 14).toFixed(1) + 'h'} icon={TrendingUp} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution Chart */}
        <Card className="h-96">
          <CardHeader title="Hours Distribution by Project" />
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {kpis.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trend Chart */}
        <Card className="h-96">
            <CardHeader title="Last 7 Days Activity" />
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpis.trendData}>
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};