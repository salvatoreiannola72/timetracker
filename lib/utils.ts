import { Database } from './database.types';
import { TimesheetEntry } from '../types';

// Convert Supabase database row to app TimesheetEntry format
export function dbEntryToEntry(dbEntry: Database['public']['Tables']['timesheet_entries']['Row']): TimesheetEntry {
    return {
        ...dbEntry,
        userId: dbEntry.user_id,
        projectId: dbEntry.project_id,
    };
}

// Convert app TimesheetEntry to Supabase insert format
export function entryToDbInsert(entry: Omit<TimesheetEntry, 'id' | 'created_at' | 'updated_at'>): Database['public']['Tables']['timesheet_entries']['Insert'] {
    return {
        user_id: entry.userId || entry.user_id,
        project_id: entry.projectId || entry.project_id,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
    };
}
