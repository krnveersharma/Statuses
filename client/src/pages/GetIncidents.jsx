import { useAuth, useOrganization } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function GetIncidentsPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const {organization}=useOrganization()

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
        if (msg.type === organization?.id+'_incident_created' || msg.type === organization?.id+'_incident_updated') {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">
            Manage and track all system incidents
          </p>
        </div>
        <Button onClick={() => navigate('/create-incident')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Incident
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-9 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {incidents?.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No incidents found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first incident report
          </p>
          <Button onClick={() => navigate('/create-incident')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Incident
          </Button>
        </div>
      )}

      {incidents?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-6 line-clamp-2">
                    {incident.title}
                  </CardTitle>
                  <Badge variant={getStatusVariant(incident.status)} className="gap-1 shrink-0">
                    {getStatusIcon(incident.status)}
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.description}
                  </p>
                  {/* <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Priority:</span>
                    <Badge variant={getPriorityVariant(incident.priority)} size="sm">
                      {incident.priority}
                    </Badge>
                  </div> */}
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(incident?.createdAt)}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={() => navigate(`/get-incident/${incident.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};