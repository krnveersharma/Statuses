const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function createIncidentUpdate(token, data) {
  const res = await fetch(`${API_BASE_URL}/incident-updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create incident update');
  return res.json();
} 