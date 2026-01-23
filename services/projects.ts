import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

export class ProjectsService {
    static async getProjects(): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/projects`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return null;
        }
    }

    static async addProject(name: string, clientId: number): Promise<any> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/projects/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, customer: clientId }),
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding project:', error);
            return null;
        }
    }

    static async deleteProject(id: number): Promise<boolean> {
        const token = AuthService.getAccessToken();

        try {
            const response = await fetch(
                `${backendUrl}/api/projects/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    } 
    
    static async updateProject(id: number, name: string, clientId: number, active: boolean): Promise<any> {
        const token = AuthService.getAccessToken();
        try {
            const response = await fetch(
                `${backendUrl}/api/projects/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, customer: clientId, active: active }),
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating project:', error);
            return null;
        }
    }
}