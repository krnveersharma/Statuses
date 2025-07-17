const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getuser(token) {
    const res = await fetch(`${API_BASE_URL}/user/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  }