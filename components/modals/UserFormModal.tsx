import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../Button";

interface UserForm {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  job_title: string;
  hire_date: string;
  is_staff: boolean;
  password: string;
  confirm_password: string;
}

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  form: UserForm;
  onChange: (value: UserForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const JOB_TITLE_OPTIONS = [
  { value: "", label: "Seleziona ruolo (opzionale)" },
  { value: "SE", label: "Software Engineer" },
  { value: "FE", label: "Frontend Engineer" },
  { value: "BE", label: "Backend Engineer" },
  { value: "QA", label: "Quality Assurance" },
  { value: "PM", label: "Project Manager" },
  { value: "DM", label: "Development Manager" },
  { value: "SM", label: "Scrum Master" },
  { value: "UX", label: "User Experience Designer" },
  { value: "DS", label: "Data Scientist" },
  { value: "DA", label: "Data Analyst" },
  { value: "HR", label: "Human Resource" },
];

const buildDefaultPassword = (firstName: string, lastName: string) =>
  `${firstName}${lastName}`.replace(/\s+/g, "");

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  form,
  onChange,
  onSubmit,
  onClose,
}) => {
  const passwordTouchedRef = useRef(false);
  const confirmPasswordTouchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      passwordTouchedRef.current = false;
      confirmPasswordTouchedRef.current = false;
      return;
    }

    if (mode !== "create") return;
    if (passwordTouchedRef.current || confirmPasswordTouchedRef.current) return;

    const generatedPassword = buildDefaultPassword(form.first_name, form.last_name);

    onChange({
      ...form,
      password: generatedPassword,
      confirm_password: generatedPassword,
    });
  }, [open, mode, form.first_name, form.last_name]);

  const handlePasswordChange = (value: string) => {
    passwordTouchedRef.current = true;
    onChange({ ...form, password: value });
  };

  const handleConfirmPasswordChange = (value: string) => {
    confirmPasswordTouchedRef.current = true;
    onChange({ ...form, confirm_password: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create" && form.password !== form.confirm_password) {
      alert("Password e conferma password non coincidono.");
      return;
    }

    onSubmit(e);
  };

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border rounded-lg"
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
              className="w-full px-3 py-2 border rounded-lg"
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
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ruolo / Job title
            </label>
            <select
              value={form.job_title}
              onChange={(e) =>
                onChange({ ...form, job_title: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              {JOB_TITLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hire date
            </label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) =>
                onChange({ ...form, hire_date: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_staff"
              type="checkbox"
              checked={form.is_staff}
              onChange={(e) =>
                onChange({ ...form, is_staff: e.target.checked })
              }
              className="h-4 w-4"
            />
            <label htmlFor="is_staff" className="text-sm font-medium text-slate-700">
              Utente staff
            </label>
          </div>

          {mode === "create" && (
            <>
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
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conferma password
                </label>
                <input
                  type="text"
                  value={form.confirm_password}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Conferma password"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
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