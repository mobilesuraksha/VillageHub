let root = null;
let lastFocusedElement = null;

function getRoot() {
  if (!root) root = document.getElementById('modal-root');
  return root;
}

/**
 * Opens a modal dialog. `content` may be an HTML string or a DOM node.
 * Returns a close() function the caller can invoke programmatically.
 */
export function openModal({ title, content, actions = [], onDismiss }) {
  const modalRoot = getRoot();
  lastFocusedElement = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'presentation');

  const panel = document.createElement('div');
  panel.className = 'modal-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  if (title) panel.setAttribute('aria-label', title);

  const head = document.createElement('div');
  head.className = 'modal-panel__head';

  const heading = document.createElement('h3');
  heading.textContent = title || '';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">close</span>';

  head.append(heading, closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-panel__body';
  if (typeof content === 'string') body.innerHTML = content;
  else if (content instanceof Node) body.appendChild(content);

  panel.append(head, body);

  if (actions.length) {
    const actionsRow = document.createElement('div');
    actionsRow.className = 'modal-panel__actions';
    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = `btn ${action.className || 'btn--outline'}`;
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.onClick?.();
        if (action.closeOnClick !== false) close();
      });
      actionsRow.appendChild(btn);
    });
    panel.appendChild(actionsRow);
  }

  overlay.appendChild(panel);
  modalRoot.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => overlay.classList.add('open'));

  function trapFocus(e) {
    if (e.key === 'Escape') { close(true); return; }
    if (e.key !== 'Tab') return;
    const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onOverlayClick(e) {
    if (e.target === overlay) close(true);
  }

  function close(dismissed = false) {
    overlay.classList.remove('open');
    document.removeEventListener('keydown', trapFocus);
    overlay.removeEventListener('click', onOverlayClick);
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.remove();
      lastFocusedElement?.focus?.();
    }, 250);
    if (dismissed) onDismiss?.();
  }

  closeBtn.addEventListener('click', () => close(true));
  overlay.addEventListener('click', onOverlayClick);
  document.addEventListener('keydown', trapFocus);

  // Move focus into the dialog for screen reader / keyboard users.
  requestAnimationFrame(() => closeBtn.focus());

  return close;
}

/** Convenience wrapper for a yes/no confirmation dialog. Returns a Promise<boolean>. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    openModal({
      title,
      content: `<p>${escapeForModal(message)}</p>`,
      actions: [
        { label: 'Cancel', className: 'btn--outline', onClick: () => settle(false) },
        { label: confirmLabel, className: danger ? 'btn--danger' : 'btn--primary', onClick: () => settle(true) }
      ],
      // Escape / overlay-click / the X button all count as "cancel".
      onDismiss: () => settle(false)
    });
  });
}

function escapeForModal(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
