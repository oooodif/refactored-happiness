import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getFingerprint } from "./fingerprint";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to check if user session exists and is valid
export async function checkAuthStatus(): Promise<any> {
  try {
    console.log("CHECKING AUTH STATUS...");
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log("AUTH STATUS RESPONSE:", res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log("AUTH STATUS DATA:", data);
      // Explicitly check for user object in the response
      if (data && data.user) {
        return {
          isAuthenticated: true,
          user: data.user,
          usageLimit: data.usageLimit
        };
      }
    }
    
    console.log("AUTH STATUS: Not authenticated");
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Session check failed:', error);
    return { isAuthenticated: false };
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get fingerprint for anonymous user tracking
  const fingerprint = getFingerprint();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Device-Fingerprint': fingerprint, // Add fingerprint to identify anonymous users
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "recheck";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get fingerprint for anonymous user tracking
    const fingerprint = getFingerprint();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Device-Fingerprint': fingerprint // Add fingerprint to identify anonymous users
      }
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "recheck") {
        // Try a second time to verify the session
        const sessionCheck = await checkAuthStatus();
        if (sessionCheck.isAuthenticated) {
          // Try the original request again
          const retryRes = await fetch(queryKey[0] as string, {
            credentials: "include",
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (retryRes.ok) {
            return await retryRes.json();
          }
        }
        return null;
      }
      // Default is "throw"
      throw new Error("Unauthorized");
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "recheck" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable this to refresh on focus
      staleTime: 10 * 1000, // 10 seconds, not Infinity
      retry: 1, // Allow one retry
    },
    mutations: {
      retry: 1, // Allow one retry for mutations too
    },
  },
});
