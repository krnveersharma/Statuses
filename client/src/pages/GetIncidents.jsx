import { Card } from '../../components/ui/Card';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function GetIncidentsPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/user/get-incidents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch incidents');

      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Setup WebSocket connection
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + '://') + '/ws';
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'incident_created' || msg.type === 'incident_updated') {
          fetchIncidents();
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-muted-foreground">All Incidents</h2>
        <Button onClick={() => navigate('/create-incident')}>Create Incident</Button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.length === 0 && !loading && <div>No incidents found.</div>}
        {incidents.map((incident) => (
          <Card key={incident.id}>
            <div className="p-4">
              <div className="font-semibold">{incident.title}</div>
              <div className="text-sm text-muted-foreground">Status: {incident.status}</div>
              <Button className="mt-2" variant="outline" onClick={() => navigate(`/get-incident/${incident.id}`)}>
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
