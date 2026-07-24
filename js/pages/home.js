import {
  getLatestListings, getPopularShops, getLatestJobs, getActiveOffers, getLatestNews
} from '/js/firebase/firestore-service.js';
import { renderListingCard } from '/js/components/listing-card.js';
import { renderShopCard } from '/js/components/shop-card.js';
import { renderJobCard } from '/js/components/job-card.js';
import { renderOfferCard } from '/js/components/offer-card.js';
import { renderNewsCard } from '/js/components/news-card.js';
import { showSkeletons } from '/js/core/skeleton.js';
import { observeImages } from '/js/core/lazy-load.js';
import { showToast } from '/js/core/toast.js';
import { setSEO, setStructuredData } from '/js/core/seo.js';
import { registerRoute, navigate } from '/js/core/router.js';

const CATEGORIES = [
  { id: 'mobile', name: 'Mobile', icon: 'smartphone' },
  { id: 'laptop', name: 'Laptop', icon: 'laptop_mac' },
  { id: 'computer', name: 'Computer', icon: 'computer' },
  { id: 'bike', name: 'Bike', icon: 'two_wheeler' },
  { id: 'car', name: 'Car', icon: 'directions_car' },
  { id: 'tractor', name: 'Tractor', icon: 'agriculture' },
  { id: 'land', name: 'Land', icon: 'landscape' },
  { id: 'house', name: 'House', icon: 'other_houses' },
  { id: 'furniture', name: 'Furniture', icon: 'chair' },
  { id: 'electronics', name: 'Electronics', icon: 'devices' },
  { id: 'agri-equipment', name: 'Agri Equipment', icon: 'yard' }
];

export function registerHomeRoute() {
  registerRoute('/', renderHome);
}

export async function renderHome(container) {
  setSEO({
    title: null, // use the default site title on the homepage
    description: 'Buy and sell locally, discover shops, find jobs, and stay updated with village news - all in one app.',
    canonical: `${window.location.origin}/`
  });
  setStructuredData('ld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VillageHub',
    url: window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/buy-sell?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });

  container.innerHTML = homeTemplate();
  container.classList.add('page-enter');

  wireHeroSearch(container);
  wireCategoryClicks(container);

  loadLatestListings();
  loadPopularShops();
  loadLatestJobs();
  loadOffers();
  loadNews();

  return () => {
    // Nothing to unsubscribe (Home uses one-time getDocs, not onSnapshot),
    // but the router still expects a cleanup slot to exist consistently.
  };
}

function homeTemplate() {
  return `
    <div class="container home-hero">
      <section class="hero-search">
        <svg class="hero-search__mark" viewBox="0 0 512 512" aria-hidden="true">
          ${heroMarkSpokes()}
        </svg>
        <h1>What are you looking for today?</h1>
        <p>Search listings, shops, jobs and services near you.</p>
        <form class="search-bar" data-search-form role="search">
          <span class="material-symbols-rounded" aria-hidden="true">search</span>
          <input type="search" name="q" placeholder="Search mobiles, jobs, shops..." aria-label="Search VillageHub">
        </form>
        <div class="quick-links">
          <a href="/buy-sell/add" class="quick-link-chip" data-link><span class="material-symbols-rounded icon-sm" aria-hidden="true">sell</span> Sell an item</a>
          <a href="/jobs" class="quick-link-chip" data-link><span class="material-symbols-rounded icon-sm" aria-hidden="true">work</span> Find a job</a>
          <a href="/shops" class="quick-link-chip" data-link><span class="material-symbols-rounded icon-sm" aria-hidden="true">storefront</span> Browse shops</a>
        </div>
      </section>
    </div>

    <section class="container section" aria-labelledby="categories-heading">
      <div class="section__head">
        <h2 id="categories-heading">Categories</h2>
      </div>
      <div class="category-grid" id="category-grid"></div>
    </section>

    <section class="container section" aria-labelledby="listings-heading">
      <div class="section__head">
        <div class="home-section-title-row">
          <h2 id="listings-heading">Latest Listings</h2>
        </div>
        <a href="/buy-sell" class="section__see-all" data-link>See all <span class="material-symbols-rounded icon-sm" aria-hidden="true">chevron_right</span></a>
      </div>
      <div class="card-grid" id="latest-listings-grid"></div>
    </section>

    <section class="container section shops-strip" aria-labelledby="shops-heading">
      <div class="section__head">
        <h2 id="shops-heading">Popular Shops</h2>
        <a href="/shops" class="section__see-all" data-link>See all <span class="material-symbols-rounded icon-sm" aria-hidden="true">chevron_right</span></a>
      </div>
      <div class="card-row" id="popular-shops-row"></div>
    </section>

    <section class="container section jobs-strip" aria-labelledby="jobs-heading">
      <div class="section__head">
        <h2 id="jobs-heading">Latest Jobs</h2>
        <a href="/jobs" class="section__see-all" data-link>See all <span class="material-symbols-rounded icon-sm" aria-hidden="true">chevron_right</span></a>
      </div>
      <div class="card-row" id="latest-jobs-row"></div>
    </section>

    <section class="container section offers-strip" aria-labelledby="offers-heading">
      <div class="section__head">
        <h2 id="offers-heading">Offers</h2>
        <a href="/offers" class="section__see-all" data-link>See all <span class="material-symbols-rounded icon-sm" aria-hidden="true">chevron_right</span></a>
      </div>
      <div class="card-row" id="offers-row"></div>
    </section>

    <section class="container section news-strip" aria-labelledby="news-heading">
      <div class="section__head">
        <h2 id="news-heading">Village News</h2>
        <a href="/news" class="section__see-all" data-link>See all <span class="material-symbols-rounded icon-sm" aria-hidden="true">chevron_right</span></a>
      </div>
      <div class="card-row" id="news-row"></div>
    </section>
  `;
}

function heroMarkSpokes() {
  // Same 6-spoke hub mark as the app icon (exact coordinates from
  // generate_icons.py's hub_geometry(256,256,scale=1.0) - not re-typed by
  // hand), reused here as a subtle decorative watermark.
  return `
    <g fill="#FFFFFF">
      <polygon points="272.0,210.0 263.0,106.0 249.0,106.0 240.0,210.0"/>
      <polygon points="303.8,246.9 389.4,187.1 382.4,174.9 287.8,219.1"/>
      <polygon points="287.8,292.9 382.4,337.1 389.4,324.9 303.8,265.1"/>
      <polygon points="240.0,302.0 249.0,406.0 263.0,406.0 272.0,302.0"/>
      <polygon points="208.2,265.1 122.6,324.9 129.6,337.1 224.2,292.9"/>
      <polygon points="224.2,219.1 129.6,174.9 122.6,187.1 208.2,246.9"/>
      <circle cx="256" cy="106" r="22"/>
      <circle cx="385.9" cy="181" r="22"/>
      <circle cx="385.9" cy="331" r="22"/>
      <circle cx="256" cy="406" r="22"/>
      <circle cx="126.1" cy="331" r="22"/>
      <circle cx="126.1" cy="181" r="22"/>
      <circle cx="256" cy="256" r="50"/>
    </g>`;
}

function wireHeroSearch(container) {
  const form = container.querySelector('[data-search-form]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = form.querySelector('input')?.value?.trim();
    navigate(q ? `/buy-sell?q=${encodeURIComponent(q)}` : '/buy-sell');
  });
}

function wireCategoryClicks(container) {
  const grid = container.querySelector('#category-grid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((cat) => `
    <a href="/buy-sell/${cat.id}" class="category-chip" data-link>
      <span class="category-chip__icon"><span class="material-symbols-rounded" aria-hidden="true">${cat.icon}</span></span>
      <span>${cat.name}</span>
    </a>`).join('');
}

async function loadLatestListings() {
  const el = document.getElementById('latest-listings-grid');
  if (!el) return;
  showSkeletons(el, 'card', 8);
  try {
    const listings = await getLatestListings(8);
    if (!listings.length) {
      el.innerHTML = emptyState('sell', 'No listings yet', 'Be the first to post something for sale in your village.', '/buy-sell/add', 'Post a listing');
      return;
    }
    el.innerHTML = listings.map(renderListingCard).join('');
    observeImages(el);
  } catch (err) {
    console.error('[home] Failed to load listings:', err);
    el.innerHTML = errorState();
    showToast('Could not load the latest listings.', 'error');
  }
}

async function loadPopularShops() {
  const el = document.getElementById('popular-shops-row');
  if (!el) return;
  showSkeletons(el, 'card', 5);
  try {
    const shops = await getPopularShops(6);
    if (!shops.length) {
      el.innerHTML = emptyState('storefront', 'No shops listed yet', 'Shop owners can create a free shop profile here.', '/account/my-shops', 'Add your shop');
      return;
    }
    el.innerHTML = shops.map(renderShopCard).join('');
    observeImages(el);
  } catch (err) {
    console.error('[home] Failed to load shops:', err);
    el.innerHTML = errorState();
    showToast('Could not load popular shops.', 'error');
  }
}

async function loadLatestJobs() {
  const el = document.getElementById('latest-jobs-row');
  if (!el) return;
  showSkeletons(el, 'row', 4);
  try {
    const jobs = await getLatestJobs(6);
    if (!jobs.length) {
      el.innerHTML = emptyState('work', 'No jobs posted yet', 'Local employers can post an opening for free.', '/jobs/post', 'Post a job');
      return;
    }
    el.innerHTML = jobs.map(renderJobCard).join('');
  } catch (err) {
    console.error('[home] Failed to load jobs:', err);
    el.innerHTML = errorState();
    showToast('Could not load the latest jobs.', 'error');
  }
}

async function loadOffers() {
  const el = document.getElementById('offers-row');
  if (!el) return;
  showSkeletons(el, 'card', 4);
  try {
    const offers = await getActiveOffers(6);
    if (!offers.length) {
      el.innerHTML = emptyState('local_offer', 'No active offers', 'Check back soon for daily and festival deals.');
      return;
    }
    el.innerHTML = offers.map(renderOfferCard).join('');
    observeImages(el);
  } catch (err) {
    console.error('[home] Failed to load offers:', err);
    el.innerHTML = errorState();
  }
}

async function loadNews() {
  const el = document.getElementById('news-row');
  if (!el) return;
  showSkeletons(el, 'row', 3);
  try {
    const news = await getLatestNews(4);
    if (!news.length) {
      el.innerHTML = emptyState('newspaper', 'No news yet', 'Village updates, Panchayat notices and events will appear here.');
      return;
    }
    el.innerHTML = news.map(renderNewsCard).join('');
    observeImages(el);
  } catch (err) {
    console.error('[home] Failed to load news:', err);
    el.innerHTML = errorState();
  }
}

function emptyState(icon, title, message, href, actionLabel) {
  return `
    <div class="state-block" style="width:100%;">
      <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
      <h3>${title}</h3>
      <p>${message}</p>
      ${href ? `<a href="${href}" class="btn btn--primary" data-link>${actionLabel}</a>` : ''}
    </div>`;
}

function errorState() {
  return `
    <div class="state-block" style="width:100%;">
      <span class="material-symbols-rounded" aria-hidden="true">error</span>
      <h3>Couldn't load this section</h3>
      <p>Check your connection and try refreshing the page.</p>
    </div>`;
  }
