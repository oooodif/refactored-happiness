// This is a custom service worker that provides offline access functionality
// It works alongside the existing service worker without conflicting

const CACHE_NAME = 'aitexgen-offline-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/components/ui/button.tsx',
  '/src/components/ui/input.tsx',
  '/src/components/ui/textarea.tsx',
  '/src/components/editor/latex-input.tsx',
  '/src/components/editor/latex-output.tsx',
  // Images and Icons
  '/favicon.ico',
  // Offline fallback page
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients so this service worker can control all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle API requests - try network first, then fallback to cache if available
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              // Return cached response if available
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If no cached API response, return offline JSON
              return new Response(
                JSON.stringify({ 
                  error: 'You are currently offline. Some features may not be available.' 
                }),
                {
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
  
  // For all other requests use Cache-First strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful non-API responses
            if (response && response.status === 200 && response.type === 'basic') {
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clonedResponse);
              });
            }
            return response;
          })
          .catch(() => {
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Otherwise just fail
            return new Response('You are offline and this resource is not available.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle background syncing for offline changes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-latex-changes') {
    event.waitUntil(syncLatexChanges());
  }
});

// Sync local changes when online again
async function syncLatexChanges() {
  try {
    // Get pending changes from IndexedDB
    const pendingChanges = await getPendingChangesFromDB();
    
    // Send each change to the server
    for (const change of pendingChanges) {
      try {
        const response = await fetch('/api/documents/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(change)
        });
        
        if (response.ok) {
          // Remove from pending changes
          await removePendingChange(change.id);
        }
      } catch (error) {
        console.error('Failed to sync change:', error);
      }
    }
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

// Placeholder functions for IndexedDB operations
// These would be implemented with actual IndexedDB code
async function getPendingChangesFromDB() {
  return [];
}

async function removePendingChange(id) {
  return true;
}