import React from 'react';
import { Client, Project } from '../../types';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Briefcase,
  Building2,
  Edit2,
  Plus,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ProjectsTabContentProps {
  projects: Project[];
  searchQuery: string;
  getClient: (clientId: number) => Client | undefined;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onToggleProject: (project: Project) => void;
}

export const ProjectsTabContent: React.FC<ProjectsTabContentProps> = ({
  projects,
  searchQuery,
  getClient,
  onCreateProject,
  onEditProject,
  onToggleProject,
}) => {
  if (projects.length === 0) {
    return (
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
          <Button onClick={onCreateProject} icon={<Plus size={18} />}>
            Crea Progetto
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const client = getClient(project.customer_id);

        return (
          <Card
            key={project.id}
            className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02] ${
              project.active
                ? 'bg-white border-blue-500 hover:border-blue-600'
                : 'bg-slate-100 border-slate-300'
            }`}
          >
            <div className="p-5">
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditProject(project)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifica"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onToggleProject(project)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    project.active
                      ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title={project.active ? 'Disattiva' : 'Attiva'}
                >
                  {project.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">
                {project.name}
              </h3>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Building2 size={14} className="text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {client?.name || 'N/D'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};