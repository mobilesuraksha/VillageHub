/**
 * IMPORTANT: any user-generated string (titles, names, descriptions) that
 * gets interpolated into an innerHTML template MUST go through escapeHTML
 * first. This is the app's primary XSS defense for its render-via-string
 * pattern - never interpolate raw user input directly into a template.
 */
export function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function formatPrice(price, priceType = 'fixed') {
  if (price == null || price === '') return 'Price on request';
  const formatted = currencyFormatter.format(Number(price));
  return priceType === 'negotiable' ? `${formatted} (negotiable)` : formatted;
}

export function formatDate(dateInput) {
  const date = toJsDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function timeAgo(dateInput) {
  const date = toJsDate(dateInput);
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60]
  ];
  for (const [unit, secondsInUnit] of steps) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/** Accepts a Firestore Timestamp, JS Date, ISO string, or millis. */
function toJsDate(input) {
  if (!input) return null;
  if (typeof input.toDate === 'function') return input.toDate();
  if (input instanceof Date) return input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function debounce(fn, wait = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

export function throttle(fn, limitMs = 200) {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => { waiting = false; }, limitMs);
  };
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, '').slice(-10));
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/** Normalizes a 10-digit Indian mobile number to E.164 (+91...) for tel:/wa.me links. */
export function toE164India(phone) {
  const digits = String(phone).replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return `+91${last10}`;
}

export function whatsAppLink(phone, message = '') {
  const digits = toE164India(phone).replace('+', '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function callLink(phone) {
  return `tel:${toE164India(phone)}`;
}

export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
}
