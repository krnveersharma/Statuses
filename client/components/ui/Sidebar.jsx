import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, AlertTriangle, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getuser } from "@/src/api/getUserInfo";
import { useAuth } from "@clerk/clerk-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: <Home size={18} /> },
  {
    to: "/get-incidents",
    label: "Incidents Dashboard",
    icon: <Home size={18} />,
  },
  {
    to: "/create-service",
    label: "Create Service",
    icon: <PlusCircle size={18} />,
  },
  {
    to: "/create-incident",
    label: "Create Incident",
    icon: <AlertTriangle size={18} />,
  },
];

export function Sidebar({ onClose }) {
  const { getToken } = useAuth();
  const location = useLocation();
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
  useEffect(() => {
    fetchUserRole();
  }, []);
  return (
    <aside className="h-[100%] w-64 bg-white border-r flex flex-col py-6 px-4 shadow-sm relative">
      {/* Close button for mobile */}
      {onClose && (
        <button className="absolute top-2 right-2 md:hidden p-2" onClick={onClose} aria-label="Close sidebar">
          <X className="h-6 w-6" />
        </button>
      )}
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="font-bold text-lg tracking-tight">
          Status<span className="text-primary">es</span>
        </span>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          return (
            <>
            {(user?.org?.rol!=="admin" && (item.label=="Create Service" || item.label=="Create Incident")) || !user? <></>:<Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted-foreground/10 ${
                location.pathname === item.to
                  ? "bg-muted-foreground/10 text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={onClose}
            >
              {item.icon}
              {item.label}
            </Link>}
            </>
          );
        })}
      </nav>
    </aside>
  );
}
