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

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ И ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  // Центр Тюмени
  const mapCenter = [57.1522, 65.5415];
  const map = L.map('map', {
    zoomControl: true,
    fadeAnimation: true,
    zoomAnimation: true
  }).setView(mapCenter, 12);

// Цветная карта OpenStreetMap (классический стиль)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

  // Функция для фильтрации маркеров на карте
  function filterMarkersByCategory(category) {
    markers.forEach(marker => {
      const placeId = marker.options.placeId;
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
  }

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
  function renderPlaces(searchTerm = '', category = 'all') {
    const container = document.getElementById('placesContainer');
    container.innerHTML = '';

    // Фильтруем места
    let filteredPlaces = PLACES;

    // По категории
    if (category !== 'all') {
      filteredPlaces = filteredPlaces.filter(place => place.category === category);
    }

    // По поиску
    if (searchTerm) {
      filteredPlaces = filteredPlaces.filter(place =>
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
      );
    }

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

  // Добавляем маркеры на карту
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

  // ===== ФИЛЬТРЫ =====
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      currentCategory = button.dataset.category;

      renderPlaces('', currentCategory);
      filterMarkersByCategory(currentCategory);
    });
  });

  // ===== ПОИСК =====
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    renderPlaces(searchTerm, currentCategory);
  });

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  renderPlaces();

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
});