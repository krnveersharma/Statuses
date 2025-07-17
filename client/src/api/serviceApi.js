const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchServices(token) {
  const res = await fetch(`${API_BASE_URL}/user/get-services`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export async function createService(token, data) {
  const res = await fetch(`${API_BASE_URL}/admin/create-service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create service');
  return res.json();
} 