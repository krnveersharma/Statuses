import { Layout } from "@/components/ui/Layout";
import { Card } from '../../components/ui/Card';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function GetServicesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const {organization}=useOrganization()
  const [user, setUser] = useState(null);

  const fetchUserRole = async () => {
    try {
      const token = await getToken();
      const data = await getuser(token);
      setUser(data.message);
    } catch (err) {
      console.error("Error fetching user info:", err);
    } finally {
    }
  };
  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/user/get-services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch services');

      const data = await res.json();
      setServices(data);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchUserRole();
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + '://') + '/ws';
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("message from websockets is:",msg)
        if (msg.type === (organization?.id+'_service_created')) {
          setServices((prev) => [...prev, msg.service]);
        }
        else if(msg.type.includes(`${organization?.id}_service_updated_`)
        ){
          setServices(prevServices =>
            prevServices.map(item =>
              item.id === msg.service.id ? msg.service : item
            )
          );
          
        }
        else if(msg.type.includes(`${organization?.id}_service_deleted`)){
          setServices(prevServices =>
            prevServices.filter(item =>
              `${organization?.id}_service_deleted_${item?.id}` != msg.type
            )
          );
        }

      } catch (e) {
        console.log("fetching error")
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-muted-foreground">All Services</h2>
        {user?.org?.rol=="admin"&&<Button onClick={() => navigate('/create-service')}>Create Service</Button>}
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services?.length === 0 && !loading && <div>No services found.</div>}
        {services?.map((service) => (
          <Card key={service.id}>
            <div className="p-4">
              <div className="font-semibold">{service.name}</div>
              <div className="text-sm text-muted-foreground">Status: {service.status}</div>
              <Button className="mt-2" variant="outline" onClick={() => navigate(`/get-service/${service.id}`)}>
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
