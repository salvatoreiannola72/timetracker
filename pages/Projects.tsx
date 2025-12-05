import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, Client, Project } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Briefcase, Users, Edit2, Trash2, X, Plus, Search, Mail, Phone, Building2 } from 'lucide-react';

const PROJECT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b',
];

type ModalType = 'create-project' | 'edit-project' | 'create-client' | 'edit-client' | 'delete-project' | 'delete-client' | null;

export const Projects: React.FC = () => {
  const { user, clients, projects, addProject, updateProject, deleteProject, addClient, updateClient, deleteClient } = useStore();
  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [projectForm, setProjectForm] = useState({
      name: '',
      customer_id: '',
  });

  const [clientForm, setClientForm] = useState({
      name: '',
  });

  if (!user?.is_staff) {
      return <div className="p-8 text-center text-slate-500">Accesso Negato</div>;
  }

  // Get client name by ID
  const getClientName = (clientId: number) => {
      const client = clients.find(c => c.id === clientId);
      return client?.name || 'Cliente sconosciuto';
  };

  // Get projects count by client
  const getClientProjectsCount = (clientId: number) => {
      return projects.filter(p => p.customer_id === clientId).length;
  };

  // Get client by ID
  const getClient = (clientId: number) => {
      return clients.find(c => c.id === clientId);
  };

  // Filtered lists with search
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(p.customer_id).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery, clients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  // Stats
  const activeProjects = projects.length;
  const activeClients = clients.length;

  // Project handlers
  const handleCreateProject = async (e: React.FormEvent) => {
      e.preventDefault();
      await addProject({
          name: projectForm.name,
          customer_id: projectForm.customer_id,
          customerId: projectForm.customer_id,
      });
      setModalType(null);
      setProjectForm({ name: '', customer_id: '' });
  };

  const handleEditProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProject) return;
      await updateProject({
          ...selectedProject,
          name: projectForm.name,
          customer_id: projectForm.customer_id,
          customerId: projectForm.customer_id,
      });
      setModalType(null);
      setSelectedProject(null);
      setProjectForm({ name: '', customer_id: '' });
  };

  const handleDeleteProject = async () => {
      if (!selectedProject) return;
      await deleteProject(selectedProject.id);
      setModalType(null);
      setSelectedProject(null);
  };

  // Client handlers
  const handleCreateClient = async (e: React.FormEvent) => {
      e.preventDefault();
      await addClient(clientForm);
      setModalType(null);
      setClientForm({ name: '' });
  };

  const handleEditClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClient) return;
      await updateClient({
          ...selectedClient,
          ...clientForm
      });
      setModalType(null);
      setSelectedClient(null);
      setClientForm({ name: '' });
  };

  const handleDeleteClient = async () => {
      if (!selectedClient) return;
      await deleteClient(selectedClient.id);
      setModalType(null);
      setSelectedClient(null);
  };

  // Open modals
  const openEditProject = (project: Project) => {
      setSelectedProject(project);
      setProjectForm({
          name: project.name,
          customer_id: project.customer_id,
      });
      setModalType('edit-project');
  };

  const openDeleteProject = (project: Project) => {
      setSelectedProject(project);
      setModalType('delete-project');
  };

  const openEditClient = (client: Client) => {
      setSelectedClient(client);
      setClientForm({
          name: client.name,
      });
      setModalType('edit-client');
  };

  const openDeleteClient = (client: Client) => {
      setSelectedClient(client);
      setModalType('delete-client');
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestione Progetti</h1>
            <p className="text-slate-500 text-sm">Gestisci progetti e clienti da un'unica interfaccia</p>
        </div>
        
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`Cerca ${activeTab === 'projects' ? 'progetto' : 'cliente'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Create Button */}
          <Button 
              onClick={() => setModalType(activeTab === 'projects' ? 'create-project' : 'create-client')}
              icon={<Plus size={18} />}
              className="whitespace-nowrap"
          >
              Nuovo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
            className={`pb-3 px-2 border-b-2 transition-all ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase size={20} />
              <span className="font-medium">Progetti</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'projects' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {projects.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
            className={`pb-3 px-2 border-b-2 transition-all ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span className="font-medium">Clienti</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'clients' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {clients.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'projects' ? (
        filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'Nessun progetto trovato' : 'Nessun progetto'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Prova con un altro termine di ricerca' : 'Inizia creando il tuo primo progetto'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setModalType('create-project')} icon={<Plus size={18} />}>
                Crea Progetto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => {
              const client = getClient(project.customer_id);
              return (
                <Card key={project.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500 hover:scale-[1.02]">
                  <div className="p-5">
                    {/* Actions - sempre visibili ma opacità ridotta */}
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditProject(project)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteProject(project)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">{project.name}</h3>

                    {/* Client pill */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                        <Building2 size={14} className="text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{client?.name || 'N/D'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        filteredClients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Prova con un altro termine di ricerca' : 'Inizia creando il tuo primo cliente'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setModalType('create-client')} icon={<Plus size={18} />}>
                Crea Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <Card key={client.id} className="group relative hover:shadow-lg transition-all duration-200 border-l-4 border-slate-300 hover:border-blue-500 hover:scale-[1.02]">
                <div className="p-5">
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditClient(client)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteClient(client)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Name & Projects count */}
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{client.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                    <Briefcase size={14} />
                    {getClientProjectsCount(client.id)} progetti
                  </p>                 
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Modals - unchanged */}
      {(modalType === 'create-project' || modalType === 'edit-project') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {modalType === 'create-project' ? 'Nuovo Progetto' : 'Modifica Progetto'}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={modalType === 'create-project' ? handleCreateProject : handleEditProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Progetto</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. Website Redesign"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
                <select
                  value={projectForm.customer_id}
                  onChange={(e) => setProjectForm({ ...projectForm, customer_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleziona cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalType(null)} className="flex-1">
                  Annulla
                </Button>
                <Button type="submit" className="flex-1">
                  {modalType === 'create-project' ? 'Crea' : 'Salva'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(modalType === 'create-client' || modalType === 'edit-client') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {modalType === 'create-client' ? 'Nuovo Cliente' : 'Modifica Cliente'}
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={modalType === 'create-client' ? handleCreateClient : handleEditClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Cliente *</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. Acme Srl"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalType(null)} className="flex-1">
                  Annulla
                </Button>
                <Button type="submit" className="flex-1">
                  {modalType === 'create-client' ? 'Crea' : 'Salva'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'delete-project' && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Elimina Progetto</h2>
            <p className="text-slate-600 mb-6">
              Sei sicuro di voler eliminare il progetto <strong>{selectedProject.name}</strong>? 
              Questa azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setModalType(null)} className="flex-1">
                Annulla
              </Button>
              <Button type="button" onClick={handleDeleteProject} className="flex-1 bg-red-600 hover:bg-red-700">
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'delete-client' && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Elimina Cliente</h2>
            <p className="text-slate-600 mb-6">
              Sei sicuro di voler eliminare il cliente <strong>{selectedClient.name}</strong>?
              {getClientProjectsCount(selectedClient.id) > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Attenzione: questo cliente ha {getClientProjectsCount(selectedClient.id)} progetti associati. 
                  L'eliminazione potrebbe non essere possibile.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setModalType(null)} className="flex-1">
                Annulla
              </Button>
              <Button type="button" onClick={handleDeleteClient} className="flex-1 bg-red-600 hover:bg-red-700">
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};