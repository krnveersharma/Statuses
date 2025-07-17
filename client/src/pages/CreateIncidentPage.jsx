import React, { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { createIncident } from "../api/incidentApi";
import { fetchServices } from "../api/serviceApi";

const STATUS_OPTIONS = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
  "maintenance",
];

const IMPACT_OPTIONS = [
  "degraded_performance",
  "partial_outage",
  "major_outage",
  "under_performance",
];

export default function CreateIncidentPage() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "",
    started_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState([]);
  const [linkedServices, setLinkedServices] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadServices = async () => {
    try {
      const token = await getToken();
      const data = await fetchServices(token);
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const handleServiceSelect = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value));
  
    const selectedServices = services
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => ({
        service_id: s.id,
        name: s.name,
      }));
  
    console.log("selected service is:", selectedServices);
    setLinkedServices(selectedServices);
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = await getToken();
      await createIncident(token, {
        ...form,
        linked_services: linkedServices,
      });
      setSuccess(true);
      setForm({
        title: "",
        description: "",
        status: "",
        started_at: "",
      });
      setLinkedServices([]);
    } catch (err) {
      setError(err.message || "Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-4">Create Incident</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-semibold block mb-1">Title</label>
          <input
            name="title"
            placeholder="Title"
            className="w-full border rounded p-2"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="font-semibold block mb-1">Description</label>
          <textarea
            name="description"
            placeholder="Description"
            className="w-full border rounded p-2"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="font-semibold block mb-1">Status</label>
          <select
            name="status"
            className="w-full border rounded p-2"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select a status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold block mb-1">Started At</label>
          <input
            type="datetime-local"
            name="started_at"
            className="w-full border rounded p-2"
            value={form.started_at}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="font-semibold block mb-1">Affected Services</label>
          <select
            className="w-full border rounded p-2"
            multiple
            value={linkedServices.map((s) => s.service_id)}
            onChange={handleServiceSelect}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Hold Ctrl (Windows) or ⌘ (Mac) to select multiple services
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Incident"}
        </Button>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">Incident created!</div>}
      </form>
    </Card>
  );
}
