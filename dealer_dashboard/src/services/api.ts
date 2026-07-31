import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchEquipment = async () => {
  const response = await api.get('/equipment');
  return response.data;
};

export const fetchKPIs = async () => {
  const response = await api.get('/analytics/kpis');
  return response.data;
};

export const fetchRecommendations = async () => {
  const response = await api.get('/ai/recommendations');
  return response.data;
};

export const fetchSites = async () => {
  const response = await api.get('/sites');
  return response.data;
};

export const fetchOperators = async () => {
  const response = await api.get('/dashboard-operators');
  return response.data;
};

export const fetchTrends = async () => {
  const response = await api.get('/analytics/trends');
  return response.data;
};

export const fetchBrief = async () => {
  const response = await api.get('/analytics/brief');
  return response.data;
};

export const fetchManagerProfile = async () => {
  const response = await api.get('/auth/profile/manager');
  return response.data;
};

export const updateManagerProfile = async (payload: Record<string, unknown>) => {
  const response = await api.put('/auth/profile/manager', payload);
  return response.data;
};

export const fetchMapMarkers = async () => {
  const response = await api.get('/live/map-markers');
  return response.data;
};

export const fetchActivity = async () => {
  const response = await api.get('/live/activity');
  return response.data;
};

export const askCopilot = async (query: string) => {
  const response = await api.post('/ai/copilot', { query });
  return response.data.reply;
};

export const fetchMaintenanceLogs = async (assetId: string) => {
  const response = await api.get(`/equipment/${assetId}/maintenance`);
  return response.data;
};

// ─── Alerts API ───
export const fetchAlerts = async (role = 'dealer') => {
  const response = await api.get(`/alerts?role=${role}`);
  return response.data;
};

export const markAlertRead = async (id: string) => {
  const response = await api.patch(`/alerts/${id}/read`);
  return response.data;
};

export const dismissAlert = async (id: string) => {
  const response = await api.patch(`/alerts/${id}/dismiss`);
  return response.data;
};

export const markAllAlertsRead = async (role = 'dealer') => {
  const response = await api.patch(`/alerts/read-all?role=${role}`);
  return response.data;
};
