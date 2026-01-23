import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client, Project, TimesheetEntry, AppState, EntryType } from '../types';
import { supabase } from '../lib/supabase';
import { dbToEntry, formatUserName } from '../lib/utils';
import { AuthService } from '@/services/auth';
import { EmployeesService } from '@/services/employees'
import { CustomersService } from '@/services/customers';
import { ProjectsService } from '@/services/projects';
import { TimesheetsService, Timesheet, WorkHour } from '@/services/timesheets';

interface StoreContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  addEntry: (entry: Omit<TimesheetEntry, 'id' | 'timesheet_id' | 'employee_id' | 'user_id' | 'userId'>) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for existing session and load data on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if we have a valid JWT token
      if (AuthService.isLoginActive()) {
        const jwtUser = AuthService.getCurrentUser();
        if (jwtUser) {
          await loadUserProfile(jwtUser.user_id);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: number) => {
    try {
      // Fetch user from auth_user table by user ID
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user found');
      }
      const employeeData = await AuthService.getEmployeeFromCurrentUser();
      console.log("employeeData: ", employeeData)
      if (!employeeData) {
        throw new Error('Employee not found');
      }

      const employee = employeeData.employees_employee?.[0];

      const userProfile: User = {
        id: employeeData.user_id,
        username: employeeData.username,
        email: employeeData.email,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        name: formatUserName(employeeData.first_name, employeeData.last_name),
        is_staff: currentUser.is_staff,
        is_superuser: employeeData.is_superuser,
        is_active: employeeData.is_active,
        employee_id: employeeData?.id,
        hire_date: employeeData?.hire_date,
        job_title: employeeData?.job_title,
        // Leave tracking - default values for now, will be from DB later
        vacation_days_total: 22,
        vacation_days_used: 0,
        vacation_days_remaining: 22,
        sick_days_total: 180,
        sick_days_used: 0,
        sick_days_remaining: 180,
        permit_hours_total: 32,
        permit_hours_used: 0,
        permit_hours_remaining: 32,
      };

      setUser(userProfile);

      // Load all data
      await Promise.all([
        loadUsers(),
        loadClients(),
        loadProjects()
      ]);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If user doesn't exist in database, logout
      AuthService.logout();
      throw error;
    }
  };

  const loadUsers = async () => {
    const employeesData = await EmployeesService.getEmployees();

    if (!employeesData) {
      throw new Error('Employees not found');
    }
   
      const usersData: User[] = employeesData.map(u => {
        return {
          id: u.user_id,
          username: u.username,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          name: formatUserName(u.first_name, u.last_name),
          is_staff: u.is_staff,
          is_superuser: u.is_superuser,
          is_active: u.is_active,
          employee_id: u.id,
          hire_date: u.hire_date,
          job_title: u.job_title,
          // Leave tracking - default values for now, will be from DB later
          vacation_days_total: 22,
          vacation_days_used: 0,
          vacation_days_remaining: 22,
          sick_days_total: 180,
          sick_days_used: 0,
          sick_days_remaining: 180,
          permit_hours_total: 32,
          permit_hours_used: 0,
          permit_hours_remaining: 32,
        };
      });
      setUsers(usersData);
    
  };

  const loadClients = async () => {
    const data = await CustomersService.getCustomers();

    if (data) {
      setClients(data);
    }
  };

  const loadProjects = async () => {
    const data = await ProjectsService.getProjects();

    if (data) {
      const projectsData: Project[] = data.map(p => ({
        ...p,
        customerId: p.customer,
        customer_id: p.customer
      }));
      setProjects(projectsData);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use Django backend for authentication
      await AuthService.login(username, password);

      // Get user info from JWT token
      const jwtUser = AuthService.getCurrentUser();
      if (!jwtUser) {
        return false;
      }

      // Load user profile from database
      await loadUserProfile(jwtUser.user_id);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      AuthService.logout();
      setUser(null);
      setUsers([]);
      setClients([]);
      setProjects([]);
      setEntries([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Split name into first and last
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create auth_user record
        const { data: authUser, error: authUserError } = await supabase
          .from('auth_user')
          .insert({
            username: email.split('@')[0],
            email: email,
            first_name: firstName,
            last_name: lastName,
            password: 'managed_by_supabase_auth', // Placeholder
            is_staff: false,
            is_superuser: false,
            is_active: true,
          })
          .select()
          .single();

        if (authUserError) {
          console.error('Error creating auth_user:', authUserError);
          return { success: false, error: 'Failed to create user profile' };
        }

        // Create employee record
        const { error: employeeError } = await supabase
          .from('employees_employee')
          .insert({
            user_id: authUser.id,
            hire_date: null,
            job_title: null,
          });

        if (employeeError) {
          console.error('Error creating employee:', employeeError);
          return { success: false, error: 'Failed to create employee profile' };
        }

        // If immediately logged in (no email confirmation)
        if (data.session) {
          await loadUserProfile(data.user.id);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message || 'Failed to send reset email' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { success: false, error: error.message || 'Failed to update password' };
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      const data = await CustomersService.addCustomer(client.name);

      if (!data) throw new Error('Client not created');

      if (data) {
        setClients(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = async (client: Client) => {
    try {
      const data = await CustomersService.updateCustomer(client.id, client.name);

      if (!data) throw new Error('Client not updated');

      setClients(prev => prev.map(c => c.id === client.id ? data : c));
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: number) => {
    try {
      const data = await CustomersService.deleteCustomer(id);

      if (!data) throw new Error('Client not deleted');

      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  const addEntry = async (
    entry: Omit<TimesheetEntry, 'id' | 'timesheet_id' | 'employee_id' | 'user_id' | 'userId'>
  ) => {
    if (!user?.employee_id) return;

    try {
      const day = entry.date ?? entry.day;

      const permits = entry.permits_hours ?? 0;
      const illness = entry.illness ?? false;
      const holiday = entry.holiday ?? false;

      const hasNoWorkedHours = permits > 0 || illness || holiday;

      const newWorkHour: WorkHour | null = hasNoWorkedHours
        ? null
        : {
            project: entry.project_id ?? entry.projectId,
            customer: null,
            hours: entry.hours,
          };

      const existing = await TimesheetsService.getTimesheet(day);

      // Se non esiste -> CREATE
      if (!existing) {
        const payload: Timesheet = {
          day,
          employee: user.employee_id,
          worked_hours: newWorkHour ? [newWorkHour] : [],
          permits_hours: illness || holiday ? 0 : permits,
          illness,
          holiday,
        };

        const created = await TimesheetsService.createTimesheet(payload);
        if (!created) throw new Error('Timesheet not created');
        return;
      }

      // Se esiste -> UPDATE
      const next: Timesheet = {
        ...existing,
        illness,
        holiday,
      };

      // Se illness/holiday => azzera tutto
      if (illness || holiday) {
        next.permits_hours = 0;
        next.worked_hours = [];
      } else {
        // Se permits > 0 => set permits
        if (permits > 0) next.permits_hours = permits;

        // Se c’è una workHour nuova => append
        if (newWorkHour) {
          next.worked_hours = [...(existing.worked_hours ?? []), newWorkHour];
        }
      }

      await TimesheetsService.updateTimesheet(next);
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (entry: TimesheetEntry) => {
    try {
      // Caso 1: è un timework (ha timesheet_id) -> cancello il timework
      if (entry.timesheet_id) {
        await TimesheetsService.deleteTimework(entry.id);
        return;
      }

      // Caso 2: non è PERMIT -> cancello direttamente il timesheet
      if (entry.entry_type !== EntryType.PERMIT) {
        await TimesheetsService.deleteTimesheet(entry.id);
        return;
      }

      // Caso 3: è PERMIT (ma non timework)
      const date = entry.date ?? entry.day;
      const existingTimesheet = await TimesheetsService.getTimesheet(date);

      if (existingTimesheet?.worked_hours?.length > 0) {
        existingTimesheet.permits_hours = 0;
        await TimesheetsService.updateTimesheet(existingTimesheet);
        return;
      }

      await TimesheetsService.deleteTimesheet(entry.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };


  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      const data = await ProjectsService.addProject(project.name, project.customerId!);

      if (!data) throw new Error('Project not created');

      setProjects(prev => [...prev, {
        ...data,
        customerId: data.customer,
        customer_id: data.customer
      }]);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const data = await ProjectsService.updateProject(project.id, project.name, project.customerId!, project.active);

      if (!data) throw new Error('Project not updated');

      setProjects(prev => prev.map(p => p.id === project.id ? {
        ...data,
        customerId: data.customer,
        customer_id: data.customer
      } : p));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const { error } = await supabase
        .from('projects_project')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{
      user,
      users,
      clients,
      projects,
      entries,
      login,
      logout,
      signUp,
      resetPassword,
      updatePassword,
      addEntry,
      deleteEntry,
      addProject,
      updateProject,
      deleteProject,
      addClient,
      updateClient,
      deleteClient,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
