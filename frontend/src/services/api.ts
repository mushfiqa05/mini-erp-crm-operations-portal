import { ApiResponse } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `API request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error occurred.'
    };
  }
}
