// Quick mode: one plain, fully static page per language, rendered at build time in Node from the
// same JSON as the app. No DOM APIs here. Every piece of data goes through `escape()`.
import { formatDuration, formatPeriod, monthsIn, totalExperience } from '../core/experience.js';
import { createTranslator } from '../core/i18n.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const SAFE_URL = /^(https:\/\/|mailto:|[a-z0-9][a-z0-9/._-]*$)/i;
const CATEGORIES = ['core', 'secondary', 'tools', 'office'];

export function escape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** `{{keyword}}` → <strong>; everything else escaped. */
export function rich(text) {
  return String(text)
    .split(/\{\{(.+?)\}\}/)
    .map((part, index) => (index % 2 ? `<strong>${escape(part)}</strong>` : escape(part)))
    .join('');
}

/** Only https, mailto and site-relative links are rendered; anything else becomes plain text. */
function link(href, label, base) {
  if (!href || !SAFE_URL.test(href)) return escape(label);
  const external = href.startsWith('https://');
  const url = external || href.startsWith('mailto:') ? href : `${base}${href}`;
  const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${escape(url)}"${attributes}>${escape(label)}</a>`;
}

const list = (items, render) =>
  items.length ? `<ul>${items.map((item) => `<li>${render(item)}</li>`).join('')}</ul>` : '';

function section(id, title, body) {
  if (!body) return '';
  return `<section aria-labelledby="${id}"><h2 id="${id}">${escape(title)}</h2>${body}</section>`;
}

function questEntry(quest, t, lang) {
  const meta = [
    quest.org,
    quest.location,
    quest.period && formatPeriod(quest.period, lang, t('status.current')),
  ].filter(Boolean);
  return [
    `<h3>${escape(quest.title)}</h3>`,
    meta.length ? `<p class="meta">${meta.map(escape).join(' · ')}</p>` : '',
    `<p>${rich(quest.summary)}</p>`,
    list(quest.details ?? [], rich),
  ].join('');
}

function projectEntry(project, t, lang, base) {
  const meta = [
    project.context,
    project.period && formatPeriod(project.period, lang, t('status.current')),
  ];
  const links = [
    project.links.demo && link(project.links.demo, t('detail.demo'), base),
    project.links.repo && link(project.links.repo, t('detail.repo'), base),
  ].filter(Boolean);
  return [
    `<h3>${escape(project.title)}</h3>`,
    `<p class="meta">${meta.filter(Boolean).map(escape).join(' · ')}</p>`,
    `<p>${rich(project.summary)}</p>`,
    project.role ? `<p>${escape(t('detail.role'))}: ${rich(project.role)}</p>` : '',
    list(project.highlights ?? [], rich),
    project.confidential ? `<p class="meta">${escape(t('detail.confidential'))}</p>` : '',
    links.length ? `<p class="links">${links.join(' · ')}</p>` : '',
  ].join('');
}

function techEntry(tech, t, jobs) {
  const months = tech.usedIn
    .map((id) => jobs.find((job) => job.id === id))
    .filter((job) => job?.period)
    .reduce((sum, job) => sum + monthsIn(job.period), 0);
  const years = months
    ? ` · ${escape(t('detail.years', { value: formatDuration(months, t) }))}`
    : '';
  return `${escape(tech.name)} <span class="meta">(${escape(t('quick.level', { value: tech.level }))}${years})</span>`;
}

/**
 * Renders the Quick mode page.
 * data: { ui, fallbackUi, profile, quests, sidequests, projects, tech, softskills } (parsed JSON)
 * options: { lang, base, siteUrl, alternate: { lang, href (absolute), path (site-relative) }, styles }
 */
export function renderQuickPage(data, { lang, base, siteUrl, alternate, styles = '' }) {
  const t = createTranslator(data.ui, data.fallbackUi);
  const { profile } = data;
  const quests = data.quests.items;
  const jobs = quests.filter((quest) => quest.kind === 'job');
  const learning = quests.filter((quest) =>
    ['education', 'certification', 'assessment'].includes(quest.kind),
  );
  const goals = quests.filter((quest) => quest.status === 'active');
  const experience = totalExperience(quests);
  const url = `${siteUrl}${lang === 'es' ? '' : `${lang}/`}quick/`;

  const contactValue = (item) =>
    item.href
      ? [link(item.href, item.value[0], base), ...item.value.slice(1).map(escape)].join(', ')
      : item.value.map(escape).join(', ');
  const contact = list(
    profile.keyItems,
    (item) => `<strong>${escape(item.name)}:</strong> ${contactValue(item)}`,
  );
  const skills = CATEGORIES.map((category) => {
    const items = data.tech.items.filter((tech) => tech.category === category);
    if (!items.length) return '';
    return `<h3>${escape(t(`weaponPages.${category}`))}</h3>${list(items, (tech) => techEntry(tech, t, jobs))}`;
  }).join('');

  const body = [
    section('quick-contact', t('quick.contact'), contact),
    section(
      'quick-experience',
      t('quick.experience'),
      jobs.map((quest) => `<article>${questEntry(quest, t, lang)}</article>`).join(''),
    ),
    section(
      'quick-projects',
      t('quick.projects'),
      data.projects.items
        .map((project) => `<article>${projectEntry(project, t, lang, base)}</article>`)
        .join(''),
    ),
    section('quick-skills', t('quick.skills'), skills),
    section(
      'quick-soft-skills',
      t('quick.softSkills'),
      list(
        data.softskills.items,
        (skill) => `<strong>${escape(skill.name)}</strong>: ${escape(skill.description)}`,
      ),
    ),
    section(
      'quick-education',
      t('quick.education'),
      learning.map((quest) => `<article>${questEntry(quest, t, lang)}</article>`).join(''),
    ),
    section(
      'quick-goals',
      t('quick.goals'),
      goals.map((quest) => `<article>${questEntry(quest, t, lang)}</article>`).join(''),
    ),
    section(
      'quick-hobbies',
      t('quick.hobbies'),
      list(
        data.sidequests.items,
        (side) => `<strong>${escape(side.title)}</strong>: ${side.description.map(rich).join(' ')}`,
      ),
    ),
  ].join('');

  return `<!doctype html>
<html lang="${escape(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0f160e">
<title>${escape(`${profile.name} · ${t('quick.title')}`)}</title>
<meta name="description" content="${escape(t('meta.description'))}">
<link rel="canonical" href="${escape(url)}">
<link rel="alternate" hreflang="${escape(lang)}" href="${escape(url)}">
<link rel="alternate" hreflang="${escape(alternate.lang)}" href="${escape(alternate.href)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${escape(`${profile.name} · ${profile.role}`)}">
<meta property="og:description" content="${escape(t('meta.description'))}">
<meta property="og:url" content="${escape(url)}">
<meta property="og:image" content="${escape(`${siteUrl}og-image.png`)}">
<style>${styles}</style>
</head>
<body>
<a class="skip" href="#main">${escape(t('quick.skip'))}</a>
<header>
<p class="nav"><a href="${escape(base)}">${escape(t('quick.interactive'))}</a> · <a href="${escape(alternate.path)}" hreflang="${escape(alternate.lang)}" lang="${escape(alternate.lang)}">${escape(t('quick.otherLanguage'))}</a></p>
<h1>${escape(profile.name)}</h1>
<p class="role">${escape(profile.role)}</p>
${profile.available ? `<p class="badge">${escape(t('availability'))}</p>` : ''}
<p class="meta">${escape(t('hud.hearts', experience))}</p>
</header>
<main id="main">
<section aria-label="${escape(t('quick.summary'))}">${profile.summary.map((paragraph) => `<p>${rich(paragraph)}</p>`).join('')}</section>
${body}
</main>
<footer><p>${escape(t('meta.disclaimer'))}</p></footer>
</body>
</html>
`;
}
