import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

export interface WorkHour {
    project: number,
    customer?: number,
    hours: number
}
 
export interface Timesheet {
    id: number,
    day: string,
    employee: number,
    worked_hours?: WorkHour[],
    permits_hours?: number,
    illness?: boolean,
    holiday?: boolean
}

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

    static async createTimesheet(timesheet: Timesheet): Promise<Timesheet | null> {
        const token = AuthService.getAccessToken();
        if (!token) return null;

        try {
            const url = new URL(`${backendUrl}/api/timesheets/`);
            if (timesheet.day != null) {
                url.searchParams.set('day', String(timesheet.day));
            }
            const responseExistingTimesheet = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await responseExistingTimesheet.json();
            const existingTimesheet = data[0]
            if(existingTimesheet){
                if(timesheet.worked_hours[0]){
                    existingTimesheet.worked_hours.push(timesheet.worked_hours[0])
                }
                if(timesheet.permits_hours > 0){
                    existingTimesheet.permits_hours = timesheet.permits_hours
                }
                
                return this.updateTimesheet(existingTimesheet);
            }
            const response = await fetch(`${backendUrl}/api/timesheets/`, {
                method: 'POST',
                headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                },
                body: JSON.stringify(timesheet),
            });

            // se backend risponde con errore, fetch NON va in catch automaticamente
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                console.error('createTimesheet failed', response.status, text);
                return null;
            }

            const newTimesheet = (await response.json()) as Timesheet;
            console.log('Timesheet successfully created', newTimesheet);
            return newTimesheet;
        } catch (error) {
        console.error('Error creating timesheet:', error);
        return null;
        }
    }

    static async updateTimesheet(timesheet: Timesheet): Promise<Timesheet | null> {
        const token = AuthService.getAccessToken();
        if (!token) return null;

        if (!timesheet.id) {
            console.error('updateTimesheet: missing timesheet.id');
            return null;
        }

        try {
            const response = await fetch(
            `${backendUrl}/api/timesheets/${timesheet.id}`,
            {
                method: 'PUT',
                headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                },
                body: JSON.stringify(timesheet),
            }
            );

            if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error(
                'Timesheet update failed',
                response.status,
                text
            );
            return null;
            }

            const updatedTimesheet = (await response.json()) as Timesheet;
            console.log('Timesheet successfully updated', updatedTimesheet);
            return updatedTimesheet;

        } catch (error) {
            console.error('Error updating timesheet:', error);
            return null;
        }
        }

}