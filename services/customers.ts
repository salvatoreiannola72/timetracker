import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;
export class CustomersService {

    static async getCustomers(): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/customers/`,
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

    static async addCustomer(name: string): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/customers/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name }),
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding customer:', error);
            return null;
        }
    }

    static async deleteCustomer(id: number): Promise<boolean> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/customers/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error deleting customer:', error);
            return false;
        }
    }

    static async updateCustomer(id: number, name: string): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/customers/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name }),
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating customer:', error);
            return null;
        }
    }
}