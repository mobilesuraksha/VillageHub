import { escapeHTML } from '/js/core/utils.js';

export function renderOfferCard(offer) {
  const title = escapeHTML(offer.title || 'Special offer');
  const image = offer.image || '/assets/images/placeholder.svg';
  const tag = escapeHTML(offer.discount || offer.title || '');

  return `
    <a href="/offers#${offer.id}" class="offer-card" data-link aria-label="${title}">
      <img class="lazy" data-src="${image}" alt="${title}" width="220" height="147" loading="lazy">
      <span class="offer-card__tag">${tag}</span>
    </a>`;
}
