import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUser } from '@clerk/clerk-react';

export default function Home() {
  const { user } = useUser();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Navigation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/dashboard"><Button className="w-full">Service Dashboard</Button></Link>
            <Link to="/create-service"><Button className="w-full" variant="outline">Create Service</Button></Link>
            <Link to="/create-incident"><Button className="w-full" variant="outline">Create Incident</Button></Link>
            <Link to="/get-services"><Button className="w-full" variant="outline">Get Services</Button></Link>
            <Link to="/get-incident"><Button className="w-full" variant="outline">Get Incidents</Button></Link>
          </CardContent>
        </Card>
        {/* Existing cards */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Email: {user?.primaryEmailAddress?.emailAddress}</p>
            <Button className="mt-4">Manage Profile</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Switch or create organizations using the switcher above.</p>
            <Button variant="outline" className="mt-4">Go to Organization Settings</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Create Project</Button>
            <Button className="w-full" variant="secondary">View Reports</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
