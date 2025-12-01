import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Briefcase, MoreHorizontal, X, Plus } from 'lucide-react';

const PROJECT_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#64748b', // Slate
];

export const Projects: React.FC = () => {
  const { user, projects, addProject } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      client: '',
      color: PROJECT_COLORS[0],
  });

  if (user?.role !== Role.ADMIN) {
      return <div className="p-8 text-center text-slate-500">Accesso Negato</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addProject({
          name: formData.name,
          client: formData.client,
          color: formData.color,
          status: 'ACTIVE'
      });
      setIsModalOpen(false);
      setFormData({ name: '', client: '', color: PROJECT_COLORS[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Progetti</h1>
            <p className="text-slate-500 text-sm">Progetti clienti attivi</p>
        </div>
        <Button 
            onClick={() => setIsModalOpen(true)}
            icon={<Plus size={18} />}
        >
            Nuovo Progetto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
            <Card key={project.id} className="hover:shadow-md transition-shadow group">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${project.color}20` }}>
                            <Briefcase size={20} style={{ color: project.color }} />
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{project.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{project.client}</p>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {project.status === 'ACTIVE' ? 'ATTIVO' : 'ARCHIVIATO'}
                        </span>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-900">Crea Nuovo Progetto</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20}/>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Progetto</label>
                    <input 
                        type="text" 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="es. Redesign Sito Web"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Cliente</label>
                    <input 
                        type="text" 
                        required
                        className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="es. Acme Srl"
                        value={formData.client}
                        onChange={e => setFormData({...formData, client: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Colore Etichetta</label>
                    <div className="flex flex-wrap gap-3">
                        {PROJECT_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({...formData, color})}
                                className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            >
                                {formData.color === color && <div className="w-2 h-2 bg-white rounded-full" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                    <Button type="submit" className="flex-1">Crea Progetto</Button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};