const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('soar_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.isFormData
    ? { ...(localStorage.getItem('soar_token') ? { Authorization: `Bearer ${localStorage.getItem('soar_token')}` } : {}) }
    : { ...getAuthHeaders(), ...(options.headers || {}) };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  if (response.status === 204) {
    return null;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

// Authentication
export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Authentication failed');
  }
  if (data.access_token) {
    localStorage.setItem('soar_token', data.access_token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem('soar_token');
}

export function fetchCurrentUser() {
  return request('/me');
}

// SOC Stats
export function fetchStats() {
  return request('/stats');
}

// Alerts
export function fetchAlerts(params = {}) {
  const query = new URLSearchParams();
  if (params.severity) query.append('severity', params.severity);
  if (params.category) query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/alerts${qStr}`);
}

export function fetchAlert(id) {
  return request(`/alerts/${id}`);
}

export function createAlert(alertData) {
  return request('/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

export function simulateAlert(scenario = 'phishing') {
  return request(`/alerts/simulate?scenario=${encodeURIComponent(scenario)}`, {
    method: 'POST',
  });
}

export function deleteAlert(id) {
  return request(`/alerts/${id}`, {
    method: 'DELETE',
  });
}

export async function importAlertsFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/alerts/import', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

// Incidents
export function fetchIncidents(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status_filter', params.status);
  if (params.severity) query.append('severity', params.severity);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return request(`/incidents${qStr}`);
}

export function fetchIncident(id) {
  return request(`/incidents/${id}`);
}

export function createIncident(incidentData) {
  return request('/incidents', {
    method: 'POST',
    body: JSON.stringify(incidentData),
  });
}

export function updateIncident(id, updateData) {
  return request(`/incidents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

export function deleteIncident(id) {
  return request(`/incidents/${id}`, {
    method: 'DELETE',
  });
}

export function triggerPlaybookForIncident(incidentId, playbookId) {
  return request(`/incidents/${incidentId}/trigger_playbook?playbook_id=${playbookId}`, {
    method: 'POST',
  });
}

// Playbooks
export function fetchPlaybooks() {
  return request('/playbooks');
}

export function fetchPlaybook(id) {
  return request(`/playbooks/${id}`);
}

export function createPlaybook(playbookData) {
  return request('/playbooks', {
    method: 'POST',
    body: JSON.stringify(playbookData),
  });
}

export function updatePlaybook(id, updateData) {
  return request(`/playbooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

export function deletePlaybook(id) {
  return request(`/playbooks/${id}`, {
    method: 'DELETE',
  });
}

export function runPlaybook(playbookId, incidentId = null) {
  const endpoint = incidentId
    ? `/playbooks/${playbookId}/execute?incident_id=${incidentId}`
    : `/playbooks/${playbookId}/execute`;
  return request(endpoint, {
    method: 'POST',
  });
}

// Executions & Approvals
export function fetchExecutions() {
  return request('/executions');
}

export function fetchExecution(id) {
  return request(`/executions/${id}`);
}

export function fetchPendingApprovals() {
  return request('/approvals/pending');
}

export function approveExecution(id) {
  return request(`/executions/${id}/approve`, {
    method: 'POST',
  });
}

export function rejectExecution(id) {
  return request(`/executions/${id}/reject`, {
    method: 'POST',
  });
}
