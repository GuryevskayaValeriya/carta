// ===== CONFIG =====
const API_BASE_URL = '/api';

// ===== STATE =====
let PLACES = [];
let filteredPlaces = [];
let map = null;
let markers = [];
let activeMarker = null;
let userLocationMarker = null;
let userLocationCoordinates = null;
let routeLayer = null;

// Filter State
let currentCategory = 'all';
let currentSearch = '';

// Route State
let currentRouteProfile = 'foot';

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
  modalBody: document.getElementById('modalBody'),
  routeModal: document.getElementById('routeModal'),
  routeModalClose: document.getElementById('routeModalClose'),
  routeModalBack: document.getElementById('routeModalBack'),
  routeDestinationName: document.getElementById('routeDestinationName'),
  routeTransports: document.getElementById('routeTransports'),
  sidebarRoutePanel: document.getElementById('sidebarRoutePanel'),
  sidebarRouteBack: document.getElementById('sidebarRouteBack'),
  sidebarRouteName: document.getElementById('sidebarRouteName'),
  sidebarRouteTransports: document.getElementById('sidebarRouteTransports'),
  sidebarContent: document.getElementById('sidebarContent'),
  sidebarFilters: document.querySelector('.sidebar-filters')
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
  userLocationCoordinates = userCoords;

  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
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

function calculateDistance(from, to) {
  const R = 6371e3;
  const φ1 = from[0] * Math.PI / 180;
  const φ2 = to[0] * Math.PI / 180;
  const Δφ = (to[0] - from[0]) * Math.PI / 180;
  const Δλ = (to[1] - from[1]) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getOptimalProfile(distance) {
  return distance < 2000 ? 'foot' : 'driving';
}

// Route modal state
let routeModalPlace = null;
let routeResults = {};

async function openRouteModal(place) {
  routeModalPlace = place;
  routeResults = {};
  currentRouteProfile = 'foot';
  
  elements.routeDestinationName.textContent = place.name;
  if (elements.sidebarRouteName) elements.sidebarRouteName.textContent = place.name;
  
  elements.routeTransports.innerHTML = `
    <div class="route-transport-loading">
      <span>Прокладываем маршрут...</span>
    </div>
  `;
  if (elements.sidebarRouteTransports) {
    elements.sidebarRouteTransports.innerHTML = `
      <div class="route-transport-loading">
        <span>Прокладываем маршрут...</span>
      </div>
    `;
  }
  
  showRouteModal(true);
  
  try {
    const position = await requestUserLocation();
    updateUserLocation(position);
    
    const [footRoute, drivingRoute] = await Promise.allSettled([
      fetchRouteCoordinates(userLocationCoordinates, place.coordinates, 'foot'),
      fetchRouteCoordinates(userLocationCoordinates, place.coordinates, 'driving')
    ]);
    
    routeResults = {
      foot: footRoute.status === 'fulfilled' ? footRoute.value : null,
      driving: drivingRoute.status === 'fulfilled' ? drivingRoute.value : null
    };
    
    const distance = calculateDistance(userLocationCoordinates, place.coordinates);
    currentRouteProfile = getOptimalProfile(distance);
    
    renderRouteTransports();
    
    if (routeResults[currentRouteProfile]) {
      drawRoute(routeResults[currentRouteProfile].coordinates, currentRouteProfile);
      map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
    }
    
  } catch (error) {
    console.error('Route error:', error);
    elements.routeTransports.innerHTML = `
      <div class="route-transport-error">
        <span>Не удалось построить маршрут</span>
      </div>
    `;
    elements.routeModalAction.innerHTML = 'Ошибка';
  }
}

function renderRouteTransports() {
  const foot = routeResults.foot;
  const driving = routeResults.driving;
  const isMobile = window.innerWidth <= 768;
  
  const transportHTML = `
    <button class="route-transport ${currentRouteProfile === 'foot' ? 'active' : ''}" data-profile="foot">
      <span class="route-transport-icon">🚶</span>
      <div class="route-transport-info">
        <span class="route-transport-time">${foot ? formatTime(foot.duration) : '—'}</span>
        <span class="route-transport-distance">${foot ? formatDistance(foot.distance) : '—'}</span>
      </div>
    </button>
    <button class="route-transport ${currentRouteProfile === 'driving' ? 'active' : ''}" data-profile="driving">
      <span class="route-transport-icon">🚗</span>
      <div class="route-transport-info">
        <span class="route-transport-time">${driving ? formatTime(driving.duration) : '—'}</span>
        <span class="route-transport-distance">${driving ? formatDistance(driving.distance) : '—'}</span>
      </div>
    </button>
  `;
  
  // Render to mobile modal
  if (elements.routeTransports) {
    elements.routeTransports.innerHTML = transportHTML;
  }
  
  // Render to desktop sidebar
  if (elements.sidebarRouteTransports) {
    elements.sidebarRouteTransports.innerHTML = `
      <button class="sidebar-route-transport ${currentRouteProfile === 'foot' ? 'active' : ''}" data-profile="foot">
        <span class="sidebar-route-transport-icon">🚶</span>
        <div class="sidebar-route-transport-info">
          <span class="sidebar-route-transport-time">${foot ? formatTime(foot.duration) : '—'}</span>
          <span class="sidebar-route-transport-distance">${foot ? formatDistance(foot.distance) : '—'}</span>
        </div>
      </button>
      <button class="sidebar-route-transport ${currentRouteProfile === 'driving' ? 'active' : ''}" data-profile="driving">
        <span class="sidebar-route-transport-icon">🚗</span>
        <div class="sidebar-route-transport-info">
          <span class="sidebar-route-transport-time">${driving ? formatTime(driving.duration) : '—'}</span>
          <span class="sidebar-route-transport-distance">${driving ? formatDistance(driving.distance) : '—'}</span>
        </div>
      </button>
    `;
  }
  
  // Add click handlers for mobile
  if (elements.routeTransports) {
    elements.routeTransports.querySelectorAll('.route-transport').forEach(btn => {
      btn.addEventListener('click', handleTransportClick);
    });
  }
  
  // Add click handlers for desktop
  if (elements.sidebarRouteTransports) {
    elements.sidebarRouteTransports.querySelectorAll('.sidebar-route-transport').forEach(btn => {
      btn.addEventListener('click', handleTransportClick);
    });
  }
}

function handleTransportClick(e) {
  const btn = e.currentTarget;
  const profile = btn.dataset.profile;
  if (profile === currentRouteProfile || !routeResults[profile]) return;
  
  currentRouteProfile = profile;
  renderRouteTransports();
  
  if (routeModalPlace) {
    fetchAndDrawRoute(profile);
  }
}

async function fetchAndDrawRoute(profile) {
  if (!routeModalPlace || !userLocationCoordinates) return;
  
  try {
    const routeData = await fetchRouteCoordinates(userLocationCoordinates, routeModalPlace.coordinates, profile);
    drawRoute(routeData.coordinates, profile);
    map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
  } catch (err) {
    console.error('Switch route error:', err);
  }
}

function closeRouteModal() {
  showRouteModal(false);
  routeModalPlace = null;
  routeResults = {};
  
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
}

function showRouteModal(show) {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    if (show) {
      elements.routeModal.classList.add('visible');
      toggleMobileRouteUI(true);
    } else {
      elements.routeModal.classList.remove('visible');
      toggleMobileRouteUI(false);
    }
  } else {
    // Desktop - use sidebar
    if (show) {
      elements.sidebarRoutePanel.style.display = 'block';
      elements.sidebarContent.classList.add('hidden');
      elements.sidebarFilters.style.display = 'none';
    } else {
      elements.sidebarRoutePanel.style.display = 'none';
      elements.sidebarContent.classList.remove('hidden');
      elements.sidebarFilters.style.display = 'flex';
    }
  }
}

function toggleMobileRouteUI(show) {
  const bottomCategories = document.querySelector('.bottom-categories');
  const geolocationControl = document.querySelector('.geolocation-control');
  
  if (show) {
    if (bottomCategories) bottomCategories.classList.add('route-active');
    if (geolocationControl) geolocationControl.classList.add('route-active');
  } else {
    if (bottomCategories) bottomCategories.classList.remove('route-active');
    if (geolocationControl) geolocationControl.classList.remove('route-active');
  }
}

async function buildRouteToPlace(place, routeButton, popupContent) {
  routeButton.disabled = true;
  routeButton.classList.add('loading');
  routeButton.textContent = 'Прокладываем...';

  try {
    const position = await requestUserLocation();
    updateUserLocation(position);

    const distance = calculateDistance(userLocationCoordinates, place.coordinates);
    const optimalProfile = getOptimalProfile(distance);
    currentRouteProfile = optimalProfile;

    const routeData = await fetchRouteCoordinates(userLocationCoordinates, place.coordinates, optimalProfile);
    drawRoute(routeData.coordinates, optimalProfile);
    map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });

    const [footRoute, drivingRoute] = await Promise.allSettled([
      fetchRouteCoordinates(userLocationCoordinates, place.coordinates, 'foot'),
      fetchRouteCoordinates(userLocationCoordinates, place.coordinates, 'driving')
    ]);

    const results = {
      foot: footRoute.status === 'fulfilled' ? footRoute.value : null,
      driving: drivingRoute.status === 'fulfilled' ? drivingRoute.value : null
    };

    renderRoutePanel(place, popupContent, results, currentRouteProfile);

  } catch (error) {
    if (error.code) {
      showUserLocationError(error);
    } else {
      alert('Не удалось построить маршрут. Попробуйте ещё раз через пару секунд.');
    }
  } finally {
    routeButton.disabled = false;
    routeButton.classList.remove('loading');
    routeButton.style.display = 'none';
  }
}

function renderRoutePanel(place, popupContent, results, activeProfile) {
  const existingPanel = popupContent.querySelector('.route-result-panel');
  if (existingPanel) existingPanel.remove();

  const panel = document.createElement('div');
  panel.className = 'route-result-panel';

  const foot = results.foot;
  const driving = results.driving;

  panel.innerHTML = `
    <div class="route-result-header">Маршрут построен</div>
    <div class="route-options">
      <button class="route-option ${activeProfile === 'foot' ? 'active' : ''}" data-profile="foot">
        <span class="route-option-icon">🚶</span>
        <span class="route-option-info">
          <span class="route-option-time">${foot ? formatTime(foot.duration) : '—'}</span>
          <span class="route-option-distance">${foot ? formatDistance(foot.distance) : '—'}</span>
        </span>
      </button>
      <button class="route-option ${activeProfile === 'driving' ? 'active' : ''}" data-profile="driving">
        <span class="route-option-icon">🚗</span>
        <span class="route-option-info">
          <span class="route-option-time">${driving ? formatTime(driving.duration) : '—'}</span>
          <span class="route-option-distance">${driving ? formatDistance(driving.distance) : '—'}</span>
        </span>
      </button>
    </div>
  `;

  popupContent.appendChild(panel);

  panel.querySelectorAll('.route-option').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const profile = btn.dataset.profile;
      if (profile === currentRouteProfile) return;

      btn.disabled = true;
      currentRouteProfile = profile;

      panel.querySelectorAll('.route-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      try {
        const routeData = await fetchRouteCoordinates(userLocationCoordinates, place.coordinates, profile);
        drawRoute(routeData.coordinates, profile);
        map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
      } catch (err) {
        alert('Не удалось переключить маршрут');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function formatTime(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} ч ${m} мин`;
  }
  return `${mins} мин`;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }
  return `${Math.round(meters)} м`;
}

async function fetchRouteCoordinates(fromCoordinates, toCoordinates, profile = 'foot') {
  const [fromLat, fromLng] = fromCoordinates;
  const [toLat, toLng] = toCoordinates;
  
  const requestUrl = `${API_BASE_URL}/route?from=${fromLng},${fromLat}&to=${toLng},${toLat}&profile=${profile}`;
  const response = await fetch(requestUrl);

  if (!response.ok) {
    throw new Error('Route API request failed');
  }

  const data = await response.json();
  const route = data.routes && data.routes[0];
  if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) {
    throw new Error('Route geometry is missing');
  }

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    duration: route.duration,
    distance: route.distance
  };
}

function drawRoute(routeCoordinates, profile = 'foot') {
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  const colors = {
    driving: '#f97316',
    foot: '#22c55e',
    bike: '#8b5cf6'
  };

  routeLayer = L.polyline(routeCoordinates, {
    color: colors[profile] || '#2563eb',
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

  // Route Modal Actions
  if (elements.routeModalClose) elements.routeModalClose.addEventListener('click', closeRouteModal);
  if (elements.routeModalBack) elements.routeModalBack.addEventListener('click', closeRouteModal);
  if (elements.sidebarRouteBack) elements.sidebarRouteBack.addEventListener('click', closeRouteModal);

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

      <div style="margin-top: 12px; border-top: 2px solid #f1f5f9; padding-top: 12px;">
        <button type="button" class="route-build-btn">🗺️ Построить маршрут</button>
      </div>
    `;
    
    // Build route button event - open modal
    const routeBtn = popupContent.querySelector('.route-build-btn');
    if (routeBtn) {
      routeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        marker.closePopup();
        openRouteModal(place);
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

function formatRouteInfo(duration, distance, profile = 'foot') {
  const minutes = Math.round(duration / 60);
  const km = (distance / 1000).toFixed(1).replace('.0', '');
  const distanceStr = km < 1 ? `${Math.round(distance)} м` : `${km} км`;
  
  const icons = { driving: '🚗', foot: '🚶', bike: '🚴' };
  const icon = icons[profile] || '📍';
  
  return `${icon} ${minutes} мин • ${distanceStr}`;
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
