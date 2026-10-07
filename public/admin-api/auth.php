<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';

function setup_token_param(mixed $value): string
{
    if (!is_string($value) || !preg_match('/^[a-f0-9]{48}$/', $value)) {
        throw new ApiError('SETUP_LINK_INVALID', 'This setup link is invalid or has expired. Ask an admin for a new one.', 404);
    }
    return $value;
}

api_run([
    'GET session' => function () {
        $session = current_session();
        return [
            'authenticated' => $session['authenticated'],
            'mfaRequired' => $session['mfaRequired'],
            'expired' => $session['expired'],
            'csrfToken' => $session['authenticated'] ? $session['csrf'] : null,
            'user' => $session['user'] ? user_public($session['user']) : null,
        ];
    },
    'POST login' => function () {
        $body = json_body();
        $identifier = $body['identifier'] ?? '';
        $code = $body['code'] ?? '';
        if (!is_string($identifier) || trim($identifier) === '' || strlen($identifier) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter your username or email.', 422);
        }
        if (!is_string($code) || $code === '' || strlen($code) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the access code.', 422);
        }
        return admin_login($identifier, $code);
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
        return user_mfa_status(current_admin());
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
    'POST change-access-code' => function () {
        require_auth();
        require_csrf();
        $body = json_body();
        $current = $body['current'] ?? '';
        if (!is_string($current) || $current === '' || strlen($current) > 200) {
            throw new ApiError('VALIDATION_ERROR', 'Enter your current access code.', 422);
        }
        return ['user' => admin_change_access_code($current, $body['next'] ?? '')];
    },
    'GET setup-info' => function () {
        $user = setup_user_or_fail(setup_token_param($_GET['token'] ?? ''));
        return ['displayName' => $user['displayName'], 'login' => $user['login'], 'title' => $user['title']];
    },
    'POST setup-start' => function () {
        $body = json_body();
        return admin_setup_start(setup_token_param($body['token'] ?? ''), (string) ($body['accessCode'] ?? ''));
    },
    'POST setup-complete' => function () {
        $body = json_body();
        $totp = $body['token2'] ?? '';
        if (!is_string($totp) || !preg_match('/^\s*\d{6}\s*$/', $totp)) {
            throw new ApiError('VALIDATION_ERROR', 'Enter the six-digit authenticator code.', 422);
        }
        return admin_setup_complete(setup_token_param($body['token'] ?? ''), trim($totp));
    },
    'POST logout' => function () {
        admin_logout();
        return ['authenticated' => false];
    },
], true);
