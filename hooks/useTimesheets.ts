// hooks/useTimesheets.ts
import { useState, useCallback, useEffect } from 'react';
import { TimesheetsService, Timesheet } from '@/services/timesheets';
import { EntryType } from '@/types';

interface TimesheetFilters {
  employeeId: number;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

interface TimesheetEntry {
  id: number | string;
  userId: number;
  user_id: number;
  projectId: number | null;
  project_id?: number | null;
  date: string;
  day?: string;
  hours: number;
  entry_type: EntryType;
  description?: string;
  permits_hours: number;
  illness: boolean;
  holiday: boolean;
  timesheet_id?: number;
}

export const useTimesheets = (filters: TimesheetFilters) => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEntryType = (item: any): EntryType => {
    if (item.permits_hours !== null && item.permits_hours > 0) {
      return EntryType.PERMIT;
    }
    if (item.holiday) {
      return EntryType.VACATION;
    }
    if (item.illness) {
      return EntryType.SICK_LEAVE;
    }
    return EntryType.WORK;
  };

  const loadTimesheets = useCallback(async () => {
    if (!filters.employeeId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await TimesheetsService.getTimesheetEntries(
        filters.employeeId,
        filters.month,
        filters.year
      );

      const transformedTimesheets: TimesheetEntry[] = data?.flatMap((item: any) => {
        const baseTimesheet: TimesheetEntry = {
          id: item.id,
          userId: filters.employeeId,
          user_id: filters.employeeId,
          projectId: item.project_id,
          project_id: item.project_id,
          date: item.day,
          day: item.day,
          hours: item.hours || 0,
          entry_type: getEntryType(item),
          description: item.description,
          permits_hours: item.permits_hours || 0,
          illness: item.illness || false,
          holiday: item.holiday || false,
          timesheet_id: item.timesheet_id,
        };

        // Se ci sono ore di permesso, crea un'entry separata
        if (item.permits_hours !== null && item.permits_hours > 0) {
          
          const permitEntry: TimesheetEntry = {
            id: `${item.id}`,
            userId: filters.employeeId,
            user_id: filters.employeeId,
            projectId: null,
            project_id: null,
            date: item.day,
            day: item.day,
            hours: 0,
            entry_type: EntryType.PERMIT,
            permits_hours: item.permits_hours,
            illness: false,
            holiday: false,
          };
          
          return [permitEntry];
        }

        return [baseTimesheet];
      }) || [];

      setTimesheets(transformedTimesheets);
    } catch (err) {
      console.error('Error loading timesheets:', err);
      setError('Errore nel caricamento dei timesheet');
    } finally {
      setLoading(false);
    }
  }, [filters.employeeId, filters.month, filters.year]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  const addTimesheet = useCallback(async (entry: {
    projectId: string | null;
    date: string;
    hours: number;
    entry_type: EntryType;
    description?: string;
    permits_hours?: number;
    illness?: boolean;
    holiday?: boolean;
  }) => {
    try {
      const workHour = entry.entry_type === EntryType.WORK && entry.projectId ? [{
        project: parseInt(entry.projectId),
        customer: null,
        hours: entry.hours
      }] : [];

      const timesheet: Timesheet = {
        id: null,
        day: entry.date,
        employee: filters.employeeId,
        worked_hours: workHour,
        permits_hours: entry.permits_hours || 0,
        illness: entry.illness || false,
        holiday: entry.holiday || false
      };

      await TimesheetsService.createTimesheet(timesheet);
      
      // Ricarica i dati dopo l'aggiunta
      await loadTimesheets();
      
      return { success: true };
    } catch (err) {
      console.error('Error adding timesheet:', err);
      return { success: false, error: 'Errore durante il salvataggio' };
    }
  }, [filters.employeeId, loadTimesheets]);

  const deleteTimesheet = useCallback(async (id: number | string) => {
    try {
      // Se l'ID contiene "-permit", è un'entry virtuale, non cancellare
      if (typeof id === 'string' && id.includes('-permit')) {
        console.log('Cannot delete virtual permit entry directly');
        return { success: false, error: 'Impossibile cancellare entry di permesso separatamente' };
      }

      await TimesheetsService.deleteTimesheet(id as number);
      
      // Ricarica i dati dopo la cancellazione
      await loadTimesheets();
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting timesheet:', err);
      return { success: false, error: 'Errore durante la cancellazione' };
    }
  }, [loadTimesheets]);

  const updateTimesheet = useCallback(async (
    timesheet: Timesheet
  ) => {
    try {
      await TimesheetsService.updateTimesheet(timesheet);
      
      // Ricarica i dati dopo l'aggiornamento
      await loadTimesheets();
      
      return { success: true };
    } catch (err) {
      console.error('Error updating timesheet:', err);
      return { success: false, error: 'Errore durante l\'aggiornamento' };
    }
  }, [loadTimesheets]);

  return {
    timesheets,
    loading,
    error,
    reload: loadTimesheets,
    addTimesheet,
    deleteTimesheet,
    updateTimesheet,
  };
};