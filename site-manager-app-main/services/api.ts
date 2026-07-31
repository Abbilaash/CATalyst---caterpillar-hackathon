import { Platform } from 'react-native';
import { useSession } from '@/context/SessionContext';

// ─── SET THIS to your localtunnel URL when testing on a physical device ───
// Run: npx localtunnel --port 8000  →  copy the URL it prints, paste below
// Example: 'https://fuzzy-lion-42.loca.lt'
// Leave empty string '' to fall back to local network IP
const TUNNEL_URL = 'https://petite-squids-walk.loca.lt';

const LOCAL_IP_BASE = Platform.OS === 'android' ? 'http://10.97.244.114:8000' : 'http://localhost:8000';
export const API_BASE = TUNNEL_URL || LOCAL_IP_BASE;

export function useApi() {
  const { token } = useSession();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  };

  return { fetchWithAuth };
}
