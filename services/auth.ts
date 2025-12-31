import { jwtDecode } from "jwt-decode";

const backendUrl = import.meta.env.VITE_TIMETRACKER_BACKEND_URL;

interface JWTPayload {
    user_id: number;
    username: string;
    email: string;
    exp: number;
    iat: number;
}

interface LoginResponse {
    access: string;
    refresh: string;
}

export class AuthService {
    private static ACCESS_TOKEN_KEY = 'access_token';
    private static REFRESH_TOKEN_KEY = 'refresh_token';

    static async login(username: string, password: string): Promise<LoginResponse> {
        console.log('Logging in with backend URL:', backendUrl);
        const response = await fetch(`${backendUrl}/api/auth/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data: LoginResponse = await response.json();

        localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refresh);

        return data;
    }

    static logout(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    static getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwtDecode<JWTPayload>(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch {
            return true;
        }
    }

    static isLoginActive(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;
        return !this.isTokenExpired(token);
    }

    static getCurrentUser(): JWTPayload | null {
        const token = this.getAccessToken();
        if (!token) return null;
        if (this.isTokenExpired(token)) return null;

        try {
            return jwtDecode<JWTPayload>(token);
        } catch {
            return null;
        }
    }

    static async refreshToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${backendUrl}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access);
            return true;
        } catch {
            return false;
        }
    }

    static async changePassword(
        oldPassword: string,
        newPassword1: string,
        newPassword2: string
    ): Promise<{ success: boolean; error?: string }> {
        const token = this.getAccessToken();
        if (!token) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${backendUrl}/api/auth/change_password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password1: newPassword1,
                    new_password2: newPassword2,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.detail || 'Password change failed' };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Password change failed' };
        }
    }

    static async getEmployeeFromCurrentUser(): Promise<any> {
        const token = this.getAccessToken();
        const user = this.getCurrentUser();

        if (!token || !user) return null;

        try {
            const response = await fetch(
                `${backendUrl}/api/employees/?user=${user.user_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return data[0] || null;
        } catch {
            return null;
        }
    }

    // Helper to add auth header to fetch requests
    static getAuthHeaders(): HeadersInit {
        const token = this.getAccessToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

}