// Global Theme Toggle Script
// Weekend Warriors Wrestling Club

(function() {
  'use strict';
  
  // Initialize theme on page load
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    // Apply saved theme
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    }
    
    // Create theme toggle button if it doesn't exist
    if (!document.getElementById('theme-toggle')) {
      const themeToggle = document.createElement('button');
      themeToggle.id = 'theme-toggle';
      themeToggle.className = 'theme-toggle';
      themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';
      themeToggle.setAttribute('aria-label', 'Toggle theme');
      
      // Add click handler
      themeToggle.addEventListener('click', toggleTheme);
      
      // Insert at beginning of body
      document.body.insertBefore(themeToggle, document.body.firstChild);
    }
  }
  
  // Toggle theme function
  function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = 'Dark Mode';
    } else {
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = 'Light Mode';
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();

