/**
 * VillageHub Service Worker
 * -------------------------
 * This single file does two jobs on purpose:
 *   1. Standard PWA behaviour - precache the app shell, serve cached content
 *      offline, and keep static assets fast on repeat visits.
 *   2. Firebase Cloud Messaging background handling - the FCM SDK looks for
 *      a file named exactly "firebase-messaging-sw.js" at the origin root
 *      by default, so combining both jobs here avoids two service workers
 *      fighting over the same scope.
 *
 * IMPORTANT: the firebaseConfig object below is intentionally duplicated
 * from js/firebase/firebase-config.js. Service workers cannot reliably
 * import the main thread's ES modules in every browser yet, so this copy
 * must be kept in sync by hand whenever you change your Firebase project
 * settings. (These values are safe to expose publicly - see README.md.)
 */

const SW_VERSION = 'v1';
const CACHE_NAME = `villagehub-cache-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/pages/home.css',
  '/js/main.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/favicon.svg',
  '/assets/images/placeholder.svg'
];

// Firebase/Google API calls must never be served from cache - always network.
const NEVER_CACHE_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'fcm.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'www.googleapis.com'
];

// ---------------------------------------------------------------------------
// Install: precache the app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] Precache failed for some assets:', err))
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: clean up old cache versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('villagehub-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Let the page tell a waiting worker to activate immediately (used by the
// "update available" toast in js/main.js).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Fetch: routing strategy
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Firebase/Google API traffic - it needs to hit the network
  // directly (Firestore has its own offline cache; see firebase-config.js).
  if (NEVER_CACHE_HOSTS.some((host) => url.hostname === host)) {
    return;
  }

  // Navigation requests (SPA routes): network-first, cached shell fallback,
  // offline page as the last resort.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Cross-origin static resources (Google Fonts, Firebase SDK from gstatic):
  // stale-while-revalidate so first paint is instant after the first visit.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Same-origin static assets: cache-first, falling back to network and
  // refreshing the cache for next time.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && request.url.startsWith('http')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match('/assets/images/placeholder.svg'));
    })
  );
});

// ---------------------------------------------------------------------------
// Firebase Cloud Messaging - background notifications
// ---------------------------------------------------------------------------
try {
  importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');

  // TODO: Replace with your project's config (Firebase Console > Project settings).
  // Keep this in sync with public/js/firebase/firebase-config.js.
  firebase.initializeApp({
    apiKey: 'REPLACE_WITH_YOUR_API_KEY',
    authDomain: 'REPLACE_WITH_YOUR_PROJECT.firebaseapp.com',
    projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
    storageBucket: 'REPLACE_WITH_YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
    appId: 'REPLACE_WITH_YOUR_APP_ID'
  });

  const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

  if (messaging) {
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || 'VillageHub';
      const body = (payload.notification && payload.notification.body) || 'You have a new update.';
      const notificationOptions = {
        body,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-72.png',
        data: payload.data || {},
        tag: (payload.data && payload.data.tag) || 'villagehub-notification'
      };
      self.registration.showNotification(title, notificationOptions);
    });
  }
} catch (err) {
  // Messaging is optional - a failure here should never break offline/caching.
  console.warn('[SW] Firebase Messaging unavailable in this context:', err);
}

// Clicking a background notification focuses/opens the app at a relevant route.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = (event.notification.data && event.notification.data.path) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) {
        existing.navigate(targetPath);
        return existing.focus();
      }
      return self.clients.openWindow(targetPath);
    })
  );
});
