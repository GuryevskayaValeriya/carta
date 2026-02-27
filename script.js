// ===== API CONFIG =====
const API_BASE_URL = '/api';

// Глобальное хранилище данных
let PLACES = [];

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ И ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  // Загрузка данных из API
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
    document.getElementById('placesContainer').innerHTML = `
      <div class="no-results">
        <p>⚠️</p>
        <p style="font-size:1.1rem; margin-bottom:10px;">Ошибка загрузки данных</p>
        <p style="font-size:0.9rem;">Убедитесь, что сервер запущен (npm start)</p>
      </div>
    `;
  }
}

// Инициализация приложения после загрузки данных
function initApp() {
  // Центр Тюмени
  const mapCenter = [57.1522, 65.5415];
  const map = L.map('map', {
    zoomControl: true,
    fadeAnimation: true,
    zoomAnimation: true,
    attributionControl: false
  }).setView(mapCenter, 12);

// Цветная карта OpenStreetMap (классический стиль)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ''
}).addTo(map);
  // Иконки для категорий (обновленный дизайн)
  const categoryIcons = {
    food: L.divIcon({
      html: '<div style="background:#f59e0b;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;box-shadow:0 4px 10px rgba(245,158,11,0.3);border:2px solid white;">🍜</div>',
      className: '',
      iconSize: [36, 36]
    }),
    fun: L.divIcon({
      html: '<div style="background:#8b5cf6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;box-shadow:0 4px 10px rgba(139,92,246,0.3);border:2px solid white;">🎉</div>',
      className: '',
      iconSize: [36, 36]
    }),
    study: L.divIcon({
      html: '<div style="background:#10b981;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;box-shadow:0 4px 10px rgba(16,185,129,0.3);border:2px solid white;">📚</div>',
      className: '',
      iconSize: [36, 36]
    }),
    print: L.divIcon({
      html: '<div style="background:#ef4444;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;box-shadow:0 4px 10px rgba(239,68,68,0.3);border:2px solid white;">🖨️</div>',
      className: '',
      iconSize: [36, 36]
    }),
    work: L.divIcon({
      html: '<div style="background:#3b82f6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;box-shadow:0 4px 10px rgba(59,130,246,0.3);border:2px solid white;">💼</div>',
      className: '',
      iconSize: [36, 36]
    })
  };

  // Маркеры
  let markers = [];
  let activeMarker = null;
  let currentCategory = 'all';

  // Функция для получения эмодзи категории
  function getCategoryEmoji(category) {
    const emojis = {
      food: '🍜',
      fun: '🎉',
      study: '📚',
      print: '🖨️',
      work: '💼'
    };
    return emojis[category] || '📍';
  }

  // Функция для получения названия категории
  function getCategoryName(category) {
    const names = {
      food: 'Еда',
      fun: 'Досуг',
      study: 'Учёба',
      print: 'Печать',
      work: 'Работа'
    };
    return names[category] || 'Место';
  }

  // Функция для получения цвета категории
  function getCategoryColor(category) {
    const colors = {
      food: '#f59e0b',
      fun: '#8b5cf6',
      study: '#10b981',
      print: '#ef4444',
      work: '#3b82f6'
    };
    return colors[category] || '#64748b';
  }

  // Функция рендера списка мест
  function renderPlaces(category = 'all', search = '', priceMin = 0, priceMax = Infinity) {
    const container = document.getElementById('placesContainer');
    container.innerHTML = '';

    // Фильтруем места по категории, поиску и цене
    let filteredPlaces = PLACES;

    if (category !== 'all') {
      filteredPlaces = filteredPlaces.filter(place => place.category === category);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredPlaces = filteredPlaces.filter(place =>
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
      );
    }

    // Фильтр по цене
    filteredPlaces = filteredPlaces.filter(place => {
      const placeMinPrice = place.price.min;
      const placeMaxPrice = place.price.max;
      // Место попадает в диапазон, если его минимальная цена <= максимума фильтра
      // и его максимальная цена >= минимума фильтра
      return placeMinPrice <= priceMax && placeMaxPrice >= priceMin;
    });

    // Рендерим карточки
    filteredPlaces.forEach(place => {
      let priceDisplay = '';
      if (place.price.min === place.price.max) {
        priceDisplay = `${place.price.min}₽`;
      } else if (place.price.min === 0 && place.price.max === 0) {
        priceDisplay = 'Бесплатно';
      } else {
        priceDisplay = `${place.price.min}–${place.price.max}₽`;
      }

      if (place.price.unit) {
        priceDisplay = `${place.price.min}–${place.price.max} ${place.price.unit}`;
      }

      const placeCard = document.createElement('div');
      placeCard.className = `place-card ${place.category}`;
      placeCard.dataset.id = place.id;
      placeCard.innerHTML = `
        <div class="place-card-header">
          <h3 class="place-name">${place.name}</h3>
          <span class="place-category-badge" style="background:${getCategoryColor(place.category)}">${getCategoryEmoji(place.category)}</span>
        </div>
        <div class="place-address">📍 ${place.address}</div>
        <div class="place-price">💰 ${priceDisplay} • 🕐 ${place.hours}</div>
      `;

      placeCard.addEventListener('click', () => {
        document.querySelectorAll('.place-card').forEach(c => c.classList.remove('active'));
        placeCard.classList.add('active');

        map.setView(place.coordinates, 15);

        const marker = markers.find(m => m.options.placeId === place.id);
        if (marker) {
          marker.openPopup();
          if (activeMarker) {
            activeMarker.closePopup();
          }
          activeMarker = marker;
        }
      });

      container.appendChild(placeCard);
    });

    if (filteredPlaces.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = `
        <p>🔍</p>
        <p style="font-size:1.1rem; margin-bottom:10px;">Ничего не найдено</p>
        <p style="font-size:0.9rem;">Попробуйте изменить параметры поиска</p>
      `;
      container.appendChild(noResults);
    }
  }

  // ===== ФИЛЬТРЫ =====
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', async () => {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      currentCategory = button.dataset.category;

      await loadPlacesFromAPI(currentCategory, currentSearchTerm);
    });
  });

  // ===== ПОИСК =====
  let currentSearchTerm = '';

  document.getElementById('searchInput').addEventListener('input', async (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    await loadPlacesFromAPI(currentCategory, currentSearchTerm);
  });

  // ===== ФИЛЬТР ЦЕНЫ =====
  let currentPriceMin = 0;
  let currentPriceMax = 5000;

  const priceMinSlider = document.getElementById('priceMin');
  const priceMaxSlider = document.getElementById('priceMax');
  const priceMinValue = document.getElementById('priceMinValue');
  const priceMaxValue = document.getElementById('priceMaxValue');

  function updatePriceFilter() {
    let min = parseInt(priceMinSlider.value);
    let max = parseInt(priceMaxSlider.value);

    // Гарантируем, что min <= max
    if (min > max) {
      // Если двигали min и он стал больше max, меняем max
      if (priceMinSlider === document.activeElement) {
        max = min;
        priceMaxSlider.value = max;
      } else {
        min = max;
        priceMinSlider.value = min;
      }
    }

    currentPriceMin = min;
    currentPriceMax = max;

    priceMinValue.textContent = `${min}₽`;
    priceMaxValue.textContent = `${max}₽`;

    applyPriceFilter();
  }

  function applyPriceFilter() {
    renderPlaces(currentCategory, currentSearchTerm, currentPriceMin, currentPriceMax);
  }

  priceMinSlider.addEventListener('input', updatePriceFilter);
  priceMaxSlider.addEventListener('input', updatePriceFilter);

  // Загрузка мест из API с фильтрами
  async function loadPlacesFromAPI(category, search) {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE_URL}/places?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      PLACES = await response.json();

      // Очищаем маркеры
      markers.forEach(marker => map.removeLayer(marker));
      markers = [];
      activeMarker = null;

      // Перерисовываем всё (поиск уже применён на сервере)
      renderPlaces(category, search, currentPriceMin, currentPriceMax);
      addMarkersToMap();
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }

  // Добавление маркеров на карту
  function addMarkersToMap() {
    PLACES.forEach(place => {
      const marker = L.marker(place.coordinates, {
        icon: categoryIcons[place.category],
        placeId: place.id
      }).addTo(map);

      let popupContent = `
        <div class="popup-content">
          <div class="popup-title">${place.name}</div>
          <span class="popup-category" style="background-color:${getCategoryColor(place.category)}">${getCategoryEmoji(place.category)} ${getCategoryName(place.category)}</span>
          <div class="popup-meta">📍 ${place.address}</div>
          <div class="popup-meta">💰 ${place.price.min}–${place.price.max}₽ • 🕐 ${place.hours}</div>
      `;

      if (place.discount) {
        popupContent += `<div class="popup-meta" style="color:#ef4444;font-weight:bold">🎫 ${place.discount}</div>`;
      }

      if (place.tips && place.tips.length > 0) {
        popupContent += `
          <div class="popup-tips">
            <div style="font-size:0.8rem;font-weight:600;color:#64748b;margin-bottom:8px">💡 Лайфхаки для студентов:</div>
            ${place.tips.map(tip => `<div class="popup-tip">${tip}</div>`).join('')}
          </div>
        `;
      }

      if (place.links && (place.links.map || place.links.website)) {
        popupContent += `<div class="popup-links">`;
        if (place.links.map) {
          popupContent += `<a href="${place.links.map}" target="_blank" class="popup-link">🗺️ Открыть на карте</a>`;
        }
        if (place.links.website) {
          popupContent += `<a href="${place.links.website}" target="_blank" class="popup-link">🌐 Сайт</a>`;
        }
        popupContent += `</div>`;
      }

      popupContent += `</div>`;

      marker.bindPopup(popupContent);
      markers.push(marker);

      marker.on('click', () => {
        document.querySelectorAll('.place-card').forEach(c => c.classList.remove('active'));
        const card = document.querySelector(`.place-card[data-id="${place.id}"]`);
        if (card) {
          card.classList.add('active');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // Инициализация - рендерим места и добавляем маркеры
  renderPlaces('all', '', 0, 5000);
  addMarkersToMap();

  // Добавляем легенду карты (обновленный дизайн)
  const legend = L.control({position: 'bottomleft'});

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div style="font-weight:700;margin-bottom:12px;color:#0f172a;font-size:0.9rem;">📍 Категории</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#f59e0b;color:white;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(245,158,11,0.3);">🍜</span>
          <span style="font-size:0.85rem;color:#334155;">Еда</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#8b5cf6;color:white;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(139,92,246,0.3);">🎉</span>
          <span style="font-size:0.85rem;color:#334155;">Досуг</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(16,185,129,0.3);">📚</span>
          <span style="font-size:0.85rem;color:#334155;">Учёба</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#ef4444;color:white;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(239,68,68,0.3);">🖨️</span>
          <span style="font-size:0.85rem;color:#334155;">Печать</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#3b82f6;color:white;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(59,130,246,0.3);">💼</span>
          <span style="font-size:0.85rem;color:#334155;">Работа</span>
        </div>
      </div>
    `;
    return div;
  };

  legend.addTo(map);

  // ===== АВТОМАТИЧЕСКАЯ ГЕОЛОКАЦИЯ ПРИ ЗАГРУЗКЕ =====
  let userMarker = null;
  let userCircle = null;

  function requestGeolocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLocation = [latitude, longitude];

        // Добавляем маркер пользователя
        userMarker = L.marker(userLocation, {
          icon: L.divIcon({
            html: '<div style="background:#3b82f6;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 0 10px rgba(59,130,246,0.3),0 4px 10px rgba(0,0,0,0.2);border:3px solid white;">📍</div>',
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
        userMarker.bindPopup('<b>Вы здесь!</b><br>Точность: ~' + Math.round(accuracy) + 'м').openPopup();
      },
      (error) => {
        // Тихо игнорируем ошибку (пользователь мог отказать в доступе)
        console.log('Геолокация недоступна:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  // Запрашиваем геолокацию после загрузки карты
  requestGeolocation();
}