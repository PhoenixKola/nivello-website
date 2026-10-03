<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';

api_run([
    'GET session' => function () {
        $session = current_session();
        return [
            'authenticated' => $session['authenticated'],
            'mfaRequired' => $session['mfaRequired'],
            'expired' => $session['expired'],
            'csrfToken' => $session['authenticated'] ? $session['csrf'] : null,
        ];
    },
    'POST login' => function () {
        $code = json_body()['code'] ?? '';
        if (!is_string($code) || $code === '' || strlen($code) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the access code.', 422);
        }
        return admin_login($code);
    },
    'POST mfa-verify' => function () {
        $token = json_body()['token'] ?? '';
        if (!is_string($token) || trim($token) === '' || strlen($token) > 80) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the authenticator or recovery code.', 422);
        }
        return admin_verify_mfa($token);
    },
    'GET mfa-status' => function () {
        require_auth();
        return mfa_status();
    },
    'POST mfa-enroll-start' => function () {
        require_auth();
        require_csrf();
        $accessCode = json_body()['accessCode'] ?? '';
        if (!is_string($accessCode) || $accessCode === '' || strlen($accessCode) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the access code.', 422);
        }
        return admin_start_mfa_enrollment($accessCode);
    },
    'POST mfa-enroll-confirm' => function () {
        require_auth();
        require_csrf();
        $token = json_body()['token'] ?? '';
        if (!is_string($token) || !preg_match('/^\s*\d{6}\s*$/', $token)) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the six-digit authenticator code.', 422);
        }
        return admin_confirm_mfa_enrollment(trim($token));
    },
    'POST mfa-disable' => function () {
        require_auth();
        require_csrf();
        $body = json_body();
        $accessCode = $body['accessCode'] ?? '';
        $token = $body['token'] ?? '';
        if (!is_string($accessCode) || $accessCode === '' || strlen($accessCode) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the access code.', 422);
        }
        if (!is_string($token) || trim($token) === '' || strlen($token) > 80) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the authenticator or recovery code.', 422);
        }
        return admin_disable_mfa($accessCode, $token);
    },
    'POST logout' => function () {
        admin_logout();
        return ['authenticated' => false];
    },
], true);
