import React from "react";
import { Button } from "../Button";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  form: { name: string };
  onChange: (v: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ClientFormModal: React.FC<Props> = ({
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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">
            {mode === "create" ? "Nuovo cliente" : "Modifica cliente"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="input"
            placeholder="Nome cliente"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annulla
            </Button>

            <Button type="submit">
              {mode === "create" ? "Crea" : "Salva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};