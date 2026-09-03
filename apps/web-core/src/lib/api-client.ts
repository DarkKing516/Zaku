import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private readonly client: AxiosInstance;

  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL) {
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
      }
      return config;
    });
  }

  async get<T>(url: string): Promise<T> {
    const { data } = await this.client.get<{ success: true; data: T }>(url);
    if (!data.success) {
      throw new Error('API error');
    }
    return data.data;
  }
}
