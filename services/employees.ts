import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

export class EmployeesService {

    static async getEmployees(): Promise<any> {
        const token = AuthService.getAccessToken();
        const user = AuthService.getCurrentUser();

        console.log('Fetching employees');

        if (!token || !user) return null;

        try {
            const response = await fetch(
                `${backendUrl}/api/employees`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return data || null;
        } catch {
            return null;
        }
    }
}