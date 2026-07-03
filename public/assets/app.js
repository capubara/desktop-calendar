var state = {
  user: null,
  settings: null,
  view: 'calendar',
  authMode: 'login',
  profile: 'settings',
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  events: [],
  today: [],
  search: '',
  adminData: null
};

var app = document.getElementById('app');

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
  });
}

function fmtDate(value) {
  if (!value) return '';
  return new Date(String(value).replace(' ', 'T')).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function ymd(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

async function api(action, data, method) {
  var options = { credentials: 'same-origin' };
  if (method !== 'GET') {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data || {});
  }
  var res = await fetch('/?action=' + action, options);
  var json = await res.json();
  if (!json.ok) throw new Error(json.message || 'Ошибка запроса');
  return json;
}

function setTheme() {
  var theme = state.settings ? state.settings.theme : 'light';
  document.documentElement.dataset.theme = theme;
  if (state.settings && state.settings.palette) document.documentElement.style.setProperty('--accent', state.settings.palette);
}

function notify(text, good) {
  var el = Array.from(document.querySelectorAll('[data-status]')).find(function (node) { return !node.closest('.hidden'); }) || document.querySelector('[data-status]');
  if (el) {
    el.textContent = text || '';
    el.className = 'status ' + (good ? 'good' : text ? 'bad' : '');
  }
}

async function boot() {
  try {
    var me = await api('me', null, 'GET');
    state.user = me.user;
    state.settings = me.settings;
    setTheme();
    render();
    var shareToken = new URLSearchParams(location.search).get('share');
    if (shareToken && state.user) { state.view = 'profile'; state.profile = 'share'; render(); setTimeout(function () { var input = document.getElementById('shareToken'); if (input) input.value = shareToken; }, 0); }
    if (state.user) await refreshCurrent();
  } catch (err) {
    renderAuth();
  }
}

function render() {
  if (!state.user) return renderAuth();
  setTheme();
  app.innerHTML = '<div class="app-shell">' + sidebar() + '<main class="main"><div id="screen"></div></main>' + bottomNav() + '</div>';
  bindNav();
  renderScreen();
}

function sidebar() {
  return '<aside class="sidebar"><div class="logo-row"><div class="brand-mark">F</div><div><h3>Fantasia</h3><p>' + escapeHtml(state.user.email) + '</p></div></div><nav class="nav">' + navButtons() + '</nav><button class="btn ghost" data-action="logout">Выйти</button></aside>';
}

function bottomNav() {
  return '<nav class="bottom-nav">' + navButtons(true) + '</nav>';
}

function navButtons(short) {
  var items = [['calendar', 'Календарь', '□'], ['today', 'Today', '✓'], ['profile', 'Профиль', '◎'], ['admin', 'Admin', '⚙']];
  return items.filter(function (i) { return i[0] !== 'admin' || state.user.role === 'admin'; }).map(function (i) {
    return '<button data-view="' + i[0] + '" class="' + (state.view === i[0] ? 'active' : '') + '"><span>' + i[2] + '</span><span>' + (short ? i[1].split(' ')[0] : i[1]) + '</span></button>';
  }).join('');
}

function bindNav() {
  document.querySelectorAll('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () { state.view = btn.dataset.view; render(); refreshCurrent(); });
  });
  var logout = document.querySelector('[data-action="logout"]');
  if (logout) logout.addEventListener('click', async function () { await api('logout', {}, 'POST'); state.user = null; renderAuth(); });
}

function renderAuth() {
  var isRegister = state.authMode === 'register';
  var fields = isRegister
    ? '<label>Имя<input name="name" placeholder="Иван" autocomplete="name"></label><label>Email<input name="email" type="email" placeholder="you@example.com" autocomplete="email"></label><label>Пароль<input name="password" type="password" placeholder="Минимум 6 символов" autocomplete="new-password"></label><label>Подтвердить пароль<input name="password_confirm" type="password" placeholder="Повторите пароль" autocomplete="new-password"></label>'
    : '<label>Email<input name="email" type="email" placeholder="you@example.com" autocomplete="email"></label><label>Пароль<input name="password" type="password" placeholder="Ваш пароль" autocomplete="current-password"></label><label class="checkbox"><input name="remember" type="checkbox" checked> Запомнить устройство</label>';
  app.innerHTML = '<div class="auth-shell"><section class="auth-panel"><div class="brand-mark">F</div><div><h1>Fantasia Calendar</h1><p>Календарь, ежедневник и общий доступ в одном desktop-приложении.</p></div><div class="auth-tabs"><button class="' + (!isRegister ? 'active' : '') + '" data-auth-mode="login">Вход</button><button class="' + (isRegister ? 'active' : '') + '" data-auth-mode="register">Регистрация</button></div><div class="form" id="authForm">' + fields + '<button class="btn primary" data-auth="' + (isRegister ? 'register' : 'login') + '">' + (isRegister ? 'Зарегистрироваться' : 'Войти') + '</button><p data-status class="status"></p></div><div class="form hidden" id="verifyForm"><label>Код из письма<input name="code" inputmode="numeric" placeholder="123456"></label><label>2FA-код, если включен<input name="totp" inputmode="numeric" placeholder="000000"></label><button class="btn primary" data-auth="verify">Подтвердить</button><p data-status class="status"></p></div></section><section class="auth-preview"><h2>Desktop сейчас, mobile потом</h2><p>Одна верстка перестраивается из широкой сетки календаря в компактный режим с нижней навигацией.</p><div class="preview-grid">' + Array.from({length: 35}).map(function(){ return '<span></span>'; }).join('') + '</div></section></div>';
  document.querySelectorAll('[data-auth-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.authMode = btn.dataset.authMode;
      renderAuth();
    });
  });
  document.querySelectorAll('[data-auth]').forEach(function (btn) {
    btn.addEventListener('click', function () { handleAuth(btn.dataset.auth); });
  });
}

async function handleAuth(type) {
  try {
    if (type === 'verify') {
      var vf = document.getElementById('verifyForm');
      await api('verify', readFields(vf), 'POST');
      await boot();
      return;
    }
    var form = document.getElementById('authForm');
    var payload = readFields(form);
    if (type === 'register' && payload.password !== payload.password_confirm) {
      notify('Пароли не совпадают.', false);
      return;
    }
    var remember = form.querySelector('[name="remember"]');
    payload.remember = remember ? !!remember.checked : true;
    var res = await api(type, payload, 'POST');
    document.getElementById('authForm').classList.add('hidden');
    document.getElementById('verifyForm').classList.remove('hidden');
    notify(res.message + (res.dev_code ? ' Демо-код: ' + res.dev_code : ''), true);
  } catch (err) { notify(err.message, false); }
}

function readFields(root) {
  var data = {};
  root.querySelectorAll('input, select, textarea').forEach(function (field) {
    if (!field.name) return;
    data[field.name] = field.type === 'checkbox' ? field.checked : field.value;
  });
  return data;
}

function renderScreen() {
  if (state.view === 'today') return renderToday();
  if (state.view === 'profile') return renderProfile();
  if (state.view === 'admin') return renderAdmin();
  return renderCalendar();
}

async function refreshCurrent() {
  if (!state.user) return;
  if (state.view === 'calendar') await loadEvents();
  if (state.view === 'today') await loadToday();
  if (state.view === 'admin') await loadAdmin('dashboard');
}

async function loadEvents() {
  var month = state.month.getFullYear() + '-' + String(state.month.getMonth() + 1).padStart(2, '0');
  var res = await api('events&month=' + month, null, 'GET');
  state.events = res.events;
  renderCalendar();
}

async function loadToday() {
  var res = await api('today', null, 'GET');
  state.today = res.events;
  renderToday();
}

function renderCalendar() {
  var screen = document.getElementById('screen');
  var title = state.month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  screen.innerHTML = '<div class="topbar"><div><h1>' + title + '</h1><p>Добавляйте точные события или вводите их свободным текстом.</p></div><div class="top-actions"><input class="search" id="search" placeholder="Поиск" value="' + escapeHtml(state.search) + '"><button class="icon-btn" title="Предыдущий месяц" id="prevMonth">‹</button><button class="icon-btn" title="Следующий месяц" id="nextMonth">›</button><button class="icon-btn" title="Добавить событие" id="addEvent">+</button></div></div><div class="layout-two"><section class="panel"><div class="calendar-head"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="calendar-grid" id="calendarGrid"></div></section><aside class="panel pad"><h2>Быстрое добавление</h2><p>Примеры: 10 July, 13.00, 15:00, Mam Birthday или 13-16 July, Holiday.</p><div class="form"><label>Естественный ввод<input id="quickNatural" placeholder="13-16 July, Holiday"></label><button class="btn primary" id="quickAdd">Добавить</button><p data-status class="status"></p></div></aside></div>';
  drawCalendar();
  document.getElementById('prevMonth').onclick = function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); loadEvents(); };
  document.getElementById('nextMonth').onclick = function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); loadEvents(); };
  document.getElementById('addEvent').onclick = function () { openEventModal(); };
  document.getElementById('quickAdd').onclick = async function () { await saveEvent({ natural: document.getElementById('quickNatural').value }); };
  document.getElementById('search').oninput = function (e) { state.search = e.target.value.toLowerCase(); drawCalendar(); };
}

function drawCalendar() {
  var grid = document.getElementById('calendarGrid');
  if (!grid) return;
  var first = new Date(state.month);
  var start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  var today = ymd(new Date());
  var html = '';
  for (var i = 0; i < 42; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    var key = ymd(d);
    var dayEvents = state.events.filter(function (ev) {
      var s = String(ev.starts_at).slice(0, 10), e = String(ev.ends_at).slice(0, 10);
      var ok = s <= key && e >= key;
      var q = !state.search || String(ev.title).toLowerCase().includes(state.search);
      return ok && q;
    });
    html += '<button class="day ' + (d.getMonth() !== state.month.getMonth() ? 'muted ' : '') + (key === today ? 'today' : '') + '" data-date="' + key + '"><span class="num">' + d.getDate() + '</span>' + dayEvents.slice(0, 3).map(function (ev) { return '<span class="event-pill" style="border-left-color:' + escapeHtml(ev.color || state.settings.palette) + '">' + escapeHtml(ev.title) + '</span>'; }).join('') + '</button>';
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.day').forEach(function (day) { day.onclick = function () { openEventModal({ date: day.dataset.date }); }; });
}

function openEventModal(event) {
  event = event || {};
  var html = '<div class="modal-backdrop" id="modal"><div class="modal"><div class="topbar"><h2>Событие</h2><button class="icon-btn" id="closeModal">×</button></div><div class="form"><label>Свободный ввод<input id="natural" placeholder="10 July, 13.00, 15:00, Mam Birthday"></label><label>Название<input id="title" value="' + escapeHtml(event.title || '') + '"></label><div class="form-row"><label>Дата<input id="date" type="date" value="' + escapeHtml(event.date || '') + '"></label><label>Цвет<input id="color" type="color" value="' + escapeHtml(event.color || state.settings.palette || '#e85d75') + '"></label></div><div class="form-row"><label>Начало<input id="start_time" type="time" value="09:00"></label><label>Конец<input id="end_time" type="time" value="10:00"></label></div><button class="btn primary" id="saveEvent">Сохранить</button><p data-status class="status"></p></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('saveEvent').onclick = async function () {
    await saveEvent({ natural: val('natural'), title: val('title'), date: val('date'), start_time: val('start_time'), end_time: val('end_time'), color: val('color') });
    closeModal();
  };
}

function val(id) { return document.getElementById(id).value; }
function closeModal() { var m = document.getElementById('modal'); if (m) m.remove(); }

async function saveEvent(payload) {
  try { await api('save_event', payload, 'POST'); await loadEvents(); notify('Событие сохранено.', true); }
  catch (err) { notify(err.message, false); }
}

function renderToday() {
  var screen = document.getElementById('screen');
  var list = state.today.map(function (ev) {
    return '<div class="task-row ' + (ev.completed_at ? 'done' : '') + '"><button class="check" data-toggle="' + ev.id + '" title="Отметить"></button><div><div class="task-title">' + escapeHtml(ev.title) + '</div><div class="meta">' + fmtDate(ev.starts_at) + ' - ' + fmtDate(ev.ends_at) + '</div></div></div>';
  }).join('') || '<p>На сегодня ничего не запланировано.</p>';
  screen.innerHTML = '<div class="topbar"><div><h1>Today</h1><p>Ежедневник с отметкой выполненных событий.</p></div><button class="icon-btn" id="addToday">+</button></div><section class="panel pad"><div class="today-list">' + list + '</div></section>';
  document.getElementById('addToday').onclick = function () { openEventModal({ date: ymd(new Date()) }); };
  document.querySelectorAll('[data-toggle]').forEach(function (btn) { btn.onclick = async function () { await api('toggle_event', { id: btn.dataset.toggle }, 'POST'); await loadToday(); }; });
}

function renderProfile() {
  var sections = [['settings','Настройки'],['devices','Устройства'],['privacy','Конфиденциальность'],['language','Язык'],['icon','Иконка'],['help','Помощь'],['share','Доступ']];
  var menu = sections.map(function (s) { return '<button data-profile="' + s[0] + '" class="' + (state.profile === s[0] ? 'active' : '') + '">' + s[1] + '</button>'; }).join('');
  document.getElementById('screen').innerHTML = '<div class="topbar"><div><h1>Личный кабинет</h1><p>Все модули профиля сделаны отдельными кнопками-разделами.</p></div></div><div class="profile-grid"><aside class="profile-menu">' + menu + '</aside><section class="panel pad" id="profileBody"></section></div>';
  document.querySelectorAll('[data-profile]').forEach(function (btn) { btn.onclick = function () { state.profile = btn.dataset.profile; renderProfile(); }; });
  renderProfileBody();
}

async function renderProfileBody() {
  var body = document.getElementById('profileBody');
  if (state.profile === 'settings') {
    body.innerHTML = '<h2>Настройки</h2><div class="form"><label>Тема<select id="theme"><option value="light">Светлая</option><option value="dark">Темная</option></select></label><label>Цвет календаря<input id="palette" type="color" value="' + escapeHtml(state.settings.palette) + '"></label><button class="btn primary" id="saveSettings">Сохранить</button><p data-status class="status"></p></div>';
    document.getElementById('theme').value = state.settings.theme;
    document.getElementById('saveSettings').onclick = saveSettings;
  } else if (state.profile === 'language') {
    body.innerHTML = '<h2>Язык</h2><div class="form"><select id="language"><option value="ru">Русский</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select><button class="btn primary" id="saveSettings">Сохранить</button><p data-status class="status"></p></div>';
    document.getElementById('language').value = state.settings.language;
    document.getElementById('saveSettings').onclick = saveSettings;
  } else if (state.profile === 'icon') {
    body.innerHTML = '<h2>Иконка приложения</h2><div class="form"><select id="app_icon"><option value="spark">Spark</option><option value="sun">Sun</option><option value="check">Check</option><option value="calendar">Calendar</option></select><button class="btn primary" id="saveSettings">Сохранить</button><p data-status class="status"></p></div>';
    document.getElementById('app_icon').value = state.settings.app_icon;
    document.getElementById('saveSettings').onclick = saveSettings;
  } else if (state.profile === 'devices') {
    var res = await api('devices', null, 'GET');
    body.innerHTML = '<h2>Устройства</h2><p>Отключить можно первое устройство или устройство, добавленное больше года назад.</p><div class="plain-list">' + res.devices.map(function (d) { return '<div class="list-row"><strong>' + escapeHtml(d.device_name) + '</strong><span class="meta">Первый вход: ' + escapeHtml(d.first_seen) + '<br>Последний вход: ' + escapeHtml(d.last_seen) + (d.revoked_at ? '<br>Отключено: ' + escapeHtml(d.revoked_at) : '') + '</span><button class="btn danger" data-revoke="' + d.id + '">Отключить</button></div>'; }).join('') + '</div><p data-status class="status"></p>';
    document.querySelectorAll('[data-revoke]').forEach(function (btn) { btn.onclick = async function () { try { await api('revoke_device', { id: btn.dataset.revoke }, 'POST'); renderProfileBody(); } catch (e) { notify(e.message, false); } }; });
  } else if (state.profile === 'privacy') {
    body.innerHTML = '<h2>Конфиденциальность</h2><div class="form"><label>Новый пароль<input id="newPassword" type="password"></label><button class="btn" id="changePassword">Изменить пароль</button><button class="btn" id="prepare2fa">Настроить 2FA</button><button class="btn danger" id="disable2fa">Отключить 2FA</button><div id="twofaBox"></div><p data-status class="status"></p></div>';
    document.getElementById('changePassword').onclick = async function () { try { await api('change_password', { password: val('newPassword') }, 'POST'); notify('Пароль изменен.', true); } catch(e){ notify(e.message, false); } };
    document.getElementById('prepare2fa').onclick = async function () { var res = await api('twofa_prepare', {}, 'POST'); document.getElementById('twofaBox').innerHTML = '<p>Секрет для Google Authenticator: <strong>' + escapeHtml(res.secret) + '</strong></p><p class="meta">Демо-код сейчас: ' + escapeHtml(res.current_code) + '</p><label>Код из приложения<input id="totp"></label><button class="btn primary" id="enable2fa">Включить</button>'; document.getElementById('enable2fa').onclick = async function(){ await api('twofa_enable', { totp: val('totp') }, 'POST'); notify('2FA включена.', true); }; };
    document.getElementById('disable2fa').onclick = async function () { await api('twofa_disable', {}, 'POST'); notify('2FA отключена.', true); };
  } else if (state.profile === 'help') {
    body.innerHTML = '<h2>Помощь</h2><div class="form"><label>Тема<input id="subject"></label><label>Сообщение<textarea id="message"></textarea></label><button class="btn primary" id="sendSupport">Отправить</button><p data-status class="status"></p></div>';
    document.getElementById('sendSupport').onclick = async function () { await api('support', { subject: val('subject'), message: val('message') }, 'POST'); notify('Обращение отправлено.', true); };
  } else if (state.profile === 'share') {
    var shares = await api('shares', null, 'GET');
    body.innerHTML = '<h2>Доступ к календарю</h2><div class="form"><label>Email пользователя<input id="shareEmail" type="email"></label><button class="btn primary" id="sendInvite">Пригласить</button><label>Принять приглашение по токену<input id="shareToken"></label><button class="btn" id="acceptShare">Принять</button><p data-status class="status"></p></div><div class="plain-list">' + shares.shares.map(function (s) { return '<div class="list-row"><strong>' + escapeHtml(s.invitee_email) + '</strong><span class="meta">Статус: ' + escapeHtml(s.status) + '<br>Токен: ' + escapeHtml(s.token) + '</span></div>'; }).join('') + '</div>';
    document.getElementById('sendInvite').onclick = async function () { var res = await api('share_invite', { email: val('shareEmail') }, 'POST'); notify('Токен приглашения: ' + res.token, true); };
    document.getElementById('acceptShare').onclick = async function () { await api('share_accept', { token: val('shareToken') }, 'POST'); notify('Доступ принят.', true); };
  }
}

async function saveSettings() {
  var payload = Object.assign({}, state.settings);
  ['theme','palette','language','app_icon'].forEach(function (id) { var el = document.getElementById(id); if (el) payload[id] = el.value; });
  var res = await api('settings', payload, 'POST');
  state.settings = res.settings;
  setTheme();
  notify('Настройки сохранены.', true);
}

async function loadAdmin(kind) {
  var action = 'admin_' + kind;
  state.adminData = await api(action, null, 'GET');
  renderAdmin(kind);
}

function renderAdmin(kind) {
  kind = kind || 'dashboard';
  var tabs = [['dashboard','Сводка'],['users','Пользователи'],['events','События'],['shares','Доступ'],['support','Поддержка'],['logs','Логи']];
  document.getElementById('screen').innerHTML = '<div class="topbar"><div><h1>Admin</h1><p>Панель администратора для управления данными проекта.</p></div></div><div class="top-actions">' + tabs.map(function (t) { return '<button class="btn ' + (kind === t[0] ? 'primary' : '') + '" data-admin="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><section class="panel pad" id="adminBody"></section>';
  document.querySelectorAll('[data-admin]').forEach(function (btn) { btn.onclick = function () { loadAdmin(btn.dataset.admin); }; });
  var body = document.getElementById('adminBody');
  if (!state.adminData) { body.innerHTML = '<p>Загрузка...</p>'; loadAdmin(kind); return; }
  if (kind === 'dashboard') {
    var s = state.adminData.stats || {};
    body.innerHTML = '<div class="plain-list"><div class="list-row"><strong>Пользователи</strong><span>' + (s.users || 0) + '</span></div><div class="list-row"><strong>События</strong><span>' + (s.events || 0) + '</span></div><div class="list-row"><strong>Приглашения</strong><span>' + (s.shares || 0) + '</span></div><div class="list-row"><strong>Новые обращения</strong><span>' + (s.support || 0) + '</span></div></div>';
  } else {
    var key = kind === 'support' ? 'requests' : kind;
    body.innerHTML = tableFor(state.adminData[key] || []);
  }
}

function tableFor(rows) {
  if (!rows.length) return '<p>Данных пока нет.</p>';
  var cols = Object.keys(rows[0]);
  return '<div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th>' + escapeHtml(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + escapeHtml(r[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}

boot();
