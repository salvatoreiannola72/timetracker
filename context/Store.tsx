import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, Project, TimesheetEntry, AppState } from '../types';
import { MOCK_USERS, MOCK_PROJECTS, MOCK_ENTRIES } from '../constants';

interface StoreContextType extends AppState {
  login: (email: string) => boolean;
  logout: () => void;
  addEntry: (entry: Omit<TimesheetEntry, 'id'>) => void;
  updateEntry: (entry: TimesheetEntry) => void;
  deleteEntry: (id: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  isAuthenticated: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users] = useState<User[]>(MOCK_USERS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [entries, setEntries] = useState<TimesheetEntry[]>(MOCK_ENTRIES);

  // Simulate persistent login for dev convenience
  useEffect(() => {
    const savedUser = localStorage.getItem('chrono_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string): boolean => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('chrono_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chrono_user');
  };

  const addEntry = (entry: Omit<TimesheetEntry, 'id'>) => {
    const newEntry: TimesheetEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const updateEntry = (updatedEntry: TimesheetEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
    };
    setProjects(prev => [...prev, newProject]);
  };

  return (
    <StoreContext.Provider value={{
      user,
      users,
      projects,
      entries,
      login,
      logout,
      addEntry,
      updateEntry,
      deleteEntry,
      addProject,
      isAuthenticated: !!user
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