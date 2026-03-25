import React from "react";
import { Client } from "../../types";
import { Button } from "../Button";
import { X } from "lucide-react";

interface ProjectForm {
  name: string;
  customer_id: number | "";
  start_date: string;
  end_date: string;
  effort: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  form: ProjectForm;
  clients: Client[];
  onChange: (v: ProjectForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProjectFormModal: React.FC<Props> = ({
  open,
  mode,
  form,
  clients,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">
            {mode === "create" ? "Nuovo progetto" : "Modifica progetto"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome progetto
            </label>
            <input
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
              placeholder="es. Website Redesign"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cliente
            </label>
            <select
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
              value={form.customer_id}
              onChange={(e) =>
                onChange({ ...form, customer_id: Number(e.target.value) })
              }
              required
            >
              <option value="">Seleziona cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data inizio
              </label>
              <input
                type="date"
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
                value={form.start_date}
                onChange={(e) => onChange({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data fine
              </label>
              <input
                type="date"
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
                value={form.end_date}
                onChange={(e) => onChange({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Effort */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Effort (GU)
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm touch-manipulation"
              placeholder="es. 20"
              value={form.effort}
              onChange={(e) => onChange({ ...form, effort: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">
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