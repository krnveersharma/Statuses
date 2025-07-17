import { Layout } from "@/components/ui/Layout";
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchServices } from '../api/serviceApi';
import React, { useEffect, useState } from 'react';

export default function ServiceDashboard() {
  const { getToken } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllServices = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        const data = await fetchServices(token);
        setServices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllServices();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-muted-foreground">Service Dashboard</h2>
        <Link to="/create-service">
          <Button>Create Service</Button>
        </Link>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.length === 0 && !loading && <div>No services found.</div>}
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {service.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      </>
  );
} 