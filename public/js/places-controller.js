export function createPlacesController({
  apiBaseUrl,
  categoriesConfig,
  elements,
  mapController,
  routeController,
  onStatusMessage
}) {
  let places = [];
  let filteredPlaces = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let activePlace = null;
  let placesState = 'loading';
  let placesErrorMessage = '';
  let mobileResultsOpen = false;
  let favoritesStatus = 'idle';
  let favoritesLoadedForUserId = null;
  let favoritePlaceIds = new Set();
  const favoritePendingIds = new Set();
  const reviewsByPlaceId = {};

  function init() {
    setupEventListeners();
    renderAll();
    loadPlaces();
    syncFavoritesWithAuth();
  }

  async function loadPlaces() {
    placesState = 'loading';
    placesErrorMessage = '';
    renderAll();

    try {
      const response = await fetch(`${apiBaseUrl}/places`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      places = await response.json();
      placesState = 'ready';
      filterPlaces();
    } catch (error) {
      console.error('Failed to load places:', error);
      places = [];
      filteredPlaces = [];
      placesState = 'error';
      placesErrorMessage = 'Не удалось загрузить места. Проверьте соединение и попробуйте снова.';
      renderAll();
    }
  }

  async function syncFavoritesWithAuth({ force = false } = {}) {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || null;

    if (!currentUserId) {
      favoritePlaceIds = new Set();
      favoritesLoadedForUserId = null;
      favoritesStatus = 'ready';

      if (currentCategory === 'favorite') {
        updateCategorySelection('all');
        currentCategory = 'all';
      }

      filterPlaces();
      return;
    }

    if (!force && favoritesStatus === 'ready' && favoritesLoadedForUserId === currentUserId) {
      return;
    }

    favoritesStatus = 'loading';
    favoritesLoadedForUserId = currentUserId;
    renderAll();

    try {
      const response = await fetch(`${apiBaseUrl}/me/favorites`, {
        credentials: 'same-origin'
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить избранное');
      }

      favoritePlaceIds = new Set(Array.isArray(data.placeIds) ? data.placeIds : []);
      favoritesStatus = 'ready';
      filterPlaces();
    } catch (error) {
      console.error('Failed to load favorites:', error);
      favoritesStatus = 'error';
      favoritePlaceIds = new Set();
      filterPlaces();
    }
  }

  function setupEventListeners() {
    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        setCategory(event.currentTarget.dataset.category);
      });
    });

    document.querySelectorAll('.filter-btn-mobile').forEach((button) => {
      button.addEventListener('click', (event) => {
        const target = event.target.closest('.filter-btn-mobile');
        setCategory(target.dataset.category);
      });
    });

    elements.desktopSearchInput?.addEventListener('input', (event) => {
      setSearch(event.target.value);
    });

    elements.mobileSearchInput?.addEventListener('input', (event) => {
      setSearch(event.target.value);
    });

    elements.mobileSearchInput?.addEventListener('focus', () => {
      mobileResultsOpen = true;
      showMobileResults(true);
      toggleMobileCategories(false);
    });

    elements.desktopClearBtn?.addEventListener('click', () => {
      elements.desktopSearchInput.value = '';
      setSearch('');
    });

    elements.mobileClearBtn?.addEventListener('click', () => {
      elements.mobileSearchInput.value = '';
      setSearch('');
    });

    elements.sidebarPlaceBack?.addEventListener('click', clearActivePlace);
    elements.mobilePlaceBackdrop?.addEventListener('click', clearActivePlace);
    elements.mobilePlaceClose?.addEventListener('click', clearActivePlace);

    window.addEventListener('resize', () => {
      restorePlaceView();
    });

    window.addEventListener('studentmap:auth-changed', () => {
      syncFavoritesWithAuth({ force: true });

      if (activePlace) {
        renderPlaceDetails();
        ensurePlaceReviews(activePlace.id, { force: true });
      }
    });

    document.addEventListener('click', (event) => {
      if (
        elements.resultsDropdown &&
        elements.mobileSearchInput &&
        !elements.resultsDropdown.contains(event.target) &&
        !elements.mobileSearchInput.contains(event.target) &&
        elements.resultsDropdown.classList.contains('visible')
      ) {
        mobileResultsOpen = false;
        showMobileResults(false);
        toggleMobileCategories(true);
      }
    });
  }

  function updateCategorySelection(category) {
    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.category === category);
    });

    document.querySelectorAll('.filter-btn-mobile').forEach((button) => {
      button.classList.toggle('active', button.dataset.category === category);
    });
  }

  function updateSidebarTitle() {
    if (!elements.sidebarTitle) {
      return;
    }

    if (currentCategory === 'favorite') {
      elements.sidebarTitle.textContent = '❤ Избранное';
      return;
    }

    elements.sidebarTitle.textContent = '📍 Места';
  }

  function setCategory(category) {
    if (category === 'favorite' && !getCurrentUser()) {
      window.StudentMapAuth?.openAuthModal?.('register');
      onStatusMessage?.('Войдите, чтобы сохранять места в избранное.', 'info');
      return;
    }

    currentCategory = category;
    updateCategorySelection(category);

    if (window.innerWidth <= 768) {
      mobileResultsOpen = true;
      toggleMobileCategories(false);
    }

    filterPlaces();
  }

  function setSearch(term) {
    currentSearch = term.toLowerCase();

    elements.desktopClearBtn?.classList.toggle('hidden', !term);
    elements.mobileClearBtn?.classList.toggle('hidden', !term);

    if (elements.desktopSearchInput && elements.desktopSearchInput.value !== term) {
      elements.desktopSearchInput.value = term;
    }

    if (elements.mobileSearchInput && elements.mobileSearchInput.value !== term) {
      elements.mobileSearchInput.value = term;
    }

    mobileResultsOpen = Boolean(term) || currentCategory !== 'all';
    filterPlaces();
  }

  function filterPlaces() {
    filteredPlaces = places.filter((place) => {
      const matchesCategory =
        currentCategory === 'all' ||
        (currentCategory === 'favorite' ? favoritePlaceIds.has(place.id) : place.category === currentCategory);
      const matchesSearch =
        !currentSearch ||
        place.name.toLowerCase().includes(currentSearch) ||
        place.address.toLowerCase().includes(currentSearch);

      return matchesCategory && matchesSearch;
    });

    if (activePlace && !filteredPlaces.some((place) => place.id === activePlace.id)) {
      activePlace = null;
      hidePlaceView();
    }

    renderAll();
  }

  function renderAll() {
    mapController.updateMarkers(placesState === 'ready' ? filteredPlaces : [], activePlace?.id);
    updateSidebarTitle();
    renderSidebarList();
    renderMobileResults();
    renderPlaceDetails();
    restorePlaceView();
  }

  function renderSidebarList() {
    if (!elements.placesContainer) {
      return;
    }

    elements.placesContainer.innerHTML = '';

    if (placesState === 'loading') {
      elements.placesContainer.innerHTML = createStateMarkup({
        title: 'Загружаем места',
        description: 'Собираем подборку на карте и в списке.',
        tone: 'info'
      });
      return;
    }

    if (placesState === 'error') {
      elements.placesContainer.innerHTML = createStateMarkup({
        title: 'Не удалось загрузить места',
        description: placesErrorMessage,
        tone: 'error',
        actionLabel: 'Попробовать снова'
      });
      bindRetryAction(elements.placesContainer);
      return;
    }

    if (currentCategory === 'favorite' && favoritesStatus === 'loading') {
      elements.placesContainer.innerHTML = createStateMarkup({
        title: 'Загружаем избранное',
        description: 'Собираем сохраненные места вашего аккаунта.',
        tone: 'info'
      });
      return;
    }

    if (currentCategory === 'favorite' && favoritesStatus === 'error') {
      elements.placesContainer.innerHTML = createStateMarkup({
        title: 'Не удалось загрузить избранное',
        description: 'Попробуйте обновить список или открыть раздел позже.',
        tone: 'error',
        actionLabel: 'Повторить'
      });
      bindFavoritesRetryAction(elements.placesContainer);
      return;
    }

    if (filteredPlaces.length === 0) {
      elements.placesContainer.innerHTML = createStateMarkup({
        title: currentCategory === 'favorite' ? 'В избранном пока пусто' : 'Ничего не найдено',
        description: currentCategory === 'favorite'
          ? 'Сохраняйте понравившиеся места, чтобы они появились в этом разделе.'
          : 'Измените категорию или очистите поиск, чтобы увидеть больше мест.',
        tone: 'empty'
      });
      return;
    }

    filteredPlaces.forEach((place) => {
      const card = document.createElement('div');
      const category = categoriesConfig[place.category] || categoriesConfig.all;

      card.className = `place-card ${place.id === activePlace?.id ? 'active' : ''} category-${place.category}`;
      card.innerHTML = `
        <div class="place-card-header">
          <h3 class="place-name">${place.name}</h3>
          <div class="place-card-actions">
            ${buildFavoriteButtonMarkup(place.id, {
              isFavorite: favoritePlaceIds.has(place.id),
              isPending: favoritePendingIds.has(place.id),
              compact: true
            })}
            <span class="place-category-badge" style="background:${category.color}">${category.emoji}</span>
          </div>
        </div>
        <div class="place-address">📍 ${place.address}</div>
        <div class="place-price">💰 ${formatPrice(place.price)} • 🕐 ${place.hours}</div>
      `;

      card.querySelector('.favorite-toggle-btn')?.addEventListener('click', handleFavoriteToggle);
      card.addEventListener('click', () => {
        handlePlaceSelect(place);
      });

      elements.placesContainer.appendChild(card);
    });
  }

  function renderMobileResults() {
    if (!elements.mobileResultsList) {
      return;
    }

    elements.mobileResultsList.innerHTML = '';
    elements.mobileResultsCount.textContent = placesState === 'ready' ? filteredPlaces.length : '—';
    updateMobileResultsTitle();

    const shouldShow = shouldShowMobileResults();
    showMobileResults(shouldShow);

    if (placesState === 'loading') {
      elements.mobileResultsList.innerHTML = createStateMarkup({
        title: 'Загружаем места',
        description: 'Список появится через пару секунд.',
        tone: 'info'
      });
      return;
    }

    if (placesState === 'error') {
      elements.mobileResultsList.innerHTML = createStateMarkup({
        title: 'Не удалось загрузить места',
        description: placesErrorMessage,
        tone: 'error',
        actionLabel: 'Повторить'
      });
      bindRetryAction(elements.mobileResultsList);
      return;
    }

    if (currentCategory === 'favorite' && favoritesStatus === 'loading') {
      elements.mobileResultsList.innerHTML = createStateMarkup({
        title: 'Загружаем избранное',
        description: 'Собираем сохраненные места вашего аккаунта.',
        tone: 'info'
      });
      return;
    }

    if (currentCategory === 'favorite' && favoritesStatus === 'error') {
      elements.mobileResultsList.innerHTML = createStateMarkup({
        title: 'Не удалось загрузить избранное',
        description: 'Попробуйте повторить загрузку позже.',
        tone: 'error',
        actionLabel: 'Повторить'
      });
      bindFavoritesRetryAction(elements.mobileResultsList);
      return;
    }

    if (filteredPlaces.length === 0) {
      elements.mobileResultsList.innerHTML = createStateMarkup({
        title: currentCategory === 'favorite' ? 'В избранном пока пусто' : 'Ничего не найдено',
        description: currentCategory === 'favorite'
          ? 'Нажимайте на сердечки у мест, чтобы быстро найти их здесь.'
          : 'Попробуйте другую категорию или измените запрос.',
        tone: 'empty'
      });
      return;
    }

    filteredPlaces.forEach((place) => {
      const category = categoriesConfig[place.category] || categoriesConfig.all;
      const item = document.createElement('div');

      item.className = 'result-item';
      item.innerHTML = `
        <div class="result-icon" style="background: ${category.color}">${category.emoji}</div>
        <div class="result-info">
          <div class="result-name">${place.name}</div>
          <div class="result-address">${place.address}</div>
        </div>
        <div class="result-actions">
          ${buildFavoriteButtonMarkup(place.id, {
            isFavorite: favoritePlaceIds.has(place.id),
            isPending: favoritePendingIds.has(place.id),
            compact: true
          })}
          <div class="result-meta">${formatPrice(place.price)}</div>
        </div>
      `;

      item.querySelector('.favorite-toggle-btn')?.addEventListener('click', handleFavoriteToggle);
      item.addEventListener('click', () => {
        handlePlaceSelect(place);
      });

      elements.mobileResultsList.appendChild(item);
    });
  }

  function updateMobileResultsTitle() {
    if (!elements.resultsDropdownTitle) {
      return;
    }

    const category = categoriesConfig[currentCategory] || categoriesConfig.all;
    const title = currentCategory === 'all'
      ? '📍 Все места'
      : `${category.emoji} ${category.name}`;

    elements.resultsDropdownTitle.textContent = currentSearch
      ? `${title} по запросу`
      : title;
  }

  function shouldShowMobileResults() {
    if (window.innerWidth > 768 || activePlace) {
      return false;
    }

    if (placesState !== 'ready') {
      return mobileResultsOpen;
    }

    return mobileResultsOpen || currentSearch.length > 0 || currentCategory !== 'all';
  }

  function bindRetryAction(container) {
    container.querySelector('[data-action="retry-load-places"]')?.addEventListener('click', () => {
      loadPlaces();
    });
  }

  function bindFavoritesRetryAction(container) {
    container.querySelector('[data-action="retry-load-places"]')?.addEventListener('click', () => {
      syncFavoritesWithAuth({ force: true });
    });
  }

  function renderPlaceDetails() {
    if (!activePlace) {
      if (elements.sidebarPlaceContent) {
        elements.sidebarPlaceContent.innerHTML = '';
      }

      if (elements.mobilePlaceContent) {
        elements.mobilePlaceContent.innerHTML = '';
      }

      return;
    }

    const category = categoriesConfig[activePlace.category] || categoriesConfig.all;
    const reviewState = getReviewState(activePlace.id);
    const currentUser = getCurrentUser();
    const detailMarkup = buildPlaceDetailMarkup({
      place: activePlace,
      category,
      reviewState,
      currentUser,
      isFavorite: favoritePlaceIds.has(activePlace.id),
      isFavoritePending: favoritePendingIds.has(activePlace.id)
    });

    if (elements.sidebarPlaceContent) {
      elements.sidebarPlaceContent.innerHTML = detailMarkup;
      bindDetailActions(elements.sidebarPlaceContent, reviewState);
    }

    if (elements.mobilePlaceContent) {
      elements.mobilePlaceContent.innerHTML = detailMarkup;
      bindDetailActions(elements.mobilePlaceContent, reviewState);
    }
  }

  function bindDetailActions(container, reviewState) {
    container.querySelector('.place-detail-route-btn')?.addEventListener('click', () => {
      if (activePlace) {
        routeController.openRouteModal(activePlace);
      }
    });

    container.querySelector('.favorite-toggle-btn')?.addEventListener('click', handleFavoriteToggle);

    container.querySelector('.place-detail-review-edit')?.addEventListener('click', handleReviewEditStart);
    container.querySelector('.place-detail-review-cancel')?.addEventListener('click', handleReviewEditCancel);
    container.querySelector('.place-detail-review-form')?.addEventListener('submit', handleReviewSubmit);
    container.querySelector('.place-detail-review-form')?.addEventListener('input', handleReviewDraftChange);
    container.querySelector('.place-detail-review-delete')?.addEventListener('click', handleReviewDelete);
    container.querySelector('.place-detail-login-btn')?.addEventListener('click', () => {
      window.StudentMapAuth?.openAuthModal?.();
    });

    container.querySelector('[data-action="retry-load-reviews"]')?.addEventListener('click', () => {
      if (activePlace) {
        ensurePlaceReviews(activePlace.id, { force: true });
      }
    });

    if (reviewState.formError) {
      container.querySelector('.place-review-form-error')?.scrollIntoView({ block: 'nearest' });
    }
  }

  function handleReviewEditStart() {
    if (!activePlace) {
      return;
    }

    const reviewState = getReviewState(activePlace.id);
    reviewState.isEditingOwnReview = true;
    reviewState.formError = '';
    reviewState.formDraft = createReviewDraft(reviewState);
    renderPlaceDetails();
  }

  function handleReviewEditCancel() {
    if (!activePlace) {
      return;
    }

    const reviewState = getReviewState(activePlace.id);
    reviewState.isEditingOwnReview = false;
    reviewState.formError = '';
    reviewState.formDraft = createReviewDraft(reviewState);
    renderPlaceDetails();
  }

  async function handleFavoriteToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    const placeId = event.currentTarget.dataset.placeId;
    if (!placeId || favoritePendingIds.has(placeId)) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.StudentMapAuth?.openAuthModal?.('register');
      onStatusMessage?.('Войдите или зарегистрируйтесь, чтобы сохранять места.', 'info');
      return;
    }

    const wasFavorite = favoritePlaceIds.has(placeId);
    favoritePendingIds.add(placeId);

    if (wasFavorite) {
      favoritePlaceIds.delete(placeId);
    } else {
      favoritePlaceIds.add(placeId);
    }

    filterPlaces();

    try {
      const response = await fetch(`${apiBaseUrl}/places/${encodeURIComponent(placeId)}/favorite`, {
        method: wasFavorite ? 'DELETE' : 'POST',
        credentials: 'same-origin'
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          window.StudentMapAuth?.openAuthModal?.('register');
        }
        throw new Error(data.error || 'Не удалось обновить избранное');
      }

      if (data.isFavorite) {
        favoritePlaceIds.add(placeId);
      } else {
        favoritePlaceIds.delete(placeId);
      }

      onStatusMessage?.(
        data.isFavorite ? 'Место сохранено в избранное.' : 'Место убрано из избранного.',
        'success'
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);

      if (wasFavorite) {
        favoritePlaceIds.add(placeId);
      } else {
        favoritePlaceIds.delete(placeId);
      }

      onStatusMessage?.(error.message || 'Не удалось обновить избранное.', 'error');
    } finally {
      favoritePendingIds.delete(placeId);
      filterPlaces();
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!activePlace) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.StudentMapAuth?.openAuthModal?.();
      return;
    }

    const form = event.currentTarget;
    const reviewState = getReviewState(activePlace.id);
    const ownReview = getOwnReview(reviewState);
    const formData = new FormData(form);
    const rating = Number(formData.get('rating'));
    const body = String(formData.get('body') || '');

    reviewState.submitting = true;
    reviewState.formError = '';
    reviewState.formDraft = {
      rating: String(rating || 5),
      body
    };
    renderPlaceDetails();

    try {
      const response = await fetch(
        ownReview
          ? `${apiBaseUrl}/reviews/${ownReview.id}`
          : `${apiBaseUrl}/places/${encodeURIComponent(activePlace.id)}/reviews`,
        {
          method: ownReview ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ rating, body })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось сохранить отзыв');
      }

      reviewState.formDraft = null;
      reviewState.isEditingOwnReview = false;
      await ensurePlaceReviews(activePlace.id, { force: true });
    } catch (error) {
      reviewState.submitting = false;
      reviewState.isEditingOwnReview = Boolean(ownReview);
      reviewState.formError = error.message;
      renderPlaceDetails();
    }
  }

  function handleReviewDraftChange(event) {
    if (!activePlace) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const reviewState = getReviewState(activePlace.id);

    reviewState.formDraft = {
      rating: String(formData.get('rating') || 5),
      body: String(formData.get('body') || '')
    };

    if (reviewState.formError) {
      reviewState.formError = '';
    }
  }

  async function handleReviewDelete() {
    if (!activePlace) {
      return;
    }

    const reviewState = getReviewState(activePlace.id);
    const ownReview = getOwnReview(reviewState);
    if (!ownReview) {
      return;
    }

    reviewState.submitting = true;
    reviewState.formError = '';
    renderPlaceDetails();

    try {
      const response = await fetch(`${apiBaseUrl}/reviews/${ownReview.id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить отзыв');
      }

      reviewState.formDraft = null;
      reviewState.isEditingOwnReview = false;
      await ensurePlaceReviews(activePlace.id, { force: true });
    } catch (error) {
      reviewState.submitting = false;
      reviewState.isEditingOwnReview = true;
      reviewState.formError = error.message;
      renderPlaceDetails();
    }
  }

  async function ensurePlaceReviews(placeId, { force = false } = {}) {
    const reviewState = getReviewState(placeId);
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || null;

    if (!force && reviewState.status === 'ready' && reviewState.loadedForUserId === currentUserId) {
      return reviewState;
    }

    reviewState.status = 'loading';
    reviewState.error = '';
    reviewState.loadedForUserId = currentUserId;

    if (activePlace?.id === placeId) {
      renderPlaceDetails();
    }

    try {
      const response = await fetch(`${apiBaseUrl}/places/${encodeURIComponent(placeId)}/reviews`, {
        credentials: 'same-origin'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить отзывы');
      }

      reviewState.status = 'ready';
      reviewState.error = '';
      reviewState.summary = data.summary || { averageRating: null, reviewsCount: 0 };
      reviewState.reviews = Array.isArray(data.reviews) ? data.reviews : [];
      reviewState.submitting = false;
      reviewState.formError = '';
      reviewState.formDraft = createReviewDraft(reviewState);
      reviewState.isEditingOwnReview = false;
    } catch (error) {
      console.error('Failed to load reviews:', error);
      reviewState.status = 'error';
      reviewState.error = error.message || 'Не удалось загрузить отзывы';
      reviewState.submitting = false;
    }

    if (activePlace?.id === placeId) {
      renderPlaceDetails();
    }

    return reviewState;
  }

  function getReviewState(placeId) {
    if (!reviewsByPlaceId[placeId]) {
      reviewsByPlaceId[placeId] = {
        status: 'idle',
        error: '',
        loadedForUserId: null,
        reviews: [],
        summary: {
          averageRating: null,
          reviewsCount: 0
        },
        submitting: false,
        formError: '',
        formDraft: null,
        isEditingOwnReview: false
      };
    }

    return reviewsByPlaceId[placeId];
  }

  function handlePlaceSelect(place) {
    activePlace = place;
    mobileResultsOpen = false;
    if (getReviewState(place.id).status === 'idle') {
      getReviewState(place.id).status = 'loading';
    }
    mapController.setView(place.coordinates, 15);

    if (elements.sidebarAccountPanel?.classList.contains('active')) {
      elements.sidebarAccountPanel.classList.remove('active');
    }

    if (window.innerWidth <= 768) {
      elements.mobileSearchInput?.blur();
    }

    renderAll();
    ensurePlaceReviews(place.id);
  }

  function handleMapClick() {
    if (window.innerWidth > 768) {
      return;
    }

    if (elements.mobilePlaceSheet?.classList.contains('visible')) {
      clearActivePlace();
      return;
    }

    mobileResultsOpen = false;
    showMobileResults(false);
    toggleMobileCategories(true);
    elements.mobileSearchInput?.blur();
  }

  function clearActivePlace() {
    activePlace = null;
    renderAll();
  }

  function hidePlaceView() {
    elements.sidebarPlacePanel?.classList.remove('active');
    elements.mobilePlaceSheet?.classList.remove('visible');
    syncMobileOverlay();
  }

  function restorePlaceView() {
    if (!activePlace) {
      hidePlaceView();
      elements.sidebarContent?.classList.remove('hidden');
      elements.sidebarFilters?.classList.remove('hidden');
      syncMobileOverlay();
      return;
    }

    const routeVisible =
      elements.routeModal?.classList.contains('visible') ||
      elements.sidebarRoutePanel?.classList.contains('active');

    if (routeVisible) {
      return;
    }

    if (window.innerWidth <= 768) {
      elements.mobilePlaceSheet?.classList.add('visible');
      syncMobileOverlay();
      return;
    }

    elements.sidebarPlacePanel?.classList.add('active');
    elements.sidebarAccountPanel?.classList.remove('active');
    elements.sidebarContent?.classList.add('hidden');
    elements.sidebarFilters?.classList.add('hidden');
    syncMobileOverlay();
  }

  function syncMobileOverlay() {
    const detailVisible = elements.mobilePlaceSheet?.classList.contains('visible');
    const shouldShowCategories = !detailVisible && !shouldShowMobileResults();

    toggleMobileCategories(shouldShowCategories);

    if (window.innerWidth <= 768) {
      showMobileResults(!detailVisible && shouldShowMobileResults());
    }
  }

  function showMobileResults(visible) {
    if (!elements.resultsDropdown || window.innerWidth > 768) {
      return;
    }

    elements.resultsDropdown.classList.toggle('visible', visible);
  }

  function toggleMobileCategories(visible) {
    const bottomCategories = document.querySelector('.bottom-categories');
    const geolocationControl = document.querySelector('.geolocation-control');

    if (bottomCategories) {
      bottomCategories.classList.toggle('hidden', !visible);
    }

    if (geolocationControl && window.innerWidth <= 768) {
      geolocationControl.classList.toggle('hidden', !visible);
    }
  }

  return {
    handleMapClick,
    handlePlaceSelect,
    hidePlaceView,
    init,
    restorePlaceView
  };
}

function createStateMarkup({ title, description, tone, actionLabel }) {
  return `
    <div class="list-state list-state-${tone}">
      <div class="list-state-title">${title}</div>
      <div class="list-state-text">${description}</div>
      ${actionLabel ? `<button type="button" class="list-state-action" data-action="retry-load-places">${actionLabel}</button>` : ''}
    </div>
  `;
}

function formatPrice(price) {
  if (price.min === 0 && price.max === 0) return 'Бесплатно';
  if (price.min === price.max) return `${price.min}₽`;
  return `${price.min}–${price.max}₽`;
}

function buildPlaceDetailMarkup({ place, category, reviewState, currentUser, isFavorite, isFavoritePending }) {
  const links = [];

  if (place.links?.website) {
    links.push('<a class="place-detail-link secondary" href="' + place.links.website + '" target="_blank" rel="noreferrer">Сайт</a>');
  }

  return `
    <article class="place-detail-card">
      <div class="place-detail-hero">
        <div class="place-detail-icon" style="background:${category.color}">${category.emoji}</div>
        <div class="place-detail-headline">
          <div class="place-detail-topline">
            <span class="place-detail-category">${category.name}</span>
            ${buildFavoriteButtonMarkup(place.id, {
              isFavorite,
              isPending: isFavoritePending,
              compact: true
            })}
          </div>
          <h2 class="place-detail-title">${place.name}</h2>
        </div>
      </div>

      <div class="place-detail-meta">
        <div class="place-detail-chip">📍 ${place.address}</div>
        <div class="place-detail-chip">🕐 ${place.hours}</div>
        <div class="place-detail-chip">💰 ${formatPrice(place.price)}</div>
      </div>

      ${place.description ? `<p class="place-detail-description">${place.description}</p>` : ''}

      ${place.tips && place.tips.length > 0 ? `
        <section class="place-detail-section">
          <h3 class="place-detail-section-title">Что полезно знать</h3>
          <ul class="place-detail-tip-list">
            ${place.tips.map((tip) => `<li>${tip}</li>`).join('')}
          </ul>
        </section>
      ` : ''}

      ${buildReviewsMarkup(reviewState, currentUser)}

      ${links.length > 0 ? `<div class="place-detail-links">${links.join('')}</div>` : ''}

      <div class="place-detail-actions place-detail-actions-stack">
        <button type="button" class="place-detail-route-btn">Построить маршрут</button>
      </div>
    </article>
  `;
}

function buildReviewsMarkup(reviewState, currentUser) {
  const summary = reviewState.summary || { averageRating: null, reviewsCount: 0 };

  return `
    <section class="place-detail-section place-reviews-section">
      <div class="place-reviews-header">
        <div>
          <h3 class="place-detail-section-title place-reviews-title">Отзывы</h3>
          <p class="place-reviews-subtitle">Реальные впечатления пользователей StudentMap.</p>
        </div>
        <div class="place-reviews-summary">
          <span class="place-reviews-score">${formatAverageRating(summary.averageRating)}</span>
          <span class="place-reviews-count">${formatReviewsCount(summary.reviewsCount)}</span>
        </div>
      </div>
      ${buildReviewsContentMarkup(reviewState, currentUser)}
    </section>
  `;
}

function buildReviewsContentMarkup(reviewState, currentUser) {
  if (reviewState.status === 'idle' || reviewState.status === 'loading') {
    return `
      <div class="place-reviews-state">
        <div class="place-reviews-state-title">Загружаем отзывы</div>
        <div class="place-reviews-state-text">Собираем мнения других пользователей.</div>
      </div>
    `;
  }

  if (reviewState.status === 'error') {
    return `
      <div class="place-reviews-state error">
        <div class="place-reviews-state-title">Не удалось загрузить отзывы</div>
        <div class="place-reviews-state-text">${escapeHtml(reviewState.error || 'Попробуйте еще раз.')}</div>
        <button type="button" class="list-state-action" data-action="retry-load-reviews">Повторить</button>
      </div>
    `;
  }

  const reviewsMarkup = reviewState.reviews.length > 0
    ? `<div class="place-reviews-list">${reviewState.reviews.map(buildSingleReviewMarkup).join('')}</div>`
    : `
      <div class="place-reviews-empty">
        <div class="place-reviews-state-title">Пока нет отзывов</div>
        <div class="place-reviews-state-text">Станьте первым, кто поделится впечатлением об этом месте.</div>
      </div>
    `;

  return `
    ${reviewsMarkup}
    ${buildReviewComposerMarkup(reviewState, currentUser)}
  `;
}

function buildSingleReviewMarkup(review) {
  return `
    <article class="place-review-card ${review.isOwner ? 'owner' : ''}">
      <div class="place-review-card-header">
        <div>
          <div class="place-review-author">${escapeHtml(review.authorName)}</div>
          <div class="place-review-date">${formatReviewDate(review)}</div>
        </div>
        <div class="place-review-rating" aria-label="Оценка ${review.rating} из 5">${renderRatingStars(review.rating)}</div>
      </div>
      <p class="place-review-body">${formatReviewBody(review.body)}</p>
      ${review.isOwner ? `
        <div class="place-review-owner-row">
          <div class="place-review-owner">Ваш отзыв</div>
          <button type="button" class="auth-secondary place-detail-review-edit">Редактировать</button>
        </div>
      ` : ''}
    </article>
  `;
}

function buildReviewComposerMarkup(reviewState, currentUser) {
  if (!currentUser) {
    return `
      <div class="place-review-guest">
        <div class="place-reviews-state-title">Хотите оставить отзыв?</div>
        <div class="place-reviews-state-text">Войдите в аккаунт, чтобы оценить место и поделиться впечатлением.</div>
        <button type="button" class="place-detail-login-btn">Войти, чтобы оставить отзыв</button>
      </div>
    `;
  }

  const ownReview = getOwnReview(reviewState);
  if (ownReview && !reviewState.isEditingOwnReview) {
    return '';
  }

  const draft = reviewState.formDraft || createReviewDraft(reviewState);
  const submitLabel = reviewState.submitting
    ? (ownReview ? 'Сохраняем...' : 'Публикуем...')
    : (ownReview ? 'Сохранить отзыв' : 'Опубликовать отзыв');

  return `
    <div class="place-review-composer">
      <h4 class="place-review-composer-title">${ownReview ? 'Редактировать отзыв' : 'Оставить отзыв'}</h4>
      <form class="place-detail-review-form">
        <label class="place-review-field">
          <span class="place-review-label">Оценка</span>
          <select name="rating" class="place-review-select" ${reviewState.submitting ? 'disabled' : ''}>
            ${buildRatingOptions(draft.rating)}
          </select>
        </label>
        <label class="place-review-field">
          <span class="place-review-label">Ваш отзыв</span>
          <textarea name="body" class="place-review-textarea" rows="4" maxlength="500" placeholder="Что понравилось, что важно знать, стоит ли сюда идти?" ${reviewState.submitting ? 'disabled' : ''}>${escapeHtml(draft.body)}</textarea>
        </label>
        ${reviewState.formError ? `<div class="place-review-form-error">${escapeHtml(reviewState.formError)}</div>` : ''}
        <div class="place-review-form-footer">
          <div class="place-review-form-hint">От 10 до 500 символов. Один отзыв на место.</div>
          <div class="place-review-form-actions">
            ${ownReview ? `<button type="button" class="auth-secondary place-detail-review-cancel" ${reviewState.submitting ? 'disabled' : ''}>Отмена</button>` : ''}
            ${ownReview ? `<button type="button" class="auth-secondary place-detail-review-delete" ${reviewState.submitting ? 'disabled' : ''}>Удалить</button>` : ''}
            <button type="submit" class="auth-submit" ${reviewState.submitting ? 'disabled' : ''}>${submitLabel}</button>
          </div>
        </div>
      </form>
    </div>
  `;
}

function createReviewDraft(reviewState) {
  const ownReview = getOwnReview(reviewState);

  return {
    rating: String(ownReview?.rating || 5),
    body: ownReview?.body || ''
  };
}

function getOwnReview(reviewState) {
  return reviewState.reviews.find((review) => review.isOwner) || null;
}

function getCurrentUser() {
  return window.StudentMapAuth?.getCurrentUser?.() || null;
}

function buildRatingOptions(selectedRating) {
  return [5, 4, 3, 2, 1]
    .map((value) => `<option value="${value}" ${String(selectedRating) === String(value) ? 'selected' : ''}>${value} из 5</option>`)
    .join('');
}

function renderRatingStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatAverageRating(value) {
  return value === null ? '—' : Number(value).toFixed(1);
}

function formatReviewsCount(count) {
  const safeCount = Number(count) || 0;
  const mod10 = safeCount % 10;
  const mod100 = safeCount % 100;
  let word = 'отзывов';

  if (mod10 === 1 && mod100 !== 11) {
    word = 'отзыв';
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    word = 'отзыва';
  }

  return `${safeCount} ${word}`;
}

function formatReviewDate(review) {
  const createdAt = new Date(review.createdAt);
  const updatedAt = new Date(review.updatedAt);
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long'
  });
  const label = formatter.format(updatedAt);

  return updatedAt.getTime() > createdAt.getTime() + 1000 ? `Обновлено ${label}` : label;
}

function formatReviewBody(body) {
  return escapeHtml(body).replace(/\n/g, '<br>');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFavoriteButtonMarkup(placeId, { isFavorite, isPending, compact = false, fullWidth = false }) {
  const label = isFavorite ? 'Убрать из избранного' : 'Добавить в избранное';
  const classes = [
    'favorite-toggle-btn',
    isFavorite ? 'active' : '',
    compact ? 'compact' : '',
    fullWidth ? 'full-width' : ''
  ].filter(Boolean).join(' ');

  return `
    <button
      type="button"
      class="${classes}"
      data-place-id="${placeId}"
      aria-pressed="${isFavorite ? 'true' : 'false'}"
      aria-label="${label}"
      title="${label}"
      ${isPending ? 'disabled' : ''}
    >
      <span class="favorite-toggle-icon" aria-hidden="true">${isFavorite ? '❤' : '♡'}</span>
      ${compact ? '' : `<span class="favorite-toggle-text">${isFavorite ? 'В избранном' : 'В избранное'}</span>`}
    </button>
  `;
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
