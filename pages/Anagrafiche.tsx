import React, { useMemo, useState } from "react";
import { useStore } from "../context/Store";
import { Search, Plus, Users, Briefcase } from "lucide-react";
import { Client, Project, User } from "../types";

import { Button } from "../components/Button";
import { ClientsTabContent } from "../components/anagrafiche/ClientsTabContent";
import { ProjectsTabContent } from "../components/anagrafiche/ProjectsTabContent";
import { TeamTabContent } from "../components/anagrafiche/TeamTabContent";

import { ClientFormModal } from "../components/modals/ClientFormModal";
import { ProjectFormModal } from "../components/modals/ProjectFormModal";
import { ConfirmToggleModal } from "../components/modals/ConfirmToggleModal";
import { UserFormModal } from "../components/modals/UserFormModal";

import { useToast } from "../hooks/useToast";
import { Toast } from "../components/ui/Toast";
import { parseApiError } from "../utils/errorParser";

type Tab = "clients" | "projects" | "team";

export const Anagrafiche: React.FC = () => {
  const {
    user,
    users,
    clients,
    projects,
    addProject,
    updateProject,
    addClient,
    updateClient,
    addUser,
    updateUser,
  } = useStore();

  const [tab, setTab] = useState<Tab>("clients");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [projectForm, setProjectForm] = useState<{
    name: string;
    customer_id: number | "";
  }>({
    name: "",
    customer_id: "",
  });

  const [clientForm, setClientForm] = useState({
    name: "",
  });

  const [userForm, setUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    job_title: "",
    hire_date: "",
    is_staff: false,
    password: "",
    confirm_password: "",
  });

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">(
    "create"
  );

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalMode, setClientModalMode] = useState<"create" | "edit">(
    "create"
  );

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create");


  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<
    "client" | "project" | "user" | null
  >(null);

  if (!user?.is_staff) {
    return <div className="p-8 text-center text-slate-500">Accesso Negato</div>;
  }

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Cliente sconosciuto";
  };

  const getClientProjectsCount = (clientId: number) => {
    return projects.filter((p) => p.customer_id === clientId).length;
  };

  const getClient = (clientId: number) => {
    return clients.find((c) => c.id === clientId);
  };

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();

    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const filteredProjects = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();

    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        getClientName(p.customer_id).toLowerCase().includes(q)
    );
  }, [projects, search, clients]);

  const filteredTeam = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();

    return users.filter((member: User) =>
      [
        member.name,
        member.first_name,
        member.last_name,
        member.email,
        member.username,
        member.job_title,
        member.company
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser({
        username: userForm.username,
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        password: userForm.password,
        is_staff: userForm.is_staff,
        is_superuser: false,
        is_active: true,
        hire_date: userForm.hire_date || null,
        job_title: userForm.job_title || null,
        company: user.company,
      });

      setUserModalOpen(false);
      showToast("Utente creato con successo", "success");
      
      setSelectedUser(null);
      setUserForm({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        job_title: "",
        hire_date: "",
        is_staff: false
      });
    } catch (error) {
      showToast(parseApiError(error), "error");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    await addProject({
      name: projectForm.name,
      customer_id: Number(projectForm.customer_id),
      customerId: Number(projectForm.customer_id),
    });

    setProjectModalOpen(false);
    setProjectForm({ name: "", customer_id: "" });
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    await updateProject({
      ...selectedProject,
      name: projectForm.name,
      customer_id: Number(projectForm.customer_id),
      customerId: Number(projectForm.customer_id),
    });

    setProjectModalOpen(false);
    setSelectedProject(null);
    setProjectForm({ name: "", customer_id: "" });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addClient({
      name: clientForm.name,
      company: user.company,
    });

    setClientModalOpen(false);
    setClientForm({ name: "" });
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    await updateClient({
      ...selectedClient,
      name: clientForm.name,
    });

    setClientModalOpen(false);
    setSelectedClient(null);
    setClientForm({ name: "" });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await updateUser({
        ...selectedUser,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        name: `${userForm.first_name} ${userForm.last_name}`.trim(),
        email: userForm.email,
        username: userForm.username,
        job_title: userForm.job_title || null,
        hire_date: userForm.hire_date || null,
        is_staff: userForm.is_staff
      });

      setUserModalOpen(false);
      showToast("Utente aggiornato", "success");
      setSelectedUser(null);
      setUserForm({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        job_title: "",
        hire_date: "",
        is_staff: false
      });
      
    } catch (error) {
      showToast(parseApiError(error), "error");
    }
  };

  const openCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      job_title: "",
    });
    setUserModalMode("create");
    setUserModalOpen(true);
  };

  const openEditUser = (member: User) => {
    setSelectedUser(member);
    setUserForm({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      email: member.email || "",
      username: member.username || "",
      job_title: member.job_title || "",
      hire_date: member.hire_date || "",
      is_staff: member.is_staff ?? false,
    });
    setUserModalMode("edit");
    setUserModalOpen(true);
  };

  const openCreateProject = () => {
    setSelectedProject(null);
    setProjectForm({ name: "", customer_id: "" });
    setProjectModalMode("create");
    setProjectModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      customer_id: project.customer_id,
    });
    setProjectModalMode("edit");
    setProjectModalOpen(true);
  };

  const openCreateClient = () => {
    setSelectedClient(null);
    setClientForm({ name: "" });
    setClientModalMode("create");
    setClientModalOpen(true);
  };

  const openEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
    });
    setClientModalMode("edit");
    setClientModalOpen(true);
  };

  const openToggleProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedClient(null);
    setSelectedUser(null);
    setToggleTarget("project");
    setToggleModalOpen(true);
  };

  const openToggleClient = (client: Client) => {
    setSelectedClient(client);
    setSelectedProject(null);
    setSelectedUser(null);
    setToggleTarget("client");
    setToggleModalOpen(true);
  };

  const openToggleUser = (member: User) => {
    setSelectedUser(member);
    setSelectedProject(null);
    setSelectedClient(null);
    setToggleTarget("user");
    setToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (toggleTarget === "project" && selectedProject) {
      await updateProject({
        ...selectedProject,
        active: !selectedProject.active,
      });
    }

    if (toggleTarget === "client" && selectedClient) {
      await updateClient({
        ...selectedClient,
        active: !selectedClient.active,
      });
    }

    if (toggleTarget === "user" && selectedUser) {
      await updateUser({
        ...selectedUser,
        is_active: !selectedUser.is_active,
      });
    }

    setToggleModalOpen(false);
    setToggleTarget(null);
    setSelectedProject(null);
    setSelectedClient(null);
    setSelectedUser(null);
  };

  const getSearchPlaceholder = () => {
    switch (tab) {
      case "projects":
        return "Cerca progetto...";
      case "team":
        return "Cerca collaboratore...";
      default:
        return "Cerca cliente...";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anagrafiche</h1>
          <p className="text-slate-500 text-sm">
            Gestisci clienti, progetti e collaboratori da un&apos;unica interfaccia
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={getSearchPlaceholder()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            onClick={
              tab === "projects"
                ? openCreateProject
                : tab === "clients"
                ? openCreateClient
                : openCreateUser
            }
            icon={<Plus size={18} />}
            className="whitespace-nowrap"
          >
            Nuovo
          </Button>
        </div>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <button
            onClick={() => {
              setTab("clients");
              setSearch("");
            }}
            className={`pb-3 px-2 border-b-2 transition-all ${
              tab === "clients"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span className="font-medium">Clienti</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tab === "clients"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {clients.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              setTab("projects");
              setSearch("");
            }}
            className={`pb-3 px-2 border-b-2 transition-all ${
              tab === "projects"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase size={20} />
              <span className="font-medium">Progetti</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tab === "projects"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {projects.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              setTab("team");
              setSearch("");
            }}
            className={`pb-3 px-2 border-b-2 transition-all ${
              tab === "team"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span className="font-medium">Team</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tab === "team"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {users.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {tab === "clients" && (
        <ClientsTabContent
          clients={filteredClients}
          searchQuery={search}
          getClientProjectsCount={getClientProjectsCount}
          onCreateClient={openCreateClient}
          onEditClient={openEditClient}
          onToggleClient={openToggleClient}
        />
      )}

      {tab === "projects" && (
        <ProjectsTabContent
          projects={filteredProjects}
          searchQuery={search}
          getClient={getClient}
          onCreateProject={openCreateProject}
          onEditProject={openEditProject}
          onToggleProject={openToggleProject}
        />
      )}

      {tab === "team" && (
        <TeamTabContent
          users={filteredTeam}
          searchQuery={search}
          onEditUser={openEditUser}
          onToggleUser={openToggleUser}
        />
      )}

      <ProjectFormModal
        open={projectModalOpen}
        mode={projectModalMode}
        form={projectForm}
        clients={clients}
        onChange={setProjectForm}
        onSubmit={
          projectModalMode === "create" ? handleCreateProject : handleEditProject
        }
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProject(null);
          setProjectForm({ name: "", customer_id: "" });
        }}
      />

      <ClientFormModal
        open={clientModalOpen}
        mode={clientModalMode}
        form={clientForm}
        onChange={setClientForm}
        onSubmit={
          clientModalMode === "create" ? handleCreateClient : handleEditClient
        }
        onClose={() => {
          setClientModalOpen(false);
          setSelectedClient(null);
          setClientForm({ name: "" });
        }}
      />

      <UserFormModal
        open={userModalOpen}
        mode={userModalMode}
        form={userForm}
        onChange={setUserForm}
        onSubmit={userModalMode === "create" ? handleCreateUser : handleEditUser}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
          setUserForm({
            first_name: "",
            last_name: "",
            email: "",
            username: "",
            job_title: "",
          });
        }}
      />

      <ConfirmToggleModal
        open={toggleModalOpen}
        title={
          toggleTarget === "project"
            ? selectedProject?.active
              ? "Disattiva progetto"
              : "Attiva progetto"
            : toggleTarget === "client"
            ? selectedClient?.active
              ? "Disattiva cliente"
              : "Attiva cliente"
            : selectedUser?.is_active
            ? "Disattiva collaboratore"
            : "Attiva collaboratore"
        }
        message={
          toggleTarget === "project" && selectedProject
            ? `Vuoi ${selectedProject.active ? "disattivare" : "attivare"} il progetto "${selectedProject.name}"?`
            : toggleTarget === "client" && selectedClient
            ? `Vuoi ${selectedClient.active ? "disattivare" : "attivare"} il cliente "${selectedClient.name}"?`
            : toggleTarget === "user" && selectedUser
            ? `Vuoi ${selectedUser.is_active ? "disattivare" : "attivare"} il collaboratore "${selectedUser.name}"?`
            : ""
        }
        confirmLabel={
          toggleTarget === "project"
            ? selectedProject?.active
              ? "Disattiva"
              : "Attiva"
            : toggleTarget === "client"
            ? selectedClient?.active
              ? "Disattiva"
              : "Attiva"
            : selectedUser?.is_active
            ? "Disattiva"
            : "Attiva"
        }
        onConfirm={handleConfirmToggle}
        onClose={() => {
          setToggleModalOpen(false);
          setToggleTarget(null);
          setSelectedProject(null);
          setSelectedClient(null);
          setSelectedUser(null);
        }}
      />
      {toast && <Toast message={toast.message} type={toast.type} />}  
    </div>
  );
};
