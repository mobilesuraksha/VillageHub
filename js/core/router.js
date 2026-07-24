const routes = [];
let notFoundHandler = null;
let currentCleanup = null;

/**
 * Registers a route. `pattern` supports :param segments, e.g.
 * '/buy-sell/listing/:id'. `handler(container, params)` may return a
 * cleanup function (to unsubscribe Firestore listeners, remove global
 * event listeners, etc.) which is called automatically before the next
 * navigation.
 */
export function registerRoute(pattern, handler) {
  const paramNames = [];
  const regexBody = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\:([^/\\]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
  const regex = new RegExp(`^${regexBody}/?$`);
  routes.push({ pattern, regex, paramNames, handler });
}

export function setNotFoundHandler(handler) {
  notFoundHandler = handler;
}

function matchRoute(pathname) {
  for (const route of routes) {
    const match = pathname.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]); });
      return { handler: route.handler, params };
    }
  }
  return null;
}

export async function handleRoute() {
  const container = document.getElementById('main-content');
  if (!container) return;

  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (err) { console.error('[router] cleanup threw:', err); }
    currentCleanup = null;
  }

  const path = window.location.pathname;
  const match = matchRoute(path);

  container.setAttribute('aria-busy', 'true');
  window.scrollTo(0, 0);
  closeAnyOpenDrawer();

  try {
    if (match) {
      const result = await match.handler(container, match.params);
      currentCleanup = typeof result === 'function' ? result : null;
    } else if (notFoundHandler) {
      await notFoundHandler(container);
    } else {
      container.innerHTML = renderGenericError('Page not found');
    }
  } catch (err) {
    console.error('[router] Route render failed:', err);
    container.innerHTML = renderGenericError("Something went wrong loading this page.");
  } finally {
    container.removeAttribute('aria-busy');
    updateActiveNavLinks(path);
  }
}

export function navigate(path, { replace = false } = {}) {
  const current = window.location.pathname + window.location.search;
  if (path === current) { handleRoute(); return; }
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  handleRoute();
}

export function initRouter() {
  document.body.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor || !anchor.href) return;
    if (anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.hasAttribute('data-external')) return;

    let url;
    try { url = new URL(anchor.href, window.location.origin); } catch { return; }
    if (url.origin !== window.location.origin) return;

    // Same-page hash link -> let the browser scroll natively, don't re-route.
    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();
    navigate(url.pathname + url.search);
  });

  window.addEventListener('popstate', handleRoute);
  handleRoute();
}

function updateActiveNavLinks(path) {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    let linkPath;
    try { linkPath = new URL(link.href, window.location.origin).pathname; } catch { return; }
    const isActive = linkPath === '/' ? path === '/' : path === linkPath || path.startsWith(`${linkPath}/`);
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function closeAnyOpenDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
}

function renderGenericError(message) {
  return `
    <div class="state-block animate-fade-in">
      <span class="material-symbols-rounded" aria-hidden="true">error</span>
      <h3>${message}</h3>
      <p>Try going back home, or reload the page.</p>
      <a href="/" class="btn btn--primary" data-link>Back to Home</a>
    </div>`;
}
