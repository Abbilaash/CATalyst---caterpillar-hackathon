export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (res.ok) return res.json() as Promise<T>;
  const body = await res.json().catch(() => null);
  throw new Error(body?.detail || `Request failed (${res.status})`);
}

export function login(email: string, password: string) {
  return request<{ access_token: string; token_type: string }>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchDashboardData(managerId: string = 'mgr-01') {
  return request(`/api/v1/manager/dashboard/${managerId}`);
}

export async function fetchAssets(managerId: string = 'mgr-01') {
  return request(`/api/v1/manager/assets/${managerId}`);
}

export async function fetchOperations(managerId: string = 'mgr-01') {
  return request(`/api/v1/manager/operations/${managerId}`);
}

export async function fetchSchedulingData(managerId: string = 'mgr-01') {
  return request(`/api/v1/manager/scheduling-data/${managerId}`);
}

export async function fetchMaintenanceLogs(assetId: string) {
  return request(`/api/v1/equipment/${assetId}/maintenance`);
}

export async function assignOperator(payload: {
  asset_id: string;
  operator_id: string;
  job_title: string;
  start_date: string;
  start_time: string;
  total_hours: number;
  site_id: string;
}) {
  return request('/api/v1/manager/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function completeOperation(assignmentId: string) {
  return request(`/api/v1/manager/operations/${assignmentId}/complete`, {
    method: 'POST'
  });
}

export async function reassignOperation(assignmentId: string, operatorId: string) {
  return request(`/api/v1/manager/operations/${assignmentId}/reassign?operator_id=${encodeURIComponent(operatorId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function deleteOperation(assignmentId: string) {
  return request(`/api/v1/manager/operations/${assignmentId}`, {
    method: 'DELETE'
  });
}

export const fetchManagerProfile = (managerId = 'mgr-01') => request(`/api/v1/manager/profile/${managerId}`);
export const fetchManagerSites = (managerId = 'mgr-01') => request(`/api/v1/manager/sites/${managerId}`);
export const fetchQueuedTasks = (managerId = 'mgr-01') => request(`/api/v1/manager/auto-assign/queue/${managerId}`);
export const fetchInterruptedOperations = (managerId = 'mgr-01') => request(`/api/v1/manager/operations/interrupted/${managerId}`);
export const resumeInterruptedOperation = (id: string) => request(`/api/v1/manager/operations/interrupted/${id}/resume`, { method: 'POST' });
export const cancelInterruptedOperation = (id: string) => request(`/api/v1/manager/operations/interrupted/${id}/cancel`, { method: 'POST' });
export const checkInterruptions = (managerId = 'mgr-01') => request(`/api/v1/manager/assets/check-interruptions/${managerId}`, { method: 'POST' });
export const previewAutoAssignments = (payload: unknown) => request('/api/v1/manager/auto-assign/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const commitAutoAssignments = (payload: unknown) => request('/api/v1/manager/auto-assign/commit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const queueAutoAssignments = (payload: unknown) => request('/api/v1/manager/auto-assign/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const cancelQueuedTask = (id: string) => request(`/api/v1/manager/auto-assign/queue/${id}`, { method: 'DELETE' });

export async function reportIssue(payload: { asset_id: string; problem_details: string }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/operator/report-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to report issue');
  return res.json();
}
