const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchIncidents(token) {
  const res = await fetch(`${API_BASE_URL}/incidents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function createIncident(token, data) {
  const res = await fetch(`${API_BASE_URL}/admin/create-incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create incident');
  return res.json();
}

export async function fetchIncidentById(token, id) {
  const res = await fetch(`${API_BASE_URL}/user/get-incident/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch incident');
  return res.json();
} 