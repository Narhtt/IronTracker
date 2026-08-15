
// __APP_VERSION__ is substituted at build/dev-serve time from package.json (see vite.config.ts)
const CACHE_NAME = 'iron-tracker-__APP_VERSION__';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force l'activation immédiate
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((err) => {
        console.error('[SW] Echec installation.', err);
      })
  );
});

// Activation et nettoyage des anciens caches
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
    })
  );
  self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Stratégie pour les pages HTML (Navigation) : Network First, puis Cache (pour le offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Stratégie pour les autres ressources (CSS, JS, Images, Fonts) : Cache First, puis Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        // Mise en cache dynamique des nouvelles ressources valides (Chunks JS, etc.)
        // On vérifie que c'est bien une requête HTTP(S) et GET
        if (!event.request.url.startsWith('http') || event.request.method !== 'GET') return response;
        
        return caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, response.clone());
             return response;
        });
      });
    })
  );
});

// Gestion du clic sur Notification
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  // URL cible pour l'ouverture complète (fallback)
  const fullUrl = '/#/workout';
  // Chemin interne pour le routeur React (SPA Bridge)
  const internalPath = '/workout';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Chercher une fenêtre déjà ouverte de l'app
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
             // SOLUTION B : Router Bridge
             // Au lieu de naviguer (reload), on envoie un message au client React
             focusedClient.postMessage({
               type: 'NAVIGATE_TO',
               url: internalPath
             });
          });
        }
      }
      // 2. Sinon ouvrir une nouvelle fenêtre (Cas app fermée)
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
