import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client, Project, TimesheetEntry, AppState } from '../types';
import { supabase } from '../lib/supabase';
import { dbEntryToEntry, entryToDbInsert } from '../lib/utils';

interface StoreContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  addEntry: (entry: Omit<TimesheetEntry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'project_id'>) => Promise<void>;
  updateEntry: (entry: TimesheetEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      setUser(userData);
      
      // Load all data
      await Promise.all([
        loadUsers(),
        loadClients(),
        loadProjects(),
        loadEntries()
      ]);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');

    if (!error && data) {
      setClients(data);
    }
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');

    if (!error && data) {
      // Convert snake_case to camelCase
      const projectsWithClientId = data.map(p => ({
        ...p,
        clientId: p.client_id
      }));
      setProjects(projectsWithClientId as Project[]);
    }
  };

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      // Convert snake_case to camelCase
      const convertedEntries = data.map(dbEntryToEntry);
      setEntries(convertedEntries);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
      }

      // If email confirmation is required, user won't be logged in yet
      // The user profile will be created via database trigger or separate function
      // For now, we'll create it manually when they confirm and log in
      if (data.user && data.session) {
        // User is immediately logged in (email confirmation disabled)
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: 'USER'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        await loadUserProfile(data.user.id);
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

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(client as any)
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          email: client.email,
          phone: client.phone,
          vat_number: client.vat_number,
          address: client.address,
          notes: client.notes,
          status: client.status
        } as any)
        .eq('id', client.id);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === client.id ? client : c));
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  const addEntry = async (entry: Omit<TimesheetEntry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'project_id'>) => {
    if (!user) return;

    try {
      const dbEntry = entryToDbInsert({
        ...entry,
        userId: user.id,
        projectId: entry.projectId || (entry as any).project_id,
        user_id: user.id,
        project_id: entry.projectId || (entry as any).project_id,
      } as any);

      const { data, error } = await supabase
        .from('timesheet_entries')
        .insert(dbEntry as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newEntry = dbEntryToEntry(data);
        setEntries(prev => [newEntry, ...prev]);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const updateEntry = async (entry: TimesheetEntry) => {
    try {
      const dbEntry = entryToDbInsert(entry);

      const { error } = await supabase
        .from('timesheet_entries')
        .update(dbEntry as any)
        .eq('id', entry.id);

      if (error) throw error;

      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timesheet_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const projectWithClientId = {
          ...data,
          clientId: data.client_id
        };
        setProjects(prev => [...prev, projectWithClientId as Project]);
      }
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          client_id: project.client_id || project.clientId,
          color: project.color,
          status: project.status
        } as any)
        .eq('id', project.id);

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
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
      updateEntry,
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