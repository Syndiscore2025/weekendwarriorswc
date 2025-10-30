// Global Music Player - Persists across all pages
// Uses localStorage to maintain playback state and position

(function() {
  'use strict';

  // Configuration
  const STORAGE_KEYS = {
    ENABLED: 'wwwc_music_enabled',
    MUTED: 'wwwc_music_muted',
    CURRENT_TRACK: 'wwwc_current_track',
    CURRENT_TIME: 'wwwc_current_time',
    VOLUME: 'wwwc_volume',
    TRACKS: 'wwwc_tracks',
    LAST_UPDATE: 'wwwc_last_update'
  };

  const CROSSFADE_DURATION = 7000; // 7 seconds
  const SYNC_INTERVAL = 500; // Sync playback position every 500ms
  const PAGE_TIMEOUT = 2000; // Consider music stopped if no update for 2 seconds

  // Global state
  let audioTracks = [];
  let currentTrackIndex = 0;
  let currentAudioElement = null;
  let nextAudioElement = null;
  let isPlaying = false;
  let isMuted = false;
  let syncTimer = null;
  let bgAudio1 = null;
  let bgAudio2 = null;
  let audioToggle = null;
  let audioIconMuted = null;
  let audioIconPlaying = null;

  // Initialize music player
  function initGlobalMusic() {
    // Check if music is globally enabled
    const musicEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);
    if (musicEnabled === 'false') {
      console.log('Global music is disabled');
      return;
    }

    // Get DOM elements
    bgAudio1 = document.getElementById('bg-audio-1');
    bgAudio2 = document.getElementById('bg-audio-2');
    audioToggle = document.getElementById('audio-toggle');
    audioIconMuted = document.getElementById('audio-icon-muted');
    audioIconPlaying = document.getElementById('audio-icon-playing');

    if (!bgAudio1 || !bgAudio2 || !audioToggle) {
      console.log('Music player elements not found on this page');
      return;
    }

    // Load saved state
    loadMusicState();

    // Set up audio toggle button
    audioToggle.addEventListener('click', toggleMute);

    // Sync playback position periodically
    syncTimer = setInterval(syncPlaybackState, SYNC_INTERVAL);

    // Clean up on page unload
    window.addEventListener('beforeunload', savePlaybackState);

    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
  }

  // Load music state from localStorage
  async function loadMusicState() {
    try {
      // Load tracks from server
      const audioRes = await fetch('data/audio.json');
      const audioData = await audioRes.json();

      if (audioData?.tracks && Array.isArray(audioData.tracks) && audioData.tracks.length > 0) {
        audioTracks = audioData.tracks;
        localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(audioTracks));
      } else {
        // Try to load from localStorage
        const savedTracks = localStorage.getItem(STORAGE_KEYS.TRACKS);
        if (savedTracks) {
          audioTracks = JSON.parse(savedTracks);
        }
      }

      if (audioTracks.length === 0) {
        console.log('No audio tracks available');
        return;
      }

      // Show audio toggle
      audioToggle.style.display = 'flex';

      // Check if music is already playing in another tab
      const lastUpdate = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || '0');
      const timeSinceUpdate = Date.now() - lastUpdate;

      if (timeSinceUpdate < PAGE_TIMEOUT) {
        // Music is playing in another tab, sync to it
        console.log('Syncing to existing playback...');
        syncToExistingPlayback();
      } else {
        // Start fresh playback
        console.log('Starting fresh playback...');
        startPlayback();
      }

      // Load mute state
      isMuted = localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
      updateMuteUI();

    } catch (e) {
      console.error('Error loading music state:', e);
    }
  }

  // Start playback from beginning or saved position
  function startPlayback() {
    const savedTrackIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK) || '0');
    const savedTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME) || '0');
    const hasPlayedBefore = localStorage.getItem('wwwc_has_played') === 'true';

    currentTrackIndex = savedTrackIndex % audioTracks.length;
    currentAudioElement = bgAudio1;
    nextAudioElement = bgAudio2;

    const track = audioTracks[currentTrackIndex];
    const startTime = track.startTime || 0;

    currentAudioElement.src = track.url;
    currentAudioElement.currentTime = savedTime || startTime;
    currentAudioElement.volume = isMuted ? 0 : (hasPlayedBefore ? 1 : 0); // Start at 0 only for first visit
    currentAudioElement.dataset.endTime = track.endTime || '';
    currentAudioElement.dataset.trackIndex = currentTrackIndex.toString();

    currentAudioElement.play().then(() => {
      isPlaying = true;
      // Only fade in on very first visit to the site
      if (!isMuted && !hasPlayedBefore) {
        fadeIn(currentAudioElement, 5000); // 5 second fade-in on first visit
        localStorage.setItem('wwwc_has_played', 'true');
      }
      setupTimeUpdateListeners();
      updateMuteUI();
    }).catch(err => {
      console.log('Autoplay may be blocked - music will start on user interaction:', err);
      isPlaying = false;
      // Show unmuted icon to indicate music is ready
      updateMuteUI();
    });
  }

  // Sync to playback happening in another tab/page
  function syncToExistingPlayback() {
    const savedTrackIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK) || '0');
    const savedTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME) || '0');

    currentTrackIndex = savedTrackIndex % audioTracks.length;
    currentAudioElement = bgAudio1;
    nextAudioElement = bgAudio2;

    const track = audioTracks[currentTrackIndex];

    currentAudioElement.src = track.url;
    currentAudioElement.currentTime = savedTime;
    currentAudioElement.volume = isMuted ? 0 : 1; // Full volume for continuous playback
    currentAudioElement.dataset.endTime = track.endTime || '';
    currentAudioElement.dataset.trackIndex = currentTrackIndex.toString();

    currentAudioElement.play().then(() => {
      isPlaying = true;
      // No fade-in when navigating between pages - continuous playback
      setupTimeUpdateListeners();
    }).catch(err => {
      console.log('Sync playback failed:', err);
      // If sync fails, try starting fresh
      startPlayback();
    });
  }

  // Set up time update listeners for crossfade
  function setupTimeUpdateListeners() {
    currentAudioElement.addEventListener('timeupdate', handleTimeUpdate);
    nextAudioElement.addEventListener('timeupdate', handleTimeUpdate);
  }

  // Handle time updates and trigger crossfade
  function handleTimeUpdate() {
    const customEndTime = this.dataset.endTime ? parseFloat(this.dataset.endTime) : null;
    const effectiveEndTime = customEndTime || this.duration;
    const timeLeft = effectiveEndTime - this.currentTime;

    if (customEndTime && this.currentTime >= customEndTime - (CROSSFADE_DURATION / 1000)) {
      if (!this.dataset.crossfading) {
        this.dataset.crossfading = 'true';
        crossfadeToNextTrack();
      }
    } else if (timeLeft <= CROSSFADE_DURATION / 1000 && timeLeft > 0 && !this.dataset.crossfading) {
      this.dataset.crossfading = 'true';
      crossfadeToNextTrack();
    }

    if (this.currentTime < 1) {
      delete this.dataset.crossfading;
    }
  }

  // Crossfade to next track
  function crossfadeToNextTrack() {
    if (audioTracks.length === 0) return;

    currentTrackIndex = (currentTrackIndex + 1) % audioTracks.length;
    const nextTrack = audioTracks[currentTrackIndex];

    nextAudioElement.src = nextTrack.url;
    nextAudioElement.volume = 0;
    
    const startTime = nextTrack.startTime || 0;
    nextAudioElement.currentTime = startTime;
    nextAudioElement.dataset.endTime = nextTrack.endTime || '';
    nextAudioElement.dataset.trackIndex = currentTrackIndex.toString();

    nextAudioElement.play().then(() => {
      fadeIn(nextAudioElement, CROSSFADE_DURATION);
      fadeOut(currentAudioElement, CROSSFADE_DURATION);

      setTimeout(() => {
        const temp = currentAudioElement;
        currentAudioElement = nextAudioElement;
        nextAudioElement = temp;
        
        // Save new track index
        localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, currentTrackIndex.toString());
      }, CROSSFADE_DURATION);
    }).catch(err => {
      console.error('Error playing next track:', err);
    });
  }

  // Fade in audio
  function fadeIn(audio, duration) {
    if (isMuted) return;
    
    const steps = 60;
    const stepDuration = duration / steps;
    const volumeIncrement = 1 / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (isMuted) {
        clearInterval(fadeInterval);
        return;
      }
      currentStep++;
      audio.volume = Math.min(currentStep * volumeIncrement, 1);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.volume = 1;
      }
    }, stepDuration);
  }

  // Fade out audio
  function fadeOut(audio, duration) {
    const steps = 60;
    const stepDuration = duration / steps;
    const volumeDecrement = audio.volume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeDecrement, 0);

      if (currentStep >= steps || audio.volume <= 0) {
        clearInterval(fadeInterval);
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepDuration);
  }

  // Toggle mute
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(STORAGE_KEYS.MUTED, isMuted.toString());

    if (isMuted) {
      bgAudio1.volume = 0;
      bgAudio2.volume = 0;
    } else {
      if (!isPlaying) {
        startPlayback();
      } else {
        bgAudio1.volume = 1;
        bgAudio2.volume = 1;
      }
    }

    updateMuteUI();
  }

  // Update mute button UI
  function updateMuteUI() {
    if (isMuted) {
      audioIconMuted.style.display = 'block';
      audioIconPlaying.style.display = 'none';
    } else {
      audioIconMuted.style.display = 'none';
      audioIconPlaying.style.display = 'block';
    }
  }

  // Sync playback state to localStorage
  function syncPlaybackState() {
    if (!isPlaying || !currentAudioElement) return;

    localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, currentTrackIndex.toString());
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, currentAudioElement.currentTime.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
  }

  // Save playback state before page unload
  function savePlaybackState() {
    if (isPlaying && currentAudioElement) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, currentTrackIndex.toString());
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, currentAudioElement.currentTime.toString());
    }
  }

  // Handle storage changes from other tabs
  function handleStorageChange(e) {
    if (e.key === STORAGE_KEYS.MUTED) {
      isMuted = e.newValue === 'true';
      updateMuteUI();
      if (isMuted) {
        bgAudio1.volume = 0;
        bgAudio2.volume = 0;
      } else {
        bgAudio1.volume = 1;
        bgAudio2.volume = 1;
      }
    } else if (e.key === STORAGE_KEYS.ENABLED) {
      if (e.newValue === 'false') {
        // Music disabled globally
        if (currentAudioElement) currentAudioElement.pause();
        if (nextAudioElement) nextAudioElement.pause();
        isPlaying = false;
        if (audioToggle) audioToggle.style.display = 'none';
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalMusic);
  } else {
    initGlobalMusic();
  }

  // Expose global control function
  window.WWWCMusic = {
    enable: function() {
      localStorage.setItem(STORAGE_KEYS.ENABLED, 'true');
      location.reload();
    },
    disable: function() {
      localStorage.setItem(STORAGE_KEYS.ENABLED, 'false');
      if (currentAudioElement) currentAudioElement.pause();
      if (nextAudioElement) nextAudioElement.pause();
      isPlaying = false;
    },
    isEnabled: function() {
      return localStorage.getItem(STORAGE_KEYS.ENABLED) !== 'false';
    }
  };

})();

