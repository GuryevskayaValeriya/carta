const ADMIN_API_BASE = '/api/admin';
const ADMIN_MAP_DEFAULT_CENTER = [57.1522, 65.5415];

const adminState = {
  currentUser: null,
  activeView: 'places',
  loaded: {
    places: false,
    reviews: false,
    users: false
  },
  searches: {
    places: '',
    reviews: '',
    users: ''
  },
  places: [],
  selectedPlaceId: null,
  reviews: [],
  selectedReviewId: null,
  users: [],
  selectedUserId: null
};

const adminElements = {};
const searchTimers = {};
const adminPlaceMap = {
  map: null,
  marker: null,
  placesLayer: null
};

document.addEventListener('DOMContentLoaded', () => {
  bindAdminElements();
  setupAdminEventListeners();
  hydrateAdminAccess();
});

function bindAdminElements() {
  adminElements.navButtons = Array.from(document.querySelectorAll('[data-admin-view]'));
  adminElements.views = {
    places: document.getElementById('adminPlacesView'),
    reviews: document.getElementById('adminReviewsView'),
    users: document.getElementById('adminUsersView')
  };
  adminElements.headerTitle = document.getElementById('adminHeaderTitle');
  adminElements.userChip = document.getElementById('adminUserChip');
  adminElements.status = document.getElementById('adminStatus');
  adminElements.logoutButton = document.getElementById('adminLogoutButton');

  adminElements.placesSearchInput = document.getElementById('placesSearchInput');
  adminElements.reviewsSearchInput = document.getElementById('reviewsSearchInput');
  adminElements.usersSearchInput = document.getElementById('usersSearchInput');
  adminElements.createPlaceButton = document.getElementById('createPlaceButton');

  adminElements.placesList = document.getElementById('placesList');
  adminElements.placeEditor = document.getElementById('placeEditor');
  adminElements.reviewsList = document.getElementById('reviewsList');
  adminElements.reviewEditor = document.getElementById('reviewEditor');
  adminElements.usersList = document.getElementById('usersList');
  adminElements.userEditor = document.getElementById('userEditor');

  adminElements.navCounts = {
    places: document.getElementById('placesNavCount'),
    reviews: document.getElementById('reviewsNavCount'),
    users: document.getElementById('usersNavCount')
  };
}

function setupAdminEventListeners() {
  adminElements.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      switchAdminView(button.dataset.adminView);
    });
  });

  adminElements.logoutButton?.addEventListener('click', handleAdminLogout);
  adminElements.createPlaceButton?.addEventListener('click', () => {
    adminState.selectedPlaceId = null;
    renderPlaceEditor();
  });

  adminElements.placesSearchInput?.addEventListener('input', (event) => {
    scheduleSearch('places', event.target.value, loadPlaces);
  });

  adminElements.reviewsSearchInput?.addEventListener('input', (event) => {
    scheduleSearch('reviews', event.target.value, loadReviews);
  });

  adminElements.usersSearchInput?.addEventListener('input', (event) => {
    scheduleSearch('users', event.target.value, loadUsers);
  });
}

async function hydrateAdminAccess() {
  setAdminStatus('Проверяем доступ к админ-панели...', 'info');

  try {
    const data = await adminFetchJson(`${ADMIN_API_BASE}/me`);
    adminState.currentUser = data.user;
    renderAdminHeader();
    setAdminStatus('');
    switchAdminView('places');
  } catch (error) {
    console.error('Failed to open admin panel:', error);
    window.location.href = '/';
  }
}

function renderAdminHeader() {
  if (!adminState.currentUser || !adminElements.userChip) {
    return;
  }

  adminElements.userChip.textContent = `${adminState.currentUser.displayName} · admin`;
}

async function switchAdminView(viewName) {
  adminState.activeView = viewName;

  adminElements.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.adminView === viewName);
  });

  Object.entries(adminElements.views).forEach(([viewKey, element]) => {
    element.classList.toggle('active', viewKey === viewName);
  });

  const titles = {
    places: 'Места',
    reviews: 'Отзывы',
    users: 'Пользователи'
  };

  adminElements.headerTitle.textContent = titles[viewName] || 'Админ-панель';

  if (adminState.loaded[viewName]) {
    renderActiveView();
    return;
  }

  if (viewName === 'places') {
    await loadPlaces();
    return;
  }

  if (viewName === 'reviews') {
    await loadReviews();
    return;
  }

  if (viewName === 'users') {
    await loadUsers();
  }
}

function renderActiveView() {
  if (adminState.activeView === 'places') {
    renderPlacesList();
    renderPlaceEditor();
    return;
  }

  destroyPlaceMap();

  if (adminState.activeView === 'reviews') {
    renderReviewsList();
    renderReviewEditor();
    return;
  }

  renderUsersList();
  renderUserEditor();
}

async function loadPlaces() {
  adminState.loaded.places = false;
  adminElements.placesList.innerHTML = createLoadingMarkup('Загружаем места...');
  adminElements.placeEditor.innerHTML = createEditorEmptyMarkup('Выберите место или создайте новое.');

  try {
    const query = adminState.searches.places ? `?search=${encodeURIComponent(adminState.searches.places)}` : '';
    const data = await adminFetchJson(`${ADMIN_API_BASE}/places${query}`);

    adminState.places = Array.isArray(data.places) ? data.places : [];
    adminState.loaded.places = true;

    if (adminState.selectedPlaceId && !adminState.places.some((place) => place.id === adminState.selectedPlaceId)) {
      adminState.selectedPlaceId = null;
    }

    updateNavCount('places', adminState.places.length);
    renderPlacesList();
    renderPlaceEditor();
  } catch (error) {
    console.error('Failed to load places:', error);
    adminElements.placesList.innerHTML = createEmptyMarkup('Не удалось загрузить список мест.');
    adminElements.placeEditor.innerHTML = createEditorEmptyMarkup('Попробуйте обновить раздел еще раз.');
    setAdminStatus(error.message || 'Не удалось загрузить места.', 'error');
  }
}

async function loadReviews() {
  adminState.loaded.reviews = false;
  adminElements.reviewsList.innerHTML = createLoadingMarkup('Загружаем отзывы...');
  adminElements.reviewEditor.innerHTML = createEditorEmptyMarkup('Выберите отзыв для редактирования.');

  try {
    const query = adminState.searches.reviews ? `?search=${encodeURIComponent(adminState.searches.reviews)}` : '';
    const data = await adminFetchJson(`${ADMIN_API_BASE}/reviews${query}`);

    adminState.reviews = Array.isArray(data.reviews) ? data.reviews : [];
    adminState.loaded.reviews = true;

    if (adminState.selectedReviewId && !adminState.reviews.some((review) => String(review.id) === String(adminState.selectedReviewId))) {
      adminState.selectedReviewId = null;
    }

    updateNavCount('reviews', adminState.reviews.length);
    renderReviewsList();
    renderReviewEditor();
  } catch (error) {
    console.error('Failed to load reviews:', error);
    adminElements.reviewsList.innerHTML = createEmptyMarkup('Не удалось загрузить отзывы.');
    adminElements.reviewEditor.innerHTML = createEditorEmptyMarkup('Попробуйте обновить раздел еще раз.');
    setAdminStatus(error.message || 'Не удалось загрузить отзывы.', 'error');
  }
}

async function loadUsers() {
  adminState.loaded.users = false;
  adminElements.usersList.innerHTML = createLoadingMarkup('Загружаем пользователей...');
  adminElements.userEditor.innerHTML = createEditorEmptyMarkup('Выберите пользователя для редактирования.');

  try {
    const query = adminState.searches.users ? `?search=${encodeURIComponent(adminState.searches.users)}` : '';
    const data = await adminFetchJson(`${ADMIN_API_BASE}/users${query}`);

    adminState.users = Array.isArray(data.users) ? data.users : [];
    adminState.loaded.users = true;

    if (adminState.selectedUserId && !adminState.users.some((user) => user.id === adminState.selectedUserId)) {
      adminState.selectedUserId = null;
    }

    updateNavCount('users', adminState.users.length);
    renderUsersList();
    renderUserEditor();
  } catch (error) {
    console.error('Failed to load users:', error);
    adminElements.usersList.innerHTML = createEmptyMarkup('Не удалось загрузить пользователей.');
    adminElements.userEditor.innerHTML = createEditorEmptyMarkup('Попробуйте обновить раздел еще раз.');
    setAdminStatus(error.message || 'Не удалось загрузить пользователей.', 'error');
  }
}

function renderPlacesList() {
  if (!adminState.places.length) {
    adminElements.placesList.innerHTML = createEmptyMarkup('Места пока не найдены.');
    return;
  }

  adminElements.placesList.innerHTML = adminState.places.map((place) => `
    <article class="admin-card ${place.id === adminState.selectedPlaceId ? 'active' : ''}" data-place-card-id="${place.id}">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">${escapeHtml(place.name)}</div>
          <div class="admin-card-subtitle">${escapeHtml(place.address)}</div>
        </div>
        <span class="admin-chip">${escapeHtml(place.category)}</span>
      </div>
      <div class="admin-card-chips">
        <span class="admin-chip">Отзывы: ${place.reviewsCount || 0}</span>
        <span class="admin-chip">Избранное: ${place.favoritesCount || 0}</span>
        <span class="admin-chip">${escapeHtml(formatPriceRange(place.price))}</span>
      </div>
      <div class="admin-card-text">${escapeHtml(place.hours)}</div>
      <div class="admin-card-actions">
        <button class="admin-secondary-btn" type="button" data-action="edit-place" data-place-id="${place.id}">Редактировать</button>
        <button class="admin-danger-btn" type="button" data-action="delete-place" data-place-id="${place.id}">Удалить</button>
      </div>
    </article>
  `).join('');

  adminElements.placesList.querySelectorAll('[data-action="edit-place"]').forEach((button) => {
    button.addEventListener('click', () => {
      adminState.selectedPlaceId = button.dataset.placeId;
      renderPlacesList();
      renderPlaceEditor();
    });
  });

  adminElements.placesList.querySelectorAll('[data-action="delete-place"]').forEach((button) => {
    button.addEventListener('click', () => {
      handlePlaceDelete(button.dataset.placeId);
    });
  });
}

function renderPlaceEditor() {
  const place = adminState.places.find((item) => item.id === adminState.selectedPlaceId) || createEmptyPlaceDraft();
  const isEditing = Boolean(adminState.selectedPlaceId);

  adminElements.placeEditor.innerHTML = `
    <div>
      <h3 class="admin-editor-title">${isEditing ? 'Редактирование места' : 'Новое место'}</h3>
      <p class="admin-editor-hint">${isEditing ? 'Перемещайте маркер или меняйте поля координат вручную. ID места фиксирован.' : 'Кликните по карте, чтобы выбрать точку, затем заполните остальные поля. ID сгенерируется автоматически.'}</p>
    </div>
    <form class="admin-form" id="placeEditorForm">
      ${isEditing ? `
        <div class="admin-field">
          <label for="placeIdInput">ID</label>
          <input id="placeIdInput" name="id" type="text" value="${escapeHtml(place.id)}" readonly>
        </div>
      ` : ''}

      <div class="admin-map-picker">
        <div class="admin-map-picker-header">
          <div>
            <div class="admin-map-picker-title">Точка на карте</div>
            <div class="admin-map-picker-text">${isEditing ? 'Тяните маркер или кликните по карте, чтобы изменить координаты.' : 'Кликните по карте, чтобы поставить маркер нового места.'}</div>
          </div>
          <button class="admin-secondary-btn" type="button" id="clearPlacePointButton">Очистить точку</button>
        </div>
        <div class="admin-map-picker-status" id="placeMapStatus">${buildPlaceMapStatusText(place.coordinates)}</div>
        <div class="admin-place-map" id="adminPlaceMap"></div>
      </div>

      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="placeCategoryInput">Категория</label>
          <select id="placeCategoryInput" name="category">${buildCategoryOptions(place.category)}</select>
        </div>
        <div class="admin-field">
          <label for="placeAddressInput">Адрес</label>
          <input id="placeAddressInput" name="address" type="text" value="${escapeHtml(place.address)}" required>
        </div>
      </div>

      <div class="admin-field">
        <label for="placeNameInput">Название</label>
        <input id="placeNameInput" name="name" type="text" value="${escapeHtml(place.name)}" required>
      </div>

      <div class="admin-field">
        <label for="placeDescriptionInput">Описание</label>
        <textarea id="placeDescriptionInput" name="description">${escapeHtml(place.description)}</textarea>
      </div>

      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="placeHoursInput">Часы работы</label>
          <input id="placeHoursInput" name="hours" type="text" value="${escapeHtml(place.hours)}" required>
        </div>
        <div class="admin-field">
          <label for="placeDiscountInput">Скидка</label>
          <input id="placeDiscountInput" name="discount" type="text" value="${escapeHtml(place.discount || '')}">
        </div>
      </div>

      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="placeLatInput">Широта</label>
          <input id="placeLatInput" name="lat" type="number" step="0.000001" value="${escapeHtml(String(place.coordinates[0] ?? ''))}" required>
        </div>
        <div class="admin-field">
          <label for="placeLngInput">Долгота</label>
          <input id="placeLngInput" name="lng" type="number" step="0.000001" value="${escapeHtml(String(place.coordinates[1] ?? ''))}" required>
        </div>
      </div>

      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="placePriceMinInput">Цена от</label>
          <input id="placePriceMinInput" name="priceMin" type="number" value="${escapeHtml(String(place.price.min ?? 0))}">
        </div>
        <div class="admin-field">
          <label for="placePriceMaxInput">Цена до</label>
          <input id="placePriceMaxInput" name="priceMax" type="number" value="${escapeHtml(String(place.price.max ?? 0))}">
        </div>
      </div>

      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="placePriceUnitInput">Единица цены</label>
          <input id="placePriceUnitInput" name="priceUnit" type="text" value="${escapeHtml(place.price.unit || '')}">
        </div>
        <div class="admin-field">
          <label for="placeWebsiteInput">Сайт</label>
          <input id="placeWebsiteInput" name="website" type="url" value="${escapeHtml(place.links?.website || '')}">
        </div>
      </div>

      <div class="admin-field">
        <label for="placeTipsInput">Советы</label>
        <textarea id="placeTipsInput" name="tips">${escapeHtml((place.tips || []).join('\n'))}</textarea>
        <div class="admin-field-hint">Один совет на строку.</div>
      </div>

      <div class="admin-form-actions">
        <button class="admin-primary-btn" type="submit">${isEditing ? 'Сохранить изменения' : 'Создать место'}</button>
        ${isEditing ? '<button class="admin-secondary-btn" type="button" data-action="reset-place-editor">Новое место</button>' : ''}
        ${isEditing ? '<button class="admin-danger-btn" type="button" data-action="delete-place-editor">Удалить место</button>' : ''}
      </div>
    </form>
  `;

  const form = document.getElementById('placeEditorForm');
  form?.addEventListener('submit', handlePlaceSubmit);

  form?.querySelector('[name="lat"]')?.addEventListener('input', handlePlaceCoordinateInput);
  form?.querySelector('[name="lng"]')?.addEventListener('input', handlePlaceCoordinateInput);

  document.getElementById('clearPlacePointButton')?.addEventListener('click', () => {
    clearPlacePoint();
  });

  initPlaceMap(place, isEditing);

  adminElements.placeEditor.querySelector('[data-action="reset-place-editor"]')?.addEventListener('click', () => {
    adminState.selectedPlaceId = null;
    renderPlacesList();
    renderPlaceEditor();
  });

  adminElements.placeEditor.querySelector('[data-action="delete-place-editor"]')?.addEventListener('click', () => {
    if (adminState.selectedPlaceId) {
      handlePlaceDelete(adminState.selectedPlaceId);
    }
  });
}

function renderReviewsList() {
  if (!adminState.reviews.length) {
    adminElements.reviewsList.innerHTML = createEmptyMarkup('Отзывы не найдены.');
    return;
  }

  adminElements.reviewsList.innerHTML = adminState.reviews.map((review) => `
    <article class="admin-card ${String(review.id) === String(adminState.selectedReviewId) ? 'active' : ''}">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">${escapeHtml(review.placeName)}</div>
          <div class="admin-card-subtitle">${escapeHtml(review.authorName)} · ${escapeHtml(review.userEmail)}</div>
        </div>
        <span class="admin-chip">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
      </div>
      <div class="admin-card-text">${escapeHtml(trimText(review.body, 160))}</div>
      <div class="admin-card-subtitle">${formatDate(review.updatedAt)}</div>
      <div class="admin-card-actions">
        <button class="admin-secondary-btn" type="button" data-action="edit-review" data-review-id="${review.id}">Редактировать</button>
        <button class="admin-danger-btn" type="button" data-action="delete-review" data-review-id="${review.id}">Удалить</button>
      </div>
    </article>
  `).join('');

  adminElements.reviewsList.querySelectorAll('[data-action="edit-review"]').forEach((button) => {
    button.addEventListener('click', () => {
      adminState.selectedReviewId = Number(button.dataset.reviewId);
      renderReviewsList();
      renderReviewEditor();
    });
  });

  adminElements.reviewsList.querySelectorAll('[data-action="delete-review"]').forEach((button) => {
    button.addEventListener('click', () => {
      handleReviewDelete(Number(button.dataset.reviewId));
    });
  });
}

function renderReviewEditor() {
  const review = adminState.reviews.find((item) => String(item.id) === String(adminState.selectedReviewId));

  if (!review) {
    adminElements.reviewEditor.innerHTML = createEditorEmptyMarkup('Выберите отзыв, чтобы изменить рейтинг или текст.');
    return;
  }

  adminElements.reviewEditor.innerHTML = `
    <div>
      <h3 class="admin-editor-title">Редактирование отзыва</h3>
      <p class="admin-editor-hint">${escapeHtml(review.placeName)} · ${escapeHtml(review.authorName)}</p>
    </div>
    <form class="admin-form" id="reviewEditorForm">
      <div class="admin-field">
        <label for="reviewRatingInput">Оценка</label>
        <select id="reviewRatingInput" name="rating">${buildRatingOptions(review.rating)}</select>
      </div>
      <div class="admin-field">
        <label for="reviewBodyInput">Текст отзыва</label>
        <textarea id="reviewBodyInput" name="body" required>${escapeHtml(review.body)}</textarea>
      </div>
      <div class="admin-form-actions">
        <button class="admin-primary-btn" type="submit">Сохранить отзыв</button>
        <button class="admin-danger-btn" type="button" data-action="delete-review-editor">Удалить отзыв</button>
      </div>
    </form>
  `;

  document.getElementById('reviewEditorForm')?.addEventListener('submit', handleReviewSubmit);
  adminElements.reviewEditor.querySelector('[data-action="delete-review-editor"]')?.addEventListener('click', () => {
    handleReviewDelete(review.id);
  });
}

function renderUsersList() {
  if (!adminState.users.length) {
    adminElements.usersList.innerHTML = createEmptyMarkup('Пользователи не найдены.');
    return;
  }

  adminElements.usersList.innerHTML = adminState.users.map((user) => `
    <article class="admin-card ${user.id === adminState.selectedUserId ? 'active' : ''}">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">${escapeHtml(user.displayName)}</div>
          <div class="admin-card-subtitle">${escapeHtml(user.email)}</div>
        </div>
        <span class="admin-chip">${escapeHtml(user.role)}</span>
      </div>
      <div class="admin-card-chips">
        <span class="admin-chip">${user.isVerified ? 'Почта подтверждена' : 'Почта не подтверждена'}</span>
        <span class="admin-chip">${user.isActive ? 'Активен' : 'Отключен'}</span>
      </div>
      <div class="admin-card-subtitle">Создан: ${formatDate(user.createdAt)}</div>
      <div class="admin-card-actions">
        <button class="admin-secondary-btn" type="button" data-action="edit-user" data-user-id="${user.id}">Редактировать</button>
      </div>
    </article>
  `).join('');

  adminElements.usersList.querySelectorAll('[data-action="edit-user"]').forEach((button) => {
    button.addEventListener('click', () => {
      adminState.selectedUserId = button.dataset.userId;
      renderUsersList();
      renderUserEditor();
    });
  });
}

function renderUserEditor() {
  const user = adminState.users.find((item) => item.id === adminState.selectedUserId);

  if (!user) {
    adminElements.userEditor.innerHTML = createEditorEmptyMarkup('Выберите пользователя, чтобы изменить роль или статус.');
    return;
  }

  adminElements.userEditor.innerHTML = `
    <div>
      <h3 class="admin-editor-title">Редактирование пользователя</h3>
      <p class="admin-editor-hint">ID: ${escapeHtml(user.id)}</p>
    </div>
    <form class="admin-form" id="userEditorForm">
      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="userEmailInput">Почта</label>
          <input id="userEmailInput" name="email" type="email" value="${escapeHtml(user.email)}" required>
        </div>
        <div class="admin-field">
          <label for="userRoleInput">Роль</label>
          <select id="userRoleInput" name="role">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
          </select>
        </div>
      </div>
      <div class="admin-form-grid two-columns">
        <div class="admin-field">
          <label for="userFirstNameInput">Имя</label>
          <input id="userFirstNameInput" name="firstName" type="text" value="${escapeHtml(user.firstName)}" required>
        </div>
        <div class="admin-field">
          <label for="userLastNameInput">Фамилия</label>
          <input id="userLastNameInput" name="lastName" type="text" value="${escapeHtml(user.lastName)}">
        </div>
      </div>
      <div class="admin-checkbox-row">
        <label class="admin-checkbox">
          <input name="isVerified" type="checkbox" ${user.isVerified ? 'checked' : ''}>
          <span>Почта подтверждена</span>
        </label>
        <label class="admin-checkbox">
          <input name="isActive" type="checkbox" ${user.isActive ? 'checked' : ''}>
          <span>Аккаунт активен</span>
        </label>
      </div>
      <div class="admin-form-actions">
        <button class="admin-primary-btn" type="submit">Сохранить пользователя</button>
      </div>
    </form>
  `;

  document.getElementById('userEditorForm')?.addEventListener('submit', handleUserSubmit);
}

async function handlePlaceSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const isEditing = Boolean(adminState.selectedPlaceId);
  const latValue = String(formData.get('lat') || '').trim();
  const lngValue = String(formData.get('lng') || '').trim();
  const payload = {
    category: String(formData.get('category') || '').trim(),
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    hours: String(formData.get('hours') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    lat: latValue === '' ? Number.NaN : Number(latValue),
    lng: lngValue === '' ? Number.NaN : Number(lngValue),
    price: {
      min: Number(formData.get('priceMin') || 0),
      max: Number(formData.get('priceMax') || 0),
      unit: String(formData.get('priceUnit') || '').trim()
    },
    discount: String(formData.get('discount') || '').trim(),
    tips: String(formData.get('tips') || ''),
    links: {
      website: String(formData.get('website') || '').trim()
    }
  };

  if (isEditing) {
    payload.id = adminState.selectedPlaceId;
  }

  try {
    const url = isEditing ? `${ADMIN_API_BASE}/places/${encodeURIComponent(adminState.selectedPlaceId)}` : `${ADMIN_API_BASE}/places`;
    const method = isEditing ? 'PATCH' : 'POST';
    const data = await adminFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    adminState.selectedPlaceId = data.place.id;
    setAdminStatus(isEditing ? 'Место обновлено.' : 'Место создано.', 'success');
    await loadPlaces();
  } catch (error) {
    setAdminStatus(error.message || 'Не удалось сохранить место.', 'error');
  }
}

async function handlePlaceDelete(placeId) {
  const place = adminState.places.find((item) => item.id === placeId);

  if (!place || !window.confirm(`Удалить место "${place.name}"? Это также удалит связанные отзывы и избранное.`)) {
    return;
  }

  try {
    await adminFetchJson(`${ADMIN_API_BASE}/places/${encodeURIComponent(placeId)}`, {
      method: 'DELETE'
    });

    if (adminState.selectedPlaceId === placeId) {
      adminState.selectedPlaceId = null;
    }

    setAdminStatus('Место удалено.', 'success');
    await loadPlaces();
  } catch (error) {
    setAdminStatus(error.message || 'Не удалось удалить место.', 'error');
  }
}

function initPlaceMap(place, isEditing) {
  destroyPlaceMap();

  const mapElement = document.getElementById('adminPlaceMap');
  if (!mapElement || typeof L === 'undefined') {
    return;
  }

  adminPlaceMap.map = L.map(mapElement, {
    zoomControl: true,
    attributionControl: false
  }).setView(getPlaceMapCenter(place.coordinates), getPlaceMapZoom(place.coordinates));

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(adminPlaceMap.map);
  renderExistingPlacesLayer(place.id);

  adminPlaceMap.map.on('click', (event) => {
    setPlacePoint(event.latlng.lat, event.latlng.lng, { recenter: false });
    setAdminStatus(isEditing ? 'Координаты места обновлены на карте.' : 'Точка нового места выбрана.', 'info');
  });

  const initialCoordinates = normalizeCoordinates(place.coordinates);
  if (initialCoordinates) {
    setPlacePoint(initialCoordinates[0], initialCoordinates[1], { recenter: false, updateInputs: false });
    updatePlaceCoordinateInputs(initialCoordinates[0], initialCoordinates[1]);
  } else {
    updatePlaceMapStatus();
  }

  window.setTimeout(() => {
    adminPlaceMap.map?.invalidateSize();
  }, 0);
}

function destroyPlaceMap() {
  if (adminPlaceMap.map) {
    adminPlaceMap.map.remove();
    adminPlaceMap.map = null;
  }

  adminPlaceMap.marker = null;
  adminPlaceMap.placesLayer = null;
}

function renderExistingPlacesLayer(excludedPlaceId) {
  if (!adminPlaceMap.map) {
    return;
  }

  const markers = adminState.places
    .filter((place) => place.id !== excludedPlaceId)
    .map((place) => {
      const coordinates = normalizeCoordinates(place.coordinates);

      if (!coordinates) {
        return null;
      }

      return L.circleMarker(coordinates, {
        radius: 4,
        weight: 1,
        color: '#ffffff',
        fillColor: '#64748b',
        fillOpacity: 0.85
      }).bindTooltip(place.name, {
        direction: 'top',
        opacity: 0.9
      });
    })
    .filter(Boolean);

  adminPlaceMap.placesLayer = L.layerGroup(markers).addTo(adminPlaceMap.map);
}

function setPlacePoint(lat, lng, { recenter = true, updateInputs = true } = {}) {
  if (!adminPlaceMap.map || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  const coordinates = [lat, lng];

  if (!adminPlaceMap.marker) {
    adminPlaceMap.marker = L.marker(coordinates, {
      draggable: true
    }).addTo(adminPlaceMap.map);

    adminPlaceMap.marker.on('dragend', () => {
      const markerCoordinates = adminPlaceMap.marker.getLatLng();
      updatePlaceCoordinateInputs(markerCoordinates.lat, markerCoordinates.lng);
      updatePlaceMapStatus(markerCoordinates.lat, markerCoordinates.lng);
    });
  } else {
    adminPlaceMap.marker.setLatLng(coordinates);
  }

  if (updateInputs) {
    updatePlaceCoordinateInputs(lat, lng);
  }

  updatePlaceMapStatus(lat, lng);

  if (recenter) {
    adminPlaceMap.map.setView(coordinates, getPlaceMapZoom(coordinates));
  }
}

function clearPlacePoint() {
  if (adminPlaceMap.marker && adminPlaceMap.map) {
    adminPlaceMap.map.removeLayer(adminPlaceMap.marker);
    adminPlaceMap.marker = null;
  }

  updatePlaceCoordinateInputs('', '');
  updatePlaceMapStatus();
}

function handlePlaceCoordinateInput() {
  const coordinates = getCurrentPlaceCoordinateInputs();

  if (!coordinates) {
    if (adminPlaceMap.marker && adminPlaceMap.map) {
      adminPlaceMap.map.removeLayer(adminPlaceMap.marker);
      adminPlaceMap.marker = null;
    }

    updatePlaceMapStatus();
    return;
  }

  setPlacePoint(coordinates[0], coordinates[1], { recenter: false, updateInputs: false });
}

function updatePlaceCoordinateInputs(lat, lng) {
  const latInput = document.getElementById('placeLatInput');
  const lngInput = document.getElementById('placeLngInput');

  if (latInput) {
    latInput.value = lat === '' ? '' : formatCoordinate(lat);
  }

  if (lngInput) {
    lngInput.value = lng === '' ? '' : formatCoordinate(lng);
  }
}

function getCurrentPlaceCoordinateInputs() {
  const latValue = document.getElementById('placeLatInput')?.value ?? '';
  const lngValue = document.getElementById('placeLngInput')?.value ?? '';
  const lat = parseFiniteNumber(latValue);
  const lng = parseFiniteNumber(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}

function updatePlaceMapStatus(lat, lng) {
  const statusElement = document.getElementById('placeMapStatus');

  if (!statusElement) {
    return;
  }

  statusElement.textContent = buildPlaceMapStatusText(
    Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
  );
}

function buildPlaceMapStatusText(coordinates) {
  const normalized = normalizeCoordinates(coordinates);

  if (!normalized) {
    return 'Точка еще не выбрана. Кликните по карте, чтобы поставить маркер.';
  }

  return `Выбрано: ${formatCoordinate(normalized[0])}, ${formatCoordinate(normalized[1])}`;
}

function getPlaceMapCenter(coordinates) {
  return normalizeCoordinates(coordinates) || ADMIN_MAP_DEFAULT_CENTER;
}

function getPlaceMapZoom(coordinates) {
  return normalizeCoordinates(coordinates) ? 16 : 13;
}

function normalizeCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const lat = parseFiniteNumber(coordinates[0]);
  const lng = parseFiniteNumber(coordinates[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}

function parseFiniteNumber(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return Number.NaN;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  if (!adminState.selectedReviewId) {
    return;
  }

  const formData = new FormData(event.currentTarget);

  try {
    const data = await adminFetchJson(`${ADMIN_API_BASE}/reviews/${adminState.selectedReviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: Number(formData.get('rating')),
        body: String(formData.get('body') || '').trim()
      })
    });

    adminState.selectedReviewId = data.review.id;
    setAdminStatus('Отзыв обновлен.', 'success');
    await loadReviews();
  } catch (error) {
    setAdminStatus(error.message || 'Не удалось обновить отзыв.', 'error');
  }
}

async function handleReviewDelete(reviewId) {
  const review = adminState.reviews.find((item) => Number(item.id) === Number(reviewId));

  if (!review || !window.confirm(`Удалить отзыв пользователя ${review.authorName}?`)) {
    return;
  }

  try {
    await adminFetchJson(`${ADMIN_API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE'
    });

    if (Number(adminState.selectedReviewId) === Number(reviewId)) {
      adminState.selectedReviewId = null;
    }

    setAdminStatus('Отзыв удален.', 'success');
    await loadReviews();
  } catch (error) {
    setAdminStatus(error.message || 'Не удалось удалить отзыв.', 'error');
  }
}

async function handleUserSubmit(event) {
  event.preventDefault();

  if (!adminState.selectedUserId) {
    return;
  }

  const formData = new FormData(event.currentTarget);

  try {
    const data = await adminFetchJson(`${ADMIN_API_BASE}/users/${adminState.selectedUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(formData.get('email') || '').trim(),
        firstName: String(formData.get('firstName') || '').trim(),
        lastName: String(formData.get('lastName') || '').trim(),
        role: String(formData.get('role') || 'user'),
        isVerified: formData.get('isVerified') === 'on',
        isActive: formData.get('isActive') === 'on'
      })
    });

    if (adminState.currentUser && adminState.currentUser.id === data.user.id) {
      adminState.currentUser = data.user;
      renderAdminHeader();
    }

    setAdminStatus('Пользователь обновлен.', 'success');
    await loadUsers();
  } catch (error) {
    setAdminStatus(error.message || 'Не удалось обновить пользователя.', 'error');
  }
}

async function handleAdminLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (error) {
    console.error('Failed to logout from admin panel:', error);
  }

  window.location.href = '/';
}

function scheduleSearch(view, value, loader) {
  adminState.searches[view] = String(value || '').trim();

  if (searchTimers[view]) {
    window.clearTimeout(searchTimers[view]);
  }

  searchTimers[view] = window.setTimeout(() => {
    loader();
  }, 220);
}

function updateNavCount(view, count) {
  if (adminElements.navCounts[view]) {
    adminElements.navCounts[view].textContent = String(count);
  }
}

function setAdminStatus(message, tone = '') {
  adminElements.status.textContent = message;

  if (tone) {
    adminElements.status.dataset.tone = tone;
    return;
  }

  delete adminElements.status.dataset.tone;
}

function createLoadingMarkup(message) {
  return `<div class="admin-loading">${escapeHtml(message)}</div>`;
}

function createEmptyMarkup(message) {
  return `
    <div class="admin-empty">
      <div class="admin-empty-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function createEditorEmptyMarkup(message) {
  return createEmptyMarkup(message);
}

function createEmptyPlaceDraft() {
  return {
    id: '',
    category: 'food',
    name: '',
    description: '',
    price: { min: 0, max: 0, unit: '' },
    hours: '',
    address: '',
    coordinates: ['', ''],
    discount: '',
    tips: [],
    links: {}
  };
}

function buildCategoryOptions(selectedCategory) {
  return [
    ['food', 'Еда'],
    ['fun', 'Досуг'],
    ['study', 'Учёба'],
    ['print', 'Печать']
  ].map(([value, label]) => `
    <option value="${value}" ${value === selectedCategory ? 'selected' : ''}>${label}</option>
  `).join('');
}

function buildRatingOptions(selectedRating) {
  return [5, 4, 3, 2, 1].map((value) => `
    <option value="${value}" ${Number(selectedRating) === value ? 'selected' : ''}>${value} из 5</option>
  `).join('');
}

function formatPriceRange(price) {
  if (!price) {
    return 'Бесплатно';
  }

  if (Number(price.min) === 0 && Number(price.max) === 0) {
    return 'Бесплатно';
  }

  if (Number(price.min) === Number(price.max)) {
    return `${price.min}₽`;
  }

  return `${price.min}–${price.max}₽`;
}

function trimText(text, length) {
  const value = String(text || '');
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

async function adminFetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || 'Запрос к админ-панели завершился ошибкой');
  }

  return data;
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
