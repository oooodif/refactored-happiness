import { useEffect } from 'react';

// This hook sets the HTTP status code for the current page
// It works by making a fetch request to a special endpoint that our server will handle
export function useHttpStatus(status: number) {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Create a hidden iframe to make the request without affecting navigation
    const setStatusCode = async () => {
      // Request that our server set the correct status code for this path
      await fetch(`/api/set-status?status=${status}&path=${window.location.pathname}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    };

    setStatusCode();
  }, [status]);
}