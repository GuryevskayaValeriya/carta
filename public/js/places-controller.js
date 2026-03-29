export function createPlacesController({
  apiBaseUrl,
  categoriesConfig,
  elements,
  mapController,
  routeController
}) {
  let places = [];
  let filteredPlaces = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let activePlace = null;

  function init() {
    setupEventListeners();
    loadPlaces();
  }

  async function loadPlaces() {
    try {
      const response = await fetch(`${apiBaseUrl}/places`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      places = await response.json();
      filteredPlaces = places;
      renderAll();
    } catch (error) {
      console.error('Failed to load places:', error);
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
      toggleMobileCategories(true);
    });

    elements.sidebarPlaceBack?.addEventListener('click', clearActivePlace);
    elements.mobilePlaceBackdrop?.addEventListener('click', clearActivePlace);
    elements.mobilePlaceClose?.addEventListener('click', clearActivePlace);

    window.addEventListener('resize', () => {
      restorePlaceView();
    });

    document.addEventListener('click', (event) => {
      if (
        elements.resultsDropdown &&
        elements.mobileSearchInput &&
        !elements.resultsDropdown.contains(event.target) &&
        !elements.mobileSearchInput.contains(event.target) &&
        elements.resultsDropdown.classList.contains('visible')
      ) {
        showMobileResults(false);
        toggleMobileCategories(true);
      }
    });
  }

  function setCategory(category) {
    currentCategory = category;

    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.category === category);
    });

    document.querySelectorAll('.filter-btn-mobile').forEach((button) => {
      button.classList.toggle('active', button.dataset.category === category);
    });

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

    filterPlaces();
  }

  function filterPlaces() {
    filteredPlaces = places.filter((place) => {
      const matchesCategory = currentCategory === 'all' || place.category === currentCategory;
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
    mapController.updateMarkers(filteredPlaces, activePlace?.id);
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

    if (filteredPlaces.length === 0) {
      elements.placesContainer.innerHTML = '<div class="no-results">Ничего не найдено</div>';
      return;
    }

    filteredPlaces.forEach((place) => {
      const card = document.createElement('div');
      const category = categoriesConfig[place.category] || categoriesConfig.all;

      card.className = `place-card ${place.id === activePlace?.id ? 'active' : ''} category-${place.category}`;
      card.innerHTML = `
        <div class="place-card-header">
          <h3 class="place-name">${place.name}</h3>
          <span class="place-category-badge" style="background:${category.color}">${category.emoji}</span>
        </div>
        <div class="place-address">📍 ${place.address}</div>
        <div class="place-price">💰 ${formatPrice(place.price)} • 🕐 ${place.hours}</div>
      `;

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
    elements.mobileResultsCount.textContent = filteredPlaces.length;

    showMobileResults(currentSearch.length > 0);

    if (filteredPlaces.length === 0) {
      elements.mobileResultsList.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8">Ничего не найдено</div>';
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
        <div class="result-meta">${formatPrice(place.price)}</div>
      `;

      item.addEventListener('click', () => {
        handlePlaceSelect(place);
      });

      elements.mobileResultsList.appendChild(item);
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
    const detailMarkup = buildPlaceDetailMarkup(activePlace, category);

    if (elements.sidebarPlaceContent) {
      elements.sidebarPlaceContent.innerHTML = detailMarkup;
      bindDetailActions(elements.sidebarPlaceContent);
    }

    if (elements.mobilePlaceContent) {
      elements.mobilePlaceContent.innerHTML = detailMarkup;
      bindDetailActions(elements.mobilePlaceContent);
    }
  }

  function bindDetailActions(container) {
    container.querySelector('.place-detail-route-btn')?.addEventListener('click', () => {
      if (activePlace) {
        routeController.openRouteModal(activePlace);
      }
    });
  }

  function handlePlaceSelect(place) {
    activePlace = place;
    mapController.setView(place.coordinates, 15);
    if (window.innerWidth <= 768) {
      elements.mobileSearchInput?.blur();
    }
    renderAll();
  }

  function handleMapClick() {
    if (window.innerWidth > 768) {
      return;
    }

    if (elements.mobilePlaceSheet?.classList.contains('visible')) {
      clearActivePlace();
      return;
    }

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
    elements.sidebarContent?.classList.add('hidden');
    elements.sidebarFilters?.classList.add('hidden');
    syncMobileOverlay();
  }

  function syncMobileOverlay() {
    const detailVisible = elements.mobilePlaceSheet?.classList.contains('visible');
    const shouldShowCategories = !detailVisible && currentSearch.length === 0;

    toggleMobileCategories(shouldShowCategories);

    if (window.innerWidth <= 768) {
      showMobileResults(!detailVisible && currentSearch.length > 0);
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

function formatPrice(price) {
  if (price.min === 0 && price.max === 0) return 'Бесплатно';
  if (price.min === price.max) return `${price.min}₽`;
  return `${price.min}–${price.max}₽`;
}

function buildPlaceDetailMarkup(place, category) {
  const links = [];

  if (place.links?.map) {
    links.push('<a class="place-detail-link" href="' + place.links.map + '" target="_blank" rel="noreferrer">Открыть в 2GIS</a>');
  }

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

      ${links.length > 0 ? `<div class="place-detail-links">${links.join('')}</div>` : ''}

      <div class="place-detail-actions">
        <button type="button" class="place-detail-route-btn">Построить маршрут</button>
      </div>
    </article>
  `;
}
