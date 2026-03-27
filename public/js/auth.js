const AUTH_API_BASE = '/api/auth';

const authState = {
  currentUser: null,
  pendingEmail: '',
  activeView: 'login'
};

const authElements = {};

document.addEventListener('DOMContentLoaded', () => {
  bindAuthElements();
  setupAuthEventListeners();
  setupAccountButtonVisibility();
  hydrateCurrentUser();
});

function bindAuthElements() {
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
  authElements.profileEmail = document.getElementById('profileEmail');
  authElements.profileStatus = document.getElementById('profileStatus');
  authElements.profileAvatar = document.getElementById('profileAvatar');
  authElements.resendCodeButton = document.getElementById('resendCodeButton');
  authElements.logoutButton = document.getElementById('logoutButton');
  authElements.verifyEmailInput = document.getElementById('verifyEmail');
  authElements.resultsDropdown = document.getElementById('resultsDropdown');
}

function setupAuthEventListeners() {
  authElements.accountButton?.addEventListener('click', openAuthModal);
  authElements.authClose?.addEventListener('click', closeAuthModal);
  authElements.authBackdrop?.addEventListener('click', closeAuthModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && authElements.authModal?.classList.contains('visible')) {
      closeAuthModal();
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
  authElements.logoutButton?.addEventListener('click', handleLogout);
  window.addEventListener('resize', updateAccountButtonVisibility);
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
  const shouldHide =
    isMobile && authElements.resultsDropdown?.classList.contains('visible');

  authElements.accountButton.classList.toggle('search-active', Boolean(shouldHide));
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
    if (authElements.accountButtonLabel) {
      authElements.accountButtonLabel.textContent = user.email.slice(0, 1).toUpperCase();
    }
    if (authElements.profileEmail) {
      authElements.profileEmail.textContent = user.email;
    }
    if (authElements.profileStatus) {
      authElements.profileStatus.textContent = user.isVerified
        ? 'Почта подтверждена'
        : 'Ожидается подтверждение почты';
    }
    if (authElements.profileAvatar) {
      authElements.profileAvatar.textContent = user.email.slice(0, 1).toUpperCase();
    }
    return;
  }

  authElements.accountButton?.classList.remove('authorized');
  if (authElements.accountButtonLabel) {
    authElements.accountButtonLabel.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M4 20C4.8 16.8 7.73333 15.2 12 15.2C16.2667 15.2 19.2 16.8 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }
}

function openAuthModal() {
  authElements.authModal?.classList.add('visible');
  document.body.classList.add('auth-open');
  clearAuthMessage();
  setAuthView(authState.currentUser ? 'profile' : authState.activeView);
}

function closeAuthModal() {
  authElements.authModal?.classList.remove('visible');
  document.body.classList.remove('auth-open');
  clearAuthMessage();
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
    verify: ['Подтверждение почты', 'Введите код, который мы отправили вам на почту.'],
    profile: ['Ваш аккаунт', 'Вы вошли в аккаунт и можете продолжать пользоваться картой.']
  };

  const [title, subtitle] = titles[viewName] || titles.login;
  if (authElements.authTabs) {
    authElements.authTabs.style.display =
      viewName === 'login' || viewName === 'register' ? 'flex' : 'none';
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
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

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
      body: JSON.stringify({ email, password })
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
    setAuthView('profile');
    setAuthMessage('Почта подтверждена. Вы вошли в аккаунт.', 'success');
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
    setAuthView('profile');
    setAuthMessage('Вход выполнен успешно.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    toggleFormBusy(form, false);
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
  clearAuthMessage();
  authElements.logoutButton.disabled = true;

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
    setAuthView('login');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    authElements.logoutButton.disabled = false;
  }
}

function toggleFormBusy(form, isBusy) {
  form.querySelectorAll('input, button').forEach((element) => {
    element.disabled = isBusy;
  });
}
