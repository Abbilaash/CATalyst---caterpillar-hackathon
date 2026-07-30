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
