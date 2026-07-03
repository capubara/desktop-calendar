<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/bootstrap.php';

$action = $_GET['action'] ?? '';
if ($action !== '') {
    handle_action($pdo, $config, $action);
}

function handle_action(PDO $pdo, array $config, string $action): void
{
    $data = request_data();

    if ($action === 'me') {
        $user = current_user($pdo);
        if (!$user) {
            json_response(['ok' => true, 'user' => null]);
        }
        json_response(['ok' => true, 'user' => public_user($user), 'settings' => ensure_settings($pdo, (int) $user['id'])]);
    }

    if ($action === 'register') {
        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $passwordConfirm = (string) ($data['password_confirm'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            json_response(['ok' => false, 'message' => 'Введите имя, корректную почту и пароль от 6 символов.'], 422);
        }
        if ($password !== $passwordConfirm) {
            json_response(['ok' => false, 'message' => 'Пароли не совпадают.'], 422);
        }
        if (find_user_by_email($pdo, $email)) {
            json_response(['ok' => false, 'message' => 'Пользователь с такой почтой уже существует.'], 409);
        }
        $role = ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn()) === 0 ? 'admin' : 'user';
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role, now()]);
        $userId = (int) $pdo->lastInsertId();
        ensure_settings($pdo, $userId);
        $user = find_user_by_email($pdo, $email);
        $code = create_login_code($pdo, $config, $userId, 'register');
        send_code_mail($pdo, $config, $user, $code, 'register');
        $_SESSION['pending_user_id'] = $userId;
        $_SESSION['pending_purpose'] = 'register';
        $_SESSION['pending_remember'] = true;
        $_SESSION['pending_device_name'] = null;
        audit($pdo, $userId, 'auth.register');
        json_response(['ok' => true, 'message' => 'Код подтверждения отправлен.', 'dev_code' => dev_code($config, $code)]);
    }

    if ($action === 'login') {
        $user = find_user_by_email($pdo, trim((string) ($data['email'] ?? '')));
        if (!$user || !password_verify((string) ($data['password'] ?? ''), $user['password_hash'])) {
            json_response(['ok' => false, 'message' => 'Неверная почта или пароль.'], 401);
        }
        $settings = ensure_settings($pdo, (int) $user['id']);
        $code = create_login_code($pdo, $config, (int) $user['id'], 'login');
        send_code_mail($pdo, $config, $user, $code, 'login');
        $_SESSION['pending_user_id'] = (int) $user['id'];
        $_SESSION['pending_purpose'] = 'login';
        $_SESSION['pending_remember'] = !empty($data['remember']);
        $_SESSION['pending_device_name'] = null;
        audit($pdo, (int) $user['id'], 'auth.login_code_requested');
        json_response(['ok' => true, 'message' => 'Введите код из почты.', 'needs_2fa' => (bool) $settings['twofa_enabled'], 'dev_code' => dev_code($config, $code)]);
    }

    if ($action === 'verify') {
        $userId = (int) ($_SESSION['pending_user_id'] ?? 0);
        $purpose = (string) ($_SESSION['pending_purpose'] ?? 'login');
        if (!$userId || !verify_login_code($pdo, $userId, (string) ($data['code'] ?? ''), $purpose)) {
            json_response(['ok' => false, 'message' => 'Код не подошел или устарел.'], 422);
        }
        $settings = ensure_settings($pdo, $userId);
        if ((int) $settings['twofa_enabled'] === 1 && !verify_totp((string) $settings['twofa_secret'], (string) ($data['totp'] ?? ''))) {
            json_response(['ok' => false, 'message' => '2FA-код не подошел.'], 422);
        }
        $_SESSION['user_id'] = $userId;
        if (!empty($_SESSION['pending_remember'])) {
            remember_device($pdo, $config, $userId, $_SESSION['pending_device_name'] ?? null);
        }
        unset($_SESSION['pending_user_id'], $_SESSION['pending_purpose'], $_SESSION['pending_remember'], $_SESSION['pending_device_name']);
        audit($pdo, $userId, 'auth.verified');
        json_response(['ok' => true, 'message' => 'Вы вошли в аккаунт.']);
    }

    if ($action === 'logout') {
        $user = current_user($pdo);
        if ($user) {
            audit($pdo, (int) $user['id'], 'auth.logout');
        }
        $_SESSION = [];
        session_destroy();
        json_response(['ok' => true]);
    }

    $user = require_user($pdo);
    $userId = (int) $user['id'];

    if ($action === 'events') {
        $month = preg_replace('/[^0-9\-]/', '', (string) ($_GET['month'] ?? date('Y-m')));
        $from = $month . '-01 00:00:00';
        $to = (new DateTimeImmutable($from))->modify('last day of this month 23:59:59')->format('Y-m-d H:i:s');
        $owners = visible_owner_ids($pdo, $userId, $user['email']);
        $in = implode(',', array_fill(0, count($owners), '?'));
        $stmt = $pdo->prepare('SELECT e.*, u.name AS owner_name, COALESCE(n.note_count, 0) AS note_count FROM events e JOIN users u ON u.id = e.user_id LEFT JOIN (SELECT event_id, COUNT(*) AS note_count FROM event_notes WHERE user_id = ? GROUP BY event_id) n ON n.event_id = e.id WHERE e.user_id IN (' . $in . ') AND e.starts_at <= ? AND e.ends_at >= ? ORDER BY e.starts_at');
        $stmt->execute(array_merge([$userId], $owners, [$to, $from]));
        json_response(['ok' => true, 'events' => $stmt->fetchAll()]);
    }

    if ($action === 'today') {
        $start = (new DateTimeImmutable('today'))->format('Y-m-d 00:00:00');
        $end = (new DateTimeImmutable('today'))->format('Y-m-d 23:59:59');
        $stmt = $pdo->prepare('SELECT e.*, COALESCE(n.note_count, 0) AS note_count FROM events e LEFT JOIN (SELECT event_id, COUNT(*) AS note_count FROM event_notes WHERE user_id = ? GROUP BY event_id) n ON n.event_id = e.id WHERE e.user_id = ? AND e.starts_at <= ? AND e.ends_at >= ? ORDER BY e.starts_at');
        $stmt->execute([$userId, $userId, $end, $start]);
        json_response(['ok' => true, 'events' => $stmt->fetchAll()]);
    }

    if ($action === 'save_event') {
        $parsed = parse_event_input($data);
        $id = (int) ($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare('UPDATE events SET title = ?, starts_at = ?, ends_at = ?, is_all_day = ?, source_text = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$parsed['title'], $parsed['starts_at'], $parsed['ends_at'], $parsed['is_all_day'], $parsed['source_text'], $data['color'] ?? null, now(), $id, $userId]);
            audit($pdo, $userId, 'event.updated', ['id' => $id]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO events (user_id, title, starts_at, ends_at, is_all_day, source_text, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$userId, $parsed['title'], $parsed['starts_at'], $parsed['ends_at'], $parsed['is_all_day'], $parsed['source_text'], $data['color'] ?? null, now(), now()]);
            $id = (int) $pdo->lastInsertId();
            audit($pdo, $userId, 'event.created', ['id' => $id]);
        }
        json_response(['ok' => true, 'event_id' => $id]);
    }

    if ($action === 'delete_event') {
        $id = (int) ($data['id'] ?? 0);
        $pdo->prepare('DELETE FROM events WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        audit($pdo, $userId, 'event.deleted', ['id' => $id]);
        json_response(['ok' => true]);
    }

    if ($action === 'toggle_event') {
        $id = (int) ($data['id'] ?? 0);
        $stmt = $pdo->prepare('SELECT completed_at FROM events WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $event = $stmt->fetch();
        if (!$event) {
            json_response(['ok' => false, 'message' => 'Событие не найдено.'], 404);
        }
        $completed = $event['completed_at'] ? null : now();
        $pdo->prepare('UPDATE events SET completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')->execute([$completed, now(), $id, $userId]);
        json_response(['ok' => true, 'completed_at' => $completed]);
    }

    if ($action === 'event_notes') {
        $eventId = (int) ($_GET['event_id'] ?? $data['event_id'] ?? 0);
        require_owned_event($pdo, $userId, $eventId);
        $stmt = $pdo->prepare('SELECT * FROM event_notes WHERE event_id = ? AND user_id = ? ORDER BY updated_at DESC, id DESC');
        $stmt->execute([$eventId, $userId]);
        json_response(['ok' => true, 'notes' => $stmt->fetchAll()]);
    }

    if ($action === 'save_note') {
        $id = (int) ($data['id'] ?? 0);
        $eventId = (int) ($data['event_id'] ?? 0);
        $body = trim((string) ($data['body'] ?? ''));
        if ($body === '') {
            json_response(['ok' => false, 'message' => 'Введите текст заметки.'], 422);
        }
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT event_id FROM event_notes WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            $note = $stmt->fetch();
            if (!$note) {
                json_response(['ok' => false, 'message' => 'Заметка не найдена.'], 404);
            }
            require_owned_event($pdo, $userId, (int) $note['event_id']);
            $pdo->prepare('UPDATE event_notes SET body = ?, updated_at = ? WHERE id = ? AND user_id = ?')->execute([$body, now(), $id, $userId]);
            audit($pdo, $userId, 'note.updated', ['id' => $id]);
            json_response(['ok' => true, 'note_id' => $id]);
        }
        require_owned_event($pdo, $userId, $eventId);
        $stmt = $pdo->prepare('INSERT INTO event_notes (event_id, user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$eventId, $userId, $body, now(), now()]);
        $id = (int) $pdo->lastInsertId();
        audit($pdo, $userId, 'note.created', ['id' => $id, 'event_id' => $eventId]);
        json_response(['ok' => true, 'note_id' => $id]);
    }

    if ($action === 'delete_note') {
        $id = (int) ($data['id'] ?? 0);
        $stmt = $pdo->prepare('SELECT event_id FROM event_notes WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $note = $stmt->fetch();
        if (!$note) {
            json_response(['ok' => false, 'message' => 'Заметка не найдена.'], 404);
        }
        require_owned_event($pdo, $userId, (int) $note['event_id']);
        $pdo->prepare('DELETE FROM event_notes WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        audit($pdo, $userId, 'note.deleted', ['id' => $id]);
        json_response(['ok' => true]);
    }

    if ($action === 'settings') {
        $stmt = $pdo->prepare('UPDATE user_settings SET theme = ?, palette = ?, language = ?, app_icon = ? WHERE user_id = ?');
        $stmt->execute([$data['theme'] ?? 'light', $data['palette'] ?? '#e85d75', $data['language'] ?? 'ru', $data['app_icon'] ?? 'spark', $userId]);
        audit($pdo, $userId, 'settings.updated');
        json_response(['ok' => true, 'settings' => ensure_settings($pdo, $userId)]);
    }

    if ($action === 'devices') {
        $stmt = $pdo->prepare('SELECT id, device_name, first_seen, last_seen, user_agent, revoked_at FROM trusted_devices WHERE user_id = ? ORDER BY first_seen');
        $stmt->execute([$userId]);
        json_response(['ok' => true, 'devices' => $stmt->fetchAll()]);
    }

    if ($action === 'revoke_device') {
        $deviceId = (int) ($data['id'] ?? 0);
        $stmt = $pdo->prepare('SELECT * FROM trusted_devices WHERE id = ? AND user_id = ?');
        $stmt->execute([$deviceId, $userId]);
        $device = $stmt->fetch();
        if (!$device) {
            json_response(['ok' => false, 'message' => 'Устройство не найдено.'], 404);
        }
        $firstStmt = $pdo->prepare('SELECT id FROM trusted_devices WHERE user_id = ? ORDER BY first_seen LIMIT 1');
        $firstStmt->execute([$userId]);
        $firstId = (int) $firstStmt->fetchColumn();
        $olderThanYear = strtotime($device['first_seen']) <= strtotime('-1 year');
        if ($deviceId !== $firstId && !$olderThanYear) {
            json_response(['ok' => false, 'message' => 'Можно отключить первое устройство или устройство старше года.'], 422);
        }
        $pdo->prepare('UPDATE trusted_devices SET revoked_at = ? WHERE id = ? AND user_id = ?')->execute([now(), $deviceId, $userId]);
        audit($pdo, $userId, 'device.revoked', ['id' => $deviceId]);
        json_response(['ok' => true]);
    }

    if ($action === 'change_password') {
        $password = (string) ($data['password'] ?? '');
        if (strlen($password) < 6) {
            json_response(['ok' => false, 'message' => 'Пароль должен быть от 6 символов.'], 422);
        }
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $userId]);
        audit($pdo, $userId, 'privacy.password_changed');
        json_response(['ok' => true]);
    }

    if ($action === 'twofa_prepare') {
        $secret = create_totp_secret();
        $_SESSION['twofa_secret'] = $secret;
        $uri = 'otpauth://totp/FantasiaCalendar:' . rawurlencode($user['email']) . '?secret=' . $secret . '&issuer=FantasiaCalendar';
        json_response(['ok' => true, 'secret' => $secret, 'uri' => $uri, 'current_code' => totp_code($secret)]);
    }

    if ($action === 'twofa_enable') {
        $secret = (string) ($_SESSION['twofa_secret'] ?? '');
        if ($secret === '' || !verify_totp($secret, (string) ($data['totp'] ?? ''))) {
            json_response(['ok' => false, 'message' => '2FA-код не подошел.'], 422);
        }
        $pdo->prepare('UPDATE user_settings SET twofa_enabled = 1, twofa_secret = ? WHERE user_id = ?')->execute([$secret, $userId]);
        unset($_SESSION['twofa_secret']);
        audit($pdo, $userId, 'privacy.twofa_enabled');
        json_response(['ok' => true]);
    }

    if ($action === 'twofa_disable') {
        $pdo->prepare('UPDATE user_settings SET twofa_enabled = 0, twofa_secret = NULL WHERE user_id = ?')->execute([$userId]);
        audit($pdo, $userId, 'privacy.twofa_disabled');
        json_response(['ok' => true]);
    }

    if ($action === 'share_invite') {
        $email = trim((string) ($data['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(['ok' => false, 'message' => 'Введите корректную почту.'], 422);
        }
        $invitee = find_user_by_email($pdo, $email);
        $token = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare('INSERT INTO calendar_shares (owner_id, invitee_email, invitee_user_id, token, created_at) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $email, $invitee['id'] ?? null, $token, now()]);
        file_put_contents($config['mail']['log_path'], '[' . now() . '] share invite для ' . $email . ': ' . $config['app']['base_url'] . '/?share=' . $token . PHP_EOL, FILE_APPEND);
        audit($pdo, $userId, 'share.invited', ['email' => $email]);
        json_response(['ok' => true, 'message' => 'Приглашение создано.', 'token' => $token]);
    }

    if ($action === 'shares') {
        $stmt = $pdo->prepare('SELECT s.*, u.name AS owner_name FROM calendar_shares s JOIN users u ON u.id = s.owner_id WHERE s.owner_id = ? OR lower(s.invitee_email) = lower(?) ORDER BY s.created_at DESC');
        $stmt->execute([$userId, $user['email']]);
        json_response(['ok' => true, 'shares' => $stmt->fetchAll()]);
    }

    if ($action === 'share_accept') {
        $token = (string) ($data['token'] ?? '');
        $stmt = $pdo->prepare('UPDATE calendar_shares SET status = \'accepted\', invitee_user_id = ?, accepted_at = ? WHERE token = ? AND lower(invitee_email) = lower(?)');
        $stmt->execute([$userId, now(), $token, $user['email']]);
        audit($pdo, $userId, 'share.accepted');
        json_response(['ok' => true]);
    }

    if ($action === 'support') {
        $stmt = $pdo->prepare('INSERT INTO support_requests (user_id, subject, message, created_at) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, trim((string) ($data['subject'] ?? 'Вопрос')), trim((string) ($data['message'] ?? '')), now()]);
        audit($pdo, $userId, 'support.created');
        json_response(['ok' => true, 'message' => 'Обращение отправлено.']);
    }

    if (str_starts_with($action, 'admin_')) {
        handle_admin_action($pdo, $action, $data);
    }

    json_response(['ok' => false, 'message' => 'Неизвестное действие.'], 404);
}

function handle_admin_action(PDO $pdo, string $action, array $data): void
{
    require_admin($pdo);
    if ($action === 'admin_dashboard') {
        json_response(['ok' => true, 'stats' => [
            'users' => (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
            'events' => (int) $pdo->query('SELECT COUNT(*) FROM events')->fetchColumn(),
            'shares' => (int) $pdo->query('SELECT COUNT(*) FROM calendar_shares')->fetchColumn(),
            'support' => (int) $pdo->query('SELECT COUNT(*) FROM support_requests WHERE status = \'new\'')->fetchColumn(),
        ]]);
    }
    if ($action === 'admin_users') {
        json_response(['ok' => true, 'users' => $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC')->fetchAll()]);
    }
    if ($action === 'admin_set_role') {
        $pdo->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$data['role'] === 'admin' ? 'admin' : 'user', (int) $data['id']]);
        json_response(['ok' => true]);
    }
    if ($action === 'admin_events') {
        json_response(['ok' => true, 'events' => $pdo->query('SELECT e.*, u.email FROM events e JOIN users u ON u.id = e.user_id ORDER BY e.starts_at DESC LIMIT 200')->fetchAll()]);
    }
    if ($action === 'admin_shares') {
        json_response(['ok' => true, 'shares' => $pdo->query('SELECT * FROM calendar_shares ORDER BY created_at DESC LIMIT 200')->fetchAll()]);
    }
    if ($action === 'admin_support') {
        json_response(['ok' => true, 'requests' => $pdo->query('SELECT r.*, u.email FROM support_requests r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC')->fetchAll()]);
    }
    if ($action === 'admin_logs') {
        json_response(['ok' => true, 'logs' => $pdo->query('SELECT l.*, u.email FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 200')->fetchAll()]);
    }
    json_response(['ok' => false, 'message' => 'Неизвестное admin-действие.'], 404);
}

function require_owned_event(PDO $pdo, int $userId, int $eventId): array
{
    if ($eventId <= 0) {
        json_response(['ok' => false, 'message' => 'Выберите мероприятие.'], 422);
    }
    $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ? AND user_id = ?');
    $stmt->execute([$eventId, $userId]);
    $event = $stmt->fetch();
    if (!$event) {
        json_response(['ok' => false, 'message' => 'Мероприятие не найдено.'], 404);
    }
    return $event;
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Fantasia Calendar</title>
    <link rel="stylesheet" href="/assets/app.css">
</head>
<body>
    <div id="app"></div>
    <script src="/assets/app.js"></script>
</body>
</html>
