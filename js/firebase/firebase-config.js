/**
 * Firebase initialization - single source of truth for every Firebase
 * handle used across the app (auth, db, storage, messaging).
 *
 * SECURITY NOTE: the values below are a client identifier, not a secret.
 * It is safe for them to be public in your deployed bundle - real access
 * control lives in firestore.rules / storage.rules, not in hiding this
 * object. See README.md for where to find these values in your own
 * Firebase project and for recommended hardening (App Check).
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js';
import { isSupported as messagingIsSupported, getMessaging } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging.js';

// TODO: Replace with your project's config (Firebase Console > Project settings > General).
// Keep this in sync with public/firebase-messaging-sw.js.
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_PROJECT.firebaseapp.com',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID'
};

// The VAPID key from Cloud Messaging > Web configuration, needed to request
// a push token. Leave as-is until you're ready to wire up notifications.
export const VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_KEY';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const storage = getStorage(app);

// Firestore with persistent offline cache (IndexedDB) so listings/shops/jobs
// already fetched once keep working without a connection. Falls back to a
// plain in-memory client if the browser/context doesn't support it (e.g.
// some private-browsing modes, or a second open tab in rare edge cases).
export let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (err) {
  console.warn('[firebase-config] Persistent Firestore cache unavailable, falling back to default client:', err);
  db = getFirestore(app);
}

// Messaging is optional - unsupported in some browsers/contexts (e.g. iOS
// Safari outside of a PWA install, or when notifications are blocked).
export async function getMessagingIfSupported() {
  try {
    const supported = await messagingIsSupported();
    return supported ? getMessaging(app) : null;
  } catch (err) {
    console.warn('[firebase-config] Messaging not supported in this context:', err);
    return null;
  }
}
