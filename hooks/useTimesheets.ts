// hooks/useTimesheets.ts
import { useState, useCallback, useEffect } from 'react';
import { TimesheetsService, Timesheet, WorkHour } from '@/services/timesheets';
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
    projectId: number | null;
    project_id?: number | null;
    date?: string;
    day?: string;
    hours: number;
    entry_type: EntryType;
    description?: string;
    permits_hours?: number;
    illness?: boolean;
    holiday?: boolean;
  }) => {
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
          employee: filters.employeeId,
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

      // Ricarica i dati dopo l'aggiunta
      await loadTimesheets();

      return { success: true };
    } catch (err) {
      console.error('Error adding timesheet:', err);
      return { success: false, error: 'Errore durante il salvataggio' };
    }
  }, [filters.employeeId, loadTimesheets]);

  const deleteEntry = useCallback(async (entry: TimesheetEntry) => {
    try {
      console.log('Deleting entry:', entry);
      // Caso 1: è un timework (ha timesheet_id) -> cancello il timework
      if (entry.timesheet_id) {
        await TimesheetsService.deleteTimework(entry.id);
        return { success: true };
      }

      // Caso 2: non è PERMIT -> cancello direttamente il timesheet
      if (entry.entry_type !== EntryType.PERMIT) {
        await TimesheetsService.deleteTimesheet(entry.id);
        return { success: true };
      }

      // Caso 3: è PERMIT (ma non timework)
      const date = entry.date ?? entry.day;
      const existingTimesheet = await TimesheetsService.getTimesheet(date);

      if (existingTimesheet?.worked_hours?.length > 0) {
        existingTimesheet.permits_hours = 0;
        await TimesheetsService.updateTimesheet(existingTimesheet);
        return { success: true };
      }

      await TimesheetsService.deleteTimesheet(entry.id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
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
    deleteTimesheet: deleteEntry,
    updateTimesheet,
  };
};