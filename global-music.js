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
  let audioIconPlay = null;
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
    audioIconPlay = document.getElementById('audio-icon-play');
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

      // Load mute state - DEFAULT TO MUTED if not set
      const savedMuteState = localStorage.getItem(STORAGE_KEYS.MUTED);
      if (savedMuteState === null) {
        // First time - default to muted
        isMuted = true;
        localStorage.setItem(STORAGE_KEYS.MUTED, 'true');
      } else {
        isMuted = savedMuteState === 'true';
      }

      // Check if music was actually playing (not just muted state)
      const lastUpdate = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE) || '0');
      const timeSinceUpdate = Date.now() - lastUpdate;
      const isNavigation = timeSinceUpdate < 2000; // 2 second window for navigation

      // ONLY continue playback if:
      // 1. This is a navigation (within 2 seconds)
      // 2. Music is NOT muted
      // 3. Music was actually playing (isPlaying would have been true)
      if (isNavigation && !isMuted && lastUpdate > 0) {
        // Continue playback from where we left off (navigation between pages)
        console.log('Continuing playback from navigation...');
        syncToExistingPlayback();
      } else {
        // Don't auto-start music - user must click play button
        console.log('Music ready - click play button to start');
        isPlaying = false;
      }

      updateMuteUI();

    } catch (e) {
      console.error('Error loading music state:', e);
    }
  }

  // Start playback from beginning - ALWAYS reset to track 1 on page load
  function startPlayback() {
    // ALWAYS start from track 0 (first track) at the beginning
    currentTrackIndex = 0;
    currentAudioElement = bgAudio1;
    nextAudioElement = bgAudio2;

    const track = audioTracks[currentTrackIndex];
    const startTime = track.startTime || 0;

    currentAudioElement.src = track.url;
    currentAudioElement.currentTime = startTime; // Always start at beginning of track
    currentAudioElement.volume = isMuted ? 0 : 0; // Start at 0 for fade-in
    currentAudioElement.dataset.endTime = track.endTime || '';
    currentAudioElement.dataset.trackIndex = currentTrackIndex.toString();

    currentAudioElement.play().then(() => {
      isPlaying = true;
      // ALWAYS fade in over 5 seconds on page load
      if (!isMuted) {
        fadeIn(currentAudioElement, 5000); // 5 second fade-in
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
      // Mute - COMPLETELY STOP all audio playback
      if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement.volume = 0;
        currentAudioElement.currentTime = 0;
      }
      if (nextAudioElement) {
        nextAudioElement.pause();
        nextAudioElement.volume = 0;
        nextAudioElement.currentTime = 0;
      }
      // Ensure both audio elements are stopped
      bgAudio1.pause();
      bgAudio1.volume = 0;
      bgAudio1.currentTime = 0;
      bgAudio2.pause();
      bgAudio2.volume = 0;
      bgAudio2.currentTime = 0;
      isPlaying = false;
      // Clear last update to prevent auto-start on navigation
      localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
      console.log('Music muted and stopped');
    } else {
      // Unmute - start playback from beginning of track 1
      console.log('Unmuting - starting playback from track 1');
      startPlayback();
    }

    updateMuteUI();
  }

  // Update mute button UI
  function updateMuteUI() {
    if (!isPlaying) {
      // Not playing - show PLAY button
      audioIconPlay.style.display = 'block';
      audioIconMuted.style.display = 'none';
      audioIconPlaying.style.display = 'none';
      audioToggle.title = 'Click to play music';
    } else if (isMuted) {
      // Playing but muted - show muted speaker
      audioIconPlay.style.display = 'none';
      audioIconMuted.style.display = 'block';
      audioIconPlaying.style.display = 'none';
      audioToggle.title = 'Click to unmute music';
    } else {
      // Playing and unmuted - show playing speaker
      audioIconPlay.style.display = 'none';
      audioIconMuted.style.display = 'none';
      audioIconPlaying.style.display = 'block';
      audioToggle.title = 'Click to mute music';
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
    if (isPlaying && currentAudioElement && !isMuted) {
      // Only save state if music is actually playing and not muted
      localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, currentTrackIndex.toString());
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, currentAudioElement.currentTime.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
    } else {
      // Clear last update if not playing - prevents auto-start on navigation
      localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
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

