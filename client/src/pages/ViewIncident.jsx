import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { getuser } from '../api/getUserInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  RefreshCw, 
  Calendar, 
  User, 
  Server, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Activity
} from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Mock data for demonstration (remove when using real API)
const mockIncident = {
  id: 'INC-2024-001',
  title: 'Database Connection Issues',
  description: 'Multiple users reporting timeout errors when accessing the application. Database connections are being dropped intermittently.',
  status: 'in_progress',
  started_at: '2024-01-15T10:30:00Z',
  resolved_at: null,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:45:00Z',
  linked_services: [
    { id: 1, name: 'User Authentication Service', status: 'degraded' },
    { id: 2, name: 'Main Database', status: 'down' },
    { id: 3, name: 'API Gateway', status: 'operational' }
  ],
  logs: [
    {
      id: 1,
      status: 'investigating',
      created_at: '2024-01-15T10:30:00Z',
      full_name: 'John Doe',
      message: JSON.stringify({
        action: 'Initial investigation started',
        details: 'Checking database connection logs',
        affected_users: ['user1', 'user2', 'user3']
      })
    },
    {
      id: 2,
      status: 'in_progress',
      created_at: '2024-01-15T11:15:00Z',
      full_name: 'Jane Smith',
      message: JSON.stringify({
        action: 'Root cause identified',
        details: 'Database connection pool exhaustion',
        next_steps: 'Increasing connection pool size'
      })
    },
    {
      id: 3,
      status: 'in_progress',
      created_at: '2024-01-15T14:45:00Z',
      full_name: 'Mike Johnson',
      message: JSON.stringify({
        action: 'Mitigation deployed',
        details: 'Increased connection pool from 50 to 100 connections',
        monitoring: 'Observing system performance'
      })
    }
  ]
};

const ViewIncident = () => {
  const { id } = useParams();
  const wsRef = useRef(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchIncident();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log("id is: ", id);
      fetchIncident();
      fetchUserRole();
      
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + '://') + '/ws';
      const ws = new window.WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("event triggered: ", event.data);
          if (msg.type === organization?.id + '_incident_updated_' + id) {
            console.log("edit event triggered 2");
            fetchIncident();
            fetchUserRole();
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
    }
  }, [id, organization?.id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'investigating':
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
      case 'investigating':
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

  const getServiceStatusVariant = (status) => {
    switch (status) {
      case 'operational':
        return 'secondary';
      case 'degraded':
        return 'default';
      case 'down':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

      if (loading) {
        return (
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        );
      }

      if (error) {
        return (
          <div className="container mx-auto p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        );
      }

      if (!incident) {
        return (
          <div className="container mx-auto p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No incident found with ID: {id}</AlertDescription>
            </Alert>
          </div>
        );
      }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/get-incidents')}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Incidents
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{incident?.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!userLoading && userRole === 'admin' && (
            <Button onClick={() => navigate(`/edit-incident/${id}`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Main Incident Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{incident.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(incident.status)} className="gap-1">
                  {getStatusIcon(incident.status)}
                  {incident.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {incident.description || 'No description provided'}
            </p>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Started:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(incident.started_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3" />
                    <span className="font-medium">Resolved:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(incident.resolved_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">Created:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(incident.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-3 w-3" />
                    <span className="font-medium">Updated:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(incident.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Affected Services */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Affected Services
              </h3>
              {incident.linked_services?.length > 0 ? (
                <div className="space-y-2">
                  {incident.linked_services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge variant={getServiceStatusVariant(service.status)} size="sm">
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No services affected</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident Logs */}
      {incident.logs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Incident Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incident.logs.map((log, index) => {
                let parsedMessage = {};
                try {
                  parsedMessage = JSON.parse(log.message);
                } catch (e) {
                  parsedMessage = { message: log.message };
                }

                return (
                  <div key={log.id} className="relative">
                    {index !== incident.logs.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-12 h-12 bg-background border-2 rounded-full">
                          {getStatusIcon(log.status)}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(log.status)} size="sm">
                              {log.status.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {log.full_name || 'Unknown'}
                          </div>
                        </div>
                        <Card className="p-4">
                          <div className="space-y-2">
                            {Object.entries(parsedMessage).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {Array.isArray(value) ? value.join(', ') : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewIncident;