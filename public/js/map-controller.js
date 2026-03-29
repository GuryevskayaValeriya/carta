export function createMapController({ categoriesConfig, onMapClick, onPlaceSelect }) {
  let map = null;
  let markers = [];
  let routeLayer = null;
  let userLocationMarker = null;
  let userLocationCoordinates = null;

  function init() {
    const mapCenter = [57.1522, 65.5415];

    map = L.map('map', {
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      attributionControl: false
    }).setView(mapCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    addGeolocationControl();

    map.on('click', () => {
      onMapClick?.();
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

  function updateMarkers(places, activePlaceId) {
    markers.forEach(({ marker }) => map.removeLayer(marker));
    markers = [];

    places.forEach((place) => {
      const category = categoriesConfig[place.category] || categoriesConfig.all;
      const isActive = activePlaceId === place.id;
      const markerSize = isActive ? 44 : 36;
      const markerIcon = isActive ? 22 : 18;
      const markerBorder = isActive ? '3px solid #0f172a' : '3px solid white';
      const markerShadow = isActive
        ? '0 0 0 4px rgba(15, 23, 42, 0.22), 0 10px 20px rgba(0,0,0,0.28)'
        : '0 4px 12px rgba(0,0,0,0.3)';

      const icon = L.divIcon({
        html: `<div style="
          background: ${category.color};
          color: white;
          width: ${markerSize}px;
          height: ${markerSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${markerIcon}px;
          box-shadow: ${markerShadow};
          border: ${markerBorder};
          transition: transform 0.2s;
        ">${category.emoji}</div>`,
        className: 'custom-marker-icon',
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
      });

      const marker = L.marker(place.coordinates, { icon }).addTo(map);

      marker.on('click', () => {
        onPlaceSelect?.(place);
      });

      markers.push({ placeId: place.id, marker });
    });
  }

  function setView(coordinates, zoom) {
    map.setView(coordinates, zoom);
  }

  function drawRoute(routeCoordinates, profile = 'foot') {
    clearRoute();

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

  function fitRouteToBounds() {
    if (!routeLayer) {
      return;
    }

    map.fitBounds(routeLayer.getBounds(), { padding: [48, 48] });
  }

  function clearRoute() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
  }

  function getUserLocationCoordinates() {
    return userLocationCoordinates;
  }

  return {
    clearRoute,
    drawRoute,
    fitRouteToBounds,
    getUserLocationCoordinates,
    init,
    requestUserLocation,
    setView,
    showUserLocationError,
    updateMarkers,
    updateUserLocation
  };
}
