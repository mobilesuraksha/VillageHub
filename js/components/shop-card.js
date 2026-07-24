import { escapeHTML } from '/js/core/utils.js';

export function renderShopCard(shop) {
  const name = escapeHTML(shop.name || 'Unnamed shop');
  const category = escapeHTML(shop.category || '');
  const banner = shop.banner || '/assets/images/placeholder.svg';
  const logo = shop.logo || '/assets/images/placeholder.svg';
  const rating = typeof shop.rating === 'number' ? shop.rating.toFixed(1) : 'New';

  return `
    <a href="/shops/${shop.id}" class="shop-card" data-link aria-label="${name}">
      <div class="shop-card__banner">
        <img class="lazy" data-src="${banner}" alt="" width="200" height="88" loading="lazy">
        <img class="shop-card__logo lazy" data-src="${logo}" alt="${name} logo" width="56" height="56" loading="lazy">
      </div>
      <div class="shop-card__body">
        <h3 class="shop-card__name">${name}</h3>
        <p class="shop-card__category">${category}</p>
        <div class="shop-card__rating">
          <span class="material-symbols-rounded icon-fill" aria-hidden="true">star</span>
          <span>${rating}${shop.reviewCount ? ` (${shop.reviewCount})` : ''}</span>
        </div>
      </div>
    </a>`;
}
