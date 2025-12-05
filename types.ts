import { Database } from './lib/database.types';

// Export database types
export type User = Database['public']['Tables']['users']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];

// Project with both client (legacy) and client_id
type DbProject = Database['public']['Tables']['projects']['Row'];
export interface Project extends DbProject {
  clientId: string;  // alias for client_id
}

// TimesheetEntry with both snake_case and camelCase for compatibility
type DbEntry = Database['public']['Tables']['timesheet_entries']['Row'];
export interface TimesheetEntry extends DbEntry {
  userId: string;  // alias for user_id
  projectId: string;  // alias for project_id
}

export enum Role {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR'
}

export interface AppState {
  user: User | null;
  users: User[];
  clients: Client[];
  projects: Project[];
  entries: TimesheetEntry[];
}

export interface KpiData {
  totalHours: number;
  billableHours: number;
  activeProjects: number;
  topProject: string;
}