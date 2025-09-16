// GDSC Members Dynamic Display
// This script loads member data from data.json and creates beautiful cards

// Utility function to generate initials from a person's name
function getInitials(name) {
  if (!name) return 'GM'; // Default: GDSC Member
  
  return name
    .split(' ')
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// Function to get Google color class based on member index
function getGoogleColorClass(index) {
  const colors = ['google-blue', 'google-red', 'google-yellow', 'google-green'];
  return colors[index % 4];
}

// Function to sanitize and format text
function sanitizeText(text) {
  if (!text) return '';
  return text.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

// Function to create a member card HTML
function createMemberCard(member, index) {
  const name = sanitizeText(member.name);
  const title = sanitizeText(member.title);
  const college = sanitizeText(member.college);
  
  const initials = getInitials(name);
  const colorClass = getGoogleColorClass(index);
  
  return `
    <figure class="card" tabindex="0" role="article" aria-label="Member: ${name}">
      <div class="card-header">
        <div class="avatar ${colorClass}" aria-hidden="true">
          ${initials}
        </div>
      </div>
      <figcaption class="card-content">
        <p class="name">${name}</p>
        <p class="title">${title}</p>
        <p class="college">${college}</p>
      </figcaption>
    </figure>
  `;
}

// Function to show loading state
function showLoading() {
  const membersGrid = document.getElementById('members-grid');
  membersGrid.innerHTML = `
    <div class="loading" role="status" aria-live="polite">
      <div>Loading our amazing GDSC members...</div>
    </div>
  `;
}

// Function to show error state
function showError(message) {
  const membersGrid = document.getElementById('members-grid');
  membersGrid.innerHTML = `
    <div class="error" role="alert">
      <h3>Oops! Something went wrong</h3>
      <p>${message}</p>
      <p>Please check if the data.json file exists and is properly formatted.</p>
      <button onclick="loadMembers()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--google-blue); color: white; border: none; border-radius: 8px; cursor: pointer;">
        Try Again
      </button>
    </div>
  `;
}

// Function to animate cards in sequence
function animateCards() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    // Skip the first card (template card) from animation
    if (index === 0) return;
    
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    // Stagger the animations
    setTimeout(() => {
      card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, (index - 1) * 100); // Subtract 1 to account for template card
  });
}

// Main function to load and display members
async function loadMembers() {
  const membersGrid = document.getElementById('members-grid');
  
  try {
    showLoading();
    
    // Fetch the member data
    const response = await fetch('data.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate data structure
    if (!data || !data.members || !Array.isArray(data.members)) {
      throw new Error('Invalid data format: Expected an object with a "members" array');
    }
    
    if (data.members.length === 0) {
      membersGrid.innerHTML = `
        <div class="error">
          <h3>No members found</h3>
          <p>The GDSC community is waiting for amazing people like you!</p>
        </div>
      `;
      return;
    }
    
    // Keep the original template card and add new members
    const templateCard = document.querySelector('.card');
    let membersHTML = templateCard ? templateCard.outerHTML : '';
    
    // Generate HTML for all members from JSON
    data.members.forEach((member, index) => {
      if (member.name && member.title && member.college) {
        membersHTML += createMemberCard(member, index);
      }
    });
    
    // Update the grid with all cards
    membersGrid.innerHTML = membersHTML;
    
    // Add success message to console
    console.log(`✅ Successfully loaded ${data.members.length} GDSC members!`);
    
    // Animate the cards
    setTimeout(animateCards, 100);
    
    // document.title = `GDSC REC Members (${data.members.length + 1}) - Google Developer Student Club`;
    
  } catch (error) {
    console.error('❌ Error loading members:', error);
    showError(error.message);
  }
}

// Function to add interactive features
function addInteractivity() {
  // Add click animation to cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      // Create a ripple effect
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    }
  });
  
  // Add keyboard navigation support
  document.addEventListener('keydown', (e) => {
    const focusedCard = document.activeElement;
    
    if (focusedCard && focusedCard.classList.contains('card')) {
      const cards = [...document.querySelectorAll('.card')];
      const currentIndex = cards.indexOf(focusedCard);
      
      let nextCard = null;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextCard = cards[currentIndex + 1];
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextCard = cards[currentIndex - 1];
          break;
        case 'Home':
          nextCard = cards[0];
          break;
        case 'End':
          nextCard = cards[cards.length - 1];
          break;
      }
      
      if (nextCard) {
        e.preventDefault();
        nextCard.focus();
      }
    }
    
    // Refresh shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      loadMembers();
    }
  });
}

// Function to handle window events
function setupWindowEvents() {
  // Reload data when window gains focus (useful during development)
  let isVisible = true;
  
  document.addEventListener('visibilitychange', () => {
    if (!isVisible && !document.hidden) {
      // Page became visible again, optionally reload data
      console.log('🔄 Page became visible - data is up to date');
    }
    isVisible = !document.hidden;
  });
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored');
  });
  
  window.addEventListener('offline', () => {
    console.log('📡 Connection lost');
  });
}

// Function to add performance monitoring
function addPerformanceMonitoring() {
  // Monitor loading performance
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log(`⚡ Page loaded in ${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`);
        }
      }, 0);
    });
  }
}

// Initialize the application
function initApp() {
  console.log('🚀 Initializing GDSC Members App...');
  
  // Set current year dynamically
  updateCurrentYear();
  
  // Load members data
  loadMembers();
  
  // Add interactive features
  addInteractivity();
  
  // Setup window event handlers
  setupWindowEvents();
  
  // Add performance monitoring
  addPerformanceMonitoring();
  
  console.log('✨ GDSC Members App initialized successfully!');
}

// Function to update the current year
function updateCurrentYear() {
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    const currentYear = new Date().getFullYear();
    currentYearElement.textContent = currentYear;
    console.log(`📅 Updated copyright year to ${currentYear}`);
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export functions for testing/debugging (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getInitials,
    getGoogleColorClass,
    createMemberCard,
    loadMembers
  };
}
