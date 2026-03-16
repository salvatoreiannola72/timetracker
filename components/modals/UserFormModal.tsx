import React from "react";
import { X } from "lucide-react";
import { Button } from "../Button";

interface UserForm {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  job_title: string;
}

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  form: UserForm;
  onChange: (value: UserForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  form,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === "create" ? "Nuovo collaboratore" : "Modifica collaboratore"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) =>
                onChange({ ...form, first_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cognome
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) =>
                onChange({ ...form, last_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cognome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@dominio.it"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                onChange({ ...form, username: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ruolo / Job title
            </label>
            <input
              type="text"
              value={form.job_title}
              onChange={(e) =>
                onChange({ ...form, job_title: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. Frontend Developer"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annulla
            </Button>

            <Button type="submit" className="flex-1">
              {mode === "create" ? "Crea" : "Salva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};