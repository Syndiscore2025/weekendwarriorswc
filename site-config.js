// Site configuration - registration nav tabs + section visibility
// Reads data/registrations.json and data/site-sections.json (managed from the admin dashboard)

(function() {
  'use strict';

  // Public website sections the admin can show/hide (key = data-testid on the page)
  const PUBLIC_SECTIONS = [
    { key: 'hero-section', page: 'Home', label: 'Hero banner & slideshow' },
    { key: 'stats-strip', page: 'Home', label: 'Stats strip' },
    { key: 'welcome-section', page: 'Home', label: 'Welcome section' },
    { key: 'values-bento', page: 'About', label: 'Club values' },
    { key: 'coaching-card', page: 'About', label: 'Coaching staff intro' },
    { key: 'coaches-grid', page: 'About', label: 'Coach cards' },
    { key: 'practices-card', page: 'Schedule', label: 'Practice schedule' },
    { key: 'tournaments-card', page: 'Schedule', label: 'Upcoming tournaments' },
    { key: 'contact-form', page: 'Contact', label: 'Contact form' },
    { key: 'contact-info', page: 'Contact', label: 'Contact info' },
    { key: 'nav-about', page: 'Navigation', label: 'About tab' },
    { key: 'nav-schedule', page: 'Navigation', label: 'Schedule tab' },
    { key: 'nav-contact', page: 'Navigation', label: 'Contact tab' },
    { key: 'nav-usa-membership', page: 'Navigation', label: 'USA Wrestling Membership button' },
    { key: 'audio-toggle', page: 'All pages', label: 'Music play button' }
  ];

  function fetchJSON(path) {
    return fetch(`${path}?_=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null);
  }

  function openPrograms(registrations) {
    return registrations.programs.filter(p => p.status === 'open');
  }

  function programUrl(program) {
    return `winter-signups.html?program=${encodeURIComponent(program.id)}`;
  }

  function requestedProgramId() {
    return new URLSearchParams(window.location.search).get('program');
  }

  // Program shown on the sign-up page: ?program=<id>, otherwise the first open program
  function resolveProgram(registrations) {
    const id = requestedProgramId();
    if (id) return registrations.programs.find(p => p.id === id) || null;
    return openPrograms(registrations)[0] || null;
  }

  function isSignupPage() {
    return window.location.pathname.includes('winter-signups');
  }

  function applyHiddenSections(sections) {
    const hidden = (sections.public_hidden || []).filter(key => PUBLIC_SECTIONS.some(s => s.key === key));
    if (!hidden.length) return;
    const style = document.createElement('style');
    style.id = 'ww-hidden-sections';
    style.textContent = `${hidden.map(key => `[data-testid="${key}"]`).join(',')} { display: none !important; }`;
    document.head.appendChild(style);
  }

  function markStaticActive(placeholders) {
    if (!isSignupPage()) return;
    const id = requestedProgramId();
    const match = Array.from(placeholders).find(a => (id ? a.href.includes(`program=${id}`) : true));
    if (match) {
      match.classList.add('active');
      match.setAttribute('aria-current', 'page');
    }
  }

  function renderNav(registrations) {
    const placeholders = document.querySelectorAll('nav a[data-reg-nav]');
    if (!placeholders.length) return;
    if (!registrations) {
      markStaticActive(placeholders);
      return;
    }

    const anchor = placeholders[0];
    const current = isSignupPage() ? resolveProgram(registrations) : null;

    openPrograms(registrations).forEach(program => {
      const link = document.createElement('a');
      link.href = programUrl(program);
      link.className = 'winter-reg-btn';
      link.setAttribute('data-reg-nav', '');
      link.setAttribute('data-testid', `nav-reg-${program.id}`);
      if (program.nav_color) link.style.setProperty('--reg-color', program.nav_color);
      link.textContent = program.nav_label || `${program.town} Registration`;
      if (current && current.id === program.id) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      anchor.parentNode.insertBefore(link, anchor);
    });

    placeholders.forEach(el => el.remove());
  }

  const ready = Promise.all([
    fetchJSON('data/registrations.json'),
    fetchJSON('data/site-sections.json')
  ]).then(([registrations, sections]) => ({
    registrations: registrations && Array.isArray(registrations.programs) ? registrations : null,
    sections: sections || null
  }));

  ready.then(({ sections }) => {
    if (sections) applyHiddenSections(sections);
  });

  ready.then(({ registrations }) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderNav(registrations));
    } else {
      renderNav(registrations);
    }
  });

  window.WWSiteConfig = {
    PUBLIC_SECTIONS,
    ready,
    openPrograms,
    resolveProgram,
    programUrl
  };
})();
