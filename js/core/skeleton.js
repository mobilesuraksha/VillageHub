/**
 * Renders shimmering placeholder blocks into `container` while real data
 * loads. Call again with the real markup once data arrives (this simply
 * overwrites innerHTML, it doesn't track diffing).
 */
export function showSkeletons(container, type = 'card', count = 4) {
  if (!container) return;
  const renderers = { card, row, text };
  const render = renderers[type] || card;
  container.innerHTML = Array.from({ length: count }, render).join('');
}

function card() {
  return `
    <div class="listing-card" aria-hidden="true">
      <div class="skeleton skeleton-card"></div>
      <div class="listing-card__body">
        <div class="skeleton skeleton-line w-40" style="height:18px;"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-line w-40"></div>
      </div>
    </div>`;
}

function row() {
  return `
    <div class="job-card" aria-hidden="true">
      <div class="job-card__top">
        <div class="skeleton" style="width:44px;height:44px;border-radius:var(--radius-md);flex-shrink:0;"></div>
        <div style="flex:1;">
          <div class="skeleton skeleton-line w-60" style="height:16px;margin-top:0;"></div>
          <div class="skeleton skeleton-line w-40"></div>
        </div>
      </div>
    </div>`;
}

function text() {
  return `<div class="skeleton skeleton-line w-60" style="height:16px;"></div>`;
}
