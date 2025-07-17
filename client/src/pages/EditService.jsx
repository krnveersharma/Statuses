import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EditService = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const wsRef=useRef(null)
  const [service, setService] = useState(null);
  const [form, setForm] = useState({
    name: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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
        setForm({
          name: data.name || "",
          status: data.status || "",
        });
      } catch (err) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();

      const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
      const wsUrl =
        API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + "://") + "/ws";
      const ws = new window.WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "service_updated_" + id) {
            console.log("edit event triggered");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/edit-service`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: parseInt(id),
          ...form,
        }),
      });

      if (!res.ok) throw new Error("Failed to update service");

      setSuccess(true);
      setTimeout(() => navigate("/get-services"), 1000);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-muted">
        Loading service details...
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-4 sm:mt-10">
      <Card className="p-4 sm:p-6 shadow-md rounded-2xl space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit Service</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
          <input
            name="name"
            placeholder="Service Name"
            value={form.name}
            onChange={handleChange}
            required
            className="p-2 border rounded"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="p-2 border rounded"
          >
            <option value="" disabled>
              Select status
            </option>
            <option value="operational">Operational</option>
            <option value="degraded performance">Degraded Performance</option>
            <option value="partial outage">Partial Outage</option>
            <option value="major outage">Major Outage</option>
            <option value="under maintenance">Under Maintenance</option>
          </select>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Service"}
          </Button>

          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-500">Service updated!</div>}
        </form>
      </Card>
    </div>
  );
};

export default EditService;
