// ===== CONFIG =====
const API_BASE_URL = '/api';

// ===== STATE =====
let PLACES = [];
let filteredPlaces = [];
let map = null;
let markers = [];
let activeMarker = null;

// Filter State
let currentCategory = 'all';
let currentSearch = '';

// ===== DOM ELEMENTS =====
const elements = {
  placesContainer: document.getElementById('placesContainer'),
  resultsDropdown: document.getElementById('resultsDropdown'),
  mobileResultsList: document.getElementById('mobileResultsList'),
  mobileResultsCount: document.getElementById('mobileResultsCount'),
  mobileSearchInput: document.getElementById('mobileSearchInput'),
  desktopSearchInput: document.getElementById('desktopSearchInput'),
  mobileClearBtn: document.getElementById('mobileClearBtn'),
  desktopClearBtn: document.getElementById('desktopClearBtn'),
  placeModal: document.getElementById('placeModal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalClose: document.getElementById('modalClose'),
  modalBody: document.getElementById('modalBody')
};

// ===== CATEGORIES CONFIG =====
const categoriesConfig = {
  food: { emoji: '🍜', name: 'Еда', color: '#fbbf24' },
  fun: { emoji: '🎉', name: 'Досуг', color: '#8b5cf6' },
  study: { emoji: '📚', name: 'Учёба', color: '#34d399' },
  print: { emoji: '🖨️', name: 'Печать', color: '#3b82f6' },
  all: { emoji: '📍', name: 'Все', color: '#64748b' } // Fallback
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadPlaces();
  setupEventListeners();
});

function initMap() {
  const mapCenter = [57.1522, 65.5415]; // Tyumen center
  map = L.map('map', {
    zoomControl: false, // We'll add it manually if needed, or rely on gestures
    fadeAnimation: true,
    zoomAnimation: true,
    attributionControl: false
  }).setView(mapCenter, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  // Add zoom control to top-right for desktop, hidden on mobile usually? 
  // Let's just add it standard, it's fine.
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Close mobile results when clicking on map
  map.on('click', () => {
    if (window.innerWidth <= 768) {
      showMobileResults(false);
      // Also blur input to hide keyboard
      if (elements.mobileSearchInput) elements.mobileSearchInput.blur();
    }
  });
}

async function loadPlaces() {
  try {
    const response = await fetch(`${API_BASE_URL}/places`);
    if (!response.ok) throw new Error('Network response was not ok');
    PLACES = await response.json();
    filteredPlaces = PLACES;
    renderAll();
  } catch (error) {
    console.error('Failed to load places:', error);
    // Show error in sidebar or toast
  }
}

function setupEventListeners() {
  // Desktop Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => setCategory(e.target.dataset.category));
  });

  // Mobile Filters
  document.querySelectorAll('.filter-btn-mobile').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Traverse up to find button in case icon/span clicked
      const target = e.target.closest('.filter-btn-mobile');
      setCategory(target.dataset.category);
    });
  });

  // Search Inputs
  if (elements.desktopSearchInput) {
    elements.desktopSearchInput.addEventListener('input', (e) => setSearch(e.target.value));
  }
  if (elements.mobileSearchInput) {
    elements.mobileSearchInput.addEventListener('input', (e) => setSearch(e.target.value));
    elements.mobileSearchInput.addEventListener('focus', () => {
      showMobileResults(true);
    });
  }

  // Clear Buttons
  if (elements.desktopClearBtn) {
    elements.desktopClearBtn.addEventListener('click', () => {
      elements.desktopSearchInput.value = '';
      setSearch('');
    });
  }
  if (elements.mobileClearBtn) {
    elements.mobileClearBtn.addEventListener('click', () => {
      elements.mobileSearchInput.value = '';
      setSearch('');
    });
  }

  // Modal Actions
  if (elements.modalClose) elements.modalClose.addEventListener('click', closeModal);
  if (elements.modalBackdrop) elements.modalBackdrop.addEventListener('click', closeModal);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (elements.resultsDropdown && elements.mobileSearchInput) {
      if (!elements.resultsDropdown.contains(e.target) && !elements.mobileSearchInput.contains(e.target)) {
        if (elements.resultsDropdown.classList.contains('visible')) {
          showMobileResults(false);
        }
      }
    }
  });
}

// ===== LOGIC =====

function setCategory(category) {
  currentCategory = category;
  
  // Update UI buttons
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === category);
  });
  document.querySelectorAll('.filter-btn-mobile').forEach(b => {
    b.classList.toggle('active', b.dataset.category === category);
  });

  filterPlaces();
}

function setSearch(term) {
  currentSearch = term.toLowerCase();
  
  // Update toggle visibility
  if (elements.desktopClearBtn) {
      elements.desktopClearBtn.classList.toggle('hidden', !term);
  }
  if (elements.mobileClearBtn) {
      elements.mobileClearBtn.classList.toggle('hidden', !term);
  }

  // Sync inputs
  if (elements.desktopSearchInput && elements.desktopSearchInput.value !== term) {
    elements.desktopSearchInput.value = term;
  }
  if (elements.mobileSearchInput && elements.mobileSearchInput.value !== term) {
    elements.mobileSearchInput.value = term;
  }

  filterPlaces();
}

function filterPlaces() {
  filteredPlaces = PLACES.filter(place => {
    const matchCategory = currentCategory === 'all' || place.category === currentCategory;
    const matchSearch = !currentSearch || 
      place.name.toLowerCase().includes(currentSearch) || 
      place.address.toLowerCase().includes(currentSearch);
    return matchCategory && matchSearch;
  });

  renderAll();
}

function renderAll() {
  updateMarkers();
  renderSidebar();
  renderMobileResults();
}

// ===== RENDERING =====

function updateMarkers() {
  // Clear existing
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  filteredPlaces.forEach(place => {
    const catConfig = categoriesConfig[place.category] || categoriesConfig.all;
    
    const icon = L.divIcon({
      html: `<div style="
        background: ${catConfig.color};
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        transition: transform 0.2s;
      ">${catConfig.emoji}</div>`,
      className: 'custom-marker-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20]
    });

    const marker = L.marker(place.coordinates, { icon }).addTo(map);
    
    // Create Desktop Popup Content
    const popupContent = `
      <div style="min-width: 260px; font-family: 'Inter', sans-serif; padding: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
           <div style="font-weight: 800; font-size: 18px; color: #0f172a; line-height: 1.2;">${place.name}</div>
           <div style="background: ${catConfig.color}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-left: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${catConfig.emoji}</div>
        </div>
        <div style="font-size: 14px; color: #475569; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="margin-right: 6px; font-size: 16px;">📍</span> ${place.address}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 6px 10px; border-radius: 8px; display: inline-block;">
            💰 ${formatPrice(place.price)}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 6px 10px; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0;">
            🕐 ${place.hours}
          </div>
        </div>
        ${place.description ? `<div style="font-size: 13px; color: #334155; margin-top: 10px; line-height: 1.5; border-top: 2px solid #f1f5f9; padding-top: 10px;">${place.description}</div>` : ''}
        
        ${place.tips && place.tips.length > 0 ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #f1f5f9;">
            <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;">💡 ИНФОРМАЦИЯ</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569;">
              ${place.tips.map(tip => `<li style="margin-bottom: 2px;">${tip}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="margin-top: 12px; display: flex; gap: 8px;">
           <a href="${place.links?.map || '#'}" target="_blank" style="flex: 1; text-align: center; background: #3b82f6; color: white; text-decoration: none; padding: 8px; border-radius: 8px; font-size: 13px; font-weight: 600; transition: background 0.2s;">🗺️ Маршрут</a>
        </div>
      </div>
    `;
    
    // Bind Popup (Leaflet handles click to open)
    marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10],
        className: 'custom-popup'
    });

    // Custom Click Handler (also selects sidebar item)
    marker.on('click', () => {
      onPlaceSelect(place);
    });

    markers.push(marker);
  });
}

function renderSidebar() {
  if (!elements.placesContainer) return;
  elements.placesContainer.innerHTML = '';

  if (filteredPlaces.length === 0) {
    elements.placesContainer.innerHTML = '<div class="no-results">Ничего не найдено</div>';
    return;
  }

  filteredPlaces.forEach(place => {
    const card = document.createElement('div');
    card.className = `place-card ${place.id === activeMarker?.id ? 'active' : ''} category-${place.category}`;
    
    const catConfig = categoriesConfig[place.category];
    const priceDisplay = formatPrice(place.price);

    card.innerHTML = `
      <div class="place-card-header">
        <h3 class="place-name">${place.name}</h3>
        <span class="place-category-badge" style="background:${catConfig.color}">${catConfig.emoji}</span>
      </div>
      <div class="place-address">📍 ${place.address}</div>
      <div class="place-price">💰 ${priceDisplay} • 🕐 ${place.hours}</div>
    `;

    card.addEventListener('click', () => {
      onPlaceSelect(place);
    });

    elements.placesContainer.appendChild(card);
  });
}

function renderMobileResults() {
  if (!elements.mobileResultsList) return;

  elements.mobileResultsList.innerHTML = '';
  elements.mobileResultsCount.textContent = filteredPlaces.length;

  // Show dropdown if searching
  const shouldShow = currentSearch.length > 0;
  showMobileResults(shouldShow);

  if (filteredPlaces.length === 0) {
     elements.mobileResultsList.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8">Ничего не найдено</div>';
     return;
  }

  filteredPlaces.forEach(place => {
    const catConfig = categoriesConfig[place.category];
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="result-icon" style="background: ${catConfig.color}">${catConfig.emoji}</div>
      <div class="result-info">
        <div class="result-name">${place.name}</div>
        <div class="result-address">${place.address}</div>
      </div>
      <div class="result-meta">${formatPrice(place.price)}</div>
    `;

    item.addEventListener('click', () => {
      onPlaceSelect(place);
    });

    elements.mobileResultsList.appendChild(item);
  });
}

function onPlaceSelect(place) {
  activeMarker = place;
  
  // Center map
  map.setView(place.coordinates, 15);

  // Desktop: Highlight sidebar card
  renderSidebar(); // to update active class
  
  // Find and open popup (Universal behavior: Desktop & Mobile)
  const marker = markers.find(m => m.getLatLng().lat === place.coordinates[0] && m.getLatLng().lng === place.coordinates[1]);
  if (marker) {
    marker.openPopup();
  }
  
  // Mobile: Just hide the list (don't open big modal anymore, use popup instead)
  if (window.innerWidth <= 768) {
    showMobileResults(false); 
    // openModal(place); // Disabled in favor of map popup as requested
  }
}

// ===== HELPERS =====

function formatPrice(price) {
  if (price.min === 0 && price.max === 0) return 'Бесплатно';
  if (price.min === price.max) return `${price.min}₽`;
  return `${price.min}–${price.max}₽`;
}

function showMobileResults(visible) {
  if (!elements.resultsDropdown) return;

  // Check if we are actually on mobile (or small screen)
  if (window.innerWidth > 768) return;

  if (visible) {
    elements.resultsDropdown.classList.add('visible');
  } else {
    elements.resultsDropdown.classList.remove('visible');
  }
}

function openModal(place) {
  const catConfig = categoriesConfig[place.category];
  const priceDisplay = formatPrice(place.price);
  
  // Generate Tips HTML
  let tipsHtml = '';
  if (place.tips && place.tips.length > 0) {
    tipsHtml = `
      <div class="modal-section">
        <div class="modal-section-title">💡 Лайфхаки</div>
        <div class="modal-tips">
          ${place.tips.map(tip => `<div class="modal-tip-item">${tip}</div>`).join('')}
        </div>
      </div>
    `;
  }

  // Generate Links HTML
  let linksHtml = '';
  if (place.links) {
     const links = [];
     if (place.links.map) links.push(`<a href="${place.links.map}" target="_blank" class="modal-link">🗺️ На карте</a>`);
     if (place.links.website) links.push(`<a href="${place.links.website}" target="_blank" class="modal-link secondary">🌐 Сайт</a>`);
     if (links.length > 0) linksHtml = `<div class="modal-links">${links.join('')}</div>`;
  }

  elements.modalBody.innerHTML = `
    <div class="modal-place-icon" style="background: ${catConfig.color}">${catConfig.emoji}</div>
    <h2 class="modal-place-name">${place.name}</h2>
    <div class="modal-place-category" style="background: ${catConfig.color}">${catConfig.emoji} ${catConfig.name}</div>

    <div class="modal-section">
      <div class="modal-section-title">Информация</div>
      <div class="modal-info-row">
        <span class="modal-info-icon">📍</span>
        <span class="modal-info-text">${place.address}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-icon">🕐</span>
        <span class="modal-info-text">${place.hours}</span>
      </div>
      <div class="modal-info-row">
        <span class="modal-info-icon">💰</span>
        <span class="modal-price-badge">${priceDisplay}</span>
      </div>
    </div>
    
    ${tipsHtml}
    ${linksHtml}
  `;

  elements.placeModal.classList.add('visible');
}

function closeModal() {
  elements.placeModal.classList.remove('visible');
}
