// Admin: Registration seasons, per-program sign-ups, archives, and show/hide sections
// Shared by admin.html and admin-enhanced.html. Exposes window.WWRegAdmin.

(function() {
  'use strict';

  const API_URL = 'https://api.weekendwarriorswc.com';
  const REG_FILE = 'data/registrations.json';
  const SECTIONS_FILE = 'data/site-sections.json';
  const STATUS_STYLES = {
    open: { label: 'Open', color: '#28a745' },
    closed: { label: 'Closed', color: '#999' },
    archived: { label: 'Archived', color: '#666' }
  };
  const FORM_FIELDS = [
    { key: 'town', label: 'Town *', placeholder: 'e.g., Winsted' },
    { key: 'season_name', label: 'Season Name *', placeholder: 'e.g., 2027 Summer Session' },
    { key: 'nav_label', label: 'Website Tab Label', placeholder: 'e.g., Winsted Summer Registration (auto if blank)' },
    { key: 'dates', label: 'Season Dates *', placeholder: 'e.g., July 6 - August 26, 2027' },
    { key: 'practice_schedule', label: 'Practice Days / Times', placeholder: 'e.g., Tuesdays & Thursdays · 6:30 - 8:00 PM' },
    { key: 'location', label: 'Location', placeholder: 'e.g., Gilbert High School Wrestling Room' },
    { key: 'grades', label: 'Grades', placeholder: 'e.g., 3-8' },
    { key: 'price', label: 'Price', placeholder: 'e.g., $200 Resident / $220 Non-Resident' },
    { key: 'price_note', label: 'Fee Note (optional)', placeholder: 'e.g., ***$200 FEE PAID THE FIRST DAY OF PRACTICE***' },
    { key: 'eligibility_note', label: 'Eligibility Note (optional)', placeholder: 'e.g., Open to Winsted residents only at this time' },
    { key: 'zip_placeholder', label: 'Zip Code Example (optional)', placeholder: 'e.g., 06098' },
    { key: 'flyer_image', label: 'Flyer Image Path (optional)', placeholder: 'e.g., media/winsted-winter-2026-flyer.png' }
  ];
  const COPY_FIELDS = ['town', 'practice_schedule', 'location', 'grades', 'price', 'price_note', 'eligibility_note', 'zip_placeholder', 'nav_color'];

  function esc(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Reads fresh from GitHub through the API (null if the file does not exist yet)
  async function load(path) {
    const res = await fetch(`${API_URL}/load?file=${encodeURIComponent(path)}&_=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function save(path, data) {
    const res = await fetch(`${API_URL}/save?_=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      body: JSON.stringify({ file: path, content: JSON.stringify(data, null, 2) })
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status} ${res.statusText}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Save failed');
    return result;
  }

  async function getRegistrations() {
    const data = await load(REG_FILE);
    return data && Array.isArray(data.programs) ? data : { programs: [] };
  }

  async function loadSignups(file) {
    const data = await load(file);
    return Array.isArray(data) ? data : [];
  }

  function programName(program) {
    return `${program.town} ${program.season_name || ''}`.trim();
  }

  // All sign-ups from open/closed (non-archived) programs, tagged with their program
  async function loadAllActiveSignups() {
    const reg = await getRegistrations();
    const active = reg.programs.filter(p => p.status !== 'archived');
    const lists = await Promise.all(active.map(p => loadSignups(p.data_file)));
    return lists.flatMap((list, i) => list.map(s => ({
      ...s,
      program_id: s.program_id || active[i].id,
      program_name: s.program_name || programName(active[i])
    })));
  }

  function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function uniqueId(reg, base) {
    let id = slugify(base) || 'registration';
    let n = 2;
    const original = id;
    while (reg.programs.some(p => p.id === id)) id = `${original}-${n++}`;
    return id;
  }

  function defaultNavLabel(town, seasonName) {
    const word = String(seasonName || '').replace(/^\d{4}(-\d{2,4})?\s+/, '').replace(/\s+(season|session)$/i, '');
    return `${town} ${word} Registration`.replace(/\s+/g, ' ').trim();
  }

  function sameSignup(a, b) {
    return a.submitted_at === b.submitted_at && a.wrestler_name === b.wrestler_name;
  }

  function swatch(color) {
    return `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;background:${esc(color || '#E51400')};border:1px solid #fff3;"></span>`;
  }

  function statusBadge(status) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.closed;
    return `<span style="display:inline-block;padding:0.15rem 0.55rem;border-radius:10px;font-size:0.8rem;font-weight:700;color:#fff;background:${s.color};">${s.label}</span>`;
  }

  // Moves a program's sign-ups into data/archive/ and retires it from the website
  async function archiveProgram(program) {
    const signups = await loadSignups(program.data_file);
    const archiveFile = `data/archive/${program.id}-signups.json`;
    await save(archiveFile, signups);
    if (signups.length) await save(program.data_file, []);
    program.status = 'archived';
    program.archived_at = new Date().toISOString();
    program.archive_file = archiveFile;
    program.archived_count = signups.length;
  }

  // ---------------------------------------------------------------------------
  // Registration seasons manager
  // ---------------------------------------------------------------------------
  const LABEL_STYLE = 'display:block;margin-bottom:0.35rem;color:#aaa;font-weight:600;';
  const EMPTY_CELL_STYLE = 'text-align:center;padding:1.5rem;color:#aaa;';

  function seasonManagerHtml(active) {
    const rows = active.length ? active.map(p => `
      <tr data-program="${esc(p.id)}">
        <td data-label="Website Tab">${swatch(p.nav_color)} <strong>${esc(p.nav_label || defaultNavLabel(p.town, p.season_name))}</strong></td>
        <td data-label="Season">${esc(programName(p))}</td>
        <td data-label="Dates">${esc(p.dates)}</td>
        <td data-label="Status">${statusBadge(p.status)}</td>
        <td data-label="Sign-Ups" data-count-for="${esc(p.id)}">-</td>
        <td class="right" style="white-space:nowrap;">
          <button class="secondary" data-act="edit">Edit</button>
          <button class="${p.status === 'open' ? 'secondary' : 'success'}" data-act="toggle">${p.status === 'open' ? 'Close' : 'Open'}</button>
          <button class="danger" data-act="archive">Archive</button>
        </td>
      </tr>`).join('') : `<tr><td colspan="6" style="${EMPTY_CELL_STYLE}">No active registrations. Create one below.</td></tr>`;

    return `
      <div class="content-card reg-manager">
        <h2>Registration Seasons</h2>
        <p class="note"><strong>Open</strong> = tab shows on the website and accepts sign-ups. <strong>Closed</strong> = tab hidden from the website.
        <strong>Archive</strong> = retire the season; its sign-ups move to an archive file (still viewable below).</p>
        <div class="table-container">
          <table class="admin-list">
            <thead><tr><th>Website Tab</th><th>Season</th><th>Dates</th><th>Status</th><th>Sign-Ups</th><th class="right">Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="margin-top:1rem;"><button class="primary" data-act="new">+ New Registration Season</button></div>
        <div class="reg-season-form" style="display:none;margin-top:1.25rem;padding:1.25rem;border:1px solid #444;border-radius:8px;background:rgba(0,0,0,0.25);">
          <h3 class="reg-form-title" style="margin-bottom:1rem;">New Registration Season</h3>
          <div class="reg-replaces-wrap" style="margin-bottom:1rem;">
            <label style="${LABEL_STYLE}">Replaces (archives) existing registration</label>
            <select data-field="replaces" style="width:100%;">
              <option value="">None - add alongside current registrations</option>
              ${active.map(p => `<option value="${esc(p.id)}">${esc(programName(p))}</option>`).join('')}
            </select>
            <div style="color:#888;font-size:0.85rem;margin-top:0.35rem;">Choosing one copies its details into the form and archives it when you save, so the new season replaces it on the website.</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0.85rem 1rem;">
            ${FORM_FIELDS.map(f => `
              <div>
                <label style="${LABEL_STYLE}">${esc(f.label)}</label>
                <input type="text" data-field="${f.key}" placeholder="${esc(f.placeholder)}" style="width:100%;">
              </div>`).join('')}
            <div>
              <label style="${LABEL_STYLE}">Website Tab Color</label>
              <input type="color" data-field="nav_color" value="#E51400" style="width:100%;height:42px;padding:2px;">
            </div>
            <div>
              <label style="${LABEL_STYLE}">Status</label>
              <select data-field="status" style="width:100%;">
                <option value="open">Open (tab shows on website)</option>
                <option value="closed">Closed (tab hidden)</option>
              </select>
            </div>
          </div>
          <div style="margin-top:1rem;display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
            <button class="success" data-act="save">Save Registration</button>
            <button class="secondary" data-act="cancel">Cancel</button>
          </div>
        </div>
      </div>`;
  }

  function signupCardHtml(p) {
    const details = [p.dates, p.practice_schedule].filter(Boolean).join(' · ');
    return `
      <div class="content-card reg-signups-card" data-program="${esc(p.id)}">
        <h2 style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          ${swatch(p.nav_color)} <span>${esc(programName(p))} Sign-Ups</span>
          <span data-count-for="${esc(p.id)}" data-count-style="head" style="color:#aaa;font-size:1rem;"></span>
          ${statusBadge(p.status)}
        </h2>
        <p class="note">${esc(details)}${p.location ? ` @ ${esc(p.location)}` : ''}</p>
        <div class="table-container">
          <table class="admin-list">
            <thead><tr><th>Parent Name</th><th>Wrestler Name</th><th>DOB</th><th>Grade</th><th>Weight</th><th>Phone</th><th>Email</th><th>Town</th><th>Submitted</th><th class="right">Actions</th></tr></thead>
            <tbody class="reg-signup-rows"></tbody>
          </table>
        </div>
      </div>`;
  }

  function archivedHtml(archived) {
    if (!archived.length) return '';
    return `
      <div class="content-card reg-archived">
        <h2>Archived Registrations</h2>
        <p class="note">Past seasons. Sign-ups are kept in archive files and are read-only here.</p>
        <div class="table-container">
          <table class="admin-list">
            <thead><tr><th>Season</th><th>Dates</th><th>Archived</th><th>Sign-Ups</th><th class="right">Actions</th></tr></thead>
            <tbody>
              ${archived.map(p => `
                <tr>
                  <td data-label="Season">${swatch(p.nav_color)} ${esc(programName(p))}</td>
                  <td data-label="Dates">${esc(p.dates)}</td>
                  <td data-label="Archived">${p.archived_at ? esc(new Date(p.archived_at).toLocaleDateString()) : '-'}</td>
                  <td data-label="Sign-Ups">${p.archived_count != null ? esc(p.archived_count) : '-'}</td>
                  <td class="right"><button class="secondary" data-archive-view="${esc(p.id)}">View</button></td>
                </tr>
                <tr data-archive-detail="${esc(p.id)}" style="display:none;"><td colspan="5"></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function onRoster(roster, signup) {
    return roster.some(m => m.wrestler_name === signup.wrestler_name && m.wrestler_dob === signup.wrestler_dob);
  }

  function renderSignupRows(container, program, signups, ctx) {
    container.querySelectorAll(`[data-count-for="${CSS.escape(program.id)}"]`).forEach(el => {
      el.textContent = el.dataset.countStyle === 'head' ? `(${signups.length})` : String(signups.length);
    });

    const card = container.querySelector(`.reg-signups-card[data-program="${CSS.escape(program.id)}"]`);
    const tbody = card.querySelector('.reg-signup-rows');
    if (!signups.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="${EMPTY_CELL_STYLE}">No registrations yet</td></tr>`;
      return;
    }

    tbody.innerHTML = signups.map((s, i) => {
      const submitted = s.submitted_at ? new Date(s.submitted_at) : null;
      let teamControl;
      if (ctx.teamMode === 'roster') {
        teamControl = onRoster(ctx.roster, s)
          ? '<span style="color:#28a745;font-weight:600;">✓ On Team</span>'
          : `<button class="success" data-signup-act="team" data-i="${i}" style="font-size:0.8rem;padding:0.4rem 0.6rem;white-space:nowrap;">Add to Team</button>`;
      } else {
        teamControl = `<button class="${s.on_team ? 'secondary' : 'primary'}" data-signup-act="team" data-i="${i}" style="font-size:0.8rem;padding:0.4rem 0.6rem;white-space:nowrap;min-width:100px;">${s.on_team ? '✓ On Team' : '+ Add to Team'}</button>`;
      }
      return `
        <tr>
          <td data-label="Parent">${esc(s.parent_name)}</td>
          <td data-label="Wrestler"><strong>${esc(s.wrestler_name)}</strong></td>
          <td data-label="DOB">${esc(s.wrestler_dob)}</td>
          <td data-label="Grade">${esc(s.wrestler_grade)}</td>
          <td data-label="Weight">${s.wrestler_weight ? `${esc(s.wrestler_weight)} lbs` : '-'}</td>
          <td data-label="Phone">${esc(s.phone)}</td>
          <td data-label="Email">${esc(s.email)}</td>
          <td data-label="Town">${esc(s.town || '-')}</td>
          <td data-label="Submitted">${submitted ? `${esc(submitted.toLocaleDateString())}<br><small style="color:#aaa;">${esc(submitted.toLocaleTimeString())}</small>` : ''}</td>
          <td class="right" style="padding:0.5rem;">
            <div style="display:flex;flex-direction:column;gap:0.4rem;align-items:stretch;">
              ${teamControl}
              <button class="danger" data-signup-act="delete" data-i="${i}" style="font-size:0.8rem;padding:0.4rem 0.6rem;">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-signup-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const signup = signups[Number(btn.dataset.i)];
        btn.disabled = true;
        const action = btn.dataset.signupAct === 'team' ? handleTeam : handleDelete;
        action(container, program, signup, ctx).finally(() => { btn.disabled = false; });
      });
    });
  }

  async function handleTeam(container, program, signup, ctx) {
    try {
      if (ctx.teamMode === 'roster') {
        const roster = (await load('data/team-roster.json')) || [];
        if (onRoster(roster, signup)) {
          alert('This wrestler is already on the team roster.');
          return;
        }
        roster.push(signup);
        await save('data/team-roster.json', roster);
        ctx.roster = roster;
        renderSignupRows(container, program, ctx.cache[program.id], ctx);
        alert('✅ Added to team roster!');
      } else {
        const signups = await loadSignups(program.data_file);
        const target = signups.find(s => sameSignup(s, signup));
        if (!target) throw new Error('Registration not found - please refresh the page.');
        target.on_team = !target.on_team;
        await save(program.data_file, signups);
        ctx.cache[program.id] = signups;
        renderSignupRows(container, program, signups, ctx);
      }
      if (ctx.onChange) await ctx.onChange();
    } catch (e) {
      alert('❌ Error: ' + e.message);
    }
  }

  async function handleDelete(container, program, signup, ctx) {
    if (!confirm(`Delete the registration for ${signup.wrestler_name || 'this wrestler'}?`)) return;
    try {
      const signups = await loadSignups(program.data_file);
      const index = signups.findIndex(s => sameSignup(s, signup));
      if (index === -1) throw new Error('Registration not found - please refresh the page.');
      signups.splice(index, 1);
      await save(program.data_file, signups);
      ctx.cache[program.id] = signups;
      renderSignupRows(container, program, signups, ctx);
      if (ctx.onChange) await ctx.onChange();
      alert('✅ Registration deleted successfully!');
    } catch (e) {
      alert('❌ Error deleting registration: ' + e.message);
    }
  }

  function wireArchived(container, archived) {
    container.querySelectorAll('[data-archive-view]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const program = archived.find(p => p.id === btn.dataset.archiveView);
        const detail = container.querySelector(`[data-archive-detail="${CSS.escape(program.id)}"]`);
        if (detail.style.display !== 'none') {
          detail.style.display = 'none';
          btn.textContent = 'View';
          return;
        }
        detail.style.display = '';
        btn.textContent = 'Hide';
        const cell = detail.querySelector('td');
        cell.innerHTML = '<span style="color:#aaa;">Loading...</span>';
        try {
          const signups = program.archive_file ? await loadSignups(program.archive_file) : [];
          cell.innerHTML = signups.length ? `
            <table class="admin-list" style="width:100%;">
              <thead><tr><th>Parent Name</th><th>Wrestler Name</th><th>DOB</th><th>Grade</th><th>Phone</th><th>Email</th><th>Town</th><th>Submitted</th></tr></thead>
              <tbody>${signups.map(s => `
                <tr>
                  <td data-label="Parent">${esc(s.parent_name)}</td>
                  <td data-label="Wrestler">${esc(s.wrestler_name)}</td>
                  <td data-label="DOB">${esc(s.wrestler_dob)}</td>
                  <td data-label="Grade">${esc(s.wrestler_grade)}</td>
                  <td data-label="Phone">${esc(s.phone)}</td>
                  <td data-label="Email">${esc(s.email)}</td>
                  <td data-label="Town">${esc(s.town || '-')}</td>
                  <td data-label="Submitted">${s.submitted_at ? esc(new Date(s.submitted_at).toLocaleDateString()) : ''}</td>
                </tr>`).join('')}
              </tbody>
            </table>` : '<span style="color:#aaa;">No sign-ups in this archive.</span>';
        } catch (e) {
          cell.innerHTML = `<span style="color:#ff5252;">Error loading archive: ${esc(e.message)}</span>`;
        }
      });
    });
  }

  function wireManager(container, reg, active, ctx) {
    const card = container.querySelector('.reg-manager');
    const form = card.querySelector('.reg-season-form');
    const field = key => form.querySelector(`[data-field="${key}"]`);
    let editingId = null;

    function openForm(program) {
      editingId = program ? program.id : null;
      const values = program || { grades: '3-8', price: '$200' };
      form.querySelector('.reg-form-title').textContent = program ? `Edit: ${programName(program)}` : 'New Registration Season';
      form.querySelector('.reg-replaces-wrap').style.display = program ? 'none' : '';
      field('replaces').value = '';
      FORM_FIELDS.forEach(f => { field(f.key).value = values[f.key] || ''; });
      field('nav_color').value = values.nav_color || '#E51400';
      field('status').value = values.status === 'closed' ? 'closed' : 'open';
      form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Runs a change, then reloads the whole registrations view from the saved data
    async function runAndRerender(btn, change, successMessage) {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = 'Saving...';
      try {
        await change();
        if (successMessage) alert(successMessage);
      } catch (e) {
        alert('❌ Error: ' + e.message);
      }
      await renderRegistrations(container, ctx.options);
      if (ctx.onChange) await ctx.onChange();
      btn.textContent = originalText;
      btn.disabled = false;
    }

    async function saveForm(btn) {
      const values = {};
      FORM_FIELDS.forEach(f => { values[f.key] = field(f.key).value.trim(); });
      values.nav_color = field('nav_color').value;
      values.status = field('status').value;
      if (!values.town || !values.season_name || !values.dates) {
        alert('Town, Season Name, and Season Dates are required.');
        return;
      }
      if (!values.nav_label) values.nav_label = defaultNavLabel(values.town, values.season_name);
      const replaced = editingId ? null : reg.programs.find(p => p.id === field('replaces').value);

      await runAndRerender(btn, async () => {
        if (editingId) {
          const program = reg.programs.find(p => p.id === editingId);
          Object.assign(program, values, { updated_at: new Date().toISOString() });
        } else {
          const id = uniqueId(reg, `${values.town}-${values.season_name}`);
          const program = { id, ...values, data_file: `data/signups-${id}.json`, created_at: new Date().toISOString() };
          await save(program.data_file, []);
          if (replaced) {
            await archiveProgram(replaced);
            reg.programs.splice(reg.programs.indexOf(replaced), 0, program);
          } else {
            reg.programs.push(program);
          }
        }
        await save(REG_FILE, reg);
      }, editingId
        ? '✅ Registration updated. The website will reflect changes in a few minutes.'
        : '✅ Registration created. It will appear on the website in a few minutes.');
    }

    field('replaces').addEventListener('change', () => {
      const source = active.find(p => p.id === field('replaces').value);
      if (!source) return;
      COPY_FIELDS.forEach(key => { if (source[key]) field(key).value = source[key]; });
    });

    card.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const row = btn.closest('tr[data-program]');
      const program = row ? reg.programs.find(p => p.id === row.dataset.program) : null;

      switch (btn.dataset.act) {
        case 'new':
          openForm(null);
          break;
        case 'cancel':
          form.style.display = 'none';
          break;
        case 'edit':
          if (program) openForm(program);
          break;
        case 'toggle':
          if (!program) break;
          await runAndRerender(btn, async () => {
            program.status = program.status === 'open' ? 'closed' : 'open';
            await save(REG_FILE, reg);
          });
          break;
        case 'archive': {
          if (!program) break;
          const count = (ctx.cache[program.id] || []).length;
          if (!confirm(`Archive "${programName(program)}"?\n\nIts tab will be removed from the website and its ${count} sign-up(s) moved to the archive.`)) break;
          await runAndRerender(btn, async () => {
            await archiveProgram(program);
            await save(REG_FILE, reg);
          }, '✅ Registration archived.');
          break;
        }
        case 'save':
          await saveForm(btn);
          break;
      }
    });
  }

  async function renderRegistrations(container, options = {}) {
    const ctx = {
      teamMode: options.teamMode || 'flag',
      onChange: options.onChange || null,
      roster: [],
      cache: {},
      options
    };
    container.innerHTML = '<div class="content-card"><h2>Registrations</h2><p class="note">Loading registrations...</p></div>';

    try {
      const reg = await getRegistrations();
      const active = reg.programs.filter(p => p.status !== 'archived');
      const archived = reg.programs.filter(p => p.status === 'archived');
      const [lists, roster] = await Promise.all([
        Promise.all(active.map(p => loadSignups(p.data_file))),
        ctx.teamMode === 'roster' ? load('data/team-roster.json') : null
      ]);
      ctx.roster = roster || [];

      container.innerHTML = seasonManagerHtml(active) + active.map(signupCardHtml).join('') + archivedHtml(archived);
      active.forEach((p, i) => {
        ctx.cache[p.id] = lists[i];
        renderSignupRows(container, p, lists[i], ctx);
      });
      wireManager(container, reg, active, ctx);
      wireArchived(container, archived);
    } catch (e) {
      container.innerHTML = `<div class="content-card"><h2>Registrations</h2><p class="note" style="color:#ff5252;">Error loading registrations: ${esc(e.message)}</p></div>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Show / hide sections (admin dashboard + public website)
  // ---------------------------------------------------------------------------
  async function getHiddenAdminSections(adminKey) {
    try {
      const sections = await load(SECTIONS_FILE);
      return (sections && Array.isArray(sections[adminKey])) ? sections[adminKey] : [];
    } catch (e) {
      console.error('Error loading section settings:', e);
      return [];
    }
  }

  function checkboxGrid(items, hidden, group) {
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0.5rem 1rem;">
        ${items.map(item => `
          <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;padding:0.5rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid #333;border-radius:6px;">
            <input type="checkbox" data-group="${group}" value="${esc(item.key)}" ${hidden.has(item.key) ? '' : 'checked'} style="width:18px;height:18px;flex-shrink:0;">
            <span>${item.page ? `<span style="color:#888;font-size:0.8rem;">${esc(item.page)} · </span>` : ''}${esc(item.label)}</span>
          </label>`).join('')}
      </div>`;
  }

  // options: { adminKey, adminSections: [{ key, label }], onApply(hiddenAdminKeys) }
  async function renderSectionsManager(container, options) {
    const publicSections = (window.WWSiteConfig && window.WWSiteConfig.PUBLIC_SECTIONS) || [];
    container.innerHTML = '<div class="content-card"><h2>Show / Hide Sections</h2><p class="note">Loading...</p></div>';

    let sections;
    try {
      sections = (await load(SECTIONS_FILE)) || {};
    } catch (e) {
      container.innerHTML = `<div class="content-card"><h2>Show / Hide Sections</h2><p class="note" style="color:#ff5252;">Error loading section settings: ${esc(e.message)}</p></div>`;
      return;
    }
    const publicHidden = new Set(sections.public_hidden || []);
    const adminHidden = new Set(sections[options.adminKey] || []);

    container.innerHTML = `
      <div class="content-card">
        <h2>Show / Hide Sections</h2>
        <p class="note">Uncheck any section you don't want, then click Save. Hidden sections are not deleted and can be turned back on at any time.</p>
        <h3 style="margin:1rem 0 0.75rem;">Admin Dashboard</h3>
        ${checkboxGrid(options.adminSections, adminHidden, 'admin')}
        <h3 style="margin:1.5rem 0 0.75rem;">Public Website</h3>
        ${checkboxGrid(publicSections, publicHidden, 'public')}
        <div style="margin-top:1.25rem;display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
          <button class="success" data-sections-save>Save Sections</button>
          <span data-sections-status class="muted"></span>
        </div>
      </div>`;

    const saveBtn = container.querySelector('[data-sections-save]');
    const status = container.querySelector('[data-sections-status]');
    saveBtn.addEventListener('click', async () => {
      const unchecked = group => Array.from(container.querySelectorAll(`input[data-group="${group}"]`))
        .filter(cb => !cb.checked)
        .map(cb => cb.value);
      saveBtn.disabled = true;
      status.textContent = 'Saving...';
      try {
        const latest = (await load(SECTIONS_FILE)) || {};
        latest.public_hidden = unchecked('public');
        latest[options.adminKey] = unchecked('admin');
        await save(SECTIONS_FILE, latest);
        if (options.onApply) options.onApply(latest[options.adminKey]);
        status.textContent = '✅ Saved. Website changes appear in a few minutes.';
      } catch (e) {
        status.textContent = '';
        alert('❌ Error saving sections: ' + e.message);
      }
      saveBtn.disabled = false;
    });
  }

  window.WWRegAdmin = {
    renderRegistrations,
    renderSectionsManager,
    getHiddenAdminSections,
    loadAllActiveSignups
  };
})();
