import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Redirects the user to /dashboard immediately after they sign in.
 * Avoids redirecting if the user is already on a protected/specific route.
 */
export function SignInRedirect() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once, and only if the user just signed in (isSignedIn becomes true)
    // and we haven't already redirected in this session.
    if (isSignedIn && !hasRedirected.current) {
      // Don't redirect if user is already on a quiz-specific page
      // (e.g., /host/:sessionId, /play/:sessionId, /quiz/:id, /dashboard)
      const protectedPaths = ["/dashboard", "/host", "/play", "/quiz"];
      const isOnProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));

      if (!isOnProtectedPath) {
        hasRedirected.current = true;
        navigate("/dashboard");
      }
    }
  }, [isSignedIn, navigate, location.pathname]);

  return null; // This component doesn't render anything
}
