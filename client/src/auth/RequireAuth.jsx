import { useAuth } from "@clerk/clerk-react";
import { RedirectToSignIn } from "@clerk/clerk-react";

export default function RequireAuth({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null; 
  if (!isSignedIn) return <RedirectToSignIn />;

  return children;
}
