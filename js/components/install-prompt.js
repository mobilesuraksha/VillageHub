const DISMISS_KEY = 'villagehub-install-dismissed-at';
const DISMISS_DAYS = 14;

let deferredPrompt = null;

export function initInstallPrompt() {
  const banner = document.getElementById('install-prompt-banner');
  if (!banner) return;

  if (isStandalone() || wasDismissedRecently()) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner(banner, { ios: false });
  });

  window.addEventListener('appinstalled', () => {
    hideBanner(banner);
    deferredPrompt = null;
  });

  // iOS Safari never fires beforeinstallprompt - there is no programmatic
  // install API there, so we detect the platform and show manual steps
  // instead. This is the one place UA sniffing is justified: there is no
  // feature-detection alternative for "can this browser prompt to install".
  if (isIOS() && !isStandalone()) {
    showBanner(banner, { ios: true });
  }

  banner.querySelector('[data-install-dismiss]')?.addEventListener('click', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    hideBanner(banner);
  });

  banner.querySelector('[data-install-confirm]')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideBanner(banner);
  });
}

function showBanner(banner, { ios }) {
  const actionBtn = banner.querySelector('[data-install-confirm]');
  const textEl = banner.querySelector('.install-banner__text span');
  if (ios && textEl) {
    textEl.textContent = 'Tap Share, then "Add to Home Screen"';
    if (actionBtn) actionBtn.style.display = 'none';
  }
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add('animate-slide-up'));
}

function hideBanner(banner) {
  banner.hidden = true;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function wasDismissedRecently() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}
