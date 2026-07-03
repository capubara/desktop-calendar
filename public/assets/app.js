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

var locales = {
  ru: 'ru-RU',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR'
};

var i18n = {
  en: {
    'Календарь': 'Calendar',
    'Профиль': 'Profile',
    'Выйти': 'Log out',
    'Календарь, ежедневник и общий доступ в одном desktop-приложении.': 'Calendar, daily planner and shared access in one desktop app.',
    'Вход': 'Sign in',
    'Регистрация': 'Sign up',
    'Имя': 'Name',
    'Иван': 'John',
    'Пароль': 'Password',
    'Минимум 6 символов': 'At least 6 characters',
    'Подтвердить пароль': 'Confirm password',
    'Повторите пароль': 'Repeat password',
    'Ваш пароль': 'Your password',
    'Запомнить устройство': 'Remember this device',
    'Зарегистрироваться': 'Create account',
    'Войти': 'Sign in',
    'Код из письма': 'Email code',
    '2FA-код, если включен': '2FA code, if enabled',
    'Подтвердить': 'Confirm',
    'Desktop сейчас, mobile потом': 'Desktop now, mobile later',
    'Одна верстка перестраивается из широкой сетки календаря в компактный режим с нижней навигацией.': 'One layout adapts from a wide calendar grid to a compact mode with bottom navigation.',
    'Добавляйте точные события или вводите их свободным текстом.': 'Add exact events or type them as natural text.',
    'Поиск': 'Search',
    'Предыдущий месяц': 'Previous month',
    'Следующий месяц': 'Next month',
    'Быстрое добавление': 'Quick add',
    'Примеры: 10 July, 13.00, 15:00, Mam Birthday или 13-16 July, Holiday.': 'Examples: 10 July, 13.00, 15:00, Mom Birthday or 13-16 July, Holiday.',
    'Естественный ввод': 'Natural input',
    'Добавить': 'Add',
    'Пн': 'Mon',
    'Вт': 'Tue',
    'Ср': 'Wed',
    'Чт': 'Thu',
    'Пт': 'Fri',
    'Сб': 'Sat',
    'Вс': 'Sun',
    'Что добавить?': 'What to add?',
    'В этом дне уже есть мероприятия. Выберите, что хотите добавить.': 'This day already has events. Choose what you want to add.',
    'Событие': 'Event',
    'Заметку': 'Note',
    'Выберите мероприятие': 'Choose an event',
    'Редактирование события': 'Edit event',
    'Свободный ввод': 'Natural input',
    'Название': 'Title',
    'Дата': 'Date',
    'Цвет': 'Color',
    'Начало': 'Start',
    'Конец': 'End',
    'Сохранить': 'Save',
    'Удалить событие': 'Delete event',
    'Удалить событие?': 'Delete event?',
    'Выбранный день:': 'Selected day:',
    'Будет удалено только выбранное мероприятие или выбранный день многодневного мероприятия. Его заметки удалятся только при полном удалении события.': 'Only the selected event or selected day of a multi-day event will be deleted. Notes are deleted only when the whole event is deleted.',
    'Отмена': 'Cancel',
    'Удалить': 'Delete',
    'Заметки': 'Notes',
    'Загрузка...': 'Loading...',
    'Обновлено:': 'Updated:',
    'Новая заметка': 'New note',
    'Что важно помнить об этом мероприятии?': 'What is important to remember about this event?',
    'Изменить': 'Edit',
    'Заметок пока нет.': 'No notes yet.',
    'На сегодня ничего не запланировано.': 'Nothing planned for today.',
    'Ежедневник с отметкой выполненных событий.': 'Daily planner with completion marks.',
    'Отметить': 'Mark done',
    'Личный кабинет': 'Account',
    'Все модули профиля сделаны отдельными кнопками-разделами.': 'All profile modules are separate section buttons.',
    'Настройки': 'Settings',
    'Устройства': 'Devices',
    'Конфиденциальность': 'Privacy',
    'Язык': 'Language',
    'Иконка': 'Icon',
    'Помощь': 'Help',
    'Доступ': 'Sharing',
    'Тема': 'Theme',
    'Светлая': 'Light',
    'Темная': 'Dark',
    'Цвет календаря': 'Calendar color',
    'Русский': 'Russian',
    'Иконка приложения': 'App icon',
    'Отключить можно первое устройство или устройство, добавленное больше года назад.': 'You can revoke the first device or a device added more than a year ago.',
    'Первый вход:': 'First seen:',
    'Последний вход:': 'Last seen:',
    'Отключено:': 'Revoked:',
    'Отключить': 'Revoke',
    'Новый пароль': 'New password',
    'Изменить пароль': 'Change password',
    'Настроить 2FA': 'Set up 2FA',
    'Отключить 2FA': 'Disable 2FA',
    'Тема обращения': 'Subject',
    'Сообщение': 'Message',
    'Отправить': 'Send',
    'Доступ к календарю': 'Calendar sharing',
    'Email пользователя': 'User email',
    'Пригласить': 'Invite',
    'Принять приглашение по токену': 'Accept invitation by token',
    'Принять': 'Accept',
    'Статус:': 'Status:',
    'Токен:': 'Token:',
    'Панель администратора для управления данными проекта.': 'Admin panel for managing project data.',
    'Сводка': 'Summary',
    'Пользователи': 'Users',
    'События': 'Events',
    'Приглашения': 'Invites',
    'Поддержка': 'Support',
    'Логи': 'Logs',
    'Новые обращения': 'New requests',
    'Данных пока нет.': 'No data yet.',
    'Пароли не совпадают.': 'Passwords do not match.',
    'Событие сохранено.': 'Event saved.',
    'Событие удалено.': 'Event deleted.',
    'Настройки сохранены.': 'Settings saved.',
    'Пароль изменен.': 'Password changed.',
    '2FA включена.': '2FA enabled.',
    '2FA отключена.': '2FA disabled.',
    'Обращение отправлено.': 'Support request sent.',
    'Доступ принят.': 'Access accepted.',
    'Демо-код:': 'Demo code:'
    ,
    'Код подтверждения отправлен.': 'Confirmation code sent.',
    'Введите код из почты.': 'Enter the email code.',
    'Вы вошли в аккаунт.': 'You are signed in.',
    'Неверная почта или пароль.': 'Wrong email or password.',
    'Код не подошел или устарел.': 'The code is incorrect or expired.',
    'Введите имя, корректную почту и пароль от 6 символов.': 'Enter a name, a valid email and a password of at least 6 characters.',
    'Пользователь с такой почтой уже существует.': 'A user with this email already exists.'
  },
  de: {
    'Календарь': 'Kalender',
    'Профиль': 'Profil',
    'Выйти': 'Abmelden',
    'Календарь, ежедневник и общий доступ в одном desktop-приложении.': 'Kalender, Tagesplaner und Freigabe in einer Desktop-App.',
    'Вход': 'Anmelden',
    'Регистрация': 'Registrieren',
    'Имя': 'Name',
    'Иван': 'Max',
    'Пароль': 'Passwort',
    'Минимум 6 символов': 'Mindestens 6 Zeichen',
    'Подтвердить пароль': 'Passwort bestätigen',
    'Повторите пароль': 'Passwort wiederholen',
    'Ваш пароль': 'Ihr Passwort',
    'Запомнить устройство': 'Gerät merken',
    'Зарегистрироваться': 'Konto erstellen',
    'Войти': 'Anmelden',
    'Код из письма': 'E-Mail-Code',
    '2FA-код, если включен': '2FA-Code, falls aktiviert',
    'Подтвердить': 'Bestätigen',
    'Desktop сейчас, mobile потом': 'Desktop jetzt, mobil später',
    'Одна верстка перестраивается из широкой сетки календаря в компактный режим с нижней навигацией.': 'Ein Layout passt sich vom breiten Kalender zur kompakten Ansicht mit unterer Navigation an.',
    'Добавляйте точные события или вводите их свободным текстом.': 'Fügen Sie genaue Termine hinzu oder geben Sie sie frei ein.',
    'Поиск': 'Suche',
    'Предыдущий месяц': 'Vorheriger Monat',
    'Следующий месяц': 'Nächster Monat',
    'Быстрое добавление': 'Schnell hinzufügen',
    'Примеры: 10 July, 13.00, 15:00, Mam Birthday или 13-16 July, Holiday.': 'Beispiele: 10 July, 13.00, 15:00, Mom Birthday oder 13-16 July, Holiday.',
    'Естественный ввод': 'Natürliche Eingabe',
    'Добавить': 'Hinzufügen',
    'Пн': 'Mo',
    'Вт': 'Di',
    'Ср': 'Mi',
    'Чт': 'Do',
    'Пт': 'Fr',
    'Сб': 'Sa',
    'Вс': 'So',
    'Что добавить?': 'Was hinzufügen?',
    'В этом дне уже есть мероприятия. Выберите, что хотите добавить.': 'An diesem Tag gibt es bereits Termine. Wählen Sie, was Sie hinzufügen möchten.',
    'Событие': 'Termin',
    'Заметку': 'Notiz',
    'Выберите мероприятие': 'Termin wählen',
    'Редактирование события': 'Termin bearbeiten',
    'Свободный ввод': 'Freie Eingabe',
    'Название': 'Titel',
    'Дата': 'Datum',
    'Цвет': 'Farbe',
    'Начало': 'Start',
    'Конец': 'Ende',
    'Сохранить': 'Speichern',
    'Удалить событие': 'Termin löschen',
    'Удалить событие?': 'Termin löschen?',
    'Выбранный день:': 'Gewählter Tag:',
    'Будет удалено только выбранное мероприятие или выбранный день многодневного мероприятия. Его заметки удалятся только при полном удалении события.': 'Nur der gewählte Termin oder Tag eines mehrtägigen Termins wird gelöscht. Notizen werden nur beim vollständigen Löschen entfernt.',
    'Отмена': 'Abbrechen',
    'Удалить': 'Löschen',
    'Заметки': 'Notizen',
    'Загрузка...': 'Laden...',
    'Обновлено:': 'Aktualisiert:',
    'Новая заметка': 'Neue Notiz',
    'Что важно помнить об этом мероприятии?': 'Was ist bei diesem Termin wichtig?',
    'Изменить': 'Ändern',
    'Заметок пока нет.': 'Noch keine Notizen.',
    'На сегодня ничего не запланировано.': 'Für heute ist nichts geplant.',
    'Ежедневник с отметкой выполненных событий.': 'Tagesplaner mit Erledigt-Markierungen.',
    'Отметить': 'Markieren',
    'Личный кабинет': 'Konto',
    'Все модули профиля сделаны отдельными кнопками-разделами.': 'Alle Profilmodule sind eigene Bereiche.',
    'Настройки': 'Einstellungen',
    'Устройства': 'Geräte',
    'Конфиденциальность': 'Datenschutz',
    'Язык': 'Sprache',
    'Иконка': 'Symbol',
    'Помощь': 'Hilfe',
    'Доступ': 'Freigabe',
    'Тема': 'Design',
    'Светлая': 'Hell',
    'Темная': 'Dunkel',
    'Цвет календаря': 'Kalenderfarbe',
    'Русский': 'Russisch',
    'Иконка приложения': 'App-Symbol',
    'Отключить можно первое устройство или устройство, добавленное больше года назад.': 'Sie können das erste Gerät oder ein Gerät löschen, das vor über einem Jahr hinzugefügt wurde.',
    'Первый вход:': 'Erster Login:',
    'Последний вход:': 'Letzter Login:',
    'Отключено:': 'Deaktiviert:',
    'Отключить': 'Deaktivieren',
    'Новый пароль': 'Neues Passwort',
    'Изменить пароль': 'Passwort ändern',
    'Настроить 2FA': '2FA einrichten',
    'Отключить 2FA': '2FA deaktivieren',
    'Тема обращения': 'Betreff',
    'Сообщение': 'Nachricht',
    'Отправить': 'Senden',
    'Доступ к календарю': 'Kalenderfreigabe',
    'Email пользователя': 'Benutzer-E-Mail',
    'Пригласить': 'Einladen',
    'Принять приглашение по токену': 'Einladung per Token annehmen',
    'Принять': 'Annehmen',
    'Статус:': 'Status:',
    'Токен:': 'Token:',
    'Панель администратора для управления данными проекта.': 'Adminbereich zur Verwaltung der Projektdaten.',
    'Сводка': 'Übersicht',
    'Пользователи': 'Benutzer',
    'События': 'Termine',
    'Приглашения': 'Einladungen',
    'Поддержка': 'Support',
    'Логи': 'Logs',
    'Новые обращения': 'Neue Anfragen',
    'Данных пока нет.': 'Noch keine Daten.',
    'Пароли не совпадают.': 'Passwörter stimmen nicht überein.',
    'Событие сохранено.': 'Termin gespeichert.',
    'Событие удалено.': 'Termin gelöscht.',
    'Настройки сохранены.': 'Einstellungen gespeichert.',
    'Пароль изменен.': 'Passwort geändert.',
    '2FA включена.': '2FA aktiviert.',
    '2FA отключена.': '2FA deaktiviert.',
    'Обращение отправлено.': 'Anfrage gesendet.',
    'Доступ принят.': 'Zugriff angenommen.',
    'Демо-код:': 'Demo-Code:'
    ,
    'Код подтверждения отправлен.': 'Bestätigungscode gesendet.',
    'Введите код из почты.': 'Geben Sie den E-Mail-Code ein.',
    'Вы вошли в аккаунт.': 'Sie sind angemeldet.',
    'Неверная почта или пароль.': 'Falsche E-Mail oder falsches Passwort.',
    'Код не подошел или устарел.': 'Der Code ist falsch oder abgelaufen.',
    'Введите имя, корректную почту и пароль от 6 символов.': 'Geben Sie Name, gültige E-Mail und ein Passwort ab 6 Zeichen ein.',
    'Пользователь с такой почтой уже существует.': 'Ein Benutzer mit dieser E-Mail existiert bereits.'
  },
  fr: {
    'Календарь': 'Calendrier',
    'Профиль': 'Profil',
    'Выйти': 'Se déconnecter',
    'Календарь, ежедневник и общий доступ в одном desktop-приложении.': 'Calendrier, agenda quotidien et partage dans une application de bureau.',
    'Вход': 'Connexion',
    'Регистрация': 'Inscription',
    'Имя': 'Nom',
    'Иван': 'Jean',
    'Пароль': 'Mot de passe',
    'Минимум 6 символов': 'Au moins 6 caractères',
    'Подтвердить пароль': 'Confirmer le mot de passe',
    'Повторите пароль': 'Répétez le mot de passe',
    'Ваш пароль': 'Votre mot de passe',
    'Запомнить устройство': 'Mémoriser cet appareil',
    'Зарегистрироваться': 'Créer un compte',
    'Войти': 'Se connecter',
    'Код из письма': 'Code e-mail',
    '2FA-код, если включен': 'Code 2FA, si activé',
    'Подтвердить': 'Confirmer',
    'Desktop сейчас, mobile потом': 'Bureau maintenant, mobile ensuite',
    'Одна верстка перестраивается из широкой сетки календаря в компактный режим с нижней навигацией.': 'La même interface passe du calendrier large au mode compact avec navigation inférieure.',
    'Добавляйте точные события или вводите их свободным текстом.': 'Ajoutez des événements précis ou saisissez-les en texte libre.',
    'Поиск': 'Recherche',
    'Предыдущий месяц': 'Mois précédent',
    'Следующий месяц': 'Mois suivant',
    'Быстрое добавление': 'Ajout rapide',
    'Примеры: 10 July, 13.00, 15:00, Mam Birthday или 13-16 July, Holiday.': 'Exemples : 10 July, 13.00, 15:00, Mom Birthday ou 13-16 July, Holiday.',
    'Естественный ввод': 'Saisie naturelle',
    'Добавить': 'Ajouter',
    'Пн': 'Lun',
    'Вт': 'Mar',
    'Ср': 'Mer',
    'Чт': 'Jeu',
    'Пт': 'Ven',
    'Сб': 'Sam',
    'Вс': 'Dim',
    'Что добавить?': 'Que voulez-vous ajouter ?',
    'В этом дне уже есть мероприятия. Выберите, что хотите добавить.': 'Cette journée contient déjà des événements. Choisissez quoi ajouter.',
    'Событие': 'Événement',
    'Заметку': 'Note',
    'Выберите мероприятие': 'Choisir un événement',
    'Редактирование события': 'Modifier l’événement',
    'Свободный ввод': 'Saisie libre',
    'Название': 'Titre',
    'Дата': 'Date',
    'Цвет': 'Couleur',
    'Начало': 'Début',
    'Конец': 'Fin',
    'Сохранить': 'Enregistrer',
    'Удалить событие': 'Supprimer l’événement',
    'Удалить событие?': 'Supprimer l’événement ?',
    'Выбранный день:': 'Jour choisi :',
    'Будет удалено только выбранное мероприятие или выбранный день многодневного мероприятия. Его заметки удалятся только при полном удалении события.': 'Seul l’événement choisi ou le jour choisi d’un événement sur plusieurs jours sera supprimé. Les notes ne sont supprimées qu’avec l’événement complet.',
    'Отмена': 'Annuler',
    'Удалить': 'Supprimer',
    'Заметки': 'Notes',
    'Загрузка...': 'Chargement...',
    'Обновлено:': 'Mis à jour :',
    'Новая заметка': 'Nouvelle note',
    'Что важно помнить об этом мероприятии?': 'Que faut-il retenir pour cet événement ?',
    'Изменить': 'Modifier',
    'Заметок пока нет.': 'Aucune note pour le moment.',
    'На сегодня ничего не запланировано.': 'Rien de prévu aujourd’hui.',
    'Ежедневник с отметкой выполненных событий.': 'Agenda quotidien avec événements terminés.',
    'Отметить': 'Marquer',
    'Личный кабинет': 'Compte',
    'Все модули профиля сделаны отдельными кнопками-разделами.': 'Tous les modules du profil sont des sections séparées.',
    'Настройки': 'Paramètres',
    'Устройства': 'Appareils',
    'Конфиденциальность': 'Confidentialité',
    'Язык': 'Langue',
    'Иконка': 'Icône',
    'Помощь': 'Aide',
    'Доступ': 'Partage',
    'Тема': 'Thème',
    'Светлая': 'Clair',
    'Темная': 'Sombre',
    'Цвет календаря': 'Couleur du calendrier',
    'Русский': 'Russe',
    'Иконка приложения': 'Icône de l’application',
    'Отключить можно первое устройство или устройство, добавленное больше года назад.': 'Vous pouvez désactiver le premier appareil ou un appareil ajouté il y a plus d’un an.',
    'Первый вход:': 'Première connexion :',
    'Последний вход:': 'Dernière connexion :',
    'Отключено:': 'Désactivé :',
    'Отключить': 'Désactiver',
    'Новый пароль': 'Nouveau mot de passe',
    'Изменить пароль': 'Changer le mot de passe',
    'Настроить 2FA': 'Configurer 2FA',
    'Отключить 2FA': 'Désactiver 2FA',
    'Тема обращения': 'Sujet',
    'Сообщение': 'Message',
    'Отправить': 'Envoyer',
    'Доступ к календарю': 'Partage du calendrier',
    'Email пользователя': 'E-mail utilisateur',
    'Пригласить': 'Inviter',
    'Принять приглашение по токену': 'Accepter l’invitation par jeton',
    'Принять': 'Accepter',
    'Статус:': 'Statut :',
    'Токен:': 'Jeton :',
    'Панель администратора для управления данными проекта.': 'Panneau d’administration des données du projet.',
    'Сводка': 'Résumé',
    'Пользователи': 'Utilisateurs',
    'События': 'Événements',
    'Приглашения': 'Invitations',
    'Поддержка': 'Support',
    'Логи': 'Journaux',
    'Новые обращения': 'Nouvelles demandes',
    'Данных пока нет.': 'Aucune donnée pour le moment.',
    'Пароли не совпадают.': 'Les mots de passe ne correspondent pas.',
    'Событие сохранено.': 'Événement enregistré.',
    'Событие удалено.': 'Événement supprimé.',
    'Настройки сохранены.': 'Paramètres enregistrés.',
    'Пароль изменен.': 'Mot de passe modifié.',
    '2FA включена.': '2FA activée.',
    '2FA отключена.': '2FA désactivée.',
    'Обращение отправлено.': 'Demande envoyée.',
    'Доступ принят.': 'Accès accepté.',
    'Демо-код:': 'Code démo :'
    ,
    'Код подтверждения отправлен.': 'Code de confirmation envoyé.',
    'Введите код из почты.': 'Saisissez le code reçu par e-mail.',
    'Вы вошли в аккаунт.': 'Vous êtes connecté.',
    'Неверная почта или пароль.': 'E-mail ou mot de passe incorrect.',
    'Код не подошел или устарел.': 'Le code est incorrect ou expiré.',
    'Введите имя, корректную почту и пароль от 6 символов.': 'Saisissez un nom, un e-mail valide et un mot de passe d’au moins 6 caractères.',
    'Пользователь с такой почтой уже существует.': 'Un utilisateur avec cet e-mail existe déjà.'
  }
};

function currentLanguage() {
  return (state.settings && state.settings.language) || 'ru';
}

function currentLocale() {
  return locales[currentLanguage()] || locales.ru;
}

function t(text) {
  var lang = currentLanguage();
  if (lang === 'ru') return text;
  return (i18n[lang] && i18n[lang][text]) || text;
}

function translateText(text) {
  var exact = t(text);
  if (exact !== text) return exact;
  var prefixes = ['Выбранный день:', 'Обновлено:', 'Первый вход:', 'Последний вход:', 'Отключено:', 'Статус:', 'Токен:', 'Демо-код:'];
  for (var i = 0; i < prefixes.length; i++) {
    if (text.indexOf(prefixes[i]) === 0) {
      return t(prefixes[i]) + text.slice(prefixes[i].length);
    }
  }
  return text;
}

function translateMessage(text) {
  if (!text) return '';
  var demoMarker = ' Демо-код: ';
  if (text.includes(demoMarker)) {
    var parts = text.split(demoMarker);
    return t(parts[0]) + ' ' + t('Демо-код:') + ' ' + parts.slice(1).join(demoMarker);
  }
  return translateText(text);
}

function localize(root) {
  if (currentLanguage() === 'ru' || !root) return;
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(function (node) {
    var raw = node.nodeValue;
    var trimmed = raw.trim();
    if (!trimmed) return;
    var translated = translateText(trimmed);
    if (translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
  });
  root.querySelectorAll('[placeholder], [title]').forEach(function (el) {
    if (el.placeholder) el.placeholder = t(el.placeholder);
    if (el.title) el.title = t(el.title);
  });
}

var localizeObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.nodeType === 1) localize(node);
    });
  });
});
localizeObserver.observe(document.body, { childList: true, subtree: true });

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
  });
}

function fmtDate(value) {
  if (!value) return '';
  return new Date(String(value).replace(' ', 'T')).toLocaleString(currentLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function ymd(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function datePart(value) {
  return String(value || '').slice(0, 10);
}

function timePart(value, fallback) {
  var time = String(value || '').slice(11, 16);
  return time && time.length === 5 ? time : fallback;
}

function noteLabel(count) {
  count = Number(count || 0);
  if (currentLanguage() === 'en') return count + ' ' + (count === 1 ? 'note' : 'notes');
  if (currentLanguage() === 'de') return count + ' ' + (count === 1 ? 'Notiz' : 'Notizen');
  if (currentLanguage() === 'fr') return count + ' ' + (count > 1 ? 'notes' : 'note');
  if (count % 10 === 1 && count % 100 !== 11) return count + ' заметка';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return count + ' заметки';
  return count + ' заметок';
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
    el.textContent = translateMessage(text);
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
  var title = state.month.toLocaleDateString(currentLocale(), { month: 'long', year: 'numeric' });
  screen.innerHTML = '<div class="topbar"><div><h1>' + title + '</h1><p>Добавляйте точные события или вводите их свободным текстом.</p></div><div class="top-actions"><input class="search" id="search" placeholder="Поиск" value="' + escapeHtml(state.search) + '"><button class="icon-btn" title="Предыдущий месяц" id="prevMonth">‹</button><button class="icon-btn" title="Следующий месяц" id="nextMonth">›</button></div></div><div class="layout-two"><section class="panel"><div class="calendar-head"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="calendar-grid" id="calendarGrid"></div></section><aside class="panel pad quick-add-panel"><h2>Быстрое добавление</h2><p>Примеры: 10 July, 13.00, 15:00, Mam Birthday или 13-16 July, Holiday.</p><div class="form"><label>Естественный ввод<input id="quickNatural" placeholder="13-16 July, Holiday"></label><button class="btn primary" id="quickAdd">Добавить</button><p data-status class="status"></p></div></aside></div>';
  drawCalendar();
  document.getElementById('prevMonth').onclick = function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); loadEvents(); };
  document.getElementById('nextMonth').onclick = function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); loadEvents(); };
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
    var dayEvents = eventsForDate(key, true);
    html += '<button class="day ' + (d.getMonth() !== state.month.getMonth() ? 'muted ' : '') + (key === today ? 'today' : '') + '" data-date="' + key + '"><span class="num">' + d.getDate() + '</span>' + dayEvents.slice(0, 3).map(function (ev) { return '<span class="event-pill" data-calendar-event="' + ev.id + '" style="border-left-color:' + escapeHtml(ev.color || state.settings.palette) + '">' + escapeHtml(ev.title) + '</span>'; }).join('') + '</button>';
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.day').forEach(function (day) {
    day.onclick = function (clickEvent) {
      var eventPill = clickEvent.target.closest('[data-calendar-event]');
      if (eventPill) {
        var event = state.events.find(function (ev) { return String(ev.id) === String(eventPill.dataset.calendarEvent); });
        if (event && Number(event.user_id) === Number(state.user.id)) openEventModal(event, day.dataset.date);
        return;
      }
      var dayEvents = eventsForDate(day.dataset.date, false).filter(function (ev) { return Number(ev.user_id) === Number(state.user.id); });
      if (dayEvents.length > 0) openDayActionModal(day.dataset.date, dayEvents);
      else openEventModal({ date: day.dataset.date });
    };
  });
}

function eventsForDate(date, useSearch) {
  return state.events.filter(function (ev) {
    var s = String(ev.starts_at).slice(0, 10), e = String(ev.ends_at).slice(0, 10);
    var ok = s <= date && e >= date;
    var q = !useSearch || !state.search || String(ev.title).toLowerCase().includes(state.search);
    return ok && q;
  });
}

function openDayActionModal(date, events) {
  var html = '<div class="modal-backdrop" id="modal"><div class="modal compact-modal"><div class="topbar"><h2>Что добавить?</h2><button class="icon-btn" id="closeModal">×</button></div><p>В этом дне уже есть мероприятия. Выберите, что хотите добавить.</p><div class="form-row"><button class="btn success" id="dayAddEvent">Событие</button><button class="btn warning" id="dayAddNote">Заметку</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('dayAddEvent').onclick = function () { closeModal(); openEventModal({ date: date }); };
  document.getElementById('dayAddNote').onclick = function () {
    closeModal();
    if (events.length === 1) openNotesModal(events[0]);
    else openEventPickerModal(date, events, 'note');
  };
}

function openEventPickerModal(date, events, mode) {
  mode = mode || 'note';
  var rows = events.map(function (ev) {
    return '<button class="list-row event-choice" data-pick-event="' + ev.id + '"><strong>' + escapeHtml(ev.title) + '</strong><span class="meta">' + fmtDate(ev.starts_at) + ' - ' + fmtDate(ev.ends_at) + '</span></button>';
  }).join('');
  var title = mode === 'delete' ? 'Что удалить?' : 'Выберите мероприятие';
  var html = '<div class="modal-backdrop" id="modal"><div class="modal"><div class="topbar"><h2>' + title + '</h2><button class="icon-btn" id="closeModal">×</button></div><div class="plain-list">' + rows + '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  document.querySelectorAll('[data-pick-event]').forEach(function (btn) {
    btn.onclick = function () {
      var event = events.find(function (ev) { return String(ev.id) === String(btn.dataset.pickEvent); });
      closeModal();
      if (mode === 'delete') openDeleteEventModal(event, date);
      else openNotesModal(event);
    };
  });
}

function openEventModal(event, selectedDate) {
  event = event || {};
  var isEdit = !!event.id;
  var eventDate = event.date || datePart(event.starts_at);
  var startTime = timePart(event.starts_at, '09:00');
  var endTime = timePart(event.ends_at, '10:00');
  var deleteButton = isEdit ? '<button class="btn danger" id="deleteEvent">Удалить событие</button>' : '';
  var html = '<div class="modal-backdrop" id="modal"><div class="modal"><div class="topbar"><h2>' + (isEdit ? 'Редактирование события' : 'Событие') + '</h2><button class="icon-btn" id="closeModal">×</button></div><div class="form"><label>Свободный ввод<input id="natural" placeholder="10 July, 13.00, 15:00, Mam Birthday"></label><label>Название<input id="title" value="' + escapeHtml(event.title || '') + '"></label><div class="form-row"><label>Дата<input id="date" type="date" value="' + escapeHtml(eventDate || '') + '"></label><label>Цвет<input id="color" type="color" value="' + escapeHtml(event.color || state.settings.palette || '#e85d75') + '"></label></div><div class="form-row"><label>Начало<input id="start_time" type="time" value="' + escapeHtml(startTime) + '"></label><label>Конец<input id="end_time" type="time" value="' + escapeHtml(endTime) + '"></label></div><div class="event-modal-actions"><button class="btn primary" id="saveEvent">Сохранить</button>' + deleteButton + '</div><p data-status class="status"></p></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('saveEvent').onclick = async function () {
    await saveEvent({ id: event.id || 0, natural: val('natural'), title: val('title'), date: val('date'), start_time: val('start_time'), end_time: val('end_time'), color: val('color') });
    closeModal();
  };
  if (isEdit) {
    document.getElementById('deleteEvent').onclick = function () {
      closeModal();
      openDeleteEventModal(event, selectedDate);
    };
  }
}

function openDeleteEventModal(event, selectedDate) {
  if (!event) return;
  var dayText = selectedDate ? '<p class="meta">Выбранный день: ' + escapeHtml(selectedDate) + '</p>' : '';
  var html = '<div class="modal-backdrop" id="modal"><div class="modal compact-modal"><div class="topbar"><h2>Удалить событие?</h2><button class="icon-btn" id="closeModal">×</button></div><p><strong>' + escapeHtml(event.title) + '</strong></p>' + dayText + '<p>Будет удалено только выбранное мероприятие или выбранный день многодневного мероприятия. Его заметки удалятся только при полном удалении события.</p><div class="form-row"><button class="btn ghost" id="cancelDeleteEvent">Отмена</button><button class="btn danger" id="confirmDeleteEvent">Удалить</button></div><p data-status class="status"></p></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('cancelDeleteEvent').onclick = closeModal;
  document.getElementById('confirmDeleteEvent').onclick = async function () {
    await deleteEvent(event.id, selectedDate);
    closeModal();
  };
}

async function openNotesModal(event) {
  if (!event) return;
  var html = '<div class="modal-backdrop" id="modal"><div class="modal notes-modal"><div class="topbar"><div><h2>Заметки</h2><p>' + escapeHtml(event.title) + '</p></div><button class="icon-btn" id="closeModal">×</button></div><div id="notesBody"><p>Загрузка...</p></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('closeModal').onclick = closeModal;
  await loadNotesIntoModal(event);
}

async function loadNotesIntoModal(event) {
  var body = document.getElementById('notesBody');
  if (!body) return;
  try {
    var res = await api('event_notes&event_id=' + event.id, null, 'GET');
    var notesHtml = res.notes.map(function (note) {
      return '<div class="note-card"><textarea data-note-body="' + note.id + '">' + escapeHtml(note.body) + '</textarea><div class="note-actions"><button class="btn warning" data-save-note="' + note.id + '">Изменить</button><button class="btn danger" data-delete-note="' + note.id + '">Удалить</button></div><span class="meta">Обновлено: ' + escapeHtml(note.updated_at) + '</span></div>';
    }).join('') || '<p>Заметок пока нет.</p>';
    body.innerHTML = '<div class="plain-list">' + notesHtml + '</div><div class="note-card new-note"><label>Новая заметка<textarea id="newNoteBody" placeholder="Что важно помнить об этом мероприятии?"></textarea></label><button class="btn success" id="addNote">Добавить</button><p data-status class="status"></p></div>';
    document.querySelectorAll('[data-save-note]').forEach(function (btn) {
      btn.onclick = async function () {
        await api('save_note', { id: btn.dataset.saveNote, body: document.querySelector('[data-note-body="' + btn.dataset.saveNote + '"]').value }, 'POST');
        await refreshCurrent();
        await loadNotesIntoModal(event);
      };
    });
    document.querySelectorAll('[data-delete-note]').forEach(function (btn) {
      btn.onclick = async function () {
        await api('delete_note', { id: btn.dataset.deleteNote }, 'POST');
        await refreshCurrent();
        await loadNotesIntoModal(event);
      };
    });
    document.getElementById('addNote').onclick = async function () {
      await api('save_note', { event_id: event.id, body: document.getElementById('newNoteBody').value }, 'POST');
      await refreshCurrent();
      await loadNotesIntoModal(event);
    };
  } catch (err) {
    body.innerHTML = '<p class="status bad">' + escapeHtml(err.message) + '</p>';
  }
}

function val(id) { return document.getElementById(id).value; }
function closeModal() { var m = document.getElementById('modal'); if (m) m.remove(); }

async function saveEvent(payload) {
  try { await api('save_event', payload, 'POST'); await refreshCurrent(); notify('Событие сохранено.', true); }
  catch (err) { notify(err.message, false); }
}

async function deleteEvent(id, selectedDate) {
  try {
    await api('delete_event', { id: id, date: selectedDate || '' }, 'POST');
    await refreshCurrent();
    notify('Событие удалено.', true);
  } catch (err) {
    notify(err.message, false);
  }
}

function renderToday() {
  var screen = document.getElementById('screen');
  var list = state.today.map(function (ev) {
    return '<div class="task-row ' + (ev.completed_at ? 'done' : '') + '" data-open-notes="' + ev.id + '"><button class="check" data-toggle="' + ev.id + '" title="Отметить"></button><div><div class="task-title-row"><span class="task-title">' + escapeHtml(ev.title) + '</span><span class="note-count">' + noteLabel(ev.note_count) + '</span></div><div class="meta">' + fmtDate(ev.starts_at) + ' - ' + fmtDate(ev.ends_at) + '</div></div></div>';
  }).join('') || '<p>На сегодня ничего не запланировано.</p>';
  screen.innerHTML = '<div class="topbar"><div><h1>Today</h1><p>Ежедневник с отметкой выполненных событий.</p></div><button class="icon-btn" id="addToday">+</button></div><section class="panel pad"><div class="today-list">' + list + '</div></section>';
  document.getElementById('addToday').onclick = function () { openEventModal({ date: ymd(new Date()) }); };
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.onclick = async function (event) {
      event.stopPropagation();
      await api('toggle_event', { id: btn.dataset.toggle }, 'POST');
      await loadToday();
    };
  });
  document.querySelectorAll('[data-open-notes]').forEach(function (row) {
    row.onclick = function () {
      var event = state.today.find(function (ev) { return String(ev.id) === String(row.dataset.openNotes); });
      openNotesModal(event);
    };
    row.oncontextmenu = function (mouseEvent) {
      mouseEvent.preventDefault();
      var event = state.today.find(function (ev) { return String(ev.id) === String(row.dataset.openNotes); });
      openDeleteEventModal(event, ymd(new Date()));
    };
  });
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
    body.innerHTML = '<h2>Помощь</h2><div class="form"><label>Тема обращения<input id="subject"></label><label>Сообщение<textarea id="message"></textarea></label><button class="btn primary" id="sendSupport">Отправить</button><p data-status class="status"></p></div>';
    document.getElementById('sendSupport').onclick = async function () { await api('support', { subject: val('subject'), message: val('message') }, 'POST'); notify('Обращение отправлено.', true); };
  } else if (state.profile === 'share') {
    var shares = await api('shares', null, 'GET');
    body.innerHTML = '<h2>Доступ к календарю</h2><div class="form"><label>Email пользователя<input id="shareEmail" type="email"></label><button class="btn primary" id="sendInvite">Пригласить</button><label>Принять приглашение по токену<input id="shareToken"></label><button class="btn" id="acceptShare">Принять</button><p data-status class="status"></p></div><div class="plain-list">' + shares.shares.map(function (s) { return '<div class="list-row"><strong>' + escapeHtml(s.invitee_email) + '</strong><span class="meta">Статус: ' + escapeHtml(s.status) + '<br>Токен: ' + escapeHtml(s.token) + '</span></div>'; }).join('') + '</div>';
    document.getElementById('sendInvite').onclick = async function () { var res = await api('share_invite', { email: val('shareEmail') }, 'POST'); notify('Токен приглашения: ' + res.token, true); };
    document.getElementById('acceptShare').onclick = async function () { await api('share_accept', { token: val('shareToken') }, 'POST'); notify('Доступ принят.', true); };
  }
}

async function saveSettings() {
  var oldLanguage = currentLanguage();
  var payload = Object.assign({}, state.settings);
  ['theme','palette','language','app_icon'].forEach(function (id) { var el = document.getElementById(id); if (el) payload[id] = el.value; });
  var res = await api('settings', payload, 'POST');
  state.settings = res.settings;
  setTheme();
  if (oldLanguage !== currentLanguage()) {
    render();
  }
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
