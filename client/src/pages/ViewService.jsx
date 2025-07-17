import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
import { getuser } from "../api/getUserInfo";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ViewService = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const {organization}=useOrganization()

  const [userRole, setUserRole] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = await getToken();
        const data = await getuser(token);
        setUserRole(data.message.org.rol);
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setUserLoading(false);
      }
    };

    const fetchService = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/user/get-service/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch service");
        const data = await res.json();
        setService(data);
      } catch (err) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
      fetchUserRole();

      const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
      const wsUrl =
        API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + "://") + "/ws";
      const ws = new window.WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === organization?.id+"_service_updated_" + id) {
            fetchService();
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-muted">
        Loading service details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        {error}
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Service not found.
      </div>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6 shadow-md rounded-2xl space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Service Details</h1>
          {!userLoading && userRole === "admin" && (
            <Button onClick={() => navigate(`/edit-service/${id}`)}>
              Edit
            </Button>
          )}
        </div>

        <div className="space-y-3 text-base text-gray-700">
          <div>
            <span className="font-semibold">ID:</span> {service.id}
          </div>
          <div>
            <span className="font-semibold">Name:</span> {service.name}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {service.status}
          </div>
          <div>
            <span className="font-semibold">Description:</span>{" "}
            {service.description}
          </div>
          <div>
            <span className="font-semibold">Created At:</span>{" "}
            {new Date(service.created_at).toLocaleString()}
          </div>
        </div>

        <div className="pt-6">
          <Button variant="outline" onClick={() => navigate("/get-services")}>
            Back to Services
          </Button>
        </div>
      </Card>
    </>
  );
};

export default ViewService;
