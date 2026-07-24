import { escapeHTML, formatPrice, timeAgo } from '/js/core/utils.js';

export function renderListingCard(listing) {
  const img = listing.images?.[0] || '/assets/images/placeholder.svg';
  const title = escapeHTML(listing.title || 'Untitled listing');
  const city = escapeHTML(listing.location?.city || '');
  const price = formatPrice(listing.price, listing.priceType);

  return `
    <a href="/buy-sell/listing/${listing.id}" class="listing-card" data-link aria-label="${title}, ${price}">
      <div class="listing-card__image-wrap">
        <img class="listing-card__image lazy" data-src="${img}" alt="${title}" width="300" height="225" loading="lazy">
        ${listing.featured ? '<span class="badge badge--featured">Featured</span>' : ''}
        <button class="listing-card__save" type="button" data-save-listing="${listing.id}" aria-label="Save listing" aria-pressed="false" onclick="event.preventDefault()">
          <span class="material-symbols-rounded icon-sm" aria-hidden="true">favorite</span>
        </button>
      </div>
      <div class="listing-card__body">
        <p class="listing-card__price">${price}</p>
        <h3 class="listing-card__title">${title}</h3>
        ${city ? `<p class="listing-card__location"><span class="material-symbols-rounded" aria-hidden="true">location_on</span>${city}</p>` : ''}
      </div>
    </a>`;
}

// Re-exported so pages that show "posted 3 days ago" pull date formatting
// from the same module as the card instead of a separate import.
export { timeAgo };
