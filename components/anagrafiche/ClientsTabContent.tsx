import React from 'react';
import { Client } from '../../types';
import { Card } from '../Card';
import { Button } from '../Button';
import { Briefcase, Edit2, Plus, ToggleLeft, ToggleRight, Users } from 'lucide-react';

interface ClientsTabContentProps {
  clients: Client[];
  searchQuery: string;
  getClientProjectsCount: (clientId: number) => number;
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onToggleClient: (client: Client) => void;
}

export const ClientsTabContent: React.FC<ClientsTabContentProps> = ({
  clients,
  searchQuery,
  getClientProjectsCount,
  onCreateClient,
  onEditClient,
  onToggleClient,
}) => {
  if (clients.length === 0) {
    return (
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
          <Button onClick={onCreateClient} icon={<Plus size={18} />}>
            Crea Cliente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Card
          key={client.id}
          className={`group relative hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02] ${
            client.active
              ? 'bg-white border-slate-300 hover:border-blue-500'
              : 'bg-slate-100 border-slate-300'
          }`}
        >
          <div className="p-5">
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditClient(client)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifica"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onToggleClient(client)}
                className={`p-1.5 rounded-lg transition-colors ${
                  client.active
                    ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={client.active ? 'Disattiva' : 'Attiva'}
              >
                {client.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-1">{client.name}</h3>
            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
              <Briefcase size={14} />
              {getClientProjectsCount(client.id)} progetti
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};