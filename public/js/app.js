import { createMapController } from './map-controller.js';
import { createPlacesController } from './places-controller.js';
import { createRouteController } from './route-controller.js';

const API_BASE_URL = '/api';

const categoriesConfig = {
  food: { emoji: '🍜', name: 'Еда', color: '#fbbf24' },
  fun: { emoji: '🎉', name: 'Досуг', color: '#8b5cf6' },
  study: { emoji: '📚', name: 'Учёба', color: '#34d399' },
  print: { emoji: '🖨️', name: 'Печать', color: '#3b82f6' },
  all: { emoji: '📍', name: 'Все', color: '#64748b' }
};

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    placesContainer: document.getElementById('placesContainer'),
    resultsDropdown: document.getElementById('resultsDropdown'),
    mobileResultsList: document.getElementById('mobileResultsList'),
    mobileResultsCount: document.getElementById('mobileResultsCount'),
    mobileSearchInput: document.getElementById('mobileSearchInput'),
    desktopSearchInput: document.getElementById('desktopSearchInput'),
    mobileClearBtn: document.getElementById('mobileClearBtn'),
    desktopClearBtn: document.getElementById('desktopClearBtn'),
    routeModal: document.getElementById('routeModal'),
    routeModalClose: document.getElementById('routeModalClose'),
    routeDestinationName: document.getElementById('routeDestinationName'),
    routeTransports: document.getElementById('routeTransports'),
    sidebarRoutePanel: document.getElementById('sidebarRoutePanel'),
    sidebarRouteBack: document.getElementById('sidebarRouteBack'),
    sidebarRouteName: document.getElementById('sidebarRouteName'),
    sidebarRouteTransports: document.getElementById('sidebarRouteTransports'),
    sidebarPlacePanel: document.getElementById('sidebarPlacePanel'),
    sidebarPlaceBack: document.getElementById('sidebarPlaceBack'),
    sidebarPlaceContent: document.getElementById('sidebarPlaceContent'),
    mobilePlaceSheet: document.getElementById('mobilePlaceSheet'),
    mobilePlaceBackdrop: document.getElementById('mobilePlaceBackdrop'),
    mobilePlaceClose: document.getElementById('mobilePlaceClose'),
    mobilePlaceContent: document.getElementById('mobilePlaceContent'),
    sidebarContent: document.getElementById('sidebarContent'),
    sidebarFilters: document.querySelector('.sidebar-filters')
  };

  let placesController;

  const mapController = createMapController({
    categoriesConfig,
    onMapClick: () => placesController?.handleMapClick(),
    onPlaceSelect: (place) => placesController?.handlePlaceSelect(place)
  });

  const routeController = createRouteController({
    apiBaseUrl: API_BASE_URL,
    elements,
    mapController
  });

  placesController = createPlacesController({
    apiBaseUrl: API_BASE_URL,
    categoriesConfig,
    elements,
    mapController,
    routeController
  });

  routeController.setPlaceViewHandlers({
    hidePlaceView: () => placesController.hidePlaceView(),
    restorePlaceView: () => placesController.restorePlaceView()
  });

  mapController.init();
  routeController.init();
  placesController.init();
});
