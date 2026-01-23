import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../context/Store";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import {
  Download,
  FileSpreadsheet,
  Building2,
  Users,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Briefcase,
} from "lucide-react";
import { User, Project } from "../types";
import * as XLSX from "xlsx";
import { EntryType, Timesheet as TimesheetEntry } from "../types";
import { TimesheetsService } from "@/services/timesheets";
import { useDisplayUnit } from "@/hooks/useDisplayUnit";

type ViewMode = "CLIENTS" | "PROJECTS" | "TEAM";
type PeriodType = "monthly" | "yearly";

export const Reports: React.FC = () => {
  const { projects, users, clients } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>("CLIENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });

  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);

  const { displayUnit, setDisplayUnit, formatHours } =
    useDisplayUnit();

  const loadTimesheets = async (month?: number, year?: number) => {
    const data = await TimesheetsService.getTimesheetEntries(
      undefined,
      month,
      year,
      true,
    );
    const timesheets: any[] =
      data?.flatMap((item: any, index: number) => {
        const entryType =
          (item.permits_hours ?? 0) > 0
            ? EntryType.PERMIT
            : item.illness === true
              ? EntryType.SICK_LEAVE
              : item.holiday === true
                ? EntryType.VACATION
                : EntryType.WORK;
        let timesheet = {
          userId: item.employee ?? item.employee_id,
          user_id: item.employee ?? item.employee_id,
          projectId: item.project_id,
          entry_type: entryType,
          date: item.day,
          ...item,
        };
        return [timesheet];
      }) || [];
    setTimesheets(timesheets);
  };

  useEffect(() => {
    loadTimesheets(
      periodType == "monthly" ? selectedDate.month : undefined,
      selectedDate.year,
    );
  }, [selectedDate.month, selectedDate.year, periodType]);

  // Filter entries based on selected period
  const filteredEntries = useMemo(() => {
    return timesheets.filter((entry) => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      if (periodType === "yearly") {
        return entryYear === selectedDate.year;
      } else {
        return (
          entryYear === selectedDate.year && entryMonth === selectedDate.month
        );
      }
    });
  }, [timesheets, periodType, selectedDate]);

  // --- Aggregation Logic ---

  // 1. Group by Client (Company) -> Projects -> Users
  const clientReport = useMemo(() => {
    const data: Record<
      string,
      {
        clientName: string;
        totalHours: number;
        projects: Record<
          string,
          {
            project: Project;
            hours: number;
            users: Record<string, number>;
          }
        >;
      }
    > = {};

    filteredEntries.forEach((entry) => {
      const project = projects.find((p) => p.id === entry.projectId);
      if (!project) return;
      const client = clients.find((c) => c.id === project.customer_id);
      const clientName = client?.name || `Cliente ${project.customer_id}`;

      if (!data[clientName]) {
        data[clientName] = { clientName, totalHours: 0, projects: {} };
      }

      if (!data[clientName].projects[entry.projectId]) {
        data[clientName].projects[entry.projectId] = {
          project,
          hours: 0,
          users: {},
        };
      }

      data[clientName].totalHours += entry.hours;
      data[clientName].projects[entry.projectId].hours += entry.hours;
      data[clientName].projects[entry.projectId].users[entry.userId] =
        (data[clientName].projects[entry.projectId].users[entry.userId] || 0) +
        entry.hours;
    });

    return Object.values(data).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries, projects, clients]);

  // 2. Group by User (Collaborator) -> Projects
  const teamReport = useMemo(() => {
    const data: Record<
      string,
      {
        user: User;
        totalHours: number;
        projects: Record<
          string,
          { name: string; hours: number; color: string }
        >;
      }
    > = {};

    users.forEach((u) => {
      data[u.id] = { user: u, totalHours: 0, projects: {} };
    });

    filteredEntries.forEach((entry) => {
      if (!data[entry.userId]) return; // Should not happen
      if (entry.entry_type === EntryType.WORK) {
        const project = projects.find((p) => p.id === entry.projectId);
        const projId = entry.projectId;
        const projName = project?.name || "Unknown";
        const projColor = "#3b82f6"; // Use default blue

        data[entry.userId].totalHours += entry.hours;

        if (!data[entry.userId].projects[projId]) {
          data[entry.userId].projects[projId] = {
            name: projName,
            hours: 0,
            color: projColor,
          };
        }
        data[entry.userId].projects[projId].hours += entry.hours;
      }
    });

    return Object.values(data)
      .filter((d) => d.totalHours > 0) // Hide users with 0 hours
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries, users, projects]);

  // 3. Group by Project -> Users and Client
  const projectReport = useMemo(() => {
    const data: Record<
      string,
      {
        project: Project;
        totalHours: number;
        clientName: string;
        users: Record<string, { user: User; hours: number }>;
      }
    > = {};

    filteredEntries.forEach((entry) => {
      const project = projects.find((p) => p.id === entry.projectId);
      if (!project) return;

      if (!data[entry.projectId]) {
        const client = clients.find((c) => c.id === project.customer_id);
        data[entry.projectId] = {
          project,
          totalHours: 0,
          clientName: client?.name || `Cliente ${project.customer_id}`,
          users: {},
        };
      }

      data[entry.projectId].totalHours += entry.hours;

      if (!data[entry.projectId].users[entry.userId]) {
        const user = users.find((u) => u.id === entry.userId);
        if (user) {
          data[entry.projectId].users[entry.userId] = { user, hours: 0 };
        }
      }
      if (data[entry.projectId].users[entry.userId]) {
        data[entry.projectId].users[entry.userId].hours += entry.hours;
      }
    });

    return Object.values(data).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries, projects, users, clients]);

  // --- Filtering Logic ---

  const filteredClients = clientReport.filter((c) =>
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTeam = teamReport.filter(
    (t) =>
      t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleExportCSV = () => {
    let csvContent = "";
    let filename = "";

    if (viewMode === "CLIENTS") {
      // CSV for Clients view
      filename = `report_clienti_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.csv`;
      csvContent = "Cliente,Ore Totali,Progetti Attivi\n";
      filteredClients.forEach((client) => {
        csvContent += `"${client.clientName}",${client.totalHours},${Object.keys(client.projects).length}\n`;
      });
    } else if (viewMode === "PROJECTS") {
      // CSV for Projects view
      filename = `report_progetti_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.csv`;
      csvContent = "Progetto,Cliente,Ore Totali\n";
      projectReport.forEach((item) => {
        csvContent += `"${item.project.name}","${item.clientName}",${item.totalHours}\n`;
      });
    } else if (viewMode === "TEAM") {
      // CSV for Team view
      filename = `report_team_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.csv`;
      csvContent = "Nome,Email,Ore Totali\n";
      filteredTeam.forEach((item) => {
        csvContent += `"${item.user.name}","${item.user.email}",${item.totalHours}\n`;
      });
    }

    // Also export detailed RAW data
    if (csvContent) {
      csvContent += "\n\nDETTAGLI\n";
      csvContent += "Data,Utente,Cliente,Progetto,Ore\n";
      filteredEntries.forEach((entry) => {
        const user = users.find((u) => u.id === entry.userId);
        const project = projects.find((p) => p.id === entry.projectId);
        const client = clients.find((c) => c.id === project?.customer_id);
        csvContent += `"${entry.date}","${user?.name || "Unknown"}","${client?.name || `Cliente ${project?.customer_id}` || ""}","${project?.name || ""}",${entry.hours}\n`;
      });
    }

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExportExcel = () => {
    let worksheet: XLSX.WorkSheet;
    let filename = "";

    if (viewMode === "CLIENTS") {
      // Excel for Clients view
      filename = `report_clienti_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.xlsx`;
      const data = filteredClients.map((client) => ({
        Cliente: client.clientName,
        "Ore Totali": client.totalHours,
        "Progetti Attivi": Object.keys(client.projects).length,
      }));
      worksheet = XLSX.utils.json_to_sheet(data);
    } else if (viewMode === "PROJECTS") {
      // Excel for Projects view
      filename = `report_progetti_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.xlsx`;
      const data = projectReport.map((item) => ({
        Progetto: item.project.name,
        Cliente: item.clientName,
        "Ore Totali": item.totalHours,
      }));
      worksheet = XLSX.utils.json_to_sheet(data);
    } else if (viewMode === "TEAM") {
      // Excel for Team view
      filename = `report_team_${periodType === "monthly" ? months[selectedDate.month - 1].label : "anno"}_${selectedDate.year}.xlsx`;
      const data = filteredTeam.map((item) => ({
        Nome: item.user.name,
        Email: item.user.email,
        "Ore Totali": item.totalHours,
      }));
      worksheet = XLSX.utils.json_to_sheet(data);
    }

    // Create workbook with main sheet
    const workbook = XLSX.utils.book_new();
    if (worksheet) {
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      // Always add detailed sheet
      const detailData = filteredEntries.map((entry) => {
        const user = users.find((u) => u.id === entry.userId);
        const project = projects.find((p) => p.id === entry.projectId);
        const client = clients.find((c) => c.id === project?.customer_id);
        return {
          Data: entry.date,
          Utente: user?.name || "Unknown",
          Cliente: client?.name || `Cliente ${project?.customer_id}` || "",
          Progetto: project?.name || "",
          Ore: entry.hours,
        };
      });
      const detailSheet = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Dettagli");

      XLSX.writeFile(workbook, filename!);
    }
  };

  // Generate year and month options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "Gennaio" },
    { value: 2, label: "Febbraio" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Aprile" },
    { value: 5, label: "Maggio" },
    { value: 6, label: "Giugno" },
    { value: 7, label: "Luglio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Settembre" },
    { value: 10, label: "Ottobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Dicembre" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Report e Analisi
          </h1>
          <p className="text-slate-500 text-sm">
            Monitora le prestazioni per cliente o team
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span className="font-medium">Periodo:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Display Unit Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setDisplayUnit("hours")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  displayUnit === "hours"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ore
              </button>
              <button
                onClick={() => setDisplayUnit("days")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  displayUnit === "days"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Giorni
              </button>
            </div>
            {/* Period Type Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setPeriodType("monthly")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  periodType === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mensile
              </button>
              <button
                onClick={() => setPeriodType("yearly")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  periodType === "yearly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Annuale
              </button>
            </div>

            {/* Month Selector (only for monthly view) */}
            {periodType === "monthly" && (
              <select
                value={selectedDate.month}
                onChange={(e) =>
                  setSelectedDate((prev) => ({
                    ...prev,
                    month: parseInt(e.target.value),
                  }))
                }
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}

            {/* Year Selector */}
            <select
              value={selectedDate.year}
              onChange={(e) =>
                setSelectedDate((prev) => ({
                  ...prev,
                  year: parseInt(e.target.value),
                }))
              }
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:justify-end md:ml-auto mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
              className="w-full md:w-auto"
            >
              Esporta CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<FileSpreadsheet size={16} />}
              onClick={handleExportExcel}
              className="w-full md:w-auto"
            >
              Esporta Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setViewMode("CLIENTS")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "CLIENTS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Building2 size={16} /> Clienti
          </button>
          <button
            onClick={() => setViewMode("PROJECTS")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "PROJECTS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Briefcase size={16} /> Progetti
          </button>
          <button
            onClick={() => setViewMode("TEAM")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "TEAM" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={16} /> Team
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Filtra report..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* CONTENT: CLIENTS VIEW */}
      {viewMode === "CLIENTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, idx) => (
            <Card
              key={idx}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Building2 size={24} />
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-slate-900">
                      {formatHours(client.totalHours, true)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Totale
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {client.clientName}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {Object.keys(client.projects).length} Progetti
                </p>

                {/* Lista progetti con percentuali e collaboratori */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
                    Progetti & Collaboratori
                  </p>
                  <div className="space-y-4">
                    {Object.values(client.projects).map((projData: any) => {
                      const percentage = Math.round(
                        (projData.hours / client.totalHours) * 100,
                      );
                      return (
                        <div key={projData.project.id} className="space-y-2">
                          {/* Progetto */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500"></div>
                              <span className="font-medium text-slate-700 truncate">
                                {projData.project.name}
                              </span>
                              <span className="text-slate-500 ml-2 flex-shrink-0">
                                {formatHours(projData.hours, true)}
                                ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Collaboratori per questo progetto */}
                          <div className="pl-4 space-y-1.5">
                            {Object.entries(projData.users).map(
                              ([userId, hours]) => {
                                const user = users.find((u) => u.id == userId);
                                const userPercentage = Math.round(
                                  ((hours as number) / projData.hours) * 100,
                                );
                                return (
                                  <div
                                    key={userId}
                                    className="flex items-center gap-2 text-xs text-slate-600"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-white shadow-sm">
                                      <span className="text-[8px] font-semibold text-blue-600">
                                        {user?.first_name?.[0]}
                                        {user?.last_name?.[0]}
                                      </span>
                                    </div>
                                    <span className="flex-1 min-w-0 truncate">
                                      {user?.name}
                                    </span>
                                    <span className="text-slate-400">·</span>
                                    <span className="text-slate-500 flex-shrink-0">
                                      {formatHours(hours, true)}
                                      ({userPercentage}%)
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CONTENT: TEAM VIEW */}
      {viewMode === "TEAM" && (
        <div className="grid grid-cols-1 gap-4">
          {filteredTeam.map((item) => {
            const isExpanded = expandedCard === item.user.id;
            return (
              <Card key={item.user.id} className="transition-all duration-200">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(item.user.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="text-sm font-semibold text-blue-600">
                        {item.user.first_name?.[0]?.toUpperCase()}
                        {item.user.last_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {item.user.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xl font-bold text-slate-900">
                        {formatHours(item.totalHours, true)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Totale Lavorato
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded / Detailed View */}
                {isExpanded && (
                  <div
                    className={`px-4 pb-6 sm:pl-[5rem] animate-in fade-in duration-200 ${!isExpanded ? "hidden md:block" : "block"}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.values(item.projects).map((proj: any, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500"></div>
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {proj.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                            {formatHours(proj.hours, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* CONTENT: PROJECTS VIEW */}
      {viewMode === "PROJECTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectReport
            .filter(
              (p) =>
                p.project.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((item) => (
              <Card
                key={item.project.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-500">
                      <Briefcase size={24} />
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-slate-900">
                        {formatHours(item.totalHours, true)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                        Totale
                      </span>
                    </div>
                  </div>

                  {/* Nome progetto e cliente */}
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    {item.project.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                    <Building2 size={14} />
                    {item.clientName}
                  </p>

                  {/* Collaboratori */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
                      Collaboratori
                    </p>
                    <div className="space-y-3">
                      {Object.values(item.users).map((userData: any) => {
                        const percentage = Math.round(
                          (userData.hours / item.totalHours) * 100,
                        );
                        return (
                          <div
                            key={userData.user.id}
                            className="flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-white shadow-sm">
                              <span className="text-[10px] font-semibold text-blue-600">
                                {userData.user.first_name?.[0]}
                                {userData.user.last_name?.[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700">
                                  {userData.user.name}
                                </span>
                                <span className="text-slate-500">
                                  {formatHours(userData.hours, true)}
                                  ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};
