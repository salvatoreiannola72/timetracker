import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

export class TimesheetsService {

    static async getTimesheetEntries(employeeId: number, month?: number, year?: number): Promise<any> {
        const token = AuthService.getAccessToken();

        if (!token) return null;

        try {
            
            const url = new URL(`${backendUrl}/api/timesheets/timeworks`);
            if (employeeId != null) {
                url.searchParams.set('employee', String(employeeId));
            }
            if (month != null) {
                url.searchParams.set('month', String(month));
            }
            if (year != null) {
                url.searchParams.set('year', String(year));
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const noWorkedHoursUrl = new URL(`${backendUrl}/api/timesheets/`);
            if (employeeId != null) {
                noWorkedHoursUrl.searchParams.set('employee', String(employeeId));
            }
            if (month != null) {
                noWorkedHoursUrl.searchParams.set('month', String(month));
            }
            if (year != null) {
                noWorkedHoursUrl.searchParams.set('year', String(year));
            }
            noWorkedHoursUrl.searchParams.set('no_worked_hours', 'true');
            const noWorkedHoursResponse = await fetch(noWorkedHoursUrl.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const noWorkedHoursData = await noWorkedHoursResponse.json();
            const data = await response.json();
            return [...data, ...noWorkedHoursData];
        } catch (error) {
            console.error('Error fetching timesheet entries:', error);
            return null;
        }
    }
}