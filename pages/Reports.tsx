import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Download, FileSpreadsheet, Building2, Users, FileText, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { User, Project } from '../types';
import * as XLSX from 'xlsx';

type ViewMode = 'CLIENTS' | 'TEAM' | 'RAW';
type PeriodType = 'monthly' | 'yearly';

export const Reports: React.FC = () => {
  const { entries, projects, users } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('CLIENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });

  // Filter entries based on selected period
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      if (periodType === 'yearly') {
        return entryYear === selectedDate.year;
      } else {
        return entryYear === selectedDate.year && entryMonth === selectedDate.month;
      }
    });
  }, [entries, periodType, selectedDate]);

  // --- Aggregation Logic ---

  // 1. Group by Client (Company) -> Users
  const clientReport = useMemo(() => {
    const data: Record<string, { 
      clientName: string; 
      totalHours: number; 
      projectsCount: number;
      users: Record<string, number> 
    }> = {};

    filteredEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      if (!project) return;
      const clientName = project.client;

      if (!data[clientName]) {
        data[clientName] = { clientName, totalHours: 0, projectsCount: 0, users: {} };
      }
      
      data[clientName].totalHours += entry.hours;
      data[clientName].users[entry.userId] = (data[clientName].users[entry.userId] || 0) + entry.hours;
    });

    // Count unique projects per client
    Object.keys(data).forEach(client => {
       const clientProjects = projects.filter(p => p.client === client);
       data[client].projectsCount = clientProjects.length;
    });

    return Object.values(data).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries, projects]);

  // 2. Group by User (Collaborator) -> Projects
  const teamReport = useMemo(() => {
    const data: Record<string, { 
      user: User; 
      totalHours: number; 
      projects: Record<string, { name: string; hours: number; color: string }> 
    }> = {};

    users.forEach(u => {
        data[u.id] = { user: u, totalHours: 0, projects: {} };
    });

    filteredEntries.forEach(entry => {
      if (!data[entry.userId]) return; // Should not happen
      
      const project = projects.find(p => p.id === entry.projectId);
      const projId = entry.projectId;
      const projName = project?.name || 'Unknown';
      const projColor = project?.color || '#cbd5e1';

      data[entry.userId].totalHours += entry.hours;
      
      if (!data[entry.userId].projects[projId]) {
          data[entry.userId].projects[projId] = { name: projName, hours: 0, color: projColor };
      }
      data[entry.userId].projects[projId].hours += entry.hours;
    });

    return Object.values(data)
      .filter(d => d.totalHours > 0) // Hide users with 0 hours
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries, users, projects]);

  // --- Filtering Logic ---
  
  const filteredClients = clientReport.filter(c => 
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeam = teamReport.filter(t => 
    t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
      setExpandedCard(expandedCard === id ? null : id);
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (viewMode === 'CLIENTS') {
      // CSV for Clients view
      filename = `report_clienti_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.csv`;
      csvContent = 'Cliente,Ore Totali,Progetti Attivi\n';
      filteredClients.forEach(client => {
        csvContent += `"${client.clientName}",${client.totalHours},${client.projectsCount}\n`;
      });
    } else if (viewMode === 'TEAM') {
      // CSV for Team view
      filename = `report_team_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.csv`;
      csvContent = 'Nome,Email,Ore Totali\n';
      filteredTeam.forEach(item => {
        csvContent += `"${item.user.name}","${item.user.email}",${item.totalHours}\n`;
      });
    } else if (viewMode === 'RAW') {
      // CSV for Raw/Details view
      filename = `report_dettagli_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.csv`;
      csvContent = 'Data,Utente,Cliente,Progetto,Ore\n';
      filteredEntries.forEach(entry => {
        const user = users.find(u => u.id === entry.userId);
        const project = projects.find(p => p.id === entry.projectId);
        csvContent += `"${entry.date}","${user?.name || 'Unknown'}","${project?.client || ''}","${project?.name || ''}",${entry.hours}\n`;
      });
    }

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExportExcel = () => {
    let worksheet: XLSX.WorkSheet;
    let filename = '';

    if (viewMode === 'CLIENTS') {
      // Excel for Clients view
      filename = `report_clienti_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.xlsx`;
      const data = filteredClients.map(client => ({
        'Cliente': client.clientName,
        'Ore Totali': client.totalHours,
        'Progetti Attivi': client.projectsCount
      }));
      worksheet = XLSX.utils.json_to_sheet(data);
    } else if (viewMode === 'TEAM') {
      // Excel for Team view
      filename = `report_team_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.xlsx`;
      const data = filteredTeam.map(item => ({
        'Nome': item.user.name,
        'Email': item.user.email,
        'Ore Totali': item.totalHours
      }));
      worksheet = XLSX.utils.json_to_sheet(data);
    } else if (viewMode === 'RAW') {
      // Excel for Raw/Details view
      filename = `report_dettagli_${periodType === 'monthly' ? months[selectedDate.month - 1].label : 'anno'}_${selectedDate.year}.xlsx`;
      const data = filteredEntries.map(entry => {
        const user = users.find(u => u.id === entry.userId);
        const project = projects.find(p => p.id === entry.projectId);
        return {
          'Data': entry.date,
          'Utente': user?.name || 'Unknown',
          'Cliente': project?.client || '',
          'Progetto': project?.name || '',
          'Ore': entry.hours
        };
      });
      worksheet = XLSX.utils.json_to_sheet(data);
    }

    // Create workbook and download
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet!, 'Report');
    XLSX.writeFile(workbook, filename);
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

  return (
    <div className="space-y-6 pb-20 md:pb-0">
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Report e Analisi</h1>
            <p className="text-slate-500 text-sm">Monitora le prestazioni per cliente o team</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={16}/>} onClick={handleExportCSV}>Esporta CSV</Button>
            <Button variant="primary" size="sm" icon={<FileSpreadsheet size={16}/>} onClick={handleExportExcel}>Esporta Excel</Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span className="font-medium">Periodo:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Type Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setPeriodType('monthly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  periodType === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensile
              </button>
              <button
                onClick={() => setPeriodType('yearly')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  periodType === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annuale
              </button>
            </div>

            {/* Month Selector (only for monthly view) */}
            {periodType === 'monthly' && (
              <select
                value={selectedDate.month}
                onChange={(e) => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-500 md:ml-auto">
            {periodType === 'monthly' 
              ? `${months[selectedDate.month - 1].label} ${selectedDate.year}`
              : `Anno ${selectedDate.year}`
            }
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto">
              <button 
                onClick={() => setViewMode('CLIENTS')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'CLIENTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Building2 size={16} /> Clienti
              </button>
              <button 
                onClick={() => setViewMode('TEAM')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'TEAM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Users size={16} /> Team
              </button>
              <button 
                onClick={() => setViewMode('RAW')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'RAW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <FileText size={16} /> Dettagli
              </button>
          </div>

          <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Filtra report..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
          </div>
      </div>

      {/* CONTENT: CLIENTS VIEW */}
      {viewMode === 'CLIENTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client, idx) => (
                  <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5">
                          <div className="flex justify-between items-start mb-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                  <Building2 size={24} />
                              </div>
                              <div className="text-right">
                                  <span className="block text-2xl font-bold text-slate-900">{client.totalHours}h</span>
                                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Totale Registrato</span>
                              </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-800 mb-1">{client.clientName}</h3>
                          <p className="text-sm text-slate-500 mb-4">{client.projectsCount} Progetti Attivi</p>

                          <div className="border-t border-slate-100 pt-4">
                              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Impegno per Collaboratore</p>
                              <div className="space-y-3">
                                  {Object.entries(client.users).map(([userId, hours]) => {
                                      const user = users.find(u => u.id === userId);
                                      const h = hours as number;
                                      const percentage = Math.round((h / client.totalHours) * 100);
                                      return (
                                          <div key={userId} className="flex items-center gap-3">
                                              <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm" />
                                              <div className="flex-1">
                                                  <div className="flex justify-between text-xs mb-1">
                                                      <span className="font-medium text-slate-700">{user?.name}</span>
                                                      <span className="text-slate-500">{h}h ({percentage}%)</span>
                                                  </div>
                                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      )}

      {/* CONTENT: TEAM VIEW */}
      {viewMode === 'TEAM' && (
          <div className="grid grid-cols-1 gap-4">
              {filteredTeam.map((item) => {
                  const isExpanded = expandedCard === item.user.id;
                  return (
                    <Card key={item.user.id} className="transition-all duration-200">
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleExpand(item.user.id)}
                        >
                            <div className="flex items-center gap-4">
                                <img src={item.user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={item.user.name} />
                                <div>
                                    <h3 className="font-bold text-slate-900">{item.user.name}</h3>
                                    <p className="text-xs text-slate-500">{item.user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xl font-bold text-slate-900">{item.totalHours}h</div>
                                    <div className="text-xs text-slate-500">Totale Lavorato</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>
                        
                        {/* Expanded / Detailed View */}
                        {(isExpanded || window.innerWidth >= 768) && (
                             <div className={`px-4 pb-6 sm:pl-[5rem] animate-in fade-in duration-200 ${!isExpanded ? 'hidden md:block' : 'block'}`}>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                     {Object.values(item.projects).map((proj: any, idx) => (
                                         <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-between">
                                             <div className="flex items-center gap-2 overflow-hidden">
                                                 <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }}></div>
                                                 <span className="text-sm font-medium text-slate-700 truncate">{proj.name}</span>
                                             </div>
                                             <span className="text-sm font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                                 {proj.hours}h
                                             </span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        )}
                    </Card>
                  );
              })}
          </div>
      )}

      {/* CONTENT: RAW TABLE */}
      {viewMode === 'RAW' && (
          <Card>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                         <tr>
                             <th className="px-6 py-4">Data</th>
                             <th className="px-6 py-4">Utente</th>
                             <th className="px-6 py-4">Cliente</th>
                             <th className="px-6 py-4">Progetto</th>
                             <th className="px-6 py-4 text-right">Ore</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {filteredEntries
                            .filter(e => 
                                e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                projects.find(p => p.id === e.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .slice(0, 50).map(entry => {
                             const user = users.find(u => u.id === entry.userId);
                             const project = projects.find(p => p.id === entry.projectId);
                             return (
                                 <tr key={entry.id} className="hover:bg-slate-50/50">
                                     <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{entry.date}</td>
                                     <td className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                                         {user && <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />}
                                         {user?.name || 'Unknown'}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                         {project?.client}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         <span className="inline-block w-2 h-2 rounded-full mr-2" style={{backgroundColor: project?.color}}></span>
                                         {project?.name}
                                     </td>
                                     <td className="px-6 py-4 text-right font-bold text-slate-900">{entry.hours}</td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
          </CardContent>
      </Card>
      )}
    </div>
  );
};