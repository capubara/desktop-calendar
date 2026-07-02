<?php

return [
    'app' => [
        'name' => 'Fantasia Calendar',
        'base_url' => 'http://127.0.0.1:8080',
        'timezone' => 'Europe/Kaliningrad',
        'dev_show_email_codes' => true,
    ],
    'database' => [
        'path' => dirname(__DIR__) . '/storage/app.sqlite',
    ],
    'mail' => [
        'log_path' => dirname(__DIR__) . '/storage/mailbox.log',
    ],
    'security' => [
        'code_ttl_minutes' => 10,
        'remember_days' => 365,
    ],
];
