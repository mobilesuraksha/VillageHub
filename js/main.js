import { initTheme } from '/js/core/theme.js';
import { initToast, showToast } from '/js/core/toast.js';
import { registerRoute, setNotFoundHandler, initRouter } from '/js/core/router.js';
import { setSEO } from '/js/core/seo.js';
import { initHeader } from '/js/components/header.js';
import { initDrawer } from '/js/components/drawer.js';
import { initInstallPrompt } from '/js/components/install-prompt.js';
import { registerHomeRoute } from '/js/pages/home.js';
import { onAuthChange, signInWithGoogle, handleRedirectResult } from '/js/firebase/auth-service.js';
import { setState } from '/js/core/state.js';

// ---------------------------------------------------------------------------
// 1. Theme - applied before first paint of dynamic content to avoid a flash
// ---------------------------------------------------------------------------
initTheme();
initToast();

// ---------------------------------------------------------------------------
// 2. Routes
//    Only Home is a fully built module right now. Every other nav/drawer
//    destination is registered against a shared "coming soon" placeholder
//    so links are never dead - each of these gets replaced with a real page
//    module in the next build steps (Buy & Sell, Shops, Jobs, Account...).
// ---------------------------------------------------------------------------
registerHomeRoute();

const COMING_SOON_ROUTES = [
  ['/buy-sell', 'Buy & Sell', 'sell', 'Post and browse mobiles, vehicles, land, furniture and more.'],
  ['/shops', 'Shops', 'storefront', 'Discover and review local shops.'],
  ['/jobs', 'Jobs', 'work', 'Find work or hire locally.'],
  ['/account', 'Account', 'person', 'Manage your profile, listings and shops.'],
  ['/offers', 'Offers', 'local_offer', 'Daily, festival and featured offers.'],
  ['/news', 'News', 'newspaper', 'Panchayat, school, electricity, water and event updates.'],
  ['/services', 'Services', 'home_repair_service', 'Electricians, plumbers, carpenters and more.'],
  ['/notifications', 'Notifications', 'notifications', 'Your alerts will show up here.'],
  ['/help', 'Help', 'help', 'Frequently asked questions and support.'],
  ['/contact', 'Contact us', 'mail', 'Get in touch with the VillageHub team.'],
  ['/settings', 'Settings', 'settings', 'Manage your app preferences.']
];

COMING_SOON_ROUTES.forEach(([path, title, icon, description]) => {
  registerRoute(path, (container) => renderComingSoon(container, { title, icon, description }));
});

setNotFoundHandler((container) => {
  setSEO({ title: 'Page not found' });
  container.innerHTML = `
    <div class="container">
      <div class="state-block animate-fade-in">
        <span class="material-symbols-rounded" aria-hidden="true">explore_off</span>
        <h3>We couldn't find that page</h3>
        <p>It may have been moved, or the link might be incorrect.</p>
        <a href="/" class="btn btn--primary" data-link>Back to Home</a>
      </div>
    </div>`;
});

function renderComingSoon(container, { title, icon, description }) {
  setSEO({ title, description });
  container.innerHTML = `
    <div class="container">
      <div class="state-block animate-fade-in">
        <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
        <h3>${title} is on its way</h3>
        <p>${description} This section is actively being built - check back soon.</p>
        <a href="/" class="btn btn--primary" data-link>Back to Home</a>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// 3. Shell interactivity + router boot
// ---------------------------------------------------------------------------
initHeader();
initDrawer();
initInstallPrompt();
initRouter();

// ---------------------------------------------------------------------------
// 4. Auth
// ---------------------------------------------------------------------------
onAuthChange(() => { /* state.js already updated; header/drawer re-render via subscribe() */ });
handleRedirectResult();

document.addEventListener('villagehub:request-login', async () => {
  try {
    await signInWithGoogle();
    showToast('Signed in successfully', 'success');
  } catch (err) {
    console.error('[main] Google sign-in failed:', err);
    showToast('Sign-in failed. Please try again.', 'error');
  }
});

// ---------------------------------------------------------------------------
// 5. Service worker registration + update flow
//    (Also registers FCM's expected file; see firebase-messaging-sw.js)
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('A new version of VillageHub is ready.', 'info', 0, {
              actionLabel: 'Reload',
              onAction: () => {
                newWorker.postMessage('SKIP_WAITING');
              }
            });
          }
        });
      });
    } catch (err) {
      console.warn('[main] Service worker registration failed:', err);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Reset any stray "unread notifications" indicator on boot; a real
// notifications module (next build step) will drive this from Firestore.
setState('unreadCount', 0);
