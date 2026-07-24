const SITE_NAME = 'VillageHub';
const DEFAULT_IMAGE = '/assets/images/og-image.png';

/**
 * Updates document.title, meta description, canonical link, and Open
 * Graph/Twitter tags for the current route. Call this from every page
 * module's render function. Values are set via .content/.href properties
 * (never innerHTML), so no escaping is needed here.
 */
export function setSEO({ title, description, canonical, image, type = 'website' } = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Your Village Marketplace`;
  document.title = fullTitle;

  setMeta('description', description || defaultDescription());
  setMeta('og:site_name', SITE_NAME, true);
  setMeta('og:title', fullTitle, true);
  setMeta('og:description', description || defaultDescription(), true);
  setMeta('og:type', type, true);
  setMeta('og:image', absoluteUrl(image || DEFAULT_IMAGE), true);
  setMeta('og:url', window.location.href, true);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', description || defaultDescription());
  setMeta('twitter:image', absoluteUrl(image || DEFAULT_IMAGE));

  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonical || window.location.href;
}

/** Injects (or replaces) a JSON-LD structured data block for the current page. */
export function setStructuredData(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function removeStructuredData(id) {
  document.getElementById(id)?.remove();
}

function setMeta(name, content, isProperty = false) {
  if (content == null) return;
  const attr = isProperty ? 'property' : 'name';
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function absoluteUrl(path) {
  if (!path) return '';
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

function defaultDescription() {
  return 'Buy and sell locally, discover shops, find jobs, and stay updated with news from your village community - all in one app.';
}
