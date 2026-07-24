let container = null;

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

export function initToast() {
  container = document.getElementById('toast-container');
}

/**
 * Shows a toast. `message` is set via textContent (never innerHTML) so it
 * is safe even if it happens to contain user-influenced text (e.g. an
 * error message that echoes back a search term).
 *
 * Pass `{ actionLabel, onAction }` for a toast with a clickable action
 * (used by the "update available" flow in main.js). Action toasts don't
 * auto-dismiss, since the whole point is giving the user time to act.
 */
export function showToast(message, type = 'info', duration = 4000, { actionLabel, onAction } = {}) {
  if (!container) container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');

  const icon = document.createElement('span');
  icon.className = 'material-symbols-rounded toast__icon icon-fill';
  icon.textContent = ICONS[type] || ICONS.info;
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'toast__message';
  text.textContent = message;

  toast.append(icon, text);

  if (actionLabel && onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn--sm btn--accent';
    actionBtn.textContent = actionLabel;
    actionBtn.addEventListener('click', () => { onAction(); remove(); });
    toast.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '\u00D7';
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  const remove = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  const timer = (actionLabel && onAction) ? null : setTimeout(remove, duration);
  closeBtn.addEventListener('click', () => { if (timer) clearTimeout(timer); remove(); });

  return remove;
}
