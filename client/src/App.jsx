import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import RequireAuth from "./auth/RequireAuth";
import CreateIncidentPage from "./pages/CreateIncidentPage";
import CreateServicePage from "./pages/CreateServicePage";
import "./index.css"; // or './tailwind.css'
import GetServicesPage from "./pages/GetServices";
import GetIncidentsPage from "./pages/GetIncidents";
import ViewIncident from "./pages/ViewIncident";
import EditIncident from "./pages/EditIncident";
import ViewService from "./pages/ViewService";
import EditService from "./pages/EditService";
import { Layout } from "@/components/ui/Layout";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/sign-in"
        element={
          <div className=" h-full items-center flex justify-center">
            <SignIn />
          </div>
        }
      />
      <Route path="/sign-up" element={<div className=" h-full items-center flex justify-center">
            <SignUp />
          </div>} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <GetServicesPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/create-service"
        element={
          <RequireAuth>
            <Layout>
              <CreateServicePage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/create-incident"
        element={
          <RequireAuth>
            <Layout>
              <CreateIncidentPage />
            </Layout>
          </RequireAuth>
        }
      />
      {/* <Route
        path="/create-incident-update"
        element={
          <RequireAuth>
            <Layout>
              <CreateIncidentUpdatePage />
            </Layout>
          </RequireAuth>
        }
      /> */}
      <Route
        path="/get-services"
        element={
          <RequireAuth>
            <Layout>
              <GetServicesPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/get-incidents"
        element={
          <RequireAuth>
            <Layout>
              <GetIncidentsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/get-incident/:id"
        element={
          <RequireAuth>
            <Layout>
              <ViewIncident />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/edit-incident/:id"
        element={
          <RequireAuth>
            <Layout>
              <EditIncident />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/get-service/:id"
        element={
          <RequireAuth>
            <Layout>
              <ViewService />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/edit-service/:id"
        element={
          <RequireAuth>
            <Layout>
              <EditService />
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
