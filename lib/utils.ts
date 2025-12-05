import { Database } from './database.types';
import { TimesheetEntry, Timesheet, Timework, EntryType } from '../types';

// Convert database timework + timesheet to app TimesheetEntry format
export function dbToEntry(
    timework: Database['public']['Tables']['timesheets_timework']['Row'],
    timesheet: Database['public']['Tables']['timesheets_timesheet']['Row'],
    employee_user_id: number
): TimesheetEntry {
    return {
        id: timework.id,
        timesheet_id: timework.timesheet_id,
        employee_id: timesheet.employee_id,
        user_id: employee_user_id,
        userId: employee_user_id,
        project_id: timework.project_id,
        projectId: timework.project_id,
        date: timesheet.day,
        day: timesheet.day,
        hours: timework.hours,
        entry_type: EntryType.WORK, // Default to WORK for existing entries
        permits_hours: timesheet.permits_hours,
        illness: timesheet.illness,
        holiday: timesheet.holiday,
    };
}

// Helper to combine auth_user first_name and last_name
export function formatUserName(first_name: string, last_name: string): string {
    return `${first_name} ${last_name}`.trim();
}
