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
}