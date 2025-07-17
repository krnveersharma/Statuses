import { Layout } from "@/components/ui/Layout";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
import { fetchIncidentById } from "../api/incidentApi";
import { fetchServices } from "../api/serviceApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STATUS_OPTIONS = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
  "maintainence",
];

const EditIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  const wsRef = useRef(null);
  const [incident, setIncident] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load Incident
  const loadIncident = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchIncidentById(token, id);
      setIncident({
        ...data,
        linked_services: (data.linked_services || []).map((s) => ({
          service_id: s.id,
          name: s.name,
        })),
      });
    } catch (err) {
      setError(err.message || "Failed to fetch incident");
    } finally {
      setLoading(false);
    }
  };

  // Load Services
  const loadServices = async () => {
    try {
      const token = await getToken();
      const data = await fetchServices(token);
      setServices(
        data.map((item) => ({
          service_id: item.id,
          name: item.name,
        }))
      );
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  // Save
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/admin/edit-incident`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incident),
      });

      if (!res.ok) throw new Error("Failed to update incident");
      navigate(`/get-incident/${id}`);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadIncident();
    loadServices();
    
    const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
    const wsUrl =
      API_BASE_URL.replace(/^http(s?):\/\//, wsProtocol + "://") + "/ws";
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("event triggered: ", event.data);
        if (msg.type === organization?.id+"_incident_updated_" + id) {
          console.log("edit event triggered 2");
          loadIncident();
          loadServices();
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
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!incident) return <div>No incident found.</div>;

  return (
    <>
      <Card className={"p-4 sm:p-6"}>
        <h1 className="text-2xl font-bold mb-4">Edit Incidence: {incident?.title}</h1>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="font-semibold block mb-1">Description</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={incident.description}
              onChange={(e) =>
                setIncident((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Status</label>
            <select
              className="w-full border rounded p-2"
              value={incident.status}
              onChange={(e) =>
                setIncident((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              <option value="" disabled>
                Select a status
              </option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Linked Services</label>
            <select
              className="w-full border rounded p-2"
              multiple
              value={incident.linked_services.map((s) =>
                s.service_id.toString()
              )}
              onChange={(e) => {
                const selectedServiceIds = Array.from(
                  e.target.selectedOptions,
                  (opt) => parseInt(opt.value)
                );
                const selectedServices = services.filter((s) =>
                  selectedServiceIds.includes(s.service_id)
                );
                setIncident((prev) => ({
                  ...prev,
                  linked_services: selectedServices,
                }));
              }}
            >
              {services.map((s) => (
                <option key={s.service_id} value={s.service_id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Windows) or ⌘ (Mac) to select multiple
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/get-incident/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </>
  );
};

export default EditIncident;
