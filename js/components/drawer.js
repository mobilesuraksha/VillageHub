import { subscribe } from '/js/core/state.js';
import { signOutUser } from '/js/firebase/auth-service.js';
import { showToast } from '/js/core/toast.js';
import { escapeHTML, initials } from '/js/core/utils.js';

let lastFocused = null;

export function initDrawer() {
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);

  document.getElementById('drawer')?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    const drawer = document.getElementById('drawer');
    if (e.key === 'Escape' && drawer?.classList.contains('open')) closeDrawer();
    if (e.key === 'Tab' && drawer?.classList.contains('open')) trapFocus(e, drawer);
  });

  subscribe('user', renderDrawerUser);
}

export function openDrawer() {
  lastFocused = document.activeElement;
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('drawer-overlay')?.classList.add('open');
  document.getElementById('drawer')?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => document.getElementById('drawer-close')?.focus());
}

export function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
  document.getElementById('drawer')?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocused?.focus?.();
}

function trapFocus(e, drawer) {
  const focusable = drawer.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function renderDrawerUser(user) {
  const slot = document.getElementById('drawer-user-slot');
  if (!slot) return;

  if (!user) {
    slot.innerHTML = `
      <button class="btn btn--primary btn--block" id="drawer-login-btn" type="button">
        <span class="material-symbols-rounded icon-sm" aria-hidden="true">login</span> Sign in with Google
      </button>`;
    slot.querySelector('#drawer-login-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('villagehub:request-login'));
    });
    return;
  }

  const name = escapeHTML(user.displayName || 'VillageHub User');
  const email = escapeHTML(user.email || '');
  const avatar = user.photoURL
    ? `<img class="avatar" src="${user.photoURL}" alt="" width="44" height="44">`
    : `<span class="avatar-fallback" style="width:44px;height:44px;">${initials(user.displayName)}</span>`;

  slot.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3);width:100%;">
      ${avatar}
      <div style="min-width:0;">
        <p class="drawer__user-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</p>
        <p class="drawer__user-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${email}</p>
      </div>
    </div>
    <button class="btn btn--outline btn--block" id="drawer-logout-btn" type="button" style="margin-top:var(--space-4);">
      <span class="material-symbols-rounded icon-sm" aria-hidden="true">logout</span> Sign out
    </button>`;

  slot.querySelector('#drawer-logout-btn')?.addEventListener('click', async () => {
    try {
      await signOutUser();
      showToast('Signed out successfully', 'success');
      closeDrawer();
    } catch (err) {
      console.error('[drawer] Sign out failed:', err);
      showToast('Could not sign out. Please try again.', 'error');
    }
  });
}
