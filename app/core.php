<?php

declare(strict_types=1);

function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $pdo = new PDO('sqlite:' . $config['database']['path']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS trusted_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    user_agent TEXT,
    revoked_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'light',
    palette TEXT NOT NULL DEFAULT '#e85d75',
    language TEXT NOT NULL DEFAULT 'ru',
    app_icon TEXT NOT NULL DEFAULT 'spark',
    twofa_enabled INTEGER NOT NULL DEFAULT 0,
    twofa_secret TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    is_all_day INTEGER NOT NULL DEFAULT 0,
    source_text TEXT,
    color TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS calendar_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_user_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    accepted_at TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(invitee_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
SQL);
}

function now(): string
{
    return (new DateTimeImmutable())->format('Y-m-d H:i:s');
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $json = json_decode($raw, true);
    return is_array($json) ? $json : $_POST;
}

function current_user(PDO $pdo): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([(int) $_SESSION['user_id']]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_user(PDO $pdo): array
{
    $user = current_user($pdo);
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Нужно войти в аккаунт.'], 401);
    }
    return $user;
}

function require_admin(PDO $pdo): array
{
    $user = require_user($pdo);
    if ($user['role'] !== 'admin') {
        json_response(['ok' => false, 'message' => 'Нужны права администратора.'], 403);
    }
    return $user;
}

function audit(PDO $pdo, ?int $userId, string $action, array $details = []): void
{
    $stmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, details, ip, created_at) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $action, json_encode($details, JSON_UNESCAPED_UNICODE), $_SERVER['REMOTE_ADDR'] ?? null, now()]);
}

function find_user_by_email(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM users WHERE lower(email) = lower(?)');
    $stmt->execute([trim($email)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function ensure_settings(PDO $pdo, int $userId): array
{
    $pdo->prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)')->execute([$userId]);
    $stmt = $pdo->prepare('SELECT * FROM user_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function public_user(array $user): array
{
    return ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']];
}

function dev_code(array $config, string $code): ?string
{
    return $config['app']['dev_show_email_codes'] ? $code : null;
}

function create_login_code(PDO $pdo, array $config, int $userId, string $purpose): string
{
    $code = (string) random_int(100000, 999999);
    $expires = (new DateTimeImmutable())->modify('+' . $config['security']['code_ttl_minutes'] . ' minutes')->format('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO login_codes (user_id, code_hash, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, password_hash($code, PASSWORD_DEFAULT), $purpose, $expires, now()]);
    return $code;
}

function send_code_mail(PDO $pdo, array $config, array $user, string $code, string $purpose): void
{
    file_put_contents($config['mail']['log_path'], '[' . now() . '] ' . $purpose . ' для ' . $user['email'] . ': ' . $code . PHP_EOL, FILE_APPEND);
    audit($pdo, (int) $user['id'], 'mail.code_sent', ['purpose' => $purpose]);
}

function verify_login_code(PDO $pdo, int $userId, string $code, string $purpose): bool
{
    $stmt = $pdo->prepare('SELECT * FROM login_codes WHERE user_id = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 5');
    $stmt->execute([$userId, $purpose]);
    foreach ($stmt->fetchAll() as $row) {
        if ($row['expires_at'] < now()) {
            continue;
        }
        if (password_verify(trim($code), $row['code_hash'])) {
            $pdo->prepare('UPDATE login_codes SET used_at = ? WHERE id = ?')->execute([now(), $row['id']]);
            return true;
        }
    }
    return false;
}

function remember_device(PDO $pdo, array $config, int $userId, ?string $deviceName = null): void
{
    $token = bin2hex(random_bytes(32));
    $deviceName = trim((string) $deviceName);
    if ($deviceName === '') {
        $deviceName = next_device_name($pdo, $userId);
    }
    $stmt = $pdo->prepare('INSERT INTO trusted_devices (user_id, device_name, token_hash, first_seen, last_seen, user_agent) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $deviceName, hash('sha256', $token), now(), now(), $_SERVER['HTTP_USER_AGENT'] ?? '']);
    setcookie('fantasia_device', $userId . ':' . $token, [
        'expires' => time() + 86400 * (int) $config['security']['remember_days'],
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function next_device_name(PDO $pdo, int $userId): string
{
    $family = detect_device_family($_SERVER['HTTP_USER_AGENT'] ?? '');
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM trusted_devices WHERE user_id = ? AND device_name LIKE ?');
    $stmt->execute([$userId, $family . '%']);
    $count = (int) $stmt->fetchColumn();
    return $count === 0 ? $family : $family . ' ' . ($count + 1);
}

function detect_device_family(string $userAgent): string
{
    $ua = lower_text($userAgent);
    if (str_contains($ua, 'android')) {
        return 'Android';
    }
    if (str_contains($ua, 'iphone')) {
        return 'iPhone';
    }
    if (str_contains($ua, 'ipad')) {
        return 'iPad';
    }
    if (str_contains($ua, 'windows')) {
        return 'Windows';
    }
    if (str_contains($ua, 'macintosh') || str_contains($ua, 'mac os')) {
        return 'macOS';
    }
    if (str_contains($ua, 'linux')) {
        return 'Linux';
    }
    return 'Устройство';
}

function lower_text(string $value): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }
    return strtolower($value);
}

function auto_login_from_device(PDO $pdo, array $config): void
{
    if (!empty($_SESSION['user_id']) || empty($_COOKIE['fantasia_device'])) {
        return;
    }
    $parts = explode(':', $_COOKIE['fantasia_device'], 2);
    if (count($parts) !== 2) {
        return;
    }
    $stmt = $pdo->prepare('SELECT * FROM trusted_devices WHERE user_id = ? AND token_hash = ? AND revoked_at IS NULL');
    $stmt->execute([(int) $parts[0], hash('sha256', $parts[1])]);
    $device = $stmt->fetch();
    if ($device) {
        $_SESSION['user_id'] = (int) $parts[0];
        $pdo->prepare('UPDATE trusted_devices SET last_seen = ? WHERE id = ?')->execute([now(), $device['id']]);
        audit($pdo, (int) $parts[0], 'auth.remembered_device');
    }
}

function create_totp_secret(): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = '';
    for ($i = 0; $i < 16; $i++) {
        $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $secret;
}

function base32_decode_secret(string $secret): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
    $bits = '';
    foreach (str_split($secret) as $char) {
        $value = strpos($alphabet, $char);
        if ($value !== false) {
            $bits .= str_pad(decbin($value), 5, '0', STR_PAD_LEFT);
        }
    }
    $bytes = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) {
            $bytes .= chr(bindec($byte));
        }
    }
    return $bytes;
}

function totp_code(string $secret, ?int $time = null): string
{
    $counter = intdiv($time ?? time(), 30);
    $binaryCounter = pack('N*', 0) . pack('N*', $counter);
    $hash = hash_hmac('sha1', $binaryCounter, base32_decode_secret($secret), true);
    $offset = ord(substr($hash, -1)) & 15;
    $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7fffffff;
    return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
}

function verify_totp(string $secret, string $code): bool
{
    $code = preg_replace('/\D/', '', $code);
    foreach ([-30, 0, 30] as $offset) {
        if (hash_equals(totp_code($secret, time() + $offset), $code)) {
            return true;
        }
    }
    return false;
}

function month_number(string $month): int
{
    $map = [
        'jan' => 1, 'january' => 1, 'январь' => 1, 'января' => 1,
        'feb' => 2, 'february' => 2, 'февраль' => 2, 'февраля' => 2,
        'mar' => 3, 'march' => 3, 'март' => 3, 'марта' => 3,
        'apr' => 4, 'april' => 4, 'апрель' => 4, 'апреля' => 4,
        'may' => 5, 'май' => 5, 'мая' => 5,
        'jun' => 6, 'june' => 6, 'июнь' => 6, 'июня' => 6,
        'jul' => 7, 'july' => 7, 'июль' => 7, 'июля' => 7,
        'aug' => 8, 'august' => 8, 'август' => 8, 'августа' => 8,
        'sep' => 9, 'sept' => 9, 'september' => 9, 'сентябрь' => 9, 'сентября' => 9,
        'oct' => 10, 'october' => 10, 'октябрь' => 10, 'октября' => 10,
        'nov' => 11, 'november' => 11, 'ноябрь' => 11, 'ноября' => 11,
        'dec' => 12, 'december' => 12, 'декабрь' => 12, 'декабря' => 12,
    ];
    return $map[lower_text($month)] ?? (int) date('n');
}

function normalize_time(string $time): string
{
    $time = trim(str_replace('.', ':', $time));
    if (preg_match('/^(\d{1,2})(?::(\d{2}))?$/', $time, $m)) {
        return sprintf('%02d:%02d', min(23, max(0, (int) $m[1])), isset($m[2]) ? min(59, max(0, (int) $m[2])) : 0);
    }
    return '09:00';
}

function parse_event_input(array $data): array
{
    $year = (int) date('Y');
    $title = trim((string) ($data['title'] ?? ''));
    $source = trim((string) ($data['natural'] ?? ''));
    if (!empty($data['date'])) {
        $date = (new DateTimeImmutable((string) $data['date']))->format('Y-m-d');
        $start = new DateTimeImmutable($date . ' ' . normalize_time((string) ($data['start_time'] ?? '09:00')));
        $end = new DateTimeImmutable($date . ' ' . normalize_time((string) ($data['end_time'] ?? '10:00')));
        if ($end <= $start) {
            $end = $start->modify('+1 hour');
        }
        return ['title' => $title ?: 'Без названия', 'starts_at' => $start->format('Y-m-d H:i:s'), 'ends_at' => $end->format('Y-m-d H:i:s'), 'is_all_day' => 0, 'source_text' => $source];
    }

    $text = preg_replace('/\s+/', ' ', $source);
    $parts = array_map('trim', explode(',', $text));
    $datePart = $parts[0] ?? '';
    $start = null;
    $end = null;
    $allDay = 0;

    if (preg_match('/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([[:alpha:]а-яА-ЯёЁ]+)/u', $datePart, $m)) {
        $month = month_number($m[3]);
        $start = DateTimeImmutable::createFromFormat('!Y-n-j H:i:s', $year . '-' . $month . '-' . $m[1] . ' 00:00:00');
        $end = DateTimeImmutable::createFromFormat('!Y-n-j H:i:s', $year . '-' . $month . '-' . $m[2] . ' 23:59:00');
        $title = $title ?: ($parts[1] ?? 'Событие');
        $allDay = 1;
    } elseif (preg_match('/(\d{1,2})\s+([[:alpha:]а-яА-ЯёЁ]+)/u', $datePart, $m)) {
        $month = month_number($m[2]);
        $startTime = normalize_time($parts[1] ?? '09:00');
        $endTime = normalize_time($parts[2] ?? '10:00');
        $start = DateTimeImmutable::createFromFormat('!Y-n-j H:i:s', $year . '-' . $month . '-' . $m[1] . ' ' . $startTime . ':00');
        $end = DateTimeImmutable::createFromFormat('!Y-n-j H:i:s', $year . '-' . $month . '-' . $m[1] . ' ' . $endTime . ':00');
        $title = $title ?: ($parts[3] ?? 'Событие');
    }

    if (!$start || !$end) {
        $start = new DateTimeImmutable('today 09:00');
        $end = $start->modify('+1 hour');
        $title = $title ?: ($source ?: 'Событие');
    }
    if ($end <= $start) {
        $end = $start->modify('+1 hour');
    }
    return ['title' => $title ?: 'Без названия', 'starts_at' => $start->format('Y-m-d H:i:s'), 'ends_at' => $end->format('Y-m-d H:i:s'), 'is_all_day' => $allDay, 'source_text' => $source];
}

function visible_owner_ids(PDO $pdo, int $userId, string $email): array
{
    $ids = [$userId];
    $stmt = $pdo->prepare('SELECT owner_id FROM calendar_shares WHERE status = \'accepted\' AND (invitee_user_id = ? OR lower(invitee_email) = lower(?))');
    $stmt->execute([$userId, $email]);
    foreach ($stmt->fetchAll() as $row) {
        $ids[] = (int) $row['owner_id'];
    }
    return array_values(array_unique($ids));
}
