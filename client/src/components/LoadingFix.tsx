import { useEffect, useContext } from 'react';
import { UserContext } from '@/App';

/**
 * This component is a temporary workaround to fix the infinite loading issue
 * It forces the session to stop loading after a short delay
 */
export default function LoadingFix() {
  const { session, setSession } = useContext(UserContext);

  useEffect(() => {
    // This effect runs once on mount
    console.log("LoadingFix mounted, session state:", {
      isLoading: session.isLoading,
      isAuthenticated: session.isAuthenticated
    });

    // Force stop loading after a short delay (500ms)
    const timer = setTimeout(() => {
      console.log("LoadingFix: Force stopping loading state");
      setSession(prev => {
        if (prev.isLoading) {
          // If we're in loading state, force it to complete
          return {
            ...prev,
            isLoading: false,
            user: prev.user ? {
              ...prev.user,
              id: prev.user.id || 0, // Ensure ID is present
            } : null
          };
        }
        return prev;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}