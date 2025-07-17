import { Layout } from "@/components/ui/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { createService } from "../api/serviceApi";
import React, { useState } from "react";

export default function CreateServicePage() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    status: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getToken();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await createService(token, form);
      setSuccess(true);
      setForm({
        name: "",
        status: ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card className={"p-4"}>
        <h2 className="text-2xl font-semibold mb-4">Create Service</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-semibold block mb-1">Name</label>
            <input
              name="name"
              placeholder="Service Name"
              className="w-full border rounded p-2"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Status</label>
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
          </div>
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-500">Service created successfully!</div>}
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Service"}</Button>
        </form>
      </Card>
  );
}
