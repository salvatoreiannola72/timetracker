import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;
export class CustomersService {

    static async getCustomers(): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/customers`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            return null;
        }
    }
}