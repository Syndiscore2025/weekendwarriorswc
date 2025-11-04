// Enhanced Admin Dashboard JavaScript
// Weekend Warriors Wrestling Club

const $ = (id) => document.getElementById(id);
const authView = $('auth-view');
const dash = $('dash');
const authError = $('auth-error');

// API Configuration
const API_URL = 'https://api.weekendwarriorswc.com';

// ============================================================================
// THEME TOGGLE FUNCTIONALITY
// ============================================================================
function initThemeToggle() {
  const themeToggle = $('theme-toggle');
  const savedTheme = localStorage.getItem('theme');

  // Apply saved theme on load
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = 'Dark Mode';
  }

  // Theme toggle click handler
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');

    if (document.body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = 'Dark Mode';
    } else {
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = 'Light Mode';
    }
  });
}

// Initialize theme toggle on page load
document.addEventListener('DOMContentLoaded', initThemeToggle);

// Cache-busting function
const cacheBust = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
};

// Helper function to save data
async function saveData(file, content) {
  const response = await fetch(`${API_URL}/save?_=${Date.now()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify({ file, content })
  });

  if (!response.ok) {
    throw new Error(`Save failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

// Helper function to load JSON data
async function loadJSON(file) {
  try {
    const res = await fetch(cacheBust(`data/${file}`));
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    return await res.json();
  } catch (e) {
    console.error(`Error loading ${file}:`, e);
    return null;
  }
}

// Check if already signed in
if (sessionStorage.getItem('admin-auth') === 'true') {
  showDashboard();
}

// Sign in handler
$('sign-in').addEventListener('click', async () => {
  const password = $('password').value;
  authError.textContent = '';

  try {
    const res = await fetch('data/admin-password.json');
    const data = await res.json();

    if (password === data.password) {
      sessionStorage.setItem('admin-auth', 'true');
      showDashboard();
    } else {
      authError.textContent = 'Incorrect password';
    }
  } catch (e) {
    authError.textContent = 'Error loading password file';
  }
});

// Allow Enter key to sign in
$('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') $('sign-in').click();
});

// Sign out handler
$('sign-out').addEventListener('click', () => {
  sessionStorage.removeItem('admin-auth');
  // Show the entire sign-in card again
  const authCard = authView?.closest('.content-card');
  if (authCard) authCard.classList.remove('hidden');
  authView.classList.remove('hidden');
  dash.classList.add('hidden');
  $('sign-out').style.display = 'none';
});

function showDashboard() {
  // Hide the entire sign-in card and show dashboard
  const authCard = authView?.closest('.content-card');
  if (authCard) authCard.classList.add('hidden');
  authView.classList.add('hidden');
  dash.classList.remove('hidden');
  $('sign-out').style.display = 'block';
  initializeTabs();
  loadAllData();
}

// Tab Management
function initializeTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      $(`tab-${tabId}`).classList.add('active');
    });
  });
}

// Load all data
async function loadAllData() {
  console.log('Loading all data...');
  
  // Load existing data
  await Promise.allSettled([
    loadWebsiteTab(),
    loadRegistrationsTab(),
    loadTeamTab(),
    loadTournamentTab(),
    loadAttendanceTab(),
    loadWeightTab(),
    loadResultsTab(),
    loadPaymentsTab(),
    loadCommunicationTab(),
    loadPracticeTab(),
    loadPhotosTab(),
    loadEquipmentTab(),
    loadVolunteersTab(),
    loadMedicalTab(),
    loadSkillsTab(),
    loadSettingsTab()
  ]);
  
  console.log('All data loaded');
}

// ============================================================================
// WEBSITE TAB - Slideshow, Music, Schedule, Tournaments
// ============================================================================
async function loadWebsiteTab() {
  const container = $('tab-website');
  container.innerHTML = `
    <div class="content-card">
      <h2>Homepage Slideshow</h2>
      <div class="note">Upload images (JPG, PNG) or videos (MP4, WebM). Max 50MB per file.</div>
      <div class="stack">
        <div class="row" style="grid-template-columns: 2fr 1fr auto;">
          <input id="slide-file" type="file" accept="image/*,video/*" multiple />
          <input id="slide-caption" placeholder="Caption (optional)" />
          <button id="add-slide" class="success">Upload</button>
        </div>
        <div id="slide-upload-status" class="muted"></div>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th style="width: 20%;">Preview</th>
                <th style="width: 50%;">Caption</th>
                <th style="width: 15%;">Type</th>
                <th class="right" style="width: 15%;">Actions</th>
              </tr>
            </thead>
            <tbody id="slides-list"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="content-card">
      <h2>Background Music Settings</h2>
      <div class="stack">
        <!-- Global Music Control -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; background: linear-gradient(135deg, rgba(230,0,0,0.15) 0%, rgba(180,0,0,0.15) 100%); border-radius: 10px; border: 2px solid rgba(230,0,0,0.4); margin-bottom: 1rem;">
          <div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #e60000; margin-bottom: 0.25rem;">
              Global Music Control
            </div>
            <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">
              Enable or disable background music across the entire website
            </div>
          </div>
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
            <span id="music-status-text" style="font-weight: 600; color: #4db8ff; font-size: 0.95rem;">Enabled</span>
            <div style="position: relative; width: 60px; height: 30px; background: rgba(0,0,0,0.4); border-radius: 15px; border: 2px solid #4db8ff;" id="music-toggle-bg">
              <input type="checkbox" id="global-music-toggle" checked style="opacity: 0; width: 0; height: 0;">
              <div style="position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; background: #4db8ff; border-radius: 50%; box-shadow: 0 2px 8px rgba(77,184,255,0.5); transition: all 0.3s;" id="music-toggle-slider"></div>
            </div>
          </label>
        </div>

        <h3 style="margin-top: 1.5rem;">Music Playlist</h3>
        <div class="note">Upload MP3 files for background music. Music will play randomly from the playlist.</div>
        <div class="row" style="grid-template-columns: 2fr 1fr auto;">
          <input id="music-file" type="file" accept="audio/mp3,audio/mpeg" />
          <input id="music-title" placeholder="Song Title (optional)" />
          <button id="add-music" class="success">Upload</button>
        </div>
        <div id="music-upload-status" class="muted"></div>

        <div class="table-container" style="margin-top: 1rem;">
          <table class="admin-list">
            <thead>
              <tr>
                <th style="width: 50%;">Song Title</th>
                <th style="width: 30%;">File</th>
                <th class="right" style="width: 20%;">Actions</th>
              </tr>
            </thead>
            <tbody id="music-list"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="content-card">
      <h2>Recurring Practices</h2>
      <p class="note">Create recurring practice events that will display on the schedule page.</p>
      <div class="stack">
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr 1.5fr auto;">
          <select id="cal-day">
            <option value="">Select Day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <input id="cal-start-time" type="time" placeholder="Start Time" />
          <input id="cal-end-time" type="time" placeholder="End Time" />
          <input id="cal-start-date" type="date" placeholder="Start Date (optional)" />
          <input id="cal-group" placeholder="Group (e.g., All Groups)" />
          <button id="add-calendar-event" class="success">Add</button>
        </div>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Group</th>
                <th>Start Date</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="calendar-events-list"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="content-card">
      <h2>Upcoming Tournaments</h2>
      <div class="stack">
        <div class="row" style="grid-template-columns: 1fr 2fr 2fr 1fr auto;">
          <input id="t-date" type="date" placeholder="Date" />
          <input id="t-event" placeholder="Event Name" />
          <input id="t-location" placeholder="Location" />
          <input id="t-link" type="url" placeholder="Registration URL" />
          <button id="add-tournament" class="success">Add</button>
        </div>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Location</th>
                <th>Registration</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="tournament-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners and load data
  attachWebsiteEventListeners();
  await loadSlides();
  await loadMusicSettings();
  await loadCalendarEvents();
  await loadTournaments();
}

function attachWebsiteEventListeners() {
  $('add-slide')?.addEventListener('click', handleAddSlide);
  $('add-music')?.addEventListener('click', handleAddMusic);
  $('add-calendar-event')?.addEventListener('click', handleAddCalendarEvent);
  $('add-tournament')?.addEventListener('click', handleAddTournament);

  // Global music toggle
  const globalMusicToggle = $('global-music-toggle');
  if (globalMusicToggle) {
    const musicEnabled = localStorage.getItem('wwwc_music_enabled') !== 'false';
    globalMusicToggle.checked = musicEnabled;
    updateMusicToggleUI(musicEnabled);

    globalMusicToggle.addEventListener('change', function() {
      const enabled = this.checked;
      localStorage.setItem('wwwc_music_enabled', enabled.toString());
      updateMusicToggleUI(enabled);

      if (enabled) {
        alert('✅ Background music enabled! Music will play when you visit other pages.');
      } else {
        alert('🔇 Background music disabled globally. Music will stop on all pages.');
      }
    });
  }
}

function updateMusicToggleUI(enabled) {
  const statusText = $('music-status-text');
  const toggleBg = $('music-toggle-bg');
  const toggleSlider = $('music-toggle-slider');

  if (statusText) {
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.style.color = enabled ? '#4db8ff' : '#999';
  }

  if (toggleBg) {
    toggleBg.style.borderColor = enabled ? '#4db8ff' : '#666';
  }

  if (toggleSlider) {
    toggleSlider.style.left = enabled ? '32px' : '2px';
    toggleSlider.style.background = enabled ? '#4db8ff' : '#666';
  }
}

async function loadSlides() {
  const data = await loadJSON('slides.json');
  if (!data) return;
  
  const tbody = $('slides-list');
  tbody.innerHTML = '';
  
  data.forEach((row, i) => {
    const tr = document.createElement('tr');
    const isVideo = row.type === 'video';
    const preview = isVideo
      ? `<video src="${row.url}" style="width:80px;height:45px;object-fit:cover;" muted></video>`
      : `<img src="${row.url}" style="width:80px;height:45px;object-fit:cover;" />`;
    tr.innerHTML = `
      <td>${preview}</td>
      <td>${row.caption || ''}</td>
      <td>${row.type}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteSlide(i));
    tbody.appendChild(tr);
  });
}

async function handleAddSlide() {
  const files = $('slide-file').files;
  const caption = $('slide-caption').value.trim();
  const status = $('slide-upload-status');

  if (!files || files.length === 0) {
    return alert('Please select at least one file');
  }

  status.textContent = `Uploading ${files.length} file(s)...`;
  status.style.color = '#4db8ff';

  try {
    const slides = await loadJSON('slides.json') || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `slide-${Date.now()}-${i}-${file.name}`;
      const url = `media/${fileName}`;
      const type = file.type.startsWith('video') ? 'video' : 'image';

      status.textContent = `Uploading ${i + 1}/${files.length}: ${file.name}...`;

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `media/${fileName}`, content: base64 })
      });

      slides.push({ url, caption, type });
    }

    const saveRes = await saveData('data/slides.json', JSON.stringify(slides, null, 2));
    const result = await saveRes.json();
    
    if (result.success) {
      status.textContent = `✅ ${files.length} slide(s) uploaded successfully!`;
      status.style.color = '#00ff00';
      $('slide-file').value = '';
      $('slide-caption').value = '';
      await loadSlides();
    }
  } catch (err) {
    status.textContent = '❌ Error: ' + err.message;
    status.style.color = '#e60000';
  }
}

async function deleteSlide(index) {
  if (!confirm('Delete this slide?')) return;

  const slides = await loadJSON('slides.json');
  slides.splice(index, 1);

  const saveRes = await saveData('data/slides.json', JSON.stringify(slides, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Slide deleted successfully!');
    await loadSlides();
  }
}

// Music Settings Functions
async function loadMusicSettings() {
  const data = await loadJSON('music-playlist.json');
  if (!data) return;

  const tbody = $('music-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach((song, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${song.title || 'Untitled'}</td>
      <td>${song.filename || song.url.split('/').pop()}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteMusic(i));
    tbody.appendChild(tr);
  });
}

async function handleAddMusic() {
  const file = $('music-file').files[0];
  const title = $('music-title').value.trim();
  const status = $('music-upload-status');

  if (!file) {
    return alert('Please select an audio file');
  }

  status.textContent = 'Uploading music file...';
  status.style.color = '#4db8ff';

  try {
    const fileName = `music-${Date.now()}-${file.name}`;
    const url = `media/${fileName}`;

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `media/${fileName}`, content: base64 })
    });

    const playlist = await loadJSON('music-playlist.json') || [];
    playlist.push({
      url,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name
    });

    const saveRes = await saveData('data/music-playlist.json', JSON.stringify(playlist, null, 2));
    const result = await saveRes.json();

    if (result.success) {
      status.textContent = '✅ Music uploaded successfully!';
      status.style.color = '#00ff00';
      $('music-file').value = '';
      $('music-title').value = '';
      await loadMusicSettings();
    }
  } catch (err) {
    status.textContent = '❌ Error: ' + err.message;
    status.style.color = '#e60000';
  }
}

async function deleteMusic(index) {
  if (!confirm('Delete this music file?')) return;

  const playlist = await loadJSON('music-playlist.json');
  playlist.splice(index, 1);

  const saveRes = await saveData('data/music-playlist.json', JSON.stringify(playlist, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Music deleted successfully!');
    await loadMusicSettings();
  }
}

async function loadCalendarEvents() {
  const data = await loadJSON('calendar-events.json');
  if (!data) return;

  const tbody = $('calendar-events-list');
  tbody.innerHTML = '';

  data.forEach((event, i) => {
    const tr = document.createElement('tr');
    // Handle both old schema (time) and new schema (start_time, end_time)
    const timeDisplay = event.start_time && event.end_time
      ? `${event.start_time} - ${event.end_time}`
      : event.time || '-';

    tr.innerHTML = `
      <td>${event.day}</td>
      <td>${timeDisplay}</td>
      <td>${event.group}</td>
      <td>${event.start_date || 'Immediate'}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteCalendarEvent(i));
    tbody.appendChild(tr);
  });
}

async function handleAddCalendarEvent() {
  const day = $('cal-day').value;
  const startTime = $('cal-start-time').value;
  const endTime = $('cal-end-time').value;
  const startDate = $('cal-start-date').value;
  const group = $('cal-group').value.trim();

  if (!day || !startTime || !endTime || !group) {
    return alert('Please fill in all required fields');
  }

  const events = await loadJSON('calendar-events.json') || [];
  events.push({ day, start_time: startTime, end_time: endTime, start_date: startDate, group });

  const saveRes = await saveData('data/calendar-events.json', JSON.stringify(events, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Practice added successfully!');
    $('cal-day').value = '';
    $('cal-start-time').value = '';
    $('cal-end-time').value = '';
    $('cal-start-date').value = '';
    $('cal-group').value = '';
    await loadCalendarEvents();
  }
}

async function deleteCalendarEvent(index) {
  if (!confirm('Delete this practice?')) return;

  const events = await loadJSON('calendar-events.json');
  events.splice(index, 1);

  const saveRes = await saveData('data/calendar-events.json', JSON.stringify(events, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Practice deleted successfully!');
    await loadCalendarEvents();
  }
}

async function loadTournaments() {
  const data = await loadJSON('tournaments.json');
  if (!data) return;

  const tbody = $('tournament-list');
  tbody.innerHTML = '';

  data.forEach((t, i) => {
    const tr = document.createElement('tr');
    // Handle both old schema (event, url) and new schema (event_name, registration_url)
    const eventName = t.event_name || t.event || '-';
    const location = t.location || '-';
    const regUrl = t.registration_url || t.url || '';
    const regLink = regUrl
      ? `<a href="${regUrl}" target="_blank" style="color: #4db8ff;">Register</a>`
      : '-';

    tr.innerHTML = `
      <td>${t.date}</td>
      <td>${eventName}</td>
      <td>${location}</td>
      <td>${regLink}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteTournament(i));
    tbody.appendChild(tr);
  });
}

async function handleAddTournament() {
  const date = $('t-date').value;
  const eventName = $('t-event').value.trim();
  const location = $('t-location').value.trim();
  const link = $('t-link').value.trim();

  if (!date || !eventName || !location) {
    return alert('Please fill in date, event name, and location');
  }

  const tournaments = await loadJSON('tournaments.json') || [];
  tournaments.push({
    date,
    event_name: eventName,
    location,
    registration_url: link
  });

  const saveRes = await saveData('data/tournaments.json', JSON.stringify(tournaments, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Tournament added successfully!');
    $('t-date').value = '';
    $('t-event').value = '';
    $('t-location').value = '';
    $('t-link').value = '';
    await loadTournaments();
  }
}

async function deleteTournament(index) {
  if (!confirm('Delete this tournament?')) return;

  const tournaments = await loadJSON('tournaments.json');
  tournaments.splice(index, 1);

  const saveRes = await saveData('data/tournaments.json', JSON.stringify(tournaments, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Tournament deleted successfully!');
    await loadTournaments();
  }
}

// ============================================================================
// REGISTRATIONS TAB - Winter Sign-ups
// ============================================================================
async function loadRegistrationsTab() {
  const container = $('tab-registrations');
  container.innerHTML = `
    <div class="content-card">
      <h2>25-26 Winter Season Sign-Ups</h2>
      <p class="note">Partnership with Wethersfield Youth Wrestling Club - View all registrations</p>
      <div class="table-container">
        <table class="admin-list">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Wrestler Name</th>
              <th>DOB</th>
              <th>Grade</th>
              <th>Weight</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Town</th>
              <th>Submitted</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody id="winter-signups-list"></tbody>
        </table>
      </div>
    </div>
  `;

  await loadWinterSignups();
}

async function loadWinterSignups() {
  const data = await loadJSON('winter-signups.json');
  if (!data) return;

  // Load team roster once to check who's already on the team
  const roster = await loadJSON('team-roster.json') || [];

  const tbody = $('winter-signups-list');
  tbody.innerHTML = '';

  data.forEach((signup, i) => {
    const tr = document.createElement('tr');
    const submittedDate = new Date(signup.submitted_at).toLocaleDateString();

    // Check if wrestler is already on team roster
    const onTeam = roster.some(member =>
      member.wrestler_name === signup.wrestler_name &&
      member.wrestler_dob === signup.wrestler_dob
    );

    tr.innerHTML = `
      <td>${signup.parent_name}</td>
      <td>${signup.wrestler_name}</td>
      <td>${signup.wrestler_dob}</td>
      <td>${signup.wrestler_grade}</td>
      <td>${signup.wrestler_weight || '-'}</td>
      <td>${signup.phone}</td>
      <td>${signup.email}</td>
      <td>${signup.town || '-'}</td>
      <td>${submittedDate}</td>
      <td class='right'>
        ${!onTeam ? `<button class='success' style="margin-right: 0.5rem;" data-index='${i}'>Add to Team</button>` : '<span style="color: #28a745; font-weight: 600;">✓ On Team</span>'}
        <button class='danger' data-index='${i}'>Delete</button>
      </td>
    `;

    const addBtn = tr.querySelector('.success');
    if (addBtn) {
      addBtn.addEventListener('click', () => addToTeam(i));
    }

    tr.querySelector('.danger').addEventListener('click', () => deleteSignup(i));
    tbody.appendChild(tr);
  });
}

async function addToTeam(index) {
  const signups = await loadJSON('winter-signups.json');
  const signup = signups[index];

  // Add to team roster
  const roster = await loadJSON('team-roster.json') || [];

  // Check if already on team
  const alreadyOnTeam = roster.some(member =>
    member.wrestler_name === signup.wrestler_name &&
    member.wrestler_dob === signup.wrestler_dob
  );

  if (alreadyOnTeam) {
    alert('This wrestler is already on the team roster.');
    return;
  }

  roster.push(signup);

  await saveData('data/team-roster.json', JSON.stringify(roster, null, 2));

  alert('✅ Added to team roster!');
  await loadWinterSignups();
}

async function deleteSignup(index) {
  if (!confirm('Delete this registration?')) return;

  const signups = await loadJSON('winter-signups.json');
  signups.splice(index, 1);

  const saveRes = await saveData('data/winter-signups.json', JSON.stringify(signups, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Registration deleted successfully!');
    await loadWinterSignups();
  }
}

// ============================================================================
// TEAM TAB - Team Roster Management
// ============================================================================
async function loadTeamTab() {
  const container = $('tab-team');
  container.innerHTML = `
    <div class="content-card">
      <h2>Team Groups Management</h2>
      <p class="note">Create and manage different team groups (e.g., Beginners, Advanced, Experienced)</p>

      <div class="row" style="grid-template-columns: 2fr 1fr auto; margin-bottom: 1.5rem;">
        <input id="new-team-name" placeholder="Team Group Name (e.g., Beginners)" />
        <input id="new-team-color" type="color" value="#e60000" title="Team Color" />
        <button id="add-team-group" class="success">Create Team Group</button>
      </div>

      <div id="team-groups-list" style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;"></div>
    </div>

    <div class="content-card">
      <h2>Team Roster</h2>
      <p class="note">Manage team members and send mass emails</p>

      <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 250px;">
          <input type="text" id="team-search" placeholder="Search by name, email, or grade..." style="width: 100%;">
        </div>
        <div style="flex: 1; min-width: 200px;">
          <select id="team-filter" style="width: 100%;">
            <option value="">All Teams</option>
          </select>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="select-all-team" class="secondary">Select All</button>
          <button id="deselect-all-team" class="secondary">Deselect All</button>
          <button id="email-selected" class="primary">Email Selected (<span id="selected-count">0</span>)</button>
        </div>
      </div>

      <div class="table-container">
        <table class="admin-list">
          <thead>
            <tr>
              <th style="width: 4%;"><input type="checkbox" id="select-all-checkbox"></th>
              <th>Wrestler Name</th>
              <th>Team Group</th>
              <th>Grade</th>
              <th>Weight</th>
              <th>DOB</th>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody id="team-roster-list"></tbody>
        </table>
      </div>
    </div>
  `;

  attachTeamEventListeners();
  await loadTeamGroups();
  await loadTeamRoster();
}

function attachTeamEventListeners() {
  $('add-team-group')?.addEventListener('click', handleAddTeamGroup);
  $('team-search')?.addEventListener('input', filterTeamRoster);
  $('team-filter')?.addEventListener('change', filterTeamRoster);
  $('select-all-team')?.addEventListener('click', () => selectAllTeam(true));
  $('deselect-all-team')?.addEventListener('click', () => selectAllTeam(false));
  $('email-selected')?.addEventListener('click', emailSelectedTeam);
  $('select-all-checkbox')?.addEventListener('change', (e) => selectAllTeam(e.target.checked));
}

async function loadTeamRoster() {
  const data = await loadJSON('team-roster.json');
  const teams = await loadJSON('team-groups.json') || [];

  if (!data || data.length === 0) {
    $('team-roster-list').innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 2rem; color: #aaa;">No team members yet. Add wrestlers from the Registrations tab.</td></tr>';
    return;
  }

  const tbody = $('team-roster-list');
  tbody.innerHTML = '';

  data.forEach((member, i) => {
    const tr = document.createElement('tr');
    const teamGroup = teams.find(t => t.name === member.team_group);
    const teamColor = teamGroup ? teamGroup.color : '#666';

    tr.innerHTML = `
      <td><input type="checkbox" class="team-checkbox" data-index="${i}" data-email="${member.email}"></td>
      <td>${member.wrestler_name}</td>
      <td>
        <select class="team-group-select" data-index="${i}" style="background: ${teamColor}; color: #fff; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">
          <option value="">Unassigned</option>
          ${teams.map(t => `<option value="${t.name}" ${member.team_group === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </td>
      <td>${member.wrestler_grade}</td>
      <td>${member.wrestler_weight || '-'}</td>
      <td>${member.wrestler_dob}</td>
      <td>${member.parent_name}</td>
      <td>${member.email}</td>
      <td>${member.phone}</td>
      <td class='right'><button class='danger' data-index='${i}'>Remove</button></td>
    `;

    tr.querySelector('.team-checkbox').addEventListener('change', updateSelectedCount);
    tr.querySelector('.team-group-select').addEventListener('change', (e) => updateMemberTeam(i, e.target.value));
    tr.querySelector('.danger').addEventListener('click', () => removeFromTeam(i));
    tbody.appendChild(tr);
  });

  updateSelectedCount();
}

function filterTeamRoster() {
  const searchTerm = $('team-search').value.toLowerCase();
  const teamFilter = $('team-filter').value;
  const rows = document.querySelectorAll('#team-roster-list tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const teamSelect = row.querySelector('.team-group-select');
    const teamValue = teamSelect ? teamSelect.value : '';

    const matchesSearch = text.includes(searchTerm);
    const matchesTeam = !teamFilter || teamValue === teamFilter;

    row.style.display = (matchesSearch && matchesTeam) ? '' : 'none';
  });
}

function selectAllTeam(checked) {
  document.querySelectorAll('.team-checkbox').forEach(cb => {
    cb.checked = checked;
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = document.querySelectorAll('.team-checkbox:checked').length;
  const countSpan = $('selected-count');
  if (countSpan) countSpan.textContent = count;
}

function emailSelectedTeam() {
  const selected = Array.from(document.querySelectorAll('.team-checkbox:checked'));
  if (selected.length === 0) {
    return alert('Please select at least one team member');
  }

  const emails = selected.map(cb => cb.getAttribute('data-email')).join(',');
  window.location.href = `mailto:${emails}?subject=Weekend Warriors Wrestling Club`;
}

async function removeFromTeam(index) {
  if (!confirm('Remove this wrestler from the team roster?')) return;

  const roster = await loadJSON('team-roster.json');
  roster.splice(index, 1);

  const saveRes = await saveData('data/team-roster.json', JSON.stringify(roster, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Wrestler removed from team!');
    await loadTeamRoster();
  }
}

// Team Groups Management Functions
async function loadTeamGroups() {
  const teams = await loadJSON('team-groups.json') || [];
  const container = $('team-groups-list');
  const filterSelect = $('team-filter');

  if (!container) return;

  container.innerHTML = '';

  // Update filter dropdown
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">All Teams</option>';
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.name;
      option.textContent = team.name;
      filterSelect.appendChild(option);
    });
  }

  // Display team groups as badges
  teams.forEach((team, i) => {
    const badge = document.createElement('div');
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: ${team.color};
      color: #fff;
      border-radius: 25px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    badge.innerHTML = `
      <span>${team.name}</span>
      <button style="background: rgba(255,255,255,0.3); border: none; color: #fff; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold;" data-index="${i}">×</button>
    `;
    badge.querySelector('button').addEventListener('click', () => deleteTeamGroup(i));
    container.appendChild(badge);
  });
}

async function handleAddTeamGroup() {
  const name = $('new-team-name').value.trim();
  const color = $('new-team-color').value;

  if (!name) {
    return alert('Please enter a team group name');
  }

  const teams = await loadJSON('team-groups.json') || [];

  // Check for duplicate
  if (teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return alert('A team group with this name already exists');
  }

  teams.push({ name, color });

  const saveRes = await saveData('data/team-groups.json', JSON.stringify(teams, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Team group created successfully!');
    $('new-team-name').value = '';
    $('new-team-color').value = '#e60000';
    await loadTeamGroups();
    await loadTeamRoster();
  }
}

async function deleteTeamGroup(index) {
  const teams = await loadJSON('team-groups.json');
  const teamName = teams[index].name;

  if (!confirm(`Delete team group "${teamName}"? Wrestlers in this group will be marked as Unassigned.`)) return;

  teams.splice(index, 1);

  const saveRes = await saveData('data/team-groups.json', JSON.stringify(teams, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Team group deleted!');
    await loadTeamGroups();
    await loadTeamRoster();
  }
}

async function updateMemberTeam(index, teamName) {
  const roster = await loadJSON('team-roster.json');
  roster[index].team_group = teamName;

  const saveRes = await saveData('data/team-roster.json', JSON.stringify(roster, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    await loadTeamRoster();
  }
}

// ============================================================================
// TOURNAMENT DAY ROSTER TAB - Manage Tournament Day Lineups
// ============================================================================
async function loadTournamentTab() {
  const container = $('tab-tournament');
  container.innerHTML = `
    <div class="content-card">
      <h2>Tournament Day Roster</h2>
      <p class="note">Select wrestlers for tournament day and assign mat numbers as announced by Flo-wrestling/tournament director</p>

      <div style="margin-bottom: 1.5rem;">
        <div class="row" style="grid-template-columns: 2fr 1fr auto; margin-bottom: 1rem;">
          <input id="tournament-name" placeholder="Tournament Name" />
          <input id="tournament-date" type="date" />
          <button id="create-tournament-roster" class="success">Create New Roster</button>
        </div>

        <div id="tournament-roster-selector" class="hidden">
          <h3>Select Wrestlers for Tournament</h3>
          <div style="margin-bottom: 1rem;">
            <button id="select-all-tournament" class="secondary">Select All</button>
            <button id="deselect-all-tournament" class="secondary">Deselect All</button>
          </div>
          <div id="tournament-wrestler-selection" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;"></div>
          <button id="generate-tournament-roster" class="primary">Generate Tournament Roster</button>
        </div>
      </div>

      <div id="tournament-print-area"></div>
    </div>
  `;

  attachTournamentEventListeners();
  await loadSavedTournamentRoster();
}

function attachTournamentEventListeners() {
  $('create-tournament-roster')?.addEventListener('click', showTournamentWrestlerSelection);
  $('select-all-tournament')?.addEventListener('click', () => selectAllTournamentWrestlers(true));
  $('deselect-all-tournament')?.addEventListener('click', () => selectAllTournamentWrestlers(false));
  $('generate-tournament-roster')?.addEventListener('click', generateTournamentRoster);
}

async function showTournamentWrestlerSelection() {
  const tournamentName = $('tournament-name').value.trim();
  const tournamentDate = $('tournament-date').value;

  if (!tournamentName || !tournamentDate) {
    return alert('Please enter tournament name and date');
  }

  const roster = await loadJSON('team-roster.json') || [];

  if (roster.length === 0) {
    return alert('No wrestlers in team roster. Add wrestlers from the Registrations tab first.');
  }

  const container = $('tournament-wrestler-selection');
  container.innerHTML = '';

  roster.forEach((wrestler, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 0.75rem; background: #2a2a2a; border: 1px solid #444; border-radius: 6px;';
    div.innerHTML = `
      <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
        <input type="checkbox" class="tournament-wrestler-checkbox" data-index="${i}" style="width: 18px; height: 18px;">
        <span style="font-weight: 600;">${wrestler.wrestler_name}</span>
        <span style="color: #aaa; font-size: 0.85rem;">(Grade ${wrestler.wrestler_grade}, ${wrestler.wrestler_weight || '?'} lbs)</span>
      </label>
    `;
    container.appendChild(div);
  });

  $('tournament-roster-selector').classList.remove('hidden');
}

function selectAllTournamentWrestlers(checked) {
  document.querySelectorAll('.tournament-wrestler-checkbox').forEach(cb => {
    cb.checked = checked;
  });
}

async function generateTournamentRoster() {
  const tournamentName = $('tournament-name').value.trim();
  const tournamentDate = $('tournament-date').value;
  const roster = await loadJSON('team-roster.json') || [];

  const selectedWrestlers = [];
  document.querySelectorAll('.tournament-wrestler-checkbox:checked').forEach(cb => {
    const index = parseInt(cb.dataset.index);
    selectedWrestlers.push(roster[index]);
  });

  if (selectedWrestlers.length === 0) {
    return alert('Please select at least one wrestler');
  }

  const printArea = $('tournament-print-area');
  printArea.innerHTML = `
    <div style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(230,0,0,0.2) 0%, rgba(180,0,0,0.2) 100%); border-radius: 10px; border: 2px solid #e60000;">
      <h2 style="margin: 0 0 0.5rem 0; color: #e60000;">${tournamentName}</h2>
      <p style="margin: 0; color: #ccc;">Date: ${new Date(tournamentDate).toLocaleDateString()}</p>
      <p style="margin: 0.5rem 0 0 0; color: #ccc;">Total Wrestlers: ${selectedWrestlers.length}</p>
      <button id="print-tournament-roster" class="primary no-print" style="margin-top: 1rem;">Print Roster</button>
      <button id="save-tournament-roster" class="success no-print" style="margin-top: 1rem; margin-left: 0.5rem;">Save Roster</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem;">
      ${selectedWrestlers.map((wrestler, i) => `
        <div class="tournament-wrestler-card" style="padding: 1.5rem; background: #2a2a2a; border: 2px solid #444; border-radius: 10px;">
          <div style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e60000;">
            <h3 style="margin: 0 0 0.25rem 0; color: #e60000; font-size: 1.25rem;">${wrestler.wrestler_name}</h3>
            <div style="color: #aaa; font-size: 0.9rem;">Grade ${wrestler.wrestler_grade}</div>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc; font-weight: 600;">Weight (lbs):</label>
            <input type="number" class="tournament-weight" data-index="${i}" value="${wrestler.wrestler_weight || ''}"
              style="width: 100%; padding: 0.75rem; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 6px; font-size: 1rem;"
              placeholder="Enter weight">
          </div>

          <div>
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc; font-weight: 600;">Mat Numbers (5 boxes):</label>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;">
              ${[1,2,3,4,5].map(n => `
                <input type="text" class="tournament-mat" data-index="${i}" data-mat="${n}"
                  style="padding: 0.75rem; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 6px; text-align: center; font-size: 1rem; font-weight: 600;"
                  placeholder="${n}">
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  $('print-tournament-roster')?.addEventListener('click', () => window.print());
  $('save-tournament-roster')?.addEventListener('click', () => saveTournamentRoster(tournamentName, tournamentDate, selectedWrestlers));
}

async function saveTournamentRoster(name, date, wrestlers) {
  const tournamentData = {
    name,
    date,
    wrestlers: wrestlers.map((w, i) => ({
      ...w,
      tournament_weight: document.querySelector(`.tournament-weight[data-index="${i}"]`)?.value || w.wrestler_weight,
      mat_numbers: [1,2,3,4,5].map(n =>
        document.querySelector(`.tournament-mat[data-index="${i}"][data-mat="${n}"]`)?.value || ''
      )
    }))
  };

  const saveRes = await saveData('data/tournament-roster.json', JSON.stringify(tournamentData, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Tournament roster saved successfully!');
  }
}

async function loadSavedTournamentRoster() {
  const data = await loadJSON('tournament-roster.json');
  if (!data) return;

  const printArea = $('tournament-print-area');
  printArea.innerHTML = `
    <div style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(230,0,0,0.2) 0%, rgba(180,0,0,0.2) 100%); border-radius: 10px; border: 2px solid #e60000;">
      <h2 style="margin: 0 0 0.5rem 0; color: #e60000;">${data.name}</h2>
      <p style="margin: 0; color: #ccc;">Date: ${new Date(data.date).toLocaleDateString()}</p>
      <p style="margin: 0.5rem 0 0 0; color: #ccc;">Total Wrestlers: ${data.wrestlers.length}</p>
      <button id="print-tournament-roster" class="primary no-print" style="margin-top: 1rem;">Print Roster</button>
      <button id="clear-tournament-roster" class="danger no-print" style="margin-top: 1rem; margin-left: 0.5rem;">Clear Roster</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem;">
      ${data.wrestlers.map((wrestler, i) => `
        <div class="tournament-wrestler-card" style="padding: 1.5rem; background: #2a2a2a; border: 2px solid #444; border-radius: 10px;">
          <div style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e60000;">
            <h3 style="margin: 0 0 0.25rem 0; color: #e60000; font-size: 1.25rem;">${wrestler.wrestler_name}</h3>
            <div style="color: #aaa; font-size: 0.9rem;">Grade ${wrestler.wrestler_grade}</div>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc; font-weight: 600;">Weight (lbs):</label>
            <div style="padding: 0.75rem; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 6px; font-size: 1rem; font-weight: 600;">
              ${wrestler.tournament_weight || wrestler.wrestler_weight || 'Not set'}
            </div>
          </div>

          <div>
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc; font-weight: 600;">Mat Numbers:</label>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;">
              ${wrestler.mat_numbers.map((mat, n) => `
                <div style="padding: 0.75rem; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 6px; text-align: center; font-size: 1rem; font-weight: 600;">
                  ${mat || '-'}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  $('print-tournament-roster')?.addEventListener('click', () => window.print());
  $('clear-tournament-roster')?.addEventListener('click', clearTournamentRoster);
}

async function clearTournamentRoster() {
  if (!confirm('Clear the current tournament roster? This cannot be undone.')) return;

  const saveRes = await saveData('data/tournament-roster.json', JSON.stringify(null, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Tournament roster cleared!');
    await loadTournamentTab();
  }
}

// ============================================================================
// ATTENDANCE TAB - Track Practice/Tournament Attendance
// ============================================================================
async function loadAttendanceTab() {
  const container = $('tab-attendance');
  container.innerHTML = `
    <div class="content-card">
      <h2>Attendance Tracking</h2>
      <p class="note">Mark attendance for practices and tournaments. View attendance statistics per wrestler.</p>

      <div class="stack">
        <h3>Record Attendance</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr auto;">
          <input id="attendance-date" type="date" placeholder="Date" />
          <select id="attendance-type">
            <option value="">Select Type</option>
            <option value="Practice">Practice</option>
            <option value="Tournament">Tournament</option>
          </select>
          <input id="attendance-event" placeholder="Event Name (optional)" />
          <button id="record-attendance" class="success">Record Attendance</button>
        </div>

        <div id="attendance-wrestlers" class="hidden" style="margin-top: 1rem;">
          <h3>Select Wrestlers Present</h3>
          <div style="margin-bottom: 1rem;">
            <button id="select-all-attendance" class="secondary">Select All</button>
            <button id="deselect-all-attendance" class="secondary">Deselect All</button>
          </div>
          <div id="wrestler-checkboxes" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem;"></div>
          <button id="save-attendance" class="success" style="margin-top: 1rem;">Save Attendance</button>
        </div>

        <h3 style="margin-top: 2rem;">Attendance History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Event</th>
                <th>Present</th>
                <th>Absent</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="attendance-history-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Wrestler Attendance Statistics</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler Name</th>
                <th>Total Events</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody id="attendance-stats-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  attachAttendanceEventListeners();
  await loadAttendanceData();
}

function attachAttendanceEventListeners() {
  $('record-attendance')?.addEventListener('click', showAttendanceForm);
  $('select-all-attendance')?.addEventListener('click', () => selectAllAttendance(true));
  $('deselect-all-attendance')?.addEventListener('click', () => selectAllAttendance(false));
  $('save-attendance')?.addEventListener('click', saveAttendanceRecord);
}

async function showAttendanceForm() {
  const date = $('attendance-date').value;
  const type = $('attendance-type').value;

  if (!date || !type) {
    return alert('Please select date and type');
  }

  const roster = await loadJSON('team-roster.json') || [];
  if (roster.length === 0) {
    return alert('No team members found. Add wrestlers to the team roster first.');
  }

  const container = $('wrestler-checkboxes');
  container.innerHTML = '';

  roster.forEach((member, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 0.5rem; background: #2a2a2a; border-radius: 4px; border: 1px solid #444;';
    div.innerHTML = `
      <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
        <input type="checkbox" class="attendance-checkbox" data-index="${i}" data-name="${member.wrestler_name}" checked>
        <span>${member.wrestler_name}</span>
      </label>
    `;
    container.appendChild(div);
  });

  $('attendance-wrestlers').classList.remove('hidden');
}

function selectAllAttendance(checked) {
  document.querySelectorAll('.attendance-checkbox').forEach(cb => {
    cb.checked = checked;
  });
}

async function saveAttendanceRecord() {
  const date = $('attendance-date').value;
  const type = $('attendance-type').value;
  const event = $('attendance-event').value.trim();

  const present = Array.from(document.querySelectorAll('.attendance-checkbox:checked'))
    .map(cb => cb.getAttribute('data-name'));

  const absent = Array.from(document.querySelectorAll('.attendance-checkbox:not(:checked)'))
    .map(cb => cb.getAttribute('data-name'));

  const attendance = await loadJSON('attendance.json') || [];
  attendance.push({
    date,
    type,
    event: event || type,
    present,
    absent,
    recorded_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/attendance.json', JSON.stringify(attendance, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Attendance recorded successfully!');
    $('attendance-date').value = '';
    $('attendance-type').value = '';
    $('attendance-event').value = '';
    $('attendance-wrestlers').classList.add('hidden');
    await loadAttendanceData();
  }
}

async function loadAttendanceData() {
  const attendance = await loadJSON('attendance.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Load attendance history
  const historyTbody = $('attendance-history-list');
  historyTbody.innerHTML = '';

  attendance.reverse().forEach((record, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${record.date}</td>
      <td>${record.type}</td>
      <td>${record.event}</td>
      <td>${record.present.length}</td>
      <td>${record.absent.length}</td>
      <td class='right'><button class='danger' data-index='${attendance.length - 1 - i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteAttendanceRecord(attendance.length - 1 - i));
    historyTbody.appendChild(tr);
  });

  // Calculate statistics
  const statsTbody = $('attendance-stats-list');
  statsTbody.innerHTML = '';

  roster.forEach(member => {
    const name = member.wrestler_name;
    const presentCount = attendance.filter(a => a.present.includes(name)).length;
    const absentCount = attendance.filter(a => a.absent.includes(name)).length;
    const total = presentCount + absentCount;
    const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${total}</td>
      <td>${presentCount}</td>
      <td>${absentCount}</td>
      <td><strong style="color: ${percentage >= 80 ? '#28a745' : percentage >= 60 ? '#ffc107' : '#dc3545'}">${percentage}%</strong></td>
    `;
    statsTbody.appendChild(tr);
  });
}

async function deleteAttendanceRecord(index) {
  if (!confirm('Delete this attendance record?')) return;

  const attendance = await loadJSON('attendance.json');
  attendance.splice(index, 1);

  const saveRes = await saveData('data/attendance.json', JSON.stringify(attendance, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Attendance record deleted!');
    await loadAttendanceData();
  }
}

// ============================================================================
// WEIGHT TRACKING TAB
// ============================================================================
async function loadWeightTab() {
  const container = $('tab-weight');
  container.innerHTML = `
    <div class="content-card">
      <h2>Weight Tracking Over Time</h2>
      <p class="note">Track wrestler weights throughout the season for weight class planning</p>

      <div class="stack">
        <h3>Record Weight</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr auto;">
          <select id="weight-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="weight-value" type="number" step="0.1" placeholder="Weight (lbs)" />
          <input id="weight-date" type="date" />
          <button id="add-weight" class="success">Add Weight</button>
        </div>

        <h3 style="margin-top: 2rem;">Weight History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Weight (lbs)</th>
                <th>Date</th>
                <th>Change</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="weight-history-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Current Weights</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Current Weight</th>
                <th>Last Recorded</th>
                <th>Trend (30 days)</th>
              </tr>
            </thead>
            <tbody id="current-weights-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadWeightData();
  attachWeightEventListeners();
}

function attachWeightEventListeners() {
  $('add-weight')?.addEventListener('click', addWeightRecord);
}

async function loadWeightData() {
  const weights = await loadJSON('weight-tracking.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('weight-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('weight-date').value = new Date().toISOString().split('T')[0];

  // Load weight history
  const historyTbody = $('weight-history-list');
  historyTbody.innerHTML = '';

  weights.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((record, i) => {
    // Find previous weight for this wrestler
    const prevWeights = weights.filter(w =>
      w.wrestler === record.wrestler &&
      new Date(w.date) < new Date(record.date)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    const change = prevWeights.length > 0
      ? (record.weight - prevWeights[0].weight).toFixed(1)
      : '-';

    const changeColor = change > 0 ? '#ffc107' : change < 0 ? '#28a745' : '#aaa';
    const changeText = change !== '-' ? (change > 0 ? `+${change}` : change) : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${record.wrestler}</td>
      <td><strong>${record.weight}</strong></td>
      <td>${record.date}</td>
      <td style="color: ${changeColor};">${changeText}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteWeightRecord(i));
    historyTbody.appendChild(tr);
  });

  // Load current weights
  const currentTbody = $('current-weights-list');
  currentTbody.innerHTML = '';

  roster.forEach(member => {
    const wrestlerWeights = weights.filter(w => w.wrestler === member.wrestler_name)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (wrestlerWeights.length > 0) {
      const current = wrestlerWeights[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldWeights = wrestlerWeights.filter(w => new Date(w.date) <= thirtyDaysAgo);
      const trend = oldWeights.length > 0
        ? (current.weight - oldWeights[0].weight).toFixed(1)
        : '-';

      const trendColor = trend > 0 ? '#ffc107' : trend < 0 ? '#28a745' : '#aaa';
      const trendText = trend !== '-' ? (trend > 0 ? `+${trend}` : trend) : 'No data';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${member.wrestler_name}</td>
        <td><strong>${current.weight} lbs</strong></td>
        <td>${current.date}</td>
        <td style="color: ${trendColor};">${trendText}</td>
      `;
      currentTbody.appendChild(tr);
    }
  });
}

async function addWeightRecord() {
  const wrestler = $('weight-wrestler').value;
  const weight = parseFloat($('weight-value').value);
  const date = $('weight-date').value;

  if (!wrestler || !weight || !date) {
    return alert('Please fill in all fields');
  }

  const weights = await loadJSON('weight-tracking.json') || [];
  weights.push({
    wrestler,
    weight,
    date,
    recorded_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/weight-tracking.json', JSON.stringify(weights, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Weight recorded successfully!');
    $('weight-wrestler').value = '';
    $('weight-value').value = '';
    await loadWeightData();
  }
}

async function deleteWeightRecord(index) {
  if (!confirm('Delete this weight record?')) return;

  const weights = await loadJSON('weight-tracking.json');
  weights.splice(index, 1);

  const saveRes = await saveData('data/weight-tracking.json', JSON.stringify(weights, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Weight record deleted!');
    await loadWeightData();
  }
}

// ============================================================================
// RESULTS TAB - Tournament Results & Win/Loss Records
// ============================================================================
async function loadResultsTab() {
  const container = $('tab-results');
  container.innerHTML = `
    <div class="content-card">
      <h2>Tournament Results & Win/Loss Records</h2>
      <p class="note">Track match results, opponents, and season statistics</p>

      <div class="stack">
        <h3>Record Match Result</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr auto;">
          <select id="result-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="result-date" type="date" />
          <input id="result-tournament" placeholder="Tournament Name" />
          <input id="result-opponent" placeholder="Opponent Name" />
          <select id="result-outcome">
            <option value="">Outcome</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
          </select>
          <select id="result-method">
            <option value="">Method</option>
            <option value="Pin">Pin</option>
            <option value="Tech Fall">Tech Fall</option>
            <option value="Major Decision">Major Decision</option>
            <option value="Decision">Decision</option>
            <option value="Forfeit">Forfeit</option>
            <option value="Injury Default">Injury Default</option>
          </select>
          <button id="add-result" class="success">Add Result</button>
        </div>

        <h3 style="margin-top: 2rem;">Match History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Wrestler</th>
                <th>Tournament</th>
                <th>Opponent</th>
                <th>Outcome</th>
                <th>Method</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="results-history-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Season Statistics</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win %</th>
                <th>Pins</th>
                <th>Tech Falls</th>
                <th>Decisions</th>
              </tr>
            </thead>
            <tbody id="season-stats-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadResultsData();
  attachResultsEventListeners();
}

function attachResultsEventListeners() {
  $('add-result')?.addEventListener('click', addMatchResult);
}

async function loadResultsData() {
  const results = await loadJSON('tournament-results.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('result-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('result-date').value = new Date().toISOString().split('T')[0];

  // Load match history
  const historyTbody = $('results-history-list');
  historyTbody.innerHTML = '';

  results.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((match, i) => {
    const outcomeColor = match.outcome === 'Win' ? '#28a745' : '#dc3545';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${match.date}</td>
      <td>${match.wrestler}</td>
      <td>${match.tournament}</td>
      <td>${match.opponent}</td>
      <td style="color: ${outcomeColor}; font-weight: 600;">${match.outcome}</td>
      <td>${match.method}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteMatchResult(i));
    historyTbody.appendChild(tr);
  });

  // Calculate season statistics
  const statsTbody = $('season-stats-list');
  statsTbody.innerHTML = '';

  roster.forEach(member => {
    const wrestlerMatches = results.filter(r => r.wrestler === member.wrestler_name);
    const wins = wrestlerMatches.filter(m => m.outcome === 'Win').length;
    const losses = wrestlerMatches.filter(m => m.outcome === 'Loss').length;
    const total = wins + losses;
    const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    const pins = wrestlerMatches.filter(m => m.outcome === 'Win' && m.method === 'Pin').length;
    const techFalls = wrestlerMatches.filter(m => m.outcome === 'Win' && m.method === 'Tech Fall').length;
    const decisions = wrestlerMatches.filter(m => m.outcome === 'Win' && (m.method === 'Decision' || m.method === 'Major Decision')).length;

    if (total > 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${member.wrestler_name}</td>
        <td style="color: #28a745; font-weight: 600;">${wins}</td>
        <td style="color: #dc3545; font-weight: 600;">${losses}</td>
        <td><strong>${winPct}%</strong></td>
        <td>${pins}</td>
        <td>${techFalls}</td>
        <td>${decisions}</td>
      `;
      statsTbody.appendChild(tr);
    }
  });
}

async function addMatchResult() {
  const wrestler = $('result-wrestler').value;
  const date = $('result-date').value;
  const tournament = $('result-tournament').value.trim();
  const opponent = $('result-opponent').value.trim();
  const outcome = $('result-outcome').value;
  const method = $('result-method').value;

  if (!wrestler || !date || !tournament || !opponent || !outcome || !method) {
    return alert('Please fill in all fields');
  }

  const results = await loadJSON('tournament-results.json') || [];
  results.push({
    wrestler,
    date,
    tournament,
    opponent,
    outcome,
    method,
    recorded_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/tournament-results.json', JSON.stringify(results, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Match result recorded successfully!');
    $('result-wrestler').value = '';
    $('result-tournament').value = '';
    $('result-opponent').value = '';
    $('result-outcome').value = '';
    $('result-method').value = '';
    await loadResultsData();
  }
}

async function deleteMatchResult(index) {
  if (!confirm('Delete this match result?')) return;

  const results = await loadJSON('tournament-results.json');
  results.splice(index, 1);

  const saveRes = await saveData('data/tournament-results.json', JSON.stringify(results, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Match result deleted!');
    await loadResultsData();
  }
}

// ============================================================================
// PAYMENTS TAB - Payment/Dues Tracking
// ============================================================================
async function loadPaymentsTab() {
  const container = $('tab-payments');
  container.innerHTML = `
    <div class="content-card">
      <h2>Payment & Dues Tracking</h2>
      <p class="note">Track registration fees, outstanding balances, and payment history</p>

      <div class="stack">
        <h3>Record Payment</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;">
          <select id="payment-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="payment-amount" type="number" step="0.01" placeholder="Amount ($)" />
          <input id="payment-date" type="date" />
          <select id="payment-method">
            <option value="">Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Venmo">Venmo</option>
            <option value="Zelle">Zelle</option>
            <option value="Stripe">Stripe</option>
          </select>
          <input id="payment-notes" placeholder="Notes (optional)" />
          <button id="add-payment" class="success">Add Payment</button>
        </div>

        <h3 style="margin-top: 2rem;">Payment History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Wrestler</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Notes</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="payment-history-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Payment Summary</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Total Paid</th>
                <th>Expected Fee</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="payment-summary-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadPaymentsData();
  attachPaymentsEventListeners();
}

function attachPaymentsEventListeners() {
  $('add-payment')?.addEventListener('click', addPaymentRecord);
}

async function loadPaymentsData() {
  const payments = await loadJSON('payments.json') || [];
  const roster = await loadJSON('team-roster.json') || [];
  const settings = await loadJSON('admin-settings.json') || { registration_fee: 200 };

  // Populate wrestler dropdown
  const select = $('payment-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('payment-date').value = new Date().toISOString().split('T')[0];

  // Load payment history
  const historyTbody = $('payment-history-list');
  historyTbody.innerHTML = '';

  payments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((payment, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${payment.date}</td>
      <td>${payment.wrestler}</td>
      <td style="color: #28a745; font-weight: 600;">$${payment.amount.toFixed(2)}</td>
      <td>${payment.method}</td>
      <td>${payment.notes || '-'}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deletePaymentRecord(i));
    historyTbody.appendChild(tr);
  });

  // Calculate payment summary
  const summaryTbody = $('payment-summary-list');
  summaryTbody.innerHTML = '';

  roster.forEach(member => {
    const wrestlerPayments = payments.filter(p => p.wrestler === member.wrestler_name);
    const totalPaid = wrestlerPayments.reduce((sum, p) => sum + p.amount, 0);
    const expectedFee = settings.registration_fee || 200;
    const balance = expectedFee - totalPaid;
    const status = balance <= 0 ? 'Paid' : balance < expectedFee ? 'Partial' : 'Unpaid';
    const statusColor = balance <= 0 ? '#28a745' : balance < expectedFee ? '#ffc107' : '#dc3545';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${member.wrestler_name}</td>
      <td style="color: #28a745;">$${totalPaid.toFixed(2)}</td>
      <td>$${expectedFee.toFixed(2)}</td>
      <td style="color: ${balance > 0 ? '#dc3545' : '#28a745'}; font-weight: 600;">$${balance.toFixed(2)}</td>
      <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
    `;
    summaryTbody.appendChild(tr);
  });
}

async function addPaymentRecord() {
  const wrestler = $('payment-wrestler').value;
  const amount = parseFloat($('payment-amount').value);
  const date = $('payment-date').value;
  const method = $('payment-method').value;
  const notes = $('payment-notes').value.trim();

  if (!wrestler || !amount || !date || !method) {
    return alert('Please fill in all required fields');
  }

  const payments = await loadJSON('payments.json') || [];
  payments.push({
    wrestler,
    amount,
    date,
    method,
    notes,
    recorded_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/payments.json', JSON.stringify(payments, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Payment recorded successfully!');
    $('payment-wrestler').value = '';
    $('payment-amount').value = '';
    $('payment-method').value = '';
    $('payment-notes').value = '';
    await loadPaymentsData();
  }
}

async function deletePaymentRecord(index) {
  if (!confirm('Delete this payment record?')) return;

  const payments = await loadJSON('payments.json');
  payments.splice(index, 1);

  const saveRes = await saveData('data/payments.json', JSON.stringify(payments, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Payment record deleted!');
    await loadPaymentsData();
  }
}

// ============================================================================
// COMMUNICATION TAB - Parent Communication Log & Contact Messages
// ============================================================================
async function loadCommunicationTab() {
  const container = $('tab-communication');
  container.innerHTML = `
    <div class="content-card">
      <h2>Parent Communication Log</h2>
      <p class="note">Record dated notes from parent conversations, medical information, and behavioral notes</p>

      <div class="stack">
        <h3>Add Communication Note</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr auto;">
          <select id="comm-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="comm-date" type="date" />
          <select id="comm-type">
            <option value="">Note Type</option>
            <option value="General">General</option>
            <option value="Medical">Medical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Academic">Academic</option>
            <option value="Schedule">Schedule</option>
          </select>
          <button id="show-comm-form" class="primary">Add Note</button>
        </div>

        <div id="comm-note-form" class="hidden" style="margin-top: 1rem;">
          <textarea id="comm-note" rows="4" placeholder="Enter communication note..." style="width: 100%; margin-bottom: 0.5rem;"></textarea>
          <button id="save-comm-note" class="success">Save Note</button>
        </div>

        <h3 style="margin-top: 2rem;">Communication History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Wrestler</th>
                <th>Type</th>
                <th>Note</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="comm-history-list"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="content-card">
      <h2>Contact Form Messages</h2>
      <p class="note">Messages submitted through the contact form</p>
      <div class="table-container">
        <table class="admin-list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Submitted</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody id="contact-messages-list"></tbody>
        </table>
      </div>
    </div>
  `;

  await loadCommunicationData();
  attachCommunicationEventListeners();
}

function attachCommunicationEventListeners() {
  $('show-comm-form')?.addEventListener('click', showCommNoteForm);
  $('save-comm-note')?.addEventListener('click', saveCommNote);
}

function showCommNoteForm() {
  const wrestler = $('comm-wrestler').value;
  const date = $('comm-date').value;
  const type = $('comm-type').value;

  if (!wrestler || !date || !type) {
    return alert('Please select wrestler, date, and note type');
  }

  $('comm-note-form').classList.remove('hidden');
}

async function loadCommunicationData() {
  const commLog = await loadJSON('communication-log.json') || [];
  const contactMessages = await loadJSON('contact-messages.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('comm-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('comm-date').value = new Date().toISOString().split('T')[0];

  // Load communication history
  const commTbody = $('comm-history-list');
  commTbody.innerHTML = '';

  commLog.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((note, i) => {
    const typeColor = note.type === 'Medical' ? '#dc3545' : note.type === 'Behavioral' ? '#ffc107' : '#4db8ff';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${note.date}</td>
      <td>${note.wrestler}</td>
      <td style="color: ${typeColor}; font-weight: 600;">${note.type}</td>
      <td style="max-width: 400px; white-space: normal;">${note.note}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteCommNote(i));
    commTbody.appendChild(tr);
  });

  // Load contact messages
  const contactTbody = $('contact-messages-list');
  contactTbody.innerHTML = '';

  contactMessages.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).forEach((msg, i) => {
    const tr = document.createElement('tr');
    const submittedDate = new Date(msg.submitted_at).toLocaleDateString();

    tr.innerHTML = `
      <td>${msg.name}</td>
      <td><a href="mailto:${msg.email}" style="color: #4db8ff;">${msg.email}</a></td>
      <td style="max-width: 400px; white-space: normal;">${msg.message}</td>
      <td>${submittedDate}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteContactMessage(i));
    contactTbody.appendChild(tr);
  });
}

async function saveCommNote() {
  const wrestler = $('comm-wrestler').value;
  const date = $('comm-date').value;
  const type = $('comm-type').value;
  const note = $('comm-note').value.trim();

  if (!note) {
    return alert('Please enter a note');
  }

  const commLog = await loadJSON('communication-log.json') || [];
  commLog.push({
    wrestler,
    date,
    type,
    note,
    recorded_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/communication-log.json', JSON.stringify(commLog, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Communication note saved!');
    $('comm-wrestler').value = '';
    $('comm-type').value = '';
    $('comm-note').value = '';
    $('comm-note-form').classList.add('hidden');
    await loadCommunicationData();
  }
}

async function deleteCommNote(index) {
  if (!confirm('Delete this communication note?')) return;

  const commLog = await loadJSON('communication-log.json');
  commLog.splice(index, 1);

  const saveRes = await saveData('data/communication-log.json', JSON.stringify(commLog, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Note deleted!');
    await loadCommunicationData();
  }
}

async function deleteContactMessage(index) {
  if (!confirm('Delete this contact message?')) return;

  const messages = await loadJSON('contact-messages.json');
  messages.splice(index, 1);

  const saveRes = await saveData('data/contact-messages.json', JSON.stringify(messages, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Message deleted!');
    await loadCommunicationData();
  }
}

// ============================================================================
// PRACTICE PLANS TAB - Practice Plans & Drills Library
// ============================================================================
async function loadPracticeTab() {
  const container = $('tab-practice');
  container.innerHTML = `
    <div class="content-card">
      <h2>Practice Plans & Drills Library</h2>
      <p class="note">Store, organize, and schedule practice plans, technique videos, and drill sequences</p>

      <div class="stack">
        <h3>Add Practice Plan</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr auto;">
          <input id="plan-date" type="date" />
          <input id="plan-title" placeholder="Practice Title" />
          <input id="plan-duration" type="number" placeholder="Duration (min)" />
          <button id="show-plan-form" class="primary">Add Plan</button>
        </div>

        <div id="plan-details-form" class="hidden" style="margin-top: 1rem;">
          <textarea id="plan-drills" rows="6" placeholder="Enter drills and activities (one per line)..." style="width: 100%; margin-bottom: 0.5rem;"></textarea>
          <input id="plan-video-url" type="url" placeholder="Technique video URL (optional)" style="margin-bottom: 0.5rem;" />
          <button id="save-plan" class="success">Save Practice Plan</button>
        </div>

        <h3 style="margin-top: 2rem;">Practice Plans</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Duration</th>
                <th>Drills</th>
                <th>Video</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="practice-plans-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadPracticePlansData();
  attachPracticeEventListeners();
}

function attachPracticeEventListeners() {
  $('show-plan-form')?.addEventListener('click', showPlanForm);
  $('save-plan')?.addEventListener('click', savePracticePlan);
}

function showPlanForm() {
  const date = $('plan-date').value;
  const title = $('plan-title').value.trim();
  const duration = $('plan-duration').value;

  if (!date || !title || !duration) {
    return alert('Please fill in date, title, and duration');
  }

  $('plan-details-form').classList.remove('hidden');
}

async function loadPracticePlansData() {
  const plans = await loadJSON('practice-plans.json') || [];

  // Set default date to today
  $('plan-date').value = new Date().toISOString().split('T')[0];

  const tbody = $('practice-plans-list');
  tbody.innerHTML = '';

  plans.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((plan, i) => {
    const videoLink = plan.video_url
      ? `<a href="${plan.video_url}" target="_blank" style="color: #4db8ff;">View</a>`
      : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${plan.date}</td>
      <td><strong>${plan.title}</strong></td>
      <td>${plan.duration} min</td>
      <td style="max-width: 300px; white-space: normal;">${plan.drills}</td>
      <td>${videoLink}</td>
      <td class='right'><button class='danger' data-index='${i}'>Delete</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deletePracticePlan(i));
    tbody.appendChild(tr);
  });
}

async function savePracticePlan() {
  const date = $('plan-date').value;
  const title = $('plan-title').value.trim();
  const duration = parseInt($('plan-duration').value);
  const drills = $('plan-drills').value.trim();
  const videoUrl = $('plan-video-url').value.trim();

  if (!drills) {
    return alert('Please enter drills and activities');
  }

  const plans = await loadJSON('practice-plans.json') || [];
  plans.push({
    date,
    title,
    duration,
    drills,
    video_url: videoUrl,
    created_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/practice-plans.json', JSON.stringify(plans, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Practice plan saved!');
    $('plan-title').value = '';
    $('plan-duration').value = '';
    $('plan-drills').value = '';
    $('plan-video-url').value = '';
    $('plan-details-form').classList.add('hidden');
    await loadPracticePlansData();
  }
}

async function deletePracticePlan(index) {
  if (!confirm('Delete this practice plan?')) return;

  const plans = await loadJSON('practice-plans.json');
  plans.splice(index, 1);

  const saveRes = await saveData('data/practice-plans.json', JSON.stringify(plans, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Practice plan deleted!');
    await loadPracticePlansData();
  }
}

// ============================================================================
// PHOTOS TAB - Photo Gallery by Event
// ============================================================================
async function loadPhotosTab() {
  const container = $('tab-photos');
  container.innerHTML = `
    <div class="content-card">
      <h2>Photo Gallery by Event</h2>
      <p class="note">Upload and organize team photos categorized by tournaments and practices</p>

      <div class="stack">
        <h3>Upload Photos</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 2fr auto;">
          <input id="photo-event" placeholder="Event Name" />
          <input id="photo-date" type="date" />
          <input id="photo-files" type="file" accept="image/*" multiple />
          <button id="upload-photos" class="success">Upload Photos</button>
        </div>
        <div id="photo-upload-status" class="muted"></div>

        <h3 style="margin-top: 2rem;">Photo Gallery</h3>
        <div id="photo-events-list"></div>
      </div>
    </div>
  `;

  await loadPhotosData();
  attachPhotosEventListeners();
}

function attachPhotosEventListeners() {
  $('upload-photos')?.addEventListener('click', uploadPhotos);
}

async function loadPhotosData() {
  const photos = await loadJSON('photo-gallery.json') || [];

  // Set default date to today
  $('photo-date').value = new Date().toISOString().split('T')[0];

  const container = $('photo-events-list');
  container.innerHTML = '';

  // Group photos by event
  const eventGroups = {};
  photos.forEach(photo => {
    if (!eventGroups[photo.event]) {
      eventGroups[photo.event] = [];
    }
    eventGroups[photo.event].push(photo);
  });

  Object.keys(eventGroups).forEach(event => {
    const eventPhotos = eventGroups[event];
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 2rem; padding: 1rem; background: #2a2a2a; border-radius: 8px; border: 1px solid #444;';

    let html = `
      <h4 style="color: #4db8ff; margin-bottom: 1rem;">${event} (${eventPhotos[0].date})</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
    `;

    eventPhotos.forEach((photo, i) => {
      html += `
        <div style="position: relative;">
          <img src="${photo.url}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; border: 1px solid #444;" />
          <button class="danger" style="position: absolute; top: 5px; right: 5px; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deletePhoto('${event}', ${i})">×</button>
        </div>
      `;
    });

    html += '</div>';
    div.innerHTML = html;
    container.appendChild(div);
  });

  if (Object.keys(eventGroups).length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #aaa; padding: 2rem;">No photos uploaded yet</p>';
  }
}

async function uploadPhotos() {
  const event = $('photo-event').value.trim();
  const date = $('photo-date').value;
  const files = $('photo-files').files;
  const status = $('photo-upload-status');

  if (!event || !date || !files || files.length === 0) {
    return alert('Please fill in all fields and select photos');
  }

  status.textContent = `Uploading ${files.length} photo(s)...`;
  status.style.color = '#4db8ff';

  try {
    const photos = await loadJSON('photo-gallery.json') || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `photo-${Date.now()}-${i}-${file.name}`;
      const url = `media/${fileName}`;

      status.textContent = `Uploading ${i + 1}/${files.length}...`;

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `media/${fileName}`, content: base64 })
      });

      photos.push({ event, date, url, uploaded_at: new Date().toISOString() });
    }

    const saveRes = await saveData('data/photo-gallery.json', JSON.stringify(photos, null, 2));
    const result = await saveRes.json();

    if (result.success) {
      status.textContent = `✅ ${files.length} photo(s) uploaded!`;
      status.style.color = '#00ff00';
      $('photo-event').value = '';
      $('photo-files').value = '';
      await loadPhotosData();
    }
  } catch (err) {
    status.textContent = '❌ Error: ' + err.message;
    status.style.color = '#e60000';
  }
}

async function deletePhoto(event, index) {
  if (!confirm('Delete this photo?')) return;

  const photos = await loadJSON('photo-gallery.json');
  const eventPhotos = photos.filter(p => p.event === event);
  const photoToDelete = eventPhotos[index];
  const globalIndex = photos.indexOf(photoToDelete);

  photos.splice(globalIndex, 1);

  const saveRes = await saveData('data/photo-gallery.json', JSON.stringify(photos, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Photo deleted!');
    await loadPhotosData();
  }
}

// Make deletePhoto globally accessible
window.deletePhoto = deletePhoto;

// ============================================================================
// EQUIPMENT TAB - Equipment Checkout System
// ============================================================================
async function loadEquipmentTab() {
  const container = $('tab-equipment');
  container.innerHTML = `
    <div class="content-card">
      <h2>Equipment Checkout System</h2>
      <p class="note">Track borrowed club equipment (headgear, singlets, etc.) with checkout/return dates</p>

      <div class="stack">
        <h3>Checkout Equipment</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr auto;">
          <select id="equip-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <select id="equip-item">
            <option value="">Equipment Type</option>
            <option value="Headgear">Headgear</option>
            <option value="Singlet">Singlet</option>
            <option value="Shoes">Shoes</option>
            <option value="Knee Pads">Knee Pads</option>
            <option value="Other">Other</option>
          </select>
          <input id="equip-description" placeholder="Description/Size" />
          <input id="equip-checkout-date" type="date" />
          <button id="checkout-equipment" class="success">Checkout</button>
        </div>

        <h3 style="margin-top: 2rem;">Checked Out Equipment</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Item</th>
                <th>Description</th>
                <th>Checkout Date</th>
                <th>Days Out</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="equipment-out-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Equipment History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Item</th>
                <th>Checkout Date</th>
                <th>Return Date</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody id="equipment-history-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadEquipmentData();
  attachEquipmentEventListeners();
}

function attachEquipmentEventListeners() {
  $('checkout-equipment')?.addEventListener('click', checkoutEquipment);
}

async function loadEquipmentData() {
  const equipment = await loadJSON('equipment.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('equip-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('equip-checkout-date').value = new Date().toISOString().split('T')[0];

  // Load checked out equipment
  const outTbody = $('equipment-out-list');
  outTbody.innerHTML = '';

  const checkedOut = equipment.filter(e => !e.return_date);
  checkedOut.forEach((item, i) => {
    const checkoutDate = new Date(item.checkout_date);
    const today = new Date();
    const daysOut = Math.floor((today - checkoutDate) / (1000 * 60 * 60 * 24));
    const daysColor = daysOut > 30 ? '#dc3545' : daysOut > 14 ? '#ffc107' : '#28a745';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.wrestler}</td>
      <td>${item.item}</td>
      <td>${item.description}</td>
      <td>${item.checkout_date}</td>
      <td style="color: ${daysColor}; font-weight: 600;">${daysOut}</td>
      <td class='right'><button class='success' data-index='${i}'>Return</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => returnEquipment(i));
    outTbody.appendChild(tr);
  });

  // Load equipment history
  const historyTbody = $('equipment-history-list');
  historyTbody.innerHTML = '';

  const returned = equipment.filter(e => e.return_date).sort((a, b) => new Date(b.return_date) - new Date(a.return_date));
  returned.forEach(item => {
    const checkoutDate = new Date(item.checkout_date);
    const returnDate = new Date(item.return_date);
    const days = Math.floor((returnDate - checkoutDate) / (1000 * 60 * 60 * 24));

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.wrestler}</td>
      <td>${item.item}</td>
      <td>${item.checkout_date}</td>
      <td>${item.return_date}</td>
      <td>${days}</td>
    `;
    historyTbody.appendChild(tr);
  });
}

async function checkoutEquipment() {
  const wrestler = $('equip-wrestler').value;
  const item = $('equip-item').value;
  const description = $('equip-description').value.trim();
  const checkoutDate = $('equip-checkout-date').value;

  if (!wrestler || !item || !checkoutDate) {
    return alert('Please fill in all required fields');
  }

  const equipment = await loadJSON('equipment.json') || [];
  equipment.push({
    wrestler,
    item,
    description,
    checkout_date: checkoutDate,
    return_date: null,
    checked_out_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/equipment.json', JSON.stringify(equipment, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Equipment checked out!');
    $('equip-wrestler').value = '';
    $('equip-item').value = '';
    $('equip-description').value = '';
    await loadEquipmentData();
  }
}

async function returnEquipment(index) {
  if (!confirm('Mark this equipment as returned?')) return;

  const equipment = await loadJSON('equipment.json');
  const checkedOut = equipment.filter(e => !e.return_date);
  const item = checkedOut[index];
  const globalIndex = equipment.indexOf(item);

  equipment[globalIndex].return_date = new Date().toISOString().split('T')[0];

  const saveRes = await saveData('data/equipment.json', JSON.stringify(equipment, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Equipment returned!');
    await loadEquipmentData();
  }
}

// ============================================================================
// VOLUNTEERS TAB - Volunteer/Parent Helper Scheduler
// ============================================================================
async function loadVolunteersTab() {
  const container = $('tab-volunteers');
  container.innerHTML = `
    <div class="content-card">
      <h2>Volunteer & Parent Helper Scheduler</h2>
      <p class="note">Digital sign-up sheets for tournament help, snack duty, and carpool coordination</p>

      <div class="stack">
        <h3>Create Volunteer Opportunity</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr auto;">
          <input id="vol-event" placeholder="Event Name" />
          <input id="vol-date" type="date" />
          <select id="vol-type">
            <option value="">Type</option>
            <option value="Tournament Help">Tournament Help</option>
            <option value="Snack Duty">Snack Duty</option>
            <option value="Carpool">Carpool</option>
            <option value="Fundraising">Fundraising</option>
            <option value="Other">Other</option>
          </select>
          <input id="vol-slots" type="number" placeholder="# of Slots" />
          <button id="create-volunteer-opp" class="success">Create</button>
        </div>

        <h3 style="margin-top: 2rem;">Volunteer Opportunities</h3>
        <div id="volunteer-opps-list"></div>
      </div>
    </div>
  `;

  await loadVolunteersData();
  attachVolunteersEventListeners();
}

function attachVolunteersEventListeners() {
  $('create-volunteer-opp')?.addEventListener('click', createVolunteerOpp);
}

async function loadVolunteersData() {
  const volunteers = await loadJSON('volunteers.json') || [];

  // Set default date to today
  $('vol-date').value = new Date().toISOString().split('T')[0];

  const container = $('volunteer-opps-list');
  container.innerHTML = '';

  volunteers.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((opp, i) => {
    const signedUp = opp.volunteers || [];
    const slotsLeft = opp.slots - signedUp.length;
    const statusColor = slotsLeft === 0 ? '#28a745' : slotsLeft < opp.slots / 2 ? '#ffc107' : '#dc3545';

    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: #2a2a2a; border-radius: 8px; border: 1px solid #444;';

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h4 style="color: #4db8ff; margin: 0;">${opp.event} - ${opp.type}</h4>
          <p style="color: #aaa; margin: 0.25rem 0 0 0;">${opp.date}</p>
        </div>
        <div style="text-align: right;">
          <div style="color: ${statusColor}; font-weight: 600;">${slotsLeft} / ${opp.slots} slots available</div>
          <button class="danger" style="margin-top: 0.5rem;" onclick="deleteVolunteerOpp(${i})">Delete</button>
        </div>
      </div>
    `;

    if (signedUp.length > 0) {
      html += '<div style="margin-top: 1rem;"><strong>Volunteers:</strong><ul style="margin: 0.5rem 0; padding-left: 1.5rem;">';
      signedUp.forEach(vol => {
        html += `<li>${vol}</li>`;
      });
      html += '</ul></div>';
    }

    html += `
      <div style="margin-top: 1rem;">
        <input type="text" id="vol-name-${i}" placeholder="Parent/Volunteer Name" style="width: 200px; margin-right: 0.5rem;" />
        <button class="primary" onclick="signUpVolunteer(${i})">Sign Up</button>
      </div>
    `;

    div.innerHTML = html;
    container.appendChild(div);
  });

  if (volunteers.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #aaa; padding: 2rem;">No volunteer opportunities yet</p>';
  }
}

async function createVolunteerOpp() {
  const event = $('vol-event').value.trim();
  const date = $('vol-date').value;
  const type = $('vol-type').value;
  const slots = parseInt($('vol-slots').value);

  if (!event || !date || !type || !slots) {
    return alert('Please fill in all fields');
  }

  const volunteers = await loadJSON('volunteers.json') || [];
  volunteers.push({
    event,
    date,
    type,
    slots,
    volunteers: [],
    created_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/volunteers.json', JSON.stringify(volunteers, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Volunteer opportunity created!');
    $('vol-event').value = '';
    $('vol-type').value = '';
    $('vol-slots').value = '';
    await loadVolunteersData();
  }
}

async function signUpVolunteer(index) {
  const nameInput = document.getElementById(`vol-name-${index}`);
  const name = nameInput.value.trim();

  if (!name) {
    return alert('Please enter a name');
  }

  const volunteers = await loadJSON('volunteers.json');
  const opp = volunteers[index];

  if (opp.volunteers.length >= opp.slots) {
    return alert('This opportunity is full');
  }

  opp.volunteers.push(name);

  const saveRes = await saveData('data/volunteers.json', JSON.stringify(volunteers, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Volunteer signed up!');
    await loadVolunteersData();
  }
}

async function deleteVolunteerOpp(index) {
  if (!confirm('Delete this volunteer opportunity?')) return;

  const volunteers = await loadJSON('volunteers.json');
  volunteers.splice(index, 1);

  const saveRes = await saveData('data/volunteers.json', JSON.stringify(volunteers, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Volunteer opportunity deleted!');
    await loadVolunteersData();
  }
}

// Make functions globally accessible
window.signUpVolunteer = signUpVolunteer;
window.deleteVolunteerOpp = deleteVolunteerOpp;

// ============================================================================
// MEDICAL TAB - Injury/Medical Tracking
// ============================================================================
async function loadMedicalTab() {
  const container = $('tab-medical');
  container.innerHTML = `
    <div class="content-card">
      <h2>Injury & Medical Tracking</h2>
      <p class="note">Log injuries with dates, track return-to-play dates, and required medical clearances</p>

      <div class="stack">
        <h3>Log Injury/Medical Issue</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1fr auto;">
          <select id="injury-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="injury-date" type="date" />
          <select id="injury-type">
            <option value="">Injury Type</option>
            <option value="Concussion">Concussion</option>
            <option value="Sprain">Sprain</option>
            <option value="Strain">Strain</option>
            <option value="Fracture">Fracture</option>
            <option value="Skin Infection">Skin Infection</option>
            <option value="Other">Other</option>
          </select>
          <input id="injury-description" placeholder="Description" />
          <button id="show-injury-form" class="primary">Log Injury</button>
        </div>

        <div id="injury-details-form" class="hidden" style="margin-top: 1rem;">
          <div class="row" style="grid-template-columns: 1fr 1fr;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Expected Return Date</label>
              <input id="injury-return-date" type="date" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">
                <input type="checkbox" id="injury-clearance-required" /> Medical Clearance Required
              </label>
            </div>
          </div>
          <textarea id="injury-notes" rows="3" placeholder="Additional notes..." style="width: 100%; margin-top: 0.5rem;"></textarea>
          <button id="save-injury" class="success" style="margin-top: 0.5rem;">Save Injury Log</button>
        </div>

        <h3 style="margin-top: 2rem;">Active Injuries</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Injury Type</th>
                <th>Date</th>
                <th>Expected Return</th>
                <th>Clearance</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody id="active-injuries-list"></tbody>
          </table>
        </div>

        <h3 style="margin-top: 2rem;">Injury History</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Injury Type</th>
                <th>Injury Date</th>
                <th>Return Date</th>
                <th>Days Out</th>
              </tr>
            </thead>
            <tbody id="injury-history-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadMedicalData();
  attachMedicalEventListeners();
}

function attachMedicalEventListeners() {
  $('show-injury-form')?.addEventListener('click', showInjuryForm);
  $('save-injury')?.addEventListener('click', saveInjury);
}

function showInjuryForm() {
  const wrestler = $('injury-wrestler').value;
  const date = $('injury-date').value;
  const type = $('injury-type').value;

  if (!wrestler || !date || !type) {
    return alert('Please select wrestler, date, and injury type');
  }

  $('injury-details-form').classList.remove('hidden');
}

async function loadMedicalData() {
  const injuries = await loadJSON('injuries.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('injury-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('injury-date').value = new Date().toISOString().split('T')[0];

  // Load active injuries
  const activeTbody = $('active-injuries-list');
  activeTbody.innerHTML = '';

  const active = injuries.filter(i => !i.actual_return_date);
  active.forEach((injury, i) => {
    const clearanceStatus = injury.clearance_required
      ? (injury.clearance_received ? 'Received' : 'Required')
      : '-';
    const clearanceColor = injury.clearance_required && !injury.clearance_received ? '#ffc107' : '#28a745';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${injury.wrestler}</td>
      <td>${injury.type}</td>
      <td>${injury.date}</td>
      <td>${injury.expected_return_date || 'TBD'}</td>
      <td style="color: ${clearanceColor};">${clearanceStatus}</td>
      <td class='right'>
        ${injury.clearance_required && !injury.clearance_received ? `<button class='primary' style="margin-right: 0.5rem;" onclick="markClearanceReceived(${i})">Mark Cleared</button>` : ''}
        <button class='success' onclick="markReturned(${i})">Mark Returned</button>
      </td>
    `;
    activeTbody.appendChild(tr);
  });

  // Load injury history
  const historyTbody = $('injury-history-list');
  historyTbody.innerHTML = '';

  const history = injuries.filter(i => i.actual_return_date).sort((a, b) => new Date(b.actual_return_date) - new Date(a.actual_return_date));
  history.forEach(injury => {
    const injuryDate = new Date(injury.date);
    const returnDate = new Date(injury.actual_return_date);
    const daysOut = Math.floor((returnDate - injuryDate) / (1000 * 60 * 60 * 24));

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${injury.wrestler}</td>
      <td>${injury.type}</td>
      <td>${injury.date}</td>
      <td>${injury.actual_return_date}</td>
      <td>${daysOut}</td>
    `;
    historyTbody.appendChild(tr);
  });
}

async function saveInjury() {
  const wrestler = $('injury-wrestler').value;
  const date = $('injury-date').value;
  const type = $('injury-type').value;
  const description = $('injury-description').value.trim();
  const returnDate = $('injury-return-date').value;
  const clearanceRequired = $('injury-clearance-required').checked;
  const notes = $('injury-notes').value.trim();

  const injuries = await loadJSON('injuries.json') || [];
  injuries.push({
    wrestler,
    date,
    type,
    description,
    expected_return_date: returnDate,
    actual_return_date: null,
    clearance_required: clearanceRequired,
    clearance_received: false,
    notes,
    logged_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/injuries.json', JSON.stringify(injuries, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Injury logged successfully!');
    $('injury-wrestler').value = '';
    $('injury-type').value = '';
    $('injury-description').value = '';
    $('injury-return-date').value = '';
    $('injury-clearance-required').checked = false;
    $('injury-notes').value = '';
    $('injury-details-form').classList.add('hidden');
    await loadMedicalData();
  }
}

async function markClearanceReceived(index) {
  const injuries = await loadJSON('injuries.json');
  const active = injuries.filter(i => !i.actual_return_date);
  const injury = active[index];
  const globalIndex = injuries.indexOf(injury);

  injuries[globalIndex].clearance_received = true;

  const saveRes = await saveData('data/injuries.json', JSON.stringify(injuries, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Medical clearance marked as received!');
    await loadMedicalData();
  }
}

async function markReturned(index) {
  const injuries = await loadJSON('injuries.json');
  const active = injuries.filter(i => !i.actual_return_date);
  const injury = active[index];
  const globalIndex = injuries.indexOf(injury);

  if (injury.clearance_required && !injury.clearance_received) {
    if (!confirm('Medical clearance has not been received. Mark as returned anyway?')) {
      return;
    }
  }

  injuries[globalIndex].actual_return_date = new Date().toISOString().split('T')[0];

  const saveRes = await saveData('data/injuries.json', JSON.stringify(injuries, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Wrestler marked as returned!');
    await loadMedicalData();
  }
}

// Make functions globally accessible
window.markClearanceReceived = markClearanceReceived;
window.markReturned = markReturned;

// ============================================================================
// SKILLS TAB - Skill Assessment Matrix
// ============================================================================
async function loadSkillsTab() {
  const container = $('tab-skills');
  container.innerHTML = `
    <div class="content-card">
      <h2>Skill Assessment Matrix</h2>
      <p class="note">Track technique mastery per wrestler (takedowns, escapes, pins, reversals, etc.)</p>

      <div class="stack">
        <h3>Update Skill Assessment</h3>
        <div class="row" style="grid-template-columns: 1fr 1fr auto;">
          <select id="skill-wrestler">
            <option value="">Select Wrestler</option>
          </select>
          <input id="skill-date" type="date" />
          <button id="show-skill-form" class="primary">Assess Skills</button>
        </div>

        <div id="skill-assessment-form" class="hidden" style="margin-top: 1rem;">
          <h4 style="color: #4db8ff; margin-bottom: 1rem;">Rate each skill (1-5): 1=Beginner, 3=Proficient, 5=Advanced</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Stance & Motion</label>
              <input id="skill-stance" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Takedowns</label>
              <input id="skill-takedowns" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Escapes</label>
              <input id="skill-escapes" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Reversals</label>
              <input id="skill-reversals" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Pins/Turns</label>
              <input id="skill-pins" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Defense</label>
              <input id="skill-defense" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Conditioning</label>
              <input id="skill-conditioning" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Mental Toughness</label>
              <input id="skill-mental" type="number" min="1" max="5" value="3" style="width: 100%;" />
            </div>
          </div>
          <textarea id="skill-notes" rows="3" placeholder="Assessment notes..." style="width: 100%; margin-top: 1rem;"></textarea>
          <button id="save-skill-assessment" class="success" style="margin-top: 0.5rem;">Save Assessment</button>
        </div>

        <h3 style="margin-top: 2rem;">Current Skill Levels</h3>
        <div class="table-container">
          <table class="admin-list">
            <thead>
              <tr>
                <th>Wrestler</th>
                <th>Stance</th>
                <th>Takedowns</th>
                <th>Escapes</th>
                <th>Reversals</th>
                <th>Pins</th>
                <th>Defense</th>
                <th>Conditioning</th>
                <th>Mental</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody id="current-skills-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadSkillsData();
  attachSkillsEventListeners();
}

function attachSkillsEventListeners() {
  $('show-skill-form')?.addEventListener('click', showSkillForm);
  $('save-skill-assessment')?.addEventListener('click', saveSkillAssessment);
}

function showSkillForm() {
  const wrestler = $('skill-wrestler').value;
  const date = $('skill-date').value;

  if (!wrestler || !date) {
    return alert('Please select wrestler and date');
  }

  $('skill-assessment-form').classList.remove('hidden');
}

async function loadSkillsData() {
  const skills = await loadJSON('skills.json') || [];
  const roster = await loadJSON('team-roster.json') || [];

  // Populate wrestler dropdown
  const select = $('skill-wrestler');
  select.innerHTML = '<option value="">Select Wrestler</option>';
  roster.forEach(member => {
    const option = document.createElement('option');
    option.value = member.wrestler_name;
    option.textContent = member.wrestler_name;
    select.appendChild(option);
  });

  // Set default date to today
  $('skill-date').value = new Date().toISOString().split('T')[0];

  // Load current skill levels
  const tbody = $('current-skills-list');
  tbody.innerHTML = '';

  roster.forEach(member => {
    const wrestlerSkills = skills.filter(s => s.wrestler === member.wrestler_name)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (wrestlerSkills.length > 0) {
      const latest = wrestlerSkills[0];

      const getColor = (val) => {
        if (val >= 4) return '#28a745';
        if (val >= 3) return '#4db8ff';
        if (val >= 2) return '#ffc107';
        return '#dc3545';
      };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${member.wrestler_name}</td>
        <td style="color: ${getColor(latest.stance)}; font-weight: 600;">${latest.stance}</td>
        <td style="color: ${getColor(latest.takedowns)}; font-weight: 600;">${latest.takedowns}</td>
        <td style="color: ${getColor(latest.escapes)}; font-weight: 600;">${latest.escapes}</td>
        <td style="color: ${getColor(latest.reversals)}; font-weight: 600;">${latest.reversals}</td>
        <td style="color: ${getColor(latest.pins)}; font-weight: 600;">${latest.pins}</td>
        <td style="color: ${getColor(latest.defense)}; font-weight: 600;">${latest.defense}</td>
        <td style="color: ${getColor(latest.conditioning)}; font-weight: 600;">${latest.conditioning}</td>
        <td style="color: ${getColor(latest.mental)}; font-weight: 600;">${latest.mental}</td>
        <td>${latest.date}</td>
      `;
      tbody.appendChild(tr);
    }
  });
}

async function saveSkillAssessment() {
  const wrestler = $('skill-wrestler').value;
  const date = $('skill-date').value;
  const stance = parseInt($('skill-stance').value);
  const takedowns = parseInt($('skill-takedowns').value);
  const escapes = parseInt($('skill-escapes').value);
  const reversals = parseInt($('skill-reversals').value);
  const pins = parseInt($('skill-pins').value);
  const defense = parseInt($('skill-defense').value);
  const conditioning = parseInt($('skill-conditioning').value);
  const mental = parseInt($('skill-mental').value);
  const notes = $('skill-notes').value.trim();

  const skills = await loadJSON('skills.json') || [];
  skills.push({
    wrestler,
    date,
    stance,
    takedowns,
    escapes,
    reversals,
    pins,
    defense,
    conditioning,
    mental,
    notes,
    assessed_at: new Date().toISOString()
  });

  const saveRes = await saveData('data/skills.json', JSON.stringify(skills, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Skill assessment saved!');
    $('skill-wrestler').value = '';
    $('skill-notes').value = '';
    $('skill-assessment-form').classList.add('hidden');
    await loadSkillsData();
  }
}

// ============================================================================
// SETTINGS TAB - Admin Settings & Stripe Payment Toggle
// ============================================================================
async function loadSettingsTab() {
  const container = $('tab-settings');
  container.innerHTML = `
    <div class="content-card">
      <h2>Admin Settings</h2>
      <p class="note">Configure system-wide settings including Stripe payment integration</p>

      <div class="stack">
        <h3>Payment Settings</h3>
        <div style="background: #2a2a2a; padding: 1.5rem; border-radius: 8px; border: 1px solid #444;">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="stripe-enabled" style="margin-right: 1rem; width: 20px; height: 20px;" />
              <div>
                <div style="font-weight: 600; color: #4db8ff; font-size: 1.1rem;">Enable Stripe Payment Integration</div>
                <div style="color: #aaa; font-size: 0.9rem; margin-top: 0.25rem;">
                  When enabled, registration forms will show "Proceed to Payment" button.<br/>
                  When disabled, forms will only show a thank you message.
                </div>
              </div>
            </label>
          </div>

          <div id="stripe-config" class="hidden" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #444;">
            <h4 style="color: #4db8ff; margin-bottom: 1rem;">Stripe Configuration</h4>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Stripe Publishable Key</label>
              <input id="stripe-publishable-key" type="text" placeholder="pk_live_..." style="width: 100%;" />
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Stripe Secret Key</label>
              <input id="stripe-secret-key" type="password" placeholder="sk_live_..." style="width: 100%;" />
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Registration Fee ($)</label>
              <input id="registration-fee" type="number" step="0.01" placeholder="200.00" style="width: 200px;" />
            </div>
          </div>
        </div>

        <h3 style="margin-top: 2rem;">General Settings</h3>
        <div style="background: #2a2a2a; padding: 1.5rem; border-radius: 8px; border: 1px solid #444;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Club Name</label>
            <input id="club-name" type="text" placeholder="Weekend Warriors Wrestling Club" style="width: 100%;" />
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Contact Email</label>
            <input id="contact-email" type="email" placeholder="info@weekendwarriorswc.com" style="width: 100%;" />
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Season Year</label>
            <input id="season-year" type="text" placeholder="2024-2025" style="width: 200px;" />
          </div>
        </div>

        <h3 style="margin-top: 2rem;">Email Notification Settings</h3>
        <div style="background: #2a2a2a; padding: 1.5rem; border-radius: 8px; border: 1px solid #444;">
          <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 1rem;">
            <input type="checkbox" id="email-notifications-enabled" style="margin-right: 1rem; width: 20px; height: 20px;" />
            <div>
              <div style="font-weight: 600; color: #4db8ff;">Enable Email Notifications</div>
              <div style="color: #aaa; font-size: 0.9rem;">Send email alerts for new registrations and contact messages</div>
            </div>
          </label>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #aaa;">Admin Email (for notifications)</label>
            <input id="admin-notification-email" type="email" placeholder="admin@weekendwarriorswc.com" style="width: 100%;" />
          </div>
        </div>

        <div style="margin-top: 2rem; text-align: center;">
          <button id="save-settings" class="success" style="padding: 1rem 3rem; font-size: 1.1rem;">Save All Settings</button>
        </div>
      </div>
    </div>
  `;

  await loadSettingsData();
  attachSettingsEventListeners();
}

function attachSettingsEventListeners() {
  $('stripe-enabled')?.addEventListener('change', toggleStripeConfig);
  $('save-settings')?.addEventListener('click', saveSettings);
}

function toggleStripeConfig() {
  const enabled = $('stripe-enabled').checked;
  const config = $('stripe-config');

  if (enabled) {
    config.classList.remove('hidden');
  } else {
    config.classList.add('hidden');
  }
}

async function loadSettingsData() {
  const settings = await loadJSON('admin-settings.json') || {
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    registration_fee: 200,
    club_name: 'Weekend Warriors Wrestling Club',
    contact_email: 'info@weekendwarriorswc.com',
    season_year: '2024-2025',
    email_notifications_enabled: true,
    admin_notification_email: ''
  };

  // Populate form fields
  $('stripe-enabled').checked = settings.stripe_enabled || false;
  $('stripe-publishable-key').value = settings.stripe_publishable_key || '';
  $('stripe-secret-key').value = settings.stripe_secret_key || '';
  $('registration-fee').value = settings.registration_fee || 200;
  $('club-name').value = settings.club_name || 'Weekend Warriors Wrestling Club';
  $('contact-email').value = settings.contact_email || 'info@weekendwarriorswc.com';
  $('season-year').value = settings.season_year || '2024-2025';
  $('email-notifications-enabled').checked = settings.email_notifications_enabled !== false;
  $('admin-notification-email').value = settings.admin_notification_email || '';

  // Show/hide Stripe config based on toggle
  toggleStripeConfig();
}

async function saveSettings() {
  const settings = {
    stripe_enabled: $('stripe-enabled').checked,
    stripe_publishable_key: $('stripe-publishable-key').value.trim(),
    stripe_secret_key: $('stripe-secret-key').value.trim(),
    registration_fee: parseFloat($('registration-fee').value) || 200,
    club_name: $('club-name').value.trim(),
    contact_email: $('contact-email').value.trim(),
    season_year: $('season-year').value.trim(),
    email_notifications_enabled: $('email-notifications-enabled').checked,
    admin_notification_email: $('admin-notification-email').value.trim(),
    updated_at: new Date().toISOString()
  };

  // Validate Stripe settings if enabled
  if (settings.stripe_enabled) {
    if (!settings.stripe_publishable_key || !settings.stripe_secret_key) {
      return alert('Please enter both Stripe Publishable Key and Secret Key when Stripe is enabled');
    }
  }

  const saveRes = await saveData('data/admin-settings.json', JSON.stringify(settings, null, 2));
  const result = await saveRes.json();

  if (result.success) {
    alert('✅ Settings saved successfully!\n\nNote: You may need to update winter-signups.html to integrate with Stripe payment flow.');
    await loadSettingsData();
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', init);

