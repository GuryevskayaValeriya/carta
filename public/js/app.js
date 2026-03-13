// ===== CONFIG =====
const API_BASE_URL = '/api';

// ===== STATE =====
let PLACES = [];
let filteredPlaces = [];
let map = null;
let markers = [];
let activeMarker = null;
let userLocationMarker = null;
let userLocationAccuracyCircle = null;
let userLocationCoordinates = null;
let routeLayer = null;

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
  addGeolocationControl();

  // Close mobile results when clicking on map
  map.on('click', () => {
    if (window.innerWidth <= 768) {
      showMobileResults(false);
      toggleMobileCategories(true); // Show categories back when interacting with map
      // Also blur input to hide keyboard
      if (elements.mobileSearchInput) elements.mobileSearchInput.blur();
    }
  });
}

function addGeolocationControl() {
  const GeolocationControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-bar geolocation-control');
      const button = L.DomUtil.create('button', 'geolocation-btn', container);
      button.type = 'button';
      button.setAttribute('aria-label', 'Определить моё местоположение');
      button.setAttribute('title', 'Моё местоположение');
      button.innerHTML = `
        <span class="geolocation-btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5L14.85 9.15L21.5 12L14.85 14.85L12 21.5L9.15 14.85L2.5 12L9.15 9.15L12 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="2.1" fill="currentColor"/>
          </svg>
        </span>
      `;

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(button, 'click', () => centerOnUserLocation(button));

      return container;
    }
  });

  map.addControl(new GeolocationControl());
}

async function centerOnUserLocation(button) {
  button.disabled = true;
  button.classList.add('locating');
  try {
    const position = await requestUserLocation();
    updateUserLocation(position);
    map.setView(userLocationCoordinates, 16);
  } catch (error) {
    showUserLocationError(error);
  } finally {
    button.disabled = false;
    button.classList.remove('locating');
  }
}

function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: -1 });
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

function updateUserLocation(position) {
  const userCoords = [position.coords.latitude, position.coords.longitude];
  const accuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 50;
  userLocationCoordinates = userCoords;

  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
  }
  if (userLocationAccuracyCircle) {
    map.removeLayer(userLocationAccuracyCircle);
  }

  const locationIcon = L.divIcon({
    className: 'user-location-marker-wrapper',
    html: '<div class="user-location-marker"><span class="user-location-dot"></span><span class="user-location-pulse"></span></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  userLocationMarker = L.marker(userCoords, { icon: locationIcon }).addTo(map);
  userLocationMarker
    .bindTooltip('Вы здесь', {
      permanent: true,
      direction: 'right',
      offset: [14, 0],
      className: 'user-location-tooltip'
    })
    .openTooltip();

  userLocationAccuracyCircle = L.circle(userCoords, {
    radius: accuracy,
    color: '#2563eb',
    weight: 1,
    fillColor: '#60a5fa',
    fillOpacity: 0.18
  }).addTo(map);
}

function showUserLocationError(error) {
  if (error.code === -1) {
    alert('Определение местоположения не поддерживается этим браузером.');
    return;
  }

  if (error.code === 1) {
    alert('Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.');
    return;
  }

  if (error.code === 2) {
    alert('Не удалось определить местоположение. Проверьте GPS/интернет и попробуйте снова.');
    return;
  }

  if (error.code === 3) {
    alert('Превышено время ожидания геолокации. Попробуйте ещё раз.');
    return;
  }

  alert('Не удалось получить местоположение.');
}

async function buildRouteToPlace(place, routeButton) {
  routeButton.disabled = true;
  routeButton.classList.add('loading');
  routeButton.textContent = 'Строим...';

  try {
    const position = await requestUserLocation();
    updateUserLocation(position);
    const routeCoordinates = await fetchRouteCoordinates(userLocationCoordinates, place.coordinates);
    drawRoute(routeCoordinates);
    map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
  } catch (error) {
    if (error.code) {
      showUserLocationError(error);
    } else {
      alert('Не удалось построить маршрут. Попробуйте ещё раз через пару секунд.');
    }
  } finally {
    routeButton.disabled = false;
    routeButton.classList.remove('loading');
    routeButton.textContent = '🗺️ Маршрут';
  }
}

async function fetchRouteCoordinates(fromCoordinates, toCoordinates) {
  const [fromLat, fromLng] = fromCoordinates;
  const [toLat, toLng] = toCoordinates;
  
  // Используем наш прокси-сервер вместо прямого запроса
  const requestUrl = `${API_BASE_URL}/route?from=${fromLng},${fromLat}&to=${toLng},${toLat}`;
  const response = await fetch(requestUrl);

  if (!response.ok) {
    throw new Error('Route API request failed');
  }

  const data = await response.json();
  const route = data.routes && data.routes[0];
  if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) {
    throw new Error('Route geometry is missing');
  }

  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

function drawRoute(routeCoordinates) {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  routeLayer = L.polyline(routeCoordinates, {
    color: '#2563eb',
    weight: 6,
    opacity: 0.9,
    lineJoin: 'round'
  }).addTo(map);
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
      toggleMobileCategories(false); // Hide categories on focus
    });
    // Optional: Show categories back when blur/cancel? 
    // Usually users want them back when they clear search or close dropdown.
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
      toggleMobileCategories(true); // Show categories back
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
    const popupContent = document.createElement('div');
    popupContent.style.minWidth = '260px';
    popupContent.style.fontFamily = "'Inter', sans-serif";
    popupContent.style.padding = '6px';

    popupContent.innerHTML = `
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
         <button type="button" class="route-to-place-btn" style="flex: 1; text-align: center; background: #3b82f6; color: white; border: none; padding: 8px; border-radius: 8px; font-size: 13px; font-weight: 600; transition: background 0.2s; cursor: pointer;">🗺️ Маршрут</button>
      </div>
    `;
    
    // Bind click event to the route button
    const routeBtn = popupContent.querySelector('.route-to-place-btn');
    if (routeBtn) {
      routeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click
        buildRouteToPlace(place, routeBtn);
      });
    }

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

function toggleMobileCategories(visible) {
  const bottomCategories = document.querySelector('.bottom-categories');
  const geolocationControl = document.querySelector('.geolocation-control');
  
  if (bottomCategories) {
    if (visible) {
      bottomCategories.classList.remove('hidden');
    } else {
      bottomCategories.classList.add('hidden');
    }
  }

  if (geolocationControl && window.innerWidth <= 768) {
    if (visible) {
      geolocationControl.classList.remove('hidden');
    } else {
      geolocationControl.classList.add('hidden');
    }
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
