import { getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging.js';
import { doc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { db, VAPID_KEY, getMessagingIfSupported } from '/js/firebase/firebase-config.js';
import { showToast } from '/js/core/toast.js';

/**
 * Asks the user for notification permission, registers the combined
 * service worker (public/firebase-messaging-sw.js) and stores the
 * resulting FCM token on their user profile so a backend (Cloud Function
 * or trusted server using the Admin SDK) can target them later.
 *
 * NOTE: sending a push *to* a user always has to happen from a trusted
 * server context (Admin SDK / Cloud Functions) - a browser can never hold
 * the credentials needed to send messages to other users. This function
 * only handles the client's half: permission + token registration +
 * foreground display.
 */
export async function initMessaging(uid) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (token && uid) {
      await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) });
    }

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'VillageHub';
      const body = payload.notification?.body || '';
      showToast(`${title}${body ? ' - ' + body : ''}`, 'info', 6000);
    });

    return token;
  } catch (err) {
    console.warn('[messaging-service] Could not enable notifications:', err);
    return null;
  }
}
