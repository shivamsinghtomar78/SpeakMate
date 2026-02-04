const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface APIError {
    message: string;
    status?: number;
    code?: string;
}

export class APIClient {
    static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    message: errorData.detail || errorData.message || 'An unexpected error occurred',
                    status: response.status,
                    code: errorData.code
                } as APIError;
            }

            return await response.json() as T;
        } catch (error) {
            console.error(`API Request Failed: ${url}`, error);
            throw error as APIError;
        }
    }

    static get<T>(endpoint: string, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    static post<T>(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}
