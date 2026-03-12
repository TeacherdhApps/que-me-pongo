const CACHE_NAME = 'que-me-pongo-v3'; // Increment version

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.svg',
    './icon-512.svg',
    './icon-512.png'
];

// Cache-first runtime cache for static assets
const STATIC_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Network-first for API calls
const API_TIMEOUT = 5000; // 5 seconds

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force update
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Handle API requests (Supabase, Open-Meteo, Gemini) - Network first with cache fallback
    if (url.hostname.includes('supabase.co') || 
        url.hostname.includes('open-meteo.com') ||
        url.hostname.includes('googleapis.com')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle navigation requests - Stale-while-revalidate
    if (request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Handle static assets (JS, CSS, images) - Cache first
    if (request.destination === 'script' || 
        request.destination === 'style' || 
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Default: Cache first
    event.respondWith(handleStaticRequest(request));
});

async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetchWithTimeout(request, API_TIMEOUT);
        
        // Cache successful GET responses
        if (request.method === 'GET' && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving API response from cache:', request.url);
            return cachedResponse;
        }
        
        // Return offline error response
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleNavigationRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        // Fetch from network and update cache
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        // Network failed, serve from cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving navigation from cache:', request.url);
            return cachedResponse;
        }
        
        // Show offline page
        return caches.match('./index.html');
    }
}

async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        console.log('[SW] Serving static asset from cache:', request.url);
        
        // Update cache in background (stale-while-revalidate)
        fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse);
            }
        }).catch(() => {});
        
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Offline and not in cache
        return new Response('Offline', { status: 503 });
    }
}

async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-wardrobe') {
        event.waitUntil(syncWardrobeData());
    }
});

async function syncWardrobeData() {
    // Notify clients to sync data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_WARDROBE' });
    });
}

// Push notifications for outfit reminders
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || '¡Es hora de planificar tu outfit!',
        icon: './icon-192.svg',
        badge: './icon-192.svg',
        vibrate: [100, 50, 100],
        data: { url: './' }
    };
    
    event.waitUntil(
        self.registration.showNotification('¿Qué me pongo?', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || './')
    );
});
