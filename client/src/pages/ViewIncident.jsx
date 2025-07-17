import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { getuser } from '../api/getUserInfo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ViewIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userLoading, setUserLoading] = useState(true);

  const fetchUserRole = async () => {
    try {
      const token = await getToken();
      const data = await getuser(token);
      setUserRole(data.message.org.rol); 
    } catch (err) {
      console.error('Error fetching user info:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchIncident = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/user/get-incident/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch incident');

      const data = await res.json();
      setIncident(data);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchIncident();
      fetchUserRole();
    }
  }, [id]);

  if (loading) return <p className="text-gray-600">Loading incident...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!incident) return <p>No incident found.</p>;

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Incident Details</h1>
        {!userLoading && userRole === 'admin' && (
          <Button onClick={() => navigate(`/edit-incident/${id}`)}>
            Edit
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div><strong>ID:</strong> {incident.id}</div>
        <div><strong>Title:</strong> {incident.title}</div>
        <div><strong>Description:</strong> {incident.description || '-'}</div>
        <div><strong>Status:</strong> {incident.status.replace(/_/g, ' ')}</div>
        <div><strong>Started At:</strong> {formatDate(incident.started_at)}</div>
        <div><strong>Resolved At:</strong> {formatDate(incident.resolved_at)}</div>
        <div><strong>Created At:</strong> {formatDate(incident.created_at)}</div>
        <div><strong>Updated At:</strong> {formatDate(incident.updated_at)}</div>
        <div>
          <strong>Services Affected:</strong>{' '}
          {incident.linked_services?.length > 0 ? (
            <div className="ml-4">
              {incident.linked_services.map((item) => (
                <div key={item.id} className="text-sm">
                  {item.name} ({item.status})
                </div>
              ))}
            </div>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>

      {/* Logs Section */}
      {incident.logs?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Incident Logs</h2>
          <div className="space-y-3">
            {incident.logs.map((log) => {
              let parsedMessage = {};
              try {
                parsedMessage = JSON.parse(log.message);
              } catch (e) {
                parsedMessage = { message: log.message };
              }

              return (
                <div
                  key={log.id}
                  className="border p-3 rounded bg-gray-50 shadow-sm"
                >
                  <div className="text-sm text-gray-700">
                    <strong>Status:</strong> {log.status.replace(/_/g, ' ')}<br />
                    <strong>Created At:</strong> {formatDate(log.created_at)}<br />
                    <strong>By:</strong> {log.full_name || <em>Unknown</em>}
                  </div>

                  <div className="mt-2 text-sm text-gray-800">
                    <strong>Message Content:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(parsedMessage).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong>{' '}
                          {Array.isArray(value) ? value.join(', ') : value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button onClick={fetchIncident}>Refresh</Button>
      </div>
    </Card>
  );
};

export default ViewIncident;
