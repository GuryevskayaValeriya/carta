const AUTH_API_BASE = '/api/auth';
const MAX_AVATAR_FILE_SIZE = 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const authState = {
  currentUser: null,
  pendingEmail: '',
  activeView: 'login',
  profileDraft: {
    firstName: '',
    lastName: '',
    avatarData: '',
    avatarDirty: false
  }
};

const authElements = {};
let appStatusTimer = null;

window.StudentMapAuth = {
  getCurrentUser: () => authState.currentUser,
  openAuthModal: (preferredView) => openAuthModal(preferredView)
};

document.addEventListener('DOMContentLoaded', () => {
  bindAuthElements();
  setupAuthEventListeners();
  setupAccountButtonVisibility();
  hydrateCurrentUser();
});

function bindAuthElements() {
  authElements.appStatus = document.getElementById('appStatus');
  authElements.accountButton = document.getElementById('accountButton');
  authElements.accountButtonLabel = document.getElementById('accountButtonLabel');
  authElements.authModal = document.getElementById('authModal');
  authElements.authBackdrop = document.getElementById('authBackdrop');
  authElements.authClose = document.getElementById('authClose');
  authElements.authTitle = document.getElementById('authTitle');
  authElements.authSubtitle = document.getElementById('authSubtitle');
  authElements.authMessage = document.getElementById('authMessage');
  authElements.authTabs = document.querySelector('.auth-tabs');
  authElements.authViews = document.querySelectorAll('[data-auth-view]');
  authElements.authTabButtons = document.querySelectorAll('[data-auth-open-view]');
  authElements.loginForm = document.getElementById('loginForm');
  authElements.registerForm = document.getElementById('registerForm');
  authElements.verifyForm = document.getElementById('verifyForm');
  authElements.resendCodeButton = document.getElementById('resendCodeButton');
  authElements.verifyEmailInput = document.getElementById('verifyEmail');
  authElements.resultsDropdown = document.getElementById('resultsDropdown');

  authElements.sidebarContent = document.getElementById('sidebarContent');
  authElements.sidebarFilters = document.querySelector('.sidebar-filters');
  authElements.sidebarPlacePanel = document.getElementById('sidebarPlacePanel');
  authElements.sidebarRoutePanel = document.getElementById('sidebarRoutePanel');
  authElements.sidebarAccountPanel = document.getElementById('sidebarAccountPanel');
  authElements.sidebarAccountBack = document.getElementById('sidebarAccountBack');

  authElements.accountSettingsModal = document.getElementById('accountSettingsModal');
  authElements.accountSettingsBackdrop = document.getElementById('accountSettingsBackdrop');
  authElements.accountSettingsClose = document.getElementById('accountSettingsClose');

  authElements.desktopProfileEmail = document.getElementById('desktopProfileEmail');
  authElements.desktopProfileName = document.getElementById('desktopProfileName');
  authElements.desktopProfileStatus = document.getElementById('desktopProfileStatus');
  authElements.desktopProfileAvatar = document.getElementById('desktopProfileAvatar');
  authElements.mobileProfileEmail = document.getElementById('mobileProfileEmail');
  authElements.mobileProfileName = document.getElementById('mobileProfileName');
  authElements.mobileProfileStatus = document.getElementById('mobileProfileStatus');
  authElements.mobileProfileAvatar = document.getElementById('mobileProfileAvatar');

  authElements.profileForms = Array.from(document.querySelectorAll('[data-account-profile-form]'));
  authElements.profileMessages = Array.from(document.querySelectorAll('[data-profile-message]'));
  authElements.profileAvatarInputs = Array.from(document.querySelectorAll('[data-profile-avatar-input]'));
  authElements.profileAvatarStatuses = Array.from(document.querySelectorAll('[data-avatar-status]'));
  authElements.profileAvatarButtons = Array.from(document.querySelectorAll('.account-avatar-button'));
  authElements.removeAvatarButtons = Array.from(document.querySelectorAll('[data-action="remove-avatar"]'));
  authElements.desktopAdminSection = document.getElementById('desktopAdminSection');
  authElements.mobileAdminSection = document.getElementById('mobileAdminSection');
  authElements.desktopAdminLink = document.getElementById('desktopAdminLink');
  authElements.mobileAdminLink = document.getElementById('mobileAdminLink');

  authElements.desktopLogoutButton = document.getElementById('desktopLogoutButton');
  authElements.mobileLogoutButton = document.getElementById('mobileLogoutButton');
}

function setupAuthEventListeners() {
  authElements.accountButton?.addEventListener('click', handleAccountButtonClick);
  authElements.authClose?.addEventListener('click', closeAuthModal);
  authElements.authBackdrop?.addEventListener('click', closeAuthModal);
  authElements.sidebarAccountBack?.addEventListener('click', closeDesktopAccountPanel);
  authElements.accountSettingsClose?.addEventListener('click', closeMobileAccountSettings);
  authElements.accountSettingsBackdrop?.addEventListener('click', closeMobileAccountSettings);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (authElements.authModal?.classList.contains('visible')) {
      closeAuthModal();
      return;
    }

    if (authElements.accountSettingsModal?.classList.contains('visible')) {
      closeMobileAccountSettings();
      return;
    }

    if (authElements.sidebarAccountPanel?.classList.contains('active')) {
      closeDesktopAccountPanel();
    }
  });

  authElements.authTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      clearAuthMessage();
      setAuthView(button.dataset.authOpenView);
    });
  });

  authElements.loginForm?.addEventListener('submit', handleLoginSubmit);
  authElements.registerForm?.addEventListener('submit', handleRegisterSubmit);
  authElements.verifyForm?.addEventListener('submit', handleVerifySubmit);
  authElements.resendCodeButton?.addEventListener('click', handleResendCode);
  authElements.desktopLogoutButton?.addEventListener('click', handleLogout);
  authElements.mobileLogoutButton?.addEventListener('click', handleLogout);

  authElements.profileForms.forEach((form) => {
    form.addEventListener('submit', handleProfileSubmit);
    form.querySelector('[name="firstName"]')?.addEventListener('input', handleProfileFieldInput);
    form.querySelector('[name="lastName"]')?.addEventListener('input', handleProfileFieldInput);
  });

  authElements.profileAvatarInputs.forEach((input) => {
    input.addEventListener('change', handleProfileAvatarChange);
  });

  authElements.removeAvatarButtons.forEach((button) => {
    button.addEventListener('click', handleProfileAvatarRemove);
  });

  window.addEventListener('resize', handleViewportChange);
}

function setupAccountButtonVisibility() {
  updateAccountButtonVisibility();

  if (!authElements.resultsDropdown) {
    return;
  }

  const observer = new MutationObserver(() => {
    updateAccountButtonVisibility();
  });

  observer.observe(authElements.resultsDropdown, {
    attributes: true,
    attributeFilter: ['class']
  });
}

function updateAccountButtonVisibility() {
  if (!authElements.accountButton) {
    return;
  }

  const isMobile = window.innerWidth <= 768;
  const shouldHide = isMobile && authElements.resultsDropdown?.classList.contains('visible');

  authElements.accountButton.classList.toggle('search-active', Boolean(shouldHide));
}

function handleViewportChange() {
  updateAccountButtonVisibility();

  if (window.innerWidth <= 768) {
    closeDesktopAccountPanel();
    return;
  }

  closeMobileAccountSettings();
}

function handleAccountButtonClick() {
  if (!authState.currentUser) {
    openAuthModal();
    return;
  }

  if (window.innerWidth <= 768) {
    if (authElements.accountSettingsModal?.classList.contains('visible')) {
      closeMobileAccountSettings();
      return;
    }

    openMobileAccountSettings();
    return;
  }

  if (authElements.sidebarAccountPanel?.classList.contains('active')) {
    closeDesktopAccountPanel();
    return;
  }

  openDesktopAccountPanel();
}

async function hydrateCurrentUser() {
  try {
    const response = await fetch(`${AUTH_API_BASE}/me`, { credentials: 'same-origin' });
    if (!response.ok) {
      updateCurrentUser(null);
      return;
    }

    const data = await response.json();
    updateCurrentUser(data.user || null);
  } catch (error) {
    console.error('Failed to load current user:', error);
    updateCurrentUser(null);
  }
}

function updateCurrentUser(user) {
  authState.currentUser = user;

  if (user) {
    authElements.accountButton?.classList.add('authorized');
    resetProfileDraft();
    syncProfileForms();
    clearProfileMessage();
    updateRemoveAvatarButtons();
    updateAvatarStatusTexts();
    updateAdminLinksVisibility(false);
    applyProfilePresentation(createUserPresentation(user));
    syncAdminVisibility();
    dispatchAuthChange();
    return;
  }

  authElements.accountButton?.classList.remove('authorized');
  renderSignedOutButton();
  resetProfileDraft();
  syncProfileForms();
  clearProfileMessage();
  updateRemoveAvatarButtons();
  updateAvatarStatusTexts();
  updateAdminLinksVisibility(false);
  applyProfilePresentation({
    displayName: '',
    email: '',
    status: '',
    avatarData: '',
    initial: 'A'
  });
  renderSignedOutButton();
  closeDesktopAccountPanel();
  closeMobileAccountSettings();
  dispatchAuthChange();
}

function updateAdminLinksVisibility(isVisible) {
  [authElements.desktopAdminSection, authElements.mobileAdminSection].forEach((element) => {
    if (element) {
      element.hidden = !isVisible;
    }
  });
}

async function syncAdminVisibility() {
  if (!authState.currentUser) {
    updateAdminLinksVisibility(false);
    return;
  }

  try {
    const response = await fetch('/api/admin/me', {
      credentials: 'same-origin'
    });

    updateAdminLinksVisibility(response.ok);
  } catch (error) {
    updateAdminLinksVisibility(false);
  }
}

function resetProfileDraft() {
  authState.profileDraft = {
    firstName: authState.currentUser?.firstName || '',
    lastName: authState.currentUser?.lastName || '',
    avatarData: authState.currentUser?.avatarData || '',
    avatarDirty: false
  };
}

function syncProfileForms(sourceForm) {
  authElements.profileForms.forEach((form) => {
    if (sourceForm && form === sourceForm) {
      return;
    }

    const firstNameInput = form.querySelector('[name="firstName"]');
    const lastNameInput = form.querySelector('[name="lastName"]');

    if (firstNameInput) {
      firstNameInput.value = authState.profileDraft.firstName;
    }

    if (lastNameInput) {
      lastNameInput.value = authState.profileDraft.lastName;
    }
  });

  clearAvatarInputs();
  updateAvatarStatusTexts();
}

function createUserPresentation(user) {
  const displayName = [user.firstName, user.lastName]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .trim() || 'Пользователь';

  return {
    displayName,
    email: user.email || '',
    status: user.isVerified ? 'Почта подтверждена' : 'Ожидается подтверждение почты',
    avatarData: user.avatarData || '',
    initial: (displayName || user.email || 'A').slice(0, 1).toUpperCase()
  };
}

function createDraftPresentation() {
  const displayName = [authState.profileDraft.firstName, authState.profileDraft.lastName]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .trim() || 'Пользователь';

  return {
    displayName,
    email: authState.currentUser?.email || '',
    status: authState.currentUser?.isVerified ? 'Почта подтверждена' : 'Ожидается подтверждение почты',
    avatarData: getProfileAvatarData(),
    initial: (displayName || authState.currentUser?.email || 'A').slice(0, 1).toUpperCase()
  };
}

function applyProfilePresentation({ displayName, email, status, avatarData, initial }) {
  const texts = [
    [authElements.desktopProfileName, displayName],
    [authElements.mobileProfileName, displayName],
    [authElements.desktopProfileEmail, email],
    [authElements.mobileProfileEmail, email],
    [authElements.desktopProfileStatus, status],
    [authElements.mobileProfileStatus, status]
  ];

  texts.forEach(([element, value]) => {
    if (element) {
      element.textContent = value;
    }
  });

  renderAvatar(authElements.desktopProfileAvatar, avatarData, initial, 'auth-profile-image');
  renderAvatar(authElements.mobileProfileAvatar, avatarData, initial, 'auth-profile-image');
  renderAccountButton(avatarData, initial);
}

function renderAvatar(element, avatarData, initial, imageClassName) {
  if (!element) {
    return;
  }

  if (avatarData) {
    element.innerHTML = `<img src="${avatarData}" alt="" class="${imageClassName}">`;
    return;
  }

  element.textContent = initial;
}

function renderAccountButton(avatarData, initial) {
  if (!authElements.accountButtonLabel || !authElements.accountButton) {
    return;
  }

  if (avatarData) {
    authElements.accountButton.classList.add('has-avatar');
    authElements.accountButtonLabel.innerHTML = `<img src="${avatarData}" alt="" class="account-button-image">`;
    return;
  }

  authElements.accountButton.classList.remove('has-avatar');
  authElements.accountButtonLabel.textContent = initial;
}

function renderSignedOutButton() {
  if (!authElements.accountButtonLabel || !authElements.accountButton) {
    return;
  }

  authElements.accountButton.classList.remove('has-avatar');

  authElements.accountButtonLabel.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.8"/>
      <path d="M4 20C4.8 16.8 7.73333 15.2 12 15.2C16.2667 15.2 19.2 16.8 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
}

function dispatchAuthChange() {
  window.dispatchEvent(new CustomEvent('studentmap:auth-changed', {
    detail: { user: authState.currentUser }
  }));
}

function showAppStatus(message, type = 'info') {
  if (!authElements.appStatus || !message) {
    return;
  }

  authElements.appStatus.textContent = message;
  authElements.appStatus.dataset.state = type;
  authElements.appStatus.classList.add('visible');

  if (appStatusTimer) {
    window.clearTimeout(appStatusTimer);
  }

  appStatusTimer = window.setTimeout(() => {
    authElements.appStatus.classList.remove('visible');
    delete authElements.appStatus.dataset.state;
  }, 4200);
}

function showProfileMessage(message, type = 'info') {
  authElements.profileMessages.forEach((element) => {
    element.textContent = message;
    element.dataset.state = type;
    element.classList.add('visible');
  });
}

function clearProfileMessage() {
  authElements.profileMessages.forEach((element) => {
    element.textContent = '';
    element.classList.remove('visible');
    delete element.dataset.state;
  });
}

function openAuthModal(preferredView) {
  closeDesktopAccountPanel();
  closeMobileAccountSettings();
  authElements.authModal?.classList.add('visible');
  document.body.classList.add('auth-open');
  clearAuthMessage();
  setAuthView(preferredView || (authState.activeView === 'verify' ? 'verify' : authState.activeView));
}

function closeAuthModal() {
  authElements.authModal?.classList.remove('visible');
  document.body.classList.remove('auth-open');
  clearAuthMessage();
}

function prepareProfileEditor() {
  resetProfileDraft();
  syncProfileForms();
  clearProfileMessage();
  updateRemoveAvatarButtons();
  if (authState.currentUser) {
    applyProfilePresentation(createUserPresentation(authState.currentUser));
  }
}

function openDesktopAccountPanel() {
  if (!authState.currentUser || !authElements.sidebarAccountPanel) {
    return;
  }

  closeAuthModal();
  closeMobileAccountSettings();
  prepareProfileEditor();
  authElements.sidebarAccountPanel.classList.add('active');
  authElements.sidebarContent?.classList.add('hidden');
  authElements.sidebarFilters?.classList.add('hidden');
  authElements.sidebarPlacePanel?.classList.remove('active');
  authElements.sidebarRoutePanel?.classList.remove('active');
}

function closeDesktopAccountPanel() {
  if (!authElements.sidebarAccountPanel) {
    return;
  }

  authElements.sidebarAccountPanel.classList.remove('active');
  authElements.sidebarContent?.classList.remove('hidden');
  authElements.sidebarFilters?.classList.remove('hidden');
  clearProfileMessage();
  resetProfileDraft();
  syncProfileForms();
  updateRemoveAvatarButtons();
  if (authState.currentUser) {
    applyProfilePresentation(createUserPresentation(authState.currentUser));
  }
}

function openMobileAccountSettings() {
  if (!authState.currentUser) {
    return;
  }

  closeAuthModal();
  closeDesktopAccountPanel();
  prepareProfileEditor();
  authElements.accountSettingsModal?.classList.add('visible');
  document.body.classList.add('auth-open');
}

function closeMobileAccountSettings() {
  authElements.accountSettingsModal?.classList.remove('visible');
  clearProfileMessage();
  resetProfileDraft();
  syncProfileForms();
  updateRemoveAvatarButtons();

  if (authState.currentUser) {
    applyProfilePresentation(createUserPresentation(authState.currentUser));
  }

  if (!authElements.authModal?.classList.contains('visible')) {
    document.body.classList.remove('auth-open');
  }
}

function setAuthView(viewName) {
  authState.activeView = viewName;

  authElements.authViews.forEach((view) => {
    view.classList.toggle('active', view.dataset.authView === viewName);
  });

  authElements.authTabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.authOpenView === viewName);
  });

  const titles = {
    login: ['Вход в аккаунт', 'Войдите в свой аккаунт StudentMap.'],
    register: ['Регистрация', 'Создайте аккаунт и подтвердите почту кодом из письма.'],
    verify: ['Подтверждение почты', 'Введите код, который мы отправили вам на почту.']
  };

  const [title, subtitle] = titles[viewName] || titles.login;
  if (authElements.authTabs) {
    authElements.authTabs.style.display = viewName === 'login' || viewName === 'register' ? 'flex' : 'none';
  }
  if (authElements.authTitle) {
    authElements.authTitle.textContent = title;
  }
  if (authElements.authSubtitle) {
    authElements.authSubtitle.textContent = subtitle;
  }
}

function setAuthMessage(message, type = 'info') {
  if (!authElements.authMessage) {
    return;
  }

  authElements.authMessage.textContent = message;
  authElements.authMessage.dataset.state = type;
  authElements.authMessage.classList.add('visible');
}

function clearAuthMessage() {
  if (!authElements.authMessage) {
    return;
  }

  authElements.authMessage.textContent = '';
  authElements.authMessage.classList.remove('visible');
  delete authElements.authMessage.dataset.state;
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearAuthMessage();
  const form = event.currentTarget;

  const formData = new FormData(form);
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!firstName) {
    setAuthMessage('Введите имя.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    setAuthMessage('Пароли не совпадают.', 'error');
    return;
  }

  toggleFormBusy(form, true);

  try {
    const response = await fetch(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    authState.pendingEmail = email;
    if (authElements.verifyEmailInput) {
      authElements.verifyEmailInput.value = email;
    }

    form.reset();
    setAuthView('verify');
    setAuthMessage('Код подтверждения отправлен. Проверьте почту.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    toggleFormBusy(form, false);
  }
}

async function handleVerifySubmit(event) {
  event.preventDefault();
  clearAuthMessage();
  const form = event.currentTarget;

  const formData = new FormData(form);
  const email = String(formData.get('email') || authState.pendingEmail || '').trim();
  const code = String(formData.get('code') || '').trim();

  toggleFormBusy(form, true);

  try {
    const response = await fetch(`${AUTH_API_BASE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Email verification failed');
    }

    updateCurrentUser(data.user || null);
    authElements.verifyForm?.reset();
    closeAuthModal();
    setAuthView('login');
    showAppStatus('Почта подтверждена. Вы уже в аккаунте.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    toggleFormBusy(form, false);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  clearAuthMessage();
  const form = event.currentTarget;

  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  toggleFormBusy(form, true);

  try {
    const response = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    updateCurrentUser(data.user || null);
    authElements.loginForm?.reset();
    closeAuthModal();
    setAuthView('login');
    showAppStatus('Вход выполнен успешно.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    toggleFormBusy(form, false);
  }
}

function handleProfileFieldInput(event) {
  const sourceForm = event.currentTarget.form;
  authState.profileDraft.firstName = sourceForm?.querySelector('[name="firstName"]')?.value || '';
  authState.profileDraft.lastName = sourceForm?.querySelector('[name="lastName"]')?.value || '';

  syncProfileForms(sourceForm);
  updateRemoveAvatarButtons();
  updateAvatarStatusTexts();
  if (authState.currentUser) {
    applyProfilePresentation(createDraftPresentation());
  }
}

async function handleProfileAvatarChange(event) {
  const file = event.currentTarget.files && event.currentTarget.files[0];
  clearProfileMessage();

  if (!file) {
    return;
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    showProfileMessage('Поддерживаются только PNG, JPG, WEBP и GIF.', 'error');
    clearAvatarInputs();
    return;
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    showProfileMessage('Аватарка слишком большая. Выберите файл до 1 МБ.', 'error');
    clearAvatarInputs();
    return;
  }

  try {
    authState.profileDraft.avatarData = await readFileAsDataUrl(file);
    authState.profileDraft.avatarDirty = true;
    updateRemoveAvatarButtons();
    updateAvatarStatusTexts(file.name);
    if (authState.currentUser) {
      applyProfilePresentation(createDraftPresentation());
    }
    showProfileMessage('Новая аватарка выбрана. Не забудьте сохранить профиль.', 'info');
  } catch (error) {
    showProfileMessage('Не удалось загрузить аватарку. Попробуйте другой файл.', 'error');
  } finally {
    clearAvatarInputs();
  }
}

function handleProfileAvatarRemove() {
  authState.profileDraft.avatarData = '';
  authState.profileDraft.avatarDirty = true;
  updateRemoveAvatarButtons();
  updateAvatarStatusTexts();
  clearProfileMessage();

  if (authState.currentUser) {
    applyProfilePresentation(createDraftPresentation());
  }

  showProfileMessage('Аватарка будет удалена после сохранения профиля.', 'info');
}

async function handleProfileSubmit(event) {
  event.preventDefault();

  if (!authState.currentUser) {
    return;
  }

  clearProfileMessage();
  setProfileBusy(true);

  const firstName = String(authState.profileDraft.firstName || '').trim();
  const lastName = String(authState.profileDraft.lastName || '').trim();

  if (!firstName) {
    showProfileMessage('Введите имя.', 'error');
    setProfileBusy(false);
    return;
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        firstName,
        lastName,
        avatarData: getProfileAvatarData()
      })
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Маршрут обновления профиля не найден. Перезапустите сервер.');
      }

      if (response.status === 413) {
        throw new Error('Аватарка слишком большая. Выберите файл поменьше.');
      }

      throw new Error(data.error || 'Не удалось обновить профиль');
    }

    updateCurrentUser(data.user || null);
    showProfileMessage('Профиль обновлен.', 'success');
    showAppStatus('Профиль обновлен.', 'success');
  } catch (error) {
    showProfileMessage(error.message, 'error');
  } finally {
    setProfileBusy(false);
  }
}

async function handleResendCode() {
  clearAuthMessage();
  const email = authElements.verifyEmailInput?.value.trim() || authState.pendingEmail;

  if (!email) {
    setAuthMessage('Сначала укажите почту.', 'error');
    return;
  }

  authElements.resendCodeButton.disabled = true;

  try {
    const response = await fetch(`${AUTH_API_BASE}/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend verification code');
    }

    setAuthMessage('Новый код уже отправлен.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    authElements.resendCodeButton.disabled = false;
  }
}

async function handleLogout() {
  setLogoutBusy(true);

  try {
    const response = await fetch(`${AUTH_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Не удалось выйти из аккаунта');
    }

    updateCurrentUser(null);
    authState.pendingEmail = '';
    authElements.loginForm?.reset();
    authElements.registerForm?.reset();
    authElements.verifyForm?.reset();
    closeAuthModal();
    closeMobileAccountSettings();
    setAuthView('login');
    showAppStatus('Вы вышли из аккаунта.', 'success');
  } catch (error) {
    showAppStatus(error.message, 'error');
  } finally {
    setLogoutBusy(false);
  }
}

function getProfileAvatarData() {
  if (authState.profileDraft.avatarDirty) {
    return authState.profileDraft.avatarData || '';
  }

  return authState.currentUser?.avatarData || '';
}

function updateRemoveAvatarButtons() {
  const hasAvatar = Boolean(getProfileAvatarData());
  authElements.removeAvatarButtons.forEach((button) => {
    button.disabled = !hasAvatar;
  });
}

function updateAvatarStatusTexts(fileName) {
  const statusText = getAvatarStatusText(fileName);
  authElements.profileAvatarStatuses.forEach((element) => {
    element.textContent = statusText;
  });
}

function getAvatarStatusText(fileName) {
  if (fileName) {
    return `Выбрано: ${fileName}`;
  }

  return getProfileAvatarData() ? 'Фото профиля установлено' : 'Фото пока не выбрано';
}

function clearAvatarInputs() {
  authElements.profileAvatarInputs.forEach((input) => {
    input.value = '';
  });
}

function setProfileBusy(isBusy) {
  authElements.profileForms.forEach((form) => {
    form.querySelectorAll('input, button').forEach((element) => {
      element.disabled = isBusy;
    });
  });

  authElements.profileAvatarButtons.forEach((button) => {
    button.classList.toggle('is-disabled', isBusy);
  });

  if (!isBusy) {
    updateRemoveAvatarButtons();
    updateAvatarStatusTexts();
  }
}

function setLogoutBusy(isBusy) {
  [authElements.desktopLogoutButton, authElements.mobileLogoutButton].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

function toggleFormBusy(form, isBusy) {
  form.querySelectorAll('input, button').forEach((element) => {
    element.disabled = isBusy;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
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
