import { useStore } from "@/context/Store";
import React, { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  hireDate: string;
  isActive: boolean;
}

interface ActivityItem {
  id: number;
  label: string;
  time: string;
  type: "login" | "timesheet" | "password" | "default";
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;       // 0–4
  label: string;
  color: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const JOB_TITLE_MAP: Record<string, string> = {
  SE: "Software Engineer",
  FE: "Frontend Engineer",
  BE: "Backend Engineer",
  QA: "Quality Assurance",
  PM: "Project Manager",
  DM: "Development Manager",
  SM: "Scrum Master",
  UX: "User Experience Designer",
  DS: "Data Scientist",
  DA: "Data Analyst",
  HR: "Human Resource",
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function evaluateStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Debole", color: "bg-red-400" },
    2: { label: "Sufficiente", color: "bg-amber-400" },
    3: { label: "Buona", color: "bg-blue-400" },
    4: { label: "Ottima", color: "bg-green-500" },
  };
  return { score, ...(map[score] ?? { label: "", color: "" }) };
}

const ACTIVITY_DOT: Record<ActivityItem["type"], string> = {
  login:     "bg-emerald-500",
  timesheet: "bg-blue-400",
  password:  "bg-amber-400",
  default:   "bg-gray-400",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-5 ${className}`}>
      <h2 className="text-sm font-medium text-gray-800 pb-3 mb-4 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs text-gray-400 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors
          ${error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          }
          bg-white text-gray-800 placeholder-gray-300`}
      />
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = evaluateStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300
              ${i <= score ? color : "bg-gray-100"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? "text-red-400" : score === 2 ? "text-amber-500" : score === 3 ? "text-blue-500" : "text-green-600"}`}>
        {label}
      </p>
    </div>
  );
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`flex items-center justify-between py-2 text-sm
            ${idx < items.length - 1 ? "border-b border-gray-50" : ""}`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_DOT[item.type]}`} />
            <span className="text-gray-700">{item.label}</span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const {user} = useStore();
  const profile: UserProfile = {
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    jobTitle: user.job_title,
    hireDate: user.hire_date,
    isActive: user.is_active,
  };

  // ── Password form state ────────────────────────────────────────────────────
  const [form, setForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function setField(field: keyof PasswordForm) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };
  }

  function validate(): boolean {
    const newErrors: Partial<PasswordForm> = {};
    if (!form.oldPassword) newErrors.oldPassword = "Inserisci la password attuale";
    if (!form.newPassword || form.newPassword.length < 8)
      newErrors.newPassword = "Minimo 8 caratteri";
    if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Le password non coincidono";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStatus("loading");
    setServerError("");
    try {
      // Replace with your actual DRF endpoint
      const res = await fetch("/api/auth/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          old_password: form.oldPassword,
          new_password: form.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail ?? "Errore durante l'aggiornamento");
      }
      setStatus("success");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Errore sconosciuto");
    }
  }

  function handleCancel() {
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setStatus("idle");
    setServerError("");
  }

  const hireDateFormatted = new Date(profile.hireDate).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Profilo</h1>
        <p className="text-sm text-gray-400 mt-1">Gestisci le informazioni del tuo account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Personal info ── */}
        <SectionCard title="Informazioni personali">
          {/* Avatar row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center
                            text-blue-600 font-medium text-base flex-shrink-0">
              {getInitials(profile.firstName, profile.lastName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-xs text-gray-400">{JOB_TITLE_MAP[profile.jobTitle]}</p>
            </div>
          </div>

          <ReadOnlyField label="Nome completo" value={`${profile.firstName} ${profile.lastName}`} />
          <ReadOnlyField label="Email" value={profile.email} />
          {profile.jobTitle && (
            <ReadOnlyField label="Ruolo" value={JOB_TITLE_MAP[profile.jobTitle] ?? profile.jobTitle} />
          )}
          {profile.hireDate && (
            <ReadOnlyField label="Data assunzione" value={hireDateFormatted} />
          )}

          <div className="mb-1">
            <p className="text-xs text-gray-400 mb-1">Stato</p>
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full
              ${profile.isActive
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"}`}>
              {profile.isActive ? "Attivo" : "Inattivo"}
            </span>
          </div>
        </SectionCard>

        {/* ── Change password ── */}
        <SectionCard title="Cambia password">
          {status === "success" && (
            <div className="mb-4 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
              Password aggiornata con successo.
            </div>
          )}
          {status === "error" && serverError && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {serverError}
            </div>
          )}

          <FormField
            id="old-password"
            label="Password attuale"
            value={form.oldPassword}
            onChange={setField("oldPassword")}
            placeholder="••••••••"
            error={errors.oldPassword}
          />

          <FormField
            id="new-password"
            label="Nuova password"
            value={form.newPassword}
            onChange={setField("newPassword")}
            placeholder="••••••••"
            error={errors.newPassword}
          >
            <StrengthBar password={form.newPassword} />
          </FormField>

          <FormField
            id="confirm-password"
            label="Conferma nuova password"
            value={form.confirmPassword}
            onChange={setField("confirmPassword")}
            placeholder="••••••••"
            error={errors.confirmPassword}
            hint="Almeno 8 caratteri, una lettera maiuscola e un numero"
          />

          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300
                         text-white rounded-lg transition-colors cursor-pointer"
            >
              {status === "loading" ? "Aggiornamento..." : "Aggiorna password"}
            </button>
            <button
              onClick={handleCancel}
              disabled={status === "loading"}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50
                         border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Annulla
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}