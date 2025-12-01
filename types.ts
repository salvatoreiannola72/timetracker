export enum Role {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  projectId: string;
  date: string; // ISO Date string YYYY-MM-DD
  hours: number;
  description: string;
}

export interface AppState {
  user: User | null;
  users: User[];
  projects: Project[];
  entries: TimesheetEntry[];
}

export interface KpiData {
  totalHours: number;
  billableHours: number;
  activeProjects: number;
  topProject: string;
}