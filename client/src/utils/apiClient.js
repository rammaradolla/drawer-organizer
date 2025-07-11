import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use(async (config) => {
  // Check for impersonation token first
  const impersonationToken = localStorage.getItem('impersonation_token');
  if (impersonationToken) {
    config.headers.Authorization = `Bearer ${impersonationToken}`;
    return config;
  }
  // Otherwise, use Supabase session token
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient; 