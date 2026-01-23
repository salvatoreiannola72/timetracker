import { Database } from './lib/database.types';

// Export database types for Django schema
export type AuthUser = Database['public']['Tables']['auth_user']['Row'];
export type Employee = Database['public']['Tables']['employees_employee']['Row'];
export type Customer = Database['public']['Tables']['customers_customer']['Row'];
export type ProjectDb = Database['public']['Tables']['projects_project']['Row'];
export type Timesheet = Database['public']['Tables']['timesheets_timesheet']['Row'];
export type Timework = Database['public']['Tables']['timesheets_timework']['Row'];

// Entry type enum
export enum EntryType {
  WORK = 'WORK',
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  PERMIT = 'PERMIT'
}

// User type combining auth_user and employee data
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string; // computed: first_name + last_name
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  employee_id?: number;
  hire_date?: string | null;
  job_title?: string | null;
  // Leave tracking
  vacation_days_total: number;
  vacation_days_used: number;
  vacation_days_remaining: number;
  sick_days_total: number;
  sick_days_used: number;
  sick_days_remaining: number;
  permit_hours_total: number;
  permit_hours_used: number;
  permit_hours_remaining: number;
}

// Client type (alias for Customer)
export interface Client {
  id: number;
  name: string;
}

// Project with customer_id
export interface Project {
  id: number;
  name: string;
  customer_id: number;
  customerId: number;
  active: boolean;  // alias for compatibility
}

// TimesheetEntry combines timesheet and timework for easier use in UI
export interface TimesheetEntry {
  id: number;  // timework id
  timesheet_id: number;
  employee_id: number;
  user_id: number;  // derived from employee
  userId: number;  // alias
  project_id: number | null;
  projectId: number | null;  // alias
  date: string;  // from timesheet.day
  day: string;  // alias
  hours: number;
  entry_type: EntryType;  // Type of entry (work, vacation, sick, permit)
  description?: string;
  // Legacy fields (deprecated)
  permits_hours?: number;
  illness?: boolean;
  holiday?: boolean;
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