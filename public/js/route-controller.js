export function createRouteController({ apiBaseUrl, elements, mapController }) {
  let currentRouteProfile = 'foot';
  let routeModalPlace = null;
  let routeResults = {};
  let placeViewHandlers = {
    hidePlaceView: () => {},
    restorePlaceView: () => {}
  };

  function init() {
    elements.routeModalClose?.addEventListener('click', closeRouteModal);
    elements.sidebarRouteBack?.addEventListener('click', closeRouteModal);
  }

  async function openRouteModal(place) {
    routeModalPlace = place;
    routeResults = {};
    currentRouteProfile = 'foot';
    placeViewHandlers.hidePlaceView();

    elements.routeDestinationName.textContent = place.name;
    if (elements.sidebarRouteName) {
      elements.sidebarRouteName.textContent = place.name;
    }

    setTransportsLoading();
    showRouteModal(true);

    try {
      const position = await mapController.requestUserLocation();
      mapController.updateUserLocation(position);

      const userCoords = mapController.getUserLocationCoordinates();
      const [footRoute, drivingRoute] = await Promise.allSettled([
        fetchRouteCoordinates(userCoords, place.coordinates, 'foot'),
        fetchRouteCoordinates(userCoords, place.coordinates, 'driving')
      ]);

      routeResults = {
        foot: footRoute.status === 'fulfilled' ? footRoute.value : null,
        driving: drivingRoute.status === 'fulfilled' ? drivingRoute.value : null
      };

      currentRouteProfile = getPreferredProfile(
        calculateDistance(userCoords, place.coordinates),
        routeResults
      );
      renderRouteTransports();

      if (routeResults[currentRouteProfile]) {
        mapController.drawRoute(routeResults[currentRouteProfile].coordinates, currentRouteProfile);
        mapController.fitRouteToBounds();
      }
    } catch (error) {
      console.error('Route error:', error);
      if (error.code) {
        mapController.showUserLocationError(error);
        setTransportsError(mapController.getUserLocationErrorMessage(error));
        return;
      }

      setTransportsError('Не удалось построить маршрут. Попробуйте еще раз.');
    }
  }

  function renderRouteTransports() {
    const foot = routeResults.foot;
    const driving = routeResults.driving;
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

    if (elements.routeTransports) {
      elements.routeTransports.innerHTML = transportHTML;
      elements.routeTransports.querySelectorAll('.route-transport').forEach((button) => {
        button.addEventListener('click', handleTransportClick);
      });
    }

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

      elements.sidebarRouteTransports.querySelectorAll('.sidebar-route-transport').forEach((button) => {
        button.addEventListener('click', handleTransportClick);
      });
    }
  }

  function handleTransportClick(event) {
    const profile = event.currentTarget.dataset.profile;
    if (profile === currentRouteProfile || !routeResults[profile]) {
      return;
    }

    currentRouteProfile = profile;
    renderRouteTransports();

    if (routeModalPlace) {
      fetchAndDrawRoute(profile);
    }
  }

  async function fetchAndDrawRoute(profile) {
    if (!routeModalPlace || !mapController.getUserLocationCoordinates()) {
      return;
    }

    try {
      const routeData = await fetchRouteCoordinates(
        mapController.getUserLocationCoordinates(),
        routeModalPlace.coordinates,
        profile
      );

      mapController.drawRoute(routeData.coordinates, profile);
      mapController.fitRouteToBounds();
    } catch (error) {
      console.error('Switch route error:', error);
      setTransportsError('Не удалось обновить маршрут. Попробуйте еще раз.');
    }
  }

  function closeRouteModal() {
    routeModalPlace = null;
    routeResults = {};
    showRouteModal(false);
    mapController.clearRoute();
    placeViewHandlers.restorePlaceView();
  }

  function showRouteModal(show) {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      elements.routeModal.classList.toggle('visible', show);
      toggleMobileRouteUI(show);
      return;
    }

    elements.sidebarRoutePanel.classList.toggle('active', show);
    elements.sidebarContent.classList.toggle('hidden', show);
    elements.sidebarFilters.classList.toggle('hidden', show);
    elements.sidebarPlacePanel.classList.toggle('active', false);
  }

  function toggleMobileRouteUI(show) {
    const bottomCategories = document.querySelector('.bottom-categories');
    const geolocationControl = document.querySelector('.geolocation-control');

    if (bottomCategories) {
      bottomCategories.classList.toggle('route-active', show);
    }

    if (geolocationControl) {
      geolocationControl.classList.toggle('route-active', show);
    }
  }

  function setTransportsLoading() {
    const html = `
      <div class="route-transport-loading">
        <span>Прокладываем маршрут...</span>
      </div>
    `;

    if (elements.routeTransports) {
      elements.routeTransports.innerHTML = html;
    }

    if (elements.sidebarRouteTransports) {
      elements.sidebarRouteTransports.innerHTML = html;
    }
  }

  function setTransportsError(message) {
    const html = `
      <div class="route-transport-error">
        <strong>Маршрут недоступен</strong>
        <span>${message}</span>
      </div>
    `;

    if (elements.routeTransports) {
      elements.routeTransports.innerHTML = html;
    }

    if (elements.sidebarRouteTransports) {
      elements.sidebarRouteTransports.innerHTML = html;
    }
  }

  async function fetchRouteCoordinates(fromCoordinates, toCoordinates, profile = 'foot') {
    const [fromLat, fromLng] = fromCoordinates;
    const [toLat, toLng] = toCoordinates;
    const requestUrl =
      `${apiBaseUrl}/route?from=${fromLng},${fromLat}&to=${toLng},${toLat}&profile=${profile}`;
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

  return {
    closeRouteModal,
    init,
    openRouteModal,
    setPlaceViewHandlers(handlers) {
      placeViewHandlers = {
        ...placeViewHandlers,
        ...handlers
      };
    }
  };
}

function calculateDistance(from, to) {
  const earthRadius = 6371e3;
  const fromLat = from[0] * Math.PI / 180;
  const toLat = to[0] * Math.PI / 180;
  const deltaLat = (to[0] - from[0]) * Math.PI / 180;
  const deltaLng = (to[1] - from[1]) * Math.PI / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getOptimalProfile(distance) {
  return distance < 2000 ? 'foot' : 'driving';
}

function getPreferredProfile(distance, routeResults) {
  const optimalProfile = getOptimalProfile(distance);

  if (routeResults[optimalProfile]) {
    return optimalProfile;
  }

  return routeResults.foot ? 'foot' : 'driving';
}

function formatTime(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ч ${remainingMinutes} мин`;
  }

  return `${minutes} мин`;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }

  return `${Math.round(meters)} м`;
}
