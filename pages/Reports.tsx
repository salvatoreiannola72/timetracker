import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Download, Printer, Building2, Users, FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { User, Project } from '../types';

type ViewMode = 'CLIENTS' | 'TEAM' | 'RAW';

export const Reports: React.FC = () => {
  const { entries, projects, users } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('CLIENTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // --- Aggregation Logic ---

  // 1. Group by Client (Company) -> Users
  const clientReport = useMemo(() => {
    const data: Record<string, { 
      clientName: string; 
      totalHours: number; 
      projectsCount: number;
      users: Record<string, number> 
    }> = {};

    entries.forEach(entry => {
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
  }, [entries, projects]);

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

    entries.forEach(entry => {
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
  }, [entries, users, projects]);

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

  const handleExport = () => {
    alert("Exporting currently filtered view to CSV...");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500 text-sm">Monitor performance by client or team</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Printer size={16}/>} onClick={() => window.print()}>Print</Button>
            <Button variant="primary" size="sm" icon={<Download size={16}/>} onClick={handleExport}>Export</Button>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto">
              <button 
                onClick={() => setViewMode('CLIENTS')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'CLIENTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Building2 size={16} /> Clients
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
                  <FileText size={16} /> Details
              </button>
          </div>

          <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Filter reports..." 
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
                                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Logged</span>
                              </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-800 mb-1">{client.clientName}</h3>
                          <p className="text-sm text-slate-500 mb-4">{client.projectsCount} Active Projects</p>

                          <div className="border-t border-slate-100 pt-4">
                              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Effort by Collaborator</p>
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
                                    <div className="text-xs text-slate-500">Total Worked</div>
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
                             <th className="px-6 py-4">Date</th>
                             <th className="px-6 py-4">User</th>
                             <th className="px-6 py-4">Client</th>
                             <th className="px-6 py-4">Project</th>
                             <th className="px-6 py-4 text-right">Hours</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {entries
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