let observer = null;
const FALLBACK_SRC = '/assets/images/placeholder.svg';

/**
 * Scans `root` for <img class="lazy" data-src="..."> and loads them as they
 * approach the viewport. Call this again after injecting new cards into the
 * DOM (e.g. after a Firestore fetch resolves).
 */
export function observeImages(root = document) {
  const images = root.querySelectorAll('img.lazy[data-src]');

  if (!('IntersectionObserver' in window)) {
    images.forEach(loadImage);
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '150px 0px' });
  }

  images.forEach((img) => observer.observe(img));
}

function loadImage(img) {
  const src = img.getAttribute('data-src');
  if (!src) return;

  img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
  img.addEventListener('error', () => {
    img.src = FALLBACK_SRC;
    img.classList.add('loaded');
  }, { once: true });

  img.src = src;
  img.removeAttribute('data-src');
}
