import { UserFormData } from "../types";
import { AuthService } from '@/services/auth';
const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;


export class UsersService {
  static async addUser(payload: UserFormData) {
    const token = AuthService.getAccessToken();

    const response = await fetch(`${backendUrl}/api/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(JSON.stringify(errorData ?? { detail: 'User not created' }));
    }

    return response.json();
  }

  static async updateUser(id: number, payload: Partial<UserFormData>) {
    const token = AuthService.getAccessToken();

    const response = await fetch(`${backendUrl}/api/users/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(JSON.stringify(errorData ?? { detail: 'User not updated' }));
    }

    return response.json();
  }
}