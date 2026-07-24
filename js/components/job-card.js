import { escapeHTML } from '/js/core/utils.js';

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return 'Salary not disclosed';
  const period = salary.period ? `/${salary.period}` : '';
  if (salary.min && salary.max) return `\u20B9${salary.min.toLocaleString('en-IN')} - \u20B9${salary.max.toLocaleString('en-IN')}${period}`;
  return `\u20B9${(salary.min || salary.max).toLocaleString('en-IN')}${period}`;
}

export function renderJobCard(job) {
  const title = escapeHTML(job.title || 'Untitled role');
  const company = escapeHTML(job.companyName || 'A local employer');
  const city = escapeHTML(job.location?.city || '');
  const jobType = escapeHTML((job.type || '').replace('-', ' '));

  return `
    <a href="/jobs/${job.id}" class="job-card" data-link aria-label="${title} at ${company}">
      <div class="job-card__top">
        <div class="job-card__logo">
          <span class="material-symbols-rounded" aria-hidden="true">work</span>
        </div>
        <div>
          <h3 class="job-card__title">${title}</h3>
          <p class="job-card__company">${company}</p>
        </div>
      </div>
      <div class="job-card__meta">
        ${city ? `<span><span class="material-symbols-rounded" aria-hidden="true">location_on</span>${city}</span>` : ''}
        ${jobType ? `<span><span class="material-symbols-rounded" aria-hidden="true">schedule</span>${jobType}</span>` : ''}
      </div>
      <p class="job-card__salary">${formatSalary(job.salary)}</p>
    </a>`;
}
