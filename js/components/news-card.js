import { escapeHTML } from '/js/core/utils.js';
import { timeAgo } from '/js/core/utils.js';

const CATEGORY_LABELS = {
  local: 'Local',
  panchayat: 'Panchayat',
  school: 'School',
  electricity: 'Electricity',
  water: 'Water',
  events: 'Events'
};

export function renderNewsCard(news) {
  const title = escapeHTML(news.title || 'Untitled update');
  const image = news.image || '/assets/images/placeholder.svg';
  const category = CATEGORY_LABELS[news.category] || 'News';

  return `
    <a href="/news#${news.id}" class="news-card" data-link aria-label="${title}">
      <img class="news-card__thumb lazy" data-src="${image}" alt="" width="84" height="84" loading="lazy">
      <div>
        <p class="news-card__cat">${category}</p>
        <h3 class="news-card__title">${title}</h3>
        <p class="news-card__date">${timeAgo(news.createdAt)}</p>
      </div>
    </a>`;
}
