import apiClient from './apiClient';
import { AxiosRequestConfig } from 'axios';

export const api = {
  get: <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => apiClient.get(url, config),

  post: <T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> => apiClient.post(url, data, config),

  put: <T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> => apiClient.put(url, data, config),

  patch: <T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> => apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => apiClient.delete(url, config),

  upload: <T = any>(url: string, formData: FormData, config: AxiosRequestConfig = {}): Promise<T> => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadPut: <T = any>(url: string, formData: FormData, config: AxiosRequestConfig = {}): Promise<T> => {
    return apiClient.put(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const buildQueryString = (params: Record<string, any>): string => {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return filtered ? `?${filtered}` : '';
};

export default api;
