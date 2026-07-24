import { toggleTheme } from '/js/core/theme.js';
import { subscribe } from '/js/core/state.js';
import { navigate } from '/js/core/router.js';
import { openDrawer } from '/js/components/drawer.js';
import { initials, escapeHTML } from '/js/core/utils.js';

export function initHeader() {
  document.getElementById('menu-toggle')?.addEventListener('click', openDrawer);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });

  document.querySelectorAll('[data-search-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const q = input?.value?.trim();
      navigate(q ? `/buy-sell?q=${encodeURIComponent(q)}` : '/buy-sell');
    });
  });

  document.getElementById('notif-btn')?.addEventListener('click', () => navigate('/notifications'));

  subscribe('user', renderAuthState);
  subscribe('unreadCount', updateNotifBadge);
}

function renderAuthState(user) {
  const slot = document.getElementById('header-auth-slot');
  if (!slot) return;

  if (!user) {
    slot.innerHTML = `
      <button class="btn btn--primary btn--sm" id="header-login-btn" type="button">
        <span class="material-symbols-rounded icon-sm" aria-hidden="true">person</span>
        <span class="visually-hidden-mobile">Sign in</span>
      </button>`;
    slot.querySelector('#header-login-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('villagehub:request-login'));
    });
    return;
  }

  const name = escapeHTML(user.displayName || 'Account');
  if (user.photoURL) {
    slot.innerHTML = `<a href="/account" data-link data-nav-link aria-label="${name}, view account"><img class="avatar" src="${user.photoURL}" alt="" width="34" height="34"></a>`;
  } else {
    slot.innerHTML = `<a href="/account" data-link data-nav-link aria-label="${name}, view account"><span class="avatar-fallback">${initials(user.displayName)}</span></a>`;
  }
}

function updateNotifBadge(count) {
  document.getElementById('notif-badge')?.classList.toggle('show', !!count);
}
