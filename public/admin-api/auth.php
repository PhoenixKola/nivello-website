<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';

api_run([
    'GET session' => function () {
        $session = current_session();
        return [
            'authenticated' => $session['authenticated'],
            'expired' => $session['expired'],
            'csrfToken' => $session['authenticated'] ? $session['csrf'] : null,
        ];
    },
    'POST login' => function () {
        $code = json_body()['code'] ?? '';
        if (!is_string($code) || $code === '' || strlen($code) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the access code.', 422);
        }
        return ['authenticated' => true, 'csrfToken' => admin_login($code)];
    },
    'POST logout' => function () {
        admin_logout();
        return ['authenticated' => false];
    },
], true);
