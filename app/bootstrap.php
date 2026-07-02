<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['app']['timezone']);

foreach ([dirname(__DIR__) . '/storage', dirname(__DIR__) . '/storage/logs'] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}

session_name('fantasia_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

require_once __DIR__ . '/core.php';

$pdo = db($config);
migrate($pdo);
auto_login_from_device($pdo, $config);
