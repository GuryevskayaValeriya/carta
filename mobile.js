// ===== ДАННЫЕ О МЕСТАХ В ТЮМЕНИ =====
const PLACES = [
  // ===== ЕДА =====
  {
    id: 'food-1',
    category: 'food',
    name: 'Столовая ТюмГУ',
    description: 'Университетская столовая с бюджетными обедами',
    price: { min: 60, max: 120 },
    hours: '8:00–17:00',
    address: 'ул. Семакова, 10 (корпус ТюмГУ)',
    coordinates: [57.1456, 65.5673],
    tips: [
      'Комплексный обед 85₽ (суп, второе, компот)',
      'Меню обновляется каждый понедельник на сайте вуза',
      'После 15:00 выбор меньше, но и очередей нет'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/house/ulitsa_semakova_10/Z04YcQFjS0MCQFtvfXR0dnVhZA==/?ll=65.567309%2C57.145601&z=17'
    },
    verified: true
  },
  {
    id: 'food-2',
    category: 'food',
    name: 'Столовая ТИУ',
    description: 'Столовая Тюменского индустриального университета',
    price: { min: 55, max: 110 },
    hours: '8:30–16:30',
    address: 'ул. Володарского, 38',
    coordinates: [57.152506, 65.544658],
    tips: [
      'Плов 65₽ — самый популярный выбор',
      'Понедельник и четверг — самые загруженные дни',
      'Можно оплатить картой студента'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/house/volodarskogo_ulitsa_38/Z04YcQFjSEECQFtvfXR0cHRsZA==/?ll=65.570500%2C57.147800&z=17'
    },
    verified: true
  },
  {
    id: 'food-3',
    category: 'food',
    name: 'Кафе «Книги и Кофе»',
    description: 'Уютное кафе рядом с библиотекой им. Лермонтова',
    price: { min: 120, max: 250 },
    hours: '9:00–21:00',
    address: 'ул. Республики, 60',
    coordinates: [57.150500, 65.544865],
    tips: [
      'Скидка 15% по студаку до 16:00',
      'Бесплатный Wi-Fi и розетки у окон',
      'Можно сидеть час без чувства вины'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/chain/knigi_i_kofe/236773987201/?ll=65.568900%2C57.151200&z=17'
    },
    verified: true
  },
  {
    id: 'food-4',
    category: 'food',
    name: 'Теремок',
    description: 'Быстро и сытно — идеально между парами',
    price: { min: 130, max: 220 },
    hours: '8:00–22:00',
    address: 'ул. Ленина, 38',
    coordinates: [57.155030, 65.532082],
    tips: [
      'Блинчики с мясом 159₽ — хватит на 2 пары',
      'Можно заказать навынос через приложение',
      'Студенческая скидка 10% по средам'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/org/teremok/1657452843/?ll=65.564500%2C57.148900&z=17'
    },
    verified: true
  },
  {
    id: 'food-5',
    category: 'food',
    name: 'Ларёк «Шаурма у универа»',
    description: 'Быстро, дёшево, без очередей',
    price: { min: 90, max: 150 },
    hours: '9:00–21:00',
    address: 'ул. Семакова, 8 (у входа в ТюмГУ)',
    coordinates: [57.159658, 65.531750],
    tips: [
      'Шаурма 120₽ — готовят на месте',
      'Кофе 50₽, хот-дог 70₽',
      'Можно оплатить картой'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.567000%2C57.145400&z=17'
    },
    verified: true
  },
  {
    id: 'food-6',
    category: 'food',
    name: 'Пятёрочка',
    description: 'Супермаркет с горячей линией и готовой едой',
    price: { min: 70, max: 180 },
    hours: 'Круглосуточно',
    address: 'ул. Семакова, 15',
    coordinates: [57.158438, 65.530591],
    tips: [
      'Пельмени 120₽ за упаковку (хватит на 2 раза)',
      'Горячая линия: курица гриль 149₽',
      'Скидки по карте Пятёрочки'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/org/pyatyorochka/1588693477/?ll=65.568000%2C57.145900&z=17'
    },
    verified: true
  },

  // ===== ДОСУГ =====
  {
    id: 'fun-1',
    category: 'fun',
    name: 'Парк «Гагарина»',
    description: 'Большой парк с лавочками, фонтанами и бесплатными мероприятиями',
    price: { min: 0, max: 0 },
    hours: 'Круглосуточно',
    address: 'ул. Гагарина',
    coordinates: [57.172437, 65.621755],
    tips: [
      'Летом — бесплатные концерты по выходным',
      'Много скамеек в тени для учёбы',
      'Рядом фонтан — красиво вечером'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/park/park_gagarina/207330381/?ll=65.550000%2C57.153000&z=15'
    },
    verified: true
  },
  {
    id: 'fun-2',
    category: 'fun',
    name: 'Кинотеатр «Космос»',
    description: 'Студенческие сеансы по выгодным ценам',
    price: { min: 180, max: 350 },
    hours: '10:00–23:00',
    address: 'ул. Республики, 100',
    coordinates: [57.134313, 65.577316],
    tips: [
      'Студенческий билет 220₽ в будние дни до 18:00',
      'Попкорн можно принести свой',
      'Забронировать места онлайн на сайте'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/org/kosmos/1486791835/?ll=65.569500%2C57.152500&z=17'
    },
    verified: true
  },
  {
    id: 'fun-3',
    category: 'fun',
    name: 'Настольный клуб «Игротека»',
    description: 'Более 150 настольных игр и уютная атмосфера',
    price: { min: 0, max: 200 },
    hours: '12:00–23:00',
    address: 'ул. Ленина, 38',
    coordinates: [57.155030, 65.532082],
    tips: [
      'Первый час бесплатно для студентов по вторникам',
      'Можно прийти одному — найдут компанию',
      'Чай и печенье включены в цену'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.564500%2C57.148900&z=17'
    },
    verified: true
  },

  // ===== УЧЁБА / КОВОРКИНГИ =====
  {
    id: 'study-1',
    category: 'study',
    name: 'Библиотека им. М.Ю. Лермонтова',
    description: 'Главная городская библиотека с читальными залами',
    price: { min: 0, max: 0 },
    hours: '10:00–19:00, выходной — понедельник',
    address: 'ул. Республики, 60',
    coordinates: [57.150500, 65.544865],
    tips: [
      'Читальный зал на 2 этаже — тихий и просторный',
      'Бесплатный Wi-Fi и розетки у каждого стола',
      'Нужен паспорт для первого посещения'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/org/natsionalnaya_biblioteka_tiumenskoi_oblasti/1339764958/?ll=65.568900%2C57.151200&z=17'
    },
    verified: true
  },
  {
    id: 'study-2',
    category: 'study',
    name: 'Коворкинг «Точка кипения» (ТюмГУ)',
    description: 'Современный коворкинг для студентов и стартапов',
    price: { min: 0, max: 0 },
    hours: '9:00–21:00',
    address: 'ул. Семакова, 10 (корпус ТюмГУ)',
    coordinates: [57.159375, 65.531265],
    tips: [
      'Бесплатно для студентов ТюмГУ',
      'Переговорные можно бронировать онлайн',
      'Регулярно проводят бесплатные мастер-классы'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/house/ulitsa_semakova_10/Z04YcQFjS0MCQFtvfXR0dnVhZA==/?ll=65.567309%2C57.145601&z=17'
    },
    verified: true
  },
  {
    id: 'study-3',
    category: 'study',
    name: 'Кафе «Читай-Город»',
    description: 'Кафе в книжном магазине — тихо и с розетками',
    price: { min: 100, max: 300 },
    hours: '10:00–22:00',
    address: 'ул. Республики, 73',
    coordinates: [57.147316, 65.553228],
    tips: [
      'Можно сидеть час без чувства вины',
      'Бесплатный Wi-Fi и розетки',
      'Чай 90₽, пирожное 130₽'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.569200%2C57.151800&z=17'
    },
    verified: true
  },
  {
    id: 'study-4',
    category: 'study',
    name: 'Библиотека ТИУ',
    description: 'Университетская библиотека с современными залами',
    price: { min: 0, max: 0 },
    hours: '9:00–18:00',
    address: 'ул. Володарского, 38',
    coordinates: [57.152506, 65.544658],
    tips: [
      'Электронный каталог доступен онлайн',
      'Можно бронировать книги через личный кабинет',
      'Тихий зал на 3 этаже — идеально для подготовки'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/house/volodarskogo_ulitsa_38/Z04YcQFjSEECQFtvfXR0cHRsZA==/?ll=65.570500%2C57.147800&z=17'
    },
    verified: true
  },

  // ===== ПЕЧАТЬ =====
  {
    id: 'print-1',
    category: 'print',
    name: 'Типография «Печать+»',
    description: 'Печать курсовых, дипломов, плакатов со скидкой',
    price: { min: 5, max: 500 },
    hours: '9:00–19:00',
    address: 'ул. Республики, 45',
    coordinates: [57.153961, 65.539143],
    discount: '15% по студаку',
    tips: [
      'Курсовая 50 страниц = 350₽ со скидкой',
      'Диплом в твёрдом переплёте — 1200₽',
      'Срочный заказ (+50%) готов за 2 часа'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.568500%2C57.150500&z=17'
    },
    verified: true
  },
  {
    id: 'print-2',
    category: 'print',
    name: 'Почта России',
    description: 'Распечатка, сканирование, копирование',
    price: { min: 5, max: 200 },
    hours: '9:00–20:00',
    address: 'ул. Ленина, 25',
    coordinates: [57.158164, 65.527249],
    tips: [
      'Можно оплатить картой',
      'Скан документов — 10₽ за страницу',
      'Менее загружена после 17:00'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/org/pochta_rossii/1075840733/?ll=65.563000%2C57.148000&z=17'
    },
    verified: true
  },
  {
    id: 'print-3',
    category: 'print',
    name: 'Копировальный центр «Фото-Плюс»',
    description: 'Фотопечать, постеры, ламинирование',
    price: { min: 10, max: 1000 },
    hours: '10:00–20:00',
    address: 'ул. Семакова, 12',
    coordinates: [57.159375, 65.531265],
    discount: '10% с 9:00 до 12:00',
    tips: [
      'Фото 10х15 — 15₽',
      'Ламинирование А4 — 50₽',
      'Можно заказать онлайн с доставкой'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.567500%2C57.145700&z=17'
    },
    verified: true
  },

  // ===== ПОДРАБОТКА =====
  {
    id: 'work-1',
    category: 'work',
    name: 'Агентство «Промо-Тюмень»',
    description: 'Промоакции, раздача листовок, мероприятия',
    price: { min: 1500, max: 3000, unit: '₽/день' },
    hours: 'По сменам',
    address: 'ул. Республики, 50',
    coordinates: [57.152213, 65.539772],
    tips: [
      'Берут без опыта',
      'Платят сразу после смены',
      'Гибкий график — можно только по выходным'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.568700%2C57.150800&z=17',
      website: 'https://promo-tyumen.ru'
    },
    verified: true
  },
  {
    id: 'work-2',
    category: 'work',
    name: 'Колл-центр «Созвучие»',
    description: 'Оператор на входящие/исходящие звонки',
    price: { min: 30000, max: 50000, unit: '₽/мес' },
    hours: 'Гибкий график',
    address: 'ул. Максима Горького, 74',
    coordinates: [57.146740, 65.557630],
    tips: [
      'Обучение 3 дня (оплачивается)',
      'Можно работать удалённо',
      'Берут студентов с 18 лет'
    ],
    links: {
      map: 'https://yandex.ru/maps/59/tiumen/?ll=65.562000%2C57.153500&z=17'
    },
    verified: true
  },
  {
    id: 'work-3',
    category: 'work',
    name: 'Репетиторство через ТюмГУ',
    description: 'Помощь младшим курсам по предметам',
    price: { min: 800, max: 1500, unit: '₽/час' },
    hours: 'По договорённости',
    address: 'ул. Семакова, 10 (ТюмГУ)',
    coordinates: [57.159375, 65.531265],
    tips: [
      'Объявления на доске в главном корпусе',
      'Можно подать заявку на сайте вуза',
      'Оплата наличными после занятия'
    ],
    links: {
      website: 'https://utmn.ru'
    },
    verified: true
  },
  {
    id: 'work-4',
    category: 'work',
    name: 'Яндекс.Еда — курьер',
    description: 'Доставка еды на велосипеде или самокате',
    price: { min: 1000, max: 2000, unit: '₽/день' },
    hours: 'Любое время',
    address: 'Регистрация онлайн',
    coordinates: [57.1500, 65.5650],
    tips: [
      'Свободный график',
      'Можно работать только по выходным',
      'Нужен свой транспорт'
    ],
    links: {
      website: 'https://eda.yandex/delivery'
    },
    verified: true
  }
];

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  // Центр Тюмени
  const mapCenter = [57.1522, 65.5415];
  
  // Инициализация карты
  const map = L.map('map', {
    zoomControl: false,
    fadeAnimation: true,
    zoomAnimation: true,
    doubleClickZoom: false,
    dragging: true,
    scrollWheelZoom: true,
    attributionControl: true
  }).setView(mapCenter, 13);

  // Приятная светлая карта (CartoDB Positron)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20
  }).addTo(map);

  // Конфигурация категорий
  const categories = {
    all: { emoji: '💰', name: 'Все', color: '#94a3b8' },
    food: { emoji: '🍜', name: 'Еда', color: '#f59e0b' },
    fun: { emoji: '🎉', name: 'Досуг', color: '#8b5cf6' },
    study: { emoji: '📚', name: 'Учёба', color: '#10b981' },
    print: { emoji: '🖨️', name: 'Печать', color: '#ef4444' },
    work: { emoji: '💼', name: 'Работа', color: '#3b82f6' }
  };

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

  // Хранилище маркеров
  const markers = new Map();
  let activeMarker = null;
  let currentCategory = 'all';
  let visiblePlaces = [...PLACES];

  // Форматирование цены
  function formatPrice(price) {
    if (price.min === 0 && price.max === 0) return 'Бесплатно';
    if (price.min === price.max) return `${price.min}₽`;
    const unit = price.unit || '';
    return `${price.min}–${price.max}${unit ? ' ' + unit : '₽'}`;
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
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    modalBody.innerHTML = createModalContent(place);
    modal.classList.add('visible');
    
    // Центрируем карту на месте
    map.setView(place.coordinates, 15);
    
    // Закрываем панель результатов
    document.getElementById('resultsPanel').classList.remove('visible');
    document.querySelector('.bottom-bar').classList.remove('search-active');
  }

  // Закрытие модального окна
  function closeModal() {
    const modal = document.getElementById('placeModal');
    modal.classList.remove('visible');
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

  // Добавление маркеров на карту
  PLACES.forEach(place => {
    const marker = L.marker(place.coordinates, {
      icon: createMarkerIcon(place.category)
    });

    markers.set(place.id, marker);

    marker.on('click', () => {
      openModal(place);
    });
  });

  // Фильтрация маркеров по категории
  function filterMarkers(category) {
    markers.forEach((marker, placeId) => {
      const place = PLACES.find(p => p.id === placeId);
      if (category === 'all' || place.category === category) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      } else {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    });
    
    // Обновляем видимые места
    visiblePlaces = PLACES.filter(p => category === 'all' || p.category === category);
    updateResults();
  }

  // Поиск мест
  function searchPlaces(query) {
    const searchTerm = query.toLowerCase().trim();
    
    markers.forEach((marker, placeId) => {
      const place = PLACES.find(p => p.id === placeId);
      const matchesSearch = !searchTerm || 
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm);
      const matchesCategory = currentCategory === 'all' || place.category === currentCategory;
      
      if (matchesSearch && matchesCategory) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      } else {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    });
    
    // Обновляем видимые места
    visiblePlaces = PLACES.filter(p => {
      const matchesSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm) ||
        p.address.toLowerCase().includes(searchTerm);
      const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
      return matchesSearch && matchesCategory;
    });
    
    updateResults();
  }

  // Обновление результатов
  function updateResults() {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsList.innerHTML = '';
    resultsCount.textContent = visiblePlaces.length;
    
    visiblePlaces.forEach(place => {
      resultsList.appendChild(createResultItem(place));
    });
  }

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
  
  // Фильтры категорий
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      currentCategory = button.dataset.category;
      filterMarkers(currentCategory);
      
      const searchInput = document.getElementById('searchInput');
      if (searchInput.value) {
        searchInput.value = '';
        searchPlaces('');
      }
    });
  });

  // Поиск
  const searchInput = document.getElementById('searchInput');
  const resultsPanel = document.getElementById('resultsPanel');
  const bottomBar = document.querySelector('.bottom-bar');

  searchInput.addEventListener('focus', () => {
    bottomBar.classList.add('search-active');
    resultsPanel.classList.add('visible');
  });

  searchInput.addEventListener('input', (e) => {
    searchPlaces(e.target.value);
  });

  // Закрытие панели при потере фокуса (с задержкой)
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      bottomBar.classList.remove('search-active');
      resultsPanel.classList.remove('visible');
    }, 200);
  });

  // Закрытие модального окна
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);

  // Инициализация - показать все маркеры
  filterMarkers('all');

  // Геолокация пользователя
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Пользователь находится:', latitude, longitude);
      },
      (error) => {
        console.log('Геолокация недоступна:', error.message);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }
});
