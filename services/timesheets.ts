import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

export interface WorkHour {
    project: number,
    customer?: number,
    hours: number
}
 
export interface Timesheet {
    id?: number,
    day: string,
    employee: number,
    worked_hours?: WorkHour[],
    permits_hours?: number,
    illness?: boolean,
    holiday?: boolean
}

export class TimesheetsService {

    static async getTimesheetEntries(employeeId?: number, month?: number, year?: number, all_users?: boolean): Promise<any> {
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
            if (all_users) {
                url.searchParams.set('all_users', String(all_users));
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
            if (all_users) {
                noWorkedHoursUrl.searchParams.set('all_users', String(all_users));
            }
            noWorkedHoursUrl.searchParams.set('no_worked_hours', 'true');
            const noWorkedHoursResponse = await fetch(noWorkedHoursUrl.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const noWorkedHoursData = await noWorkedHoursResponse.json();
            const data = await response.json();
            console.log("data", data)
            console.log("noWorkedHoursData", noWorkedHoursData)
            return [...data, ...noWorkedHoursData];
        } catch (error) {
            console.error('Error fetching timesheet entries:', error);
            return null;
        }
    }

    static async getTimesheet(day: string): Promise<any> {
        const token = AuthService.getAccessToken();

        if (!token) return null;

        try {
            
            const url = new URL(`${backendUrl}/api/timesheets/`);
            if (day != null) {
                url.searchParams.set('day', String(day));
            }
            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Error fetching timesheet:', error);
            return null;
        }
    }

    static async createTimesheet(timesheet: Timesheet): Promise<Timesheet | null> {
        const token = AuthService.getAccessToken();
        if (!token) return null;

        try {
            
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

    static async deleteTimesheet(id: number): Promise<boolean> {
        const token = AuthService.getAccessToken();
        if (!token) return false;

        if (!id) {
            console.error('deleteTimesheet: missing id');
            return false;
        }

        try {
            const response = await fetch(
            `${backendUrl}/api/timesheets/${id}`,
            {
                method: 'DELETE',
                headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                },
            }
            );

            if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error(
                'Timesheet delete failed',
                response.status,
                text
            );
            return false;
            }

            console.log('Timesheet successfully deleted', id);
            return true;

        } catch (error) {
            console.error('Error deleting timesheet:', error);
            return false;
        }
    }

    static async deleteTimework(id: number): Promise<boolean> {
        const token = AuthService.getAccessToken();
        if (!token) return false;

        if (!id) {
            console.error('delete Timework: missing id');
            return false;
        }

        try {
            const response = await fetch(
            `${backendUrl}/api/timesheets/timeworks/${id}`,
            {
                method: 'DELETE',
                headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                },
            }
            );

            if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error(
                'Timework delete failed',
                response.status,
                text
            );
            return false;
            }

            console.log('Timework successfully deleted', id);
            return true;

        } catch (error) {
            console.error('Error deleting Timework:', error);
            return false;
        }
    }

    static async getHolidays(year: number): Promise<any[] | null> {
        const token = AuthService.getAccessToken();
        if (!token) return null;

        try {
            const url = new URL(`${backendUrl}/api/timesheets/holidays`);
            url.searchParams.set('year', String(year));

            const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });

            if (!response.ok) {
            console.error('Error fetching holidays:', response.status, response.statusText);
            return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching holidays:', error);
            return null;
        }
    }



}