import React from "react";
import { User } from "../../types";
import { Card } from "../Card";
import {
  Mail,
  UserCircle2,
  Users,
  Briefcase,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface TeamTabContentProps {
  users: User[];
  searchQuery: string;
  onEditUser: (user: User) => void;
  onToggleUser: (user: User) => void;
}

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

const getJobTitleLabel = (jobTitle?: string | null) => {
  if (!jobTitle) return "Collaboratore";
  return JOB_TITLE_MAP[jobTitle] || jobTitle;
};

export const TeamTabContent: React.FC<TeamTabContentProps> = ({
  users,
  searchQuery,
  onEditUser,
  onToggleUser,
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {searchQuery ? "Nessun collaboratore trovato" : "Nessun collaboratore"}
        </h3>
        <p className="text-slate-500 mb-6">
          {searchQuery
            ? "Prova con un altro termine di ricerca"
            : "Non ci sono collaboratori da mostrare"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((member) => (
        <Card
          key={member.id}
          className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02] ${
            member.is_active
              ? "bg-white border-blue-500 hover:border-blue-600"
              : "bg-slate-100 border-slate-300"
          }`}
        >
          <div className="p-5">
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditUser(member)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifica"
                type="button"
              >
                <Edit2 size={16} />
              </button>
              
              <button
                  onClick={() => !member.is_staff && onToggleUser(member)}
                  disabled={member.is_staff}
                  className={`peer p-1.5 rounded-lg transition-colors ${
                    member.is_staff
                      ? "text-slate-300 cursor-not-allowed opacity-50"
                      : member.is_active
                      ? "text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                  type="button"
                >
                  {member.is_active ? (
                    <ToggleRight size={24} />
                  ) : (
                    <ToggleLeft size={24} />
                  )}
              </button>
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 pr-16">
              {member.name || `${member.first_name} ${member.last_name}`.trim()}
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full max-w-full">
                <Briefcase size={14} className="text-slate-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">
                  {getJobTitleLabel(member.job_title)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>

              {member.hire_date && (
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">Assunto il {member.hire_date}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};