// ===== API CONFIG =====
const API_BASE_URL = '/api';

// Глобальное хранилище данных
let PLACES = [];

// Глобальные переменные
let map = null;
const markers = new Map();
let currentCategory = 'all';
let visiblePlaces = [];

// Конфигурация категорий
const categories = {
  all: { emoji: '💰', name: 'Все', color: '#94a3b8' },
  food: { emoji: '🍜', name: 'Еда', color: '#f59e0b' },
  fun: { emoji: '🎉', name: 'Досуг', color: '#8b5cf6' },
  study: { emoji: '📚', name: 'Учёба', color: '#10b981' },
  print: { emoji: '🖨️', name: 'Печать', color: '#ef4444' }
};

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  loadPlaces();
});

// Загрузка мест из API
async function loadPlaces() {
  try {
    const response = await fetch(`${API_BASE_URL}/places`);
    if (!response.ok) throw new Error('Ошибка загрузки данных');
    PLACES = await response.json();
    initApp();
  } catch (error) {
    console.error('Ошибка:', error);
    const resultsList = document.getElementById('resultsList');
    if (resultsList) {
      resultsList.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <p style="font-size:2rem;margin-bottom:10px;">⚠️</p>
          <p style="font-size:1rem;margin-bottom:10px;">Ошибка загрузки данных</p>
          <p style="font-size:0.85rem;color:#64748b;">Убедитесь, что сервер запущен (npm start)</p>
        </div>
      `;
    }
  }
}

// Создание иконок для маркеров
function createMarkerIcon(category) {
  const cat = categories[category] || categories.all;
  return L.divIcon({
    html: `<div style="
      background: ${cat.color};
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 3px 12px ${cat.color}66, 0 0 0 3px rgba(255,255,255,0.4);
      border: 2px solid white;
    ">${cat.emoji}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -10]
  });
}

// Форматирование цены
function formatPrice(price) {
  if (price.min === 0 && price.max === 0) return 'Бесплатно';
  if (price.min === price.max) return `${price.min}₽`;
  const unit = price.unit || '';
  return `${price.min}–${price.max}${unit ? ' ' + unit : '₽'}`;
}

// Создание элемента результата
function createResultItem(place) {
  const cat = categories[place.category];
  const item = document.createElement('div');
  item.className = 'result-item';
  item.dataset.id = place.id;
  item.innerHTML = `
    <div class="result-icon" style="background: ${cat.color}">${cat.emoji}</div>
    <div class="result-info">
      <div class="result-name">${place.name}</div>
      <div class="result-address">${place.address}</div>
    </div>
    <div class="result-meta">
      <div class="result-price">${formatPrice(place.price)}</div>
    </div>
  `;

  item.addEventListener('click', () => {
    openModal(place);
  });

  return item;
}

// Обновление результатов
function updateResults() {
  const resultsList = document.getElementById('resultsList');
  const resultsCount = document.getElementById('resultsCount');

  if (!resultsList || !resultsCount) return;

  resultsList.innerHTML = '';
  resultsCount.textContent = visiblePlaces.length;

  visiblePlaces.forEach(place => {
    resultsList.appendChild(createResultItem(place));
  });
}

// Создание контента модального окна
function createModalContent(place) {
  const cat = categories[place.category];
  const priceHtml = place.price.min === 0 && place.price.max === 0
    ? '<span style="color: #10b981; font-weight: 600;">Бесплатно</span>'
    : formatPrice(place.price);

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

  let linksHtml = '';
  if (place.links) {
    const links = [];
    if (place.links.map) {
      links.push(`<a href="${place.links.map}" target="_blank" class="modal-link">🗺️ Как добраться</a>`);
    }
    if (place.links.website) {
      links.push(`<a href="${place.links.website}" target="_blank" class="modal-link secondary">🌐 Сайт</a>`);
    }
    if (links.length > 0) {
      linksHtml = `<div class="modal-links">${links.join('')}</div>`;
    }
  }

  return `
    <div class="modal-place-icon" style="background: ${cat.color}">${cat.emoji}</div>
    <h2 class="modal-place-name">${place.name}</h2>
    <div class="modal-place-category" style="background: ${cat.color}">${cat.emoji} ${cat.name}</div>

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
        <span class="modal-price-badge">${priceHtml}</span>
      </div>
    </div>

    ${tipsHtml}
    ${linksHtml}
  `;
}

// Открытие модального окна
function openModal(place) {
  const modal = document.getElementById('placeModal');
  const modalBody = document.getElementById('modalBody');

  if (!modal || !modalBody) return;

  modalBody.innerHTML = createModalContent(place);
  modal.classList.add('visible');

  if (map && place.coordinates) {
    map.setView(place.coordinates, 15);
  }

  document.getElementById('resultsPanel')?.classList.remove('visible');
  document.querySelector('.bottom-bar')?.classList.remove('search-active');
}

// Закрытие модального окна
function closeModal() {
  const modal = document.getElementById('placeModal');
  if (modal) {
    modal.classList.remove('visible');
  }
}

// Фильтрация маркеров по категории через API
async function filterMarkers(category) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.append('category', category);
    }

    const response = await fetch(`${API_BASE_URL}/places?${params}`);
    if (!response.ok) throw new Error('Ошибка загрузки данных');
    const filteredPlaces = await response.json();

    // Скрываем все маркеры
    markers.forEach((marker) => {
      if (map && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Показываем только отфильтрованные
    filteredPlaces.forEach(place => {
      const marker = markers.get(place.id);
      if (marker && map && !map.hasLayer(marker)) {
        marker.addTo(map);
      }
    });

    // Обновляем видимые места
    visiblePlaces = filteredPlaces;
    updateResults();
  } catch (error) {
    console.error('Ошибка фильтрации:', error);
  }
}

// Поиск мест через API
async function searchPlaces(query) {
  try {
    const searchTerm = query.toLowerCase().trim();
    const params = new URLSearchParams();

    if (currentCategory !== 'all') {
      params.append('category', currentCategory);
    }
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(`${API_BASE_URL}/places?${params}`);
    if (!response.ok) throw new Error('Ошибка загрузки данных');
    const filteredPlaces = await response.json();

    // Скрываем все маркеры
    markers.forEach((marker) => {
      if (map && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Показываем только подходящие
    filteredPlaces.forEach(place => {
      const marker = markers.get(place.id);
      if (marker && map && !map.hasLayer(marker)) {
        marker.addTo(map);
      }
    });

    // Обновляем видимые места
    visiblePlaces = filteredPlaces;
    updateResults();
  } catch (error) {
    console.error('Ошибка поиска:', error);
  }
}

// Инициализация приложения после загрузки данных
function initApp() {
  // Центр Тюмени
  const mapCenter = [57.1522, 65.5415];

  // Инициализация карты
  map = L.map('map', {
    zoomControl: false,
    fadeAnimation: true,
    zoomAnimation: true,
    doubleClickZoom: false,
    dragging: true,
    scrollWheelZoom: true,
    attributionControl: false
  }).setView(mapCenter, 13);

  // Приятная светлая карта (CartoDB Positron)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '',
    maxZoom: 20
  }).addTo(map);

  // Добавление маркеров на карту
  PLACES.forEach(place => {
    const marker = L.marker(place.coordinates, {
      icon: createMarkerIcon(place.category)
    });

    markers.set(place.id, marker);

    marker.on('click', () => {
      openModal(place);
    });

    if (!map.hasLayer(marker)) {
      marker.addTo(map);
    }
  });

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  // Фильтры категорий
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', async () => {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      currentCategory = button.dataset.category;
      await filterMarkers(currentCategory);

      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        await searchPlaces('');
      }
    });
  });

  // Поиск
  const searchInput = document.getElementById('searchInput');
  const resultsPanel = document.getElementById('resultsPanel');
  const bottomBar = document.querySelector('.bottom-bar');

  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      bottomBar?.classList.add('search-active');
      resultsPanel?.classList.add('visible');
    });

    searchInput.addEventListener('input', async (e) => {
      await searchPlaces(e.target.value);
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        bottomBar?.classList.remove('search-active');
        resultsPanel?.classList.remove('visible');
      }, 200);
    });
  }

  // Закрытие модального окна
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeModal);

  // Инициализация - показать все места
  visiblePlaces = PLACES;
  updateResults();

  // ===== ГЕОЛОКАЦИЯ =====
  requestGeolocation();
}

// ===== АВТОМАТИЧЕСКАЯ ГЕОЛОКАЦИЯ ПРИ ЗАГРУЗКЕ =====
let userMarker = null;
let userCircle = null;

function requestGeolocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const userLocation = [latitude, longitude];

      if (!map) return;

      // Добавляем маркер пользователя
      userMarker = L.marker(userLocation, {
        icon: L.divIcon({
          html: '<div style="background:linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 0 10px rgba(59,130,246,0.3),0 4px 10px rgba(0,0,0,0.2);border:3px solid white;">📍</div>',
          className: '',
          iconSize: [40, 40]
        })
      }).addTo(map);

      // Добавляем круг точности
      userCircle = L.circle(userLocation, {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(map);

      // Центрируем карту на пользователе
      map.setView(userLocation, 15);
      userMarker.bindPopup('<b>📍 Вы здесь!</b>', {
        className: 'geolocation-popup',
        autoClose: false,
        closeOnClick: false
      }).openPopup();
    },
    (error) => {
      console.log('Геолокация недоступна:', error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}
