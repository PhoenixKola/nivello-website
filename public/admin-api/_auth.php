<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_users.php';

function request_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https'
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) SESSION_IDLE_SECONDS);
    session_name('nivello_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => request_is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/**
 * A session stays valid only while its user exists, is active, has the same auth version (bumped on
 * disable / access reset) and, when the user has an authenticator, the same authenticator generation.
 */
function session_user_valid(array $session): ?array
{
    $userId = (string) ($session['userId'] ?? '');
    if ($userId === '') {
        return null;
    }
    $user = user_by_id($userId);
    if (!$user || $user['status'] !== 'active' || (int) ($session['authVersion'] ?? 0) !== (int) $user['authVersion']) {
        return null;
    }
    $generation = user_mfa_enabled($user) ? (string) $user['mfa']['generation'] : '';
    if ($generation !== '' && !hash_equals($generation, (string) ($session['mfaGeneration'] ?? ''))) {
        return null;
    }
    return $user;
}

/** Returns the session's auth state without keeping the session locked. */
function current_session(): array
{
    admin_session_start();
    $now = time();
    $authenticated = !empty($_SESSION['auth']);
    $mfaRequired = !empty($_SESSION['mfaPending']);
    $expired = false;
    $user = null;
    if ($mfaRequired && $now - (int) ($_SESSION['mfaPendingAt'] ?? 0) > MFA_PENDING_SECONDS) {
        unset($_SESSION['mfaPending'], $_SESSION['mfaPendingAt'], $_SESSION['mfaAttempts'], $_SESSION['mfaUserId']);
        $mfaRequired = false;
        $expired = true;
    }
    if ($authenticated) {
        $idle = $now - (int) ($_SESSION['lastSeen'] ?? 0);
        $age = $now - (int) ($_SESSION['loginAt'] ?? 0);
        $user = session_user_valid($_SESSION);
        if ($idle > SESSION_IDLE_SECONDS || $age > SESSION_MAX_SECONDS || $user === null) {
            $_SESSION = [];
            session_regenerate_id(true);
            $authenticated = false;
            $expired = true;
            $user = null;
        } else {
            $_SESSION['lastSeen'] = $now;
        }
    }
    $csrf = $authenticated ? (string) ($_SESSION['csrf'] ?? '') : '';
    // Release the session lock so long-running requests (scraper polling) never block the UI.
    session_write_close();
    return ['authenticated' => $authenticated, 'mfaRequired' => $mfaRequired, 'expired' => $expired, 'csrf' => $csrf, 'user' => $user];
}

function require_auth(): void
{
    $session = current_session();
    if (!$session['authenticated']) {
        throw $session['expired']
            ? new ApiError('SESSION_EXPIRED', 'Your session expired. Please sign in again.', 401)
            : new ApiError('UNAUTHENTICATED', 'Please sign in.', 401);
    }
    $GLOBALS['__admin_csrf'] = $session['csrf'];
    $GLOBALS['__admin_user'] = $session['user'];
}

function require_csrf(): void
{
    $expected = (string) ($GLOBALS['__admin_csrf'] ?? '');
    $given = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($expected === '' || $given === '' || !hash_equals($expected, $given)) {
        throw new ApiError('CSRF_INVALID', 'Security token missing or invalid. Reload the page and try again.', 403);
    }
}

/** The server access code (legacy owner sign-in) is a password hash (preferred) or plain value, never in the repository. */
function access_code_configured(): bool
{
    return admin_secret('access_code_hash') !== '' || strlen(admin_secret('access_code')) >= 8;
}

function access_code_matches(string $code): bool
{
    $hash = admin_secret('access_code_hash');
    if ($hash !== '') {
        return password_verify($code, $hash);
    }
    $plain = admin_secret('access_code');
    return strlen($plain) >= 8 && hash_equals($plain, $code);
}

function admin_complete_login(array $user, string $mfaGeneration = ''): string
{
    admin_session_start();
    session_regenerate_id(true);
    $now = time();
    $_SESSION = [
        'auth' => true,
        'userId' => $user['id'],
        'authVersion' => (int) $user['authVersion'],
        'loginAt' => $now,
        'lastSeen' => $now,
        'csrf' => bin2hex(random_bytes(32)),
        'mfaGeneration' => $mfaGeneration,
    ];
    $csrf = $_SESSION['csrf'];
    session_write_close();
    users_mutate_one($user['id'], function (array &$u) {
        $u['lastLoginAt'] = now_iso();
    });
    return $csrf;
}

/** Both the client (IP) and the account carry their own failure window; either one can lock sign-in. */
function login_throttles(?array $user): array
{
    $throttles = [new LoginThrottle()];
    if ($user) {
        $throttles[] = new LoginThrottle('user:' . $user['id']);
    }
    return $throttles;
}

function throttle_guard(array $throttles): void
{
    $retryAfter = max(array_map(fn (LoginThrottle $t) => $t->retryAfter(), $throttles));
    if ($retryAfter > 0) {
        throw new ApiError('TOO_MANY_ATTEMPTS', "Too many failed attempts. Try again in {$retryAfter} seconds.", 429, ['retryAfter' => $retryAfter]);
    }
}

function throttle_fail(array $throttles): void
{
    foreach ($throttles as $throttle) {
        $throttle->recordFailure();
    }
    usleep(400000);
}

function throttle_clear(array $throttles): void
{
    foreach ($throttles as $throttle) {
        $throttle->clear();
    }
}

/**
 * Identifier + access code. Unknown, disabled and not-yet-set-up accounts fail exactly like a wrong
 * code, so the response does not reveal which identifiers exist.
 */
function admin_login(string $identifier, string $code): array
{
    $users = users_all();
    if (!access_code_configured() && !array_filter($users, fn ($u) => $u['accessCodeHash'] !== '')) {
        throw new ApiError('ACCESS_NOT_CONFIGURED', 'The admin access code is not configured on the server. See docs/NIVELLO-ADMIN-DEPLOYMENT.md.', 503);
    }
    $user = user_by_identifier($identifier);
    $throttles = login_throttles($user);
    throttle_guard($throttles);

    $ok = $user !== null && $user['status'] === 'active' && user_access_code_matches($user, $code);
    if ($user === null) {
        // Spend comparable time on unknown identifiers.
        password_verify($code, password_hash('nivello-unknown-identifier', PASSWORD_DEFAULT));
    }
    if (!$ok) {
        throttle_fail($throttles);
        throw new ApiError('INVALID_CODE', 'Those sign-in details are not correct.', 401);
    }

    if (user_mfa_enabled($user)) {
        admin_session_start();
        session_regenerate_id(true);
        $_SESSION = [
            'mfaPending' => true,
            'mfaPendingAt' => time(),
            'mfaAttempts' => 0,
            'mfaUserId' => $user['id'],
        ];
        session_write_close();
        return ['authenticated' => false, 'mfaRequired' => true, 'csrfToken' => null];
    }

    throttle_clear($throttles);
    return ['authenticated' => true, 'mfaRequired' => false, 'csrfToken' => admin_complete_login($user)];
}

/** Second factor for the user who passed the first step; never checked against any other account. */
function admin_verify_mfa(string $token): array
{
    admin_session_start();
    $now = time();
    $pending = !empty($_SESSION['mfaPending']) && $now - (int) ($_SESSION['mfaPendingAt'] ?? 0) <= MFA_PENDING_SECONDS;
    $userId = (string) ($_SESSION['mfaUserId'] ?? '');
    session_write_close();
    $user = $pending && $userId !== '' ? user_by_id($userId) : null;
    if (!$user || $user['status'] !== 'active') {
        throw new ApiError('MFA_RESTART_REQUIRED', 'The verification window expired. Sign in again.', 401);
    }
    $throttles = login_throttles($user);
    throttle_guard($throttles);

    $verified = user_verify_factor($user['id'], $token);
    if ($verified === null) {
        throttle_fail($throttles);
        admin_session_start();
        $_SESSION['mfaAttempts'] = (int) ($_SESSION['mfaAttempts'] ?? 0) + 1;
        $restart = $_SESSION['mfaAttempts'] >= LOGIN_MAX_FAILURES;
        if ($restart) {
            $_SESSION = [];
        }
        session_write_close();
        throw new ApiError(
            $restart ? 'MFA_RESTART_REQUIRED' : 'INVALID_MFA_CODE',
            $restart ? 'Too many incorrect codes. Sign in again.' : 'That authenticator or recovery code is not correct.',
            401
        );
    }

    throttle_clear($throttles);
    return [
        'authenticated' => true,
        'mfaRequired' => false,
        'csrfToken' => admin_complete_login(user_by_id($user['id']), (string) $verified['generation']),
        'usedRecoveryCode' => $verified['kind'] === 'recovery',
    ];
}

/** Re-checks the signed-in user's own access code before sensitive account changes. */
function require_own_access_code(array $user, string $accessCode): void
{
    $throttles = login_throttles($user);
    throttle_guard($throttles);
    if (!user_access_code_matches($user, $accessCode)) {
        throttle_fail($throttles);
        throw new ApiError('INVALID_CODE', 'That access code is not correct.', 401);
    }
    throttle_clear($throttles);
}

function admin_start_mfa_enrollment(string $accessCode): array
{
    $user = current_admin();
    require_own_access_code($user, $accessCode);
    if (user_mfa_enabled($user)) {
        throw new ApiError('MFA_ALREADY_ENABLED', 'Authenticator verification is already enabled.', 409);
    }
    $secret = mfa_base32_encode(random_bytes(20));
    admin_session_start();
    $_SESSION['mfaEnrollment'] = ['secret' => $secret, 'createdAt' => time(), 'userId' => $user['id']];
    session_write_close();
    return ['secret' => $secret, 'provisioningUri' => user_provisioning_uri($user, $secret), 'expiresIn' => MFA_ENROLLMENT_SECONDS];
}

function admin_confirm_mfa_enrollment(string $token): array
{
    $user = current_admin();
    $throttles = login_throttles($user);
    throttle_guard($throttles);
    admin_session_start();
    $enrollment = is_array($_SESSION['mfaEnrollment'] ?? null) ? $_SESSION['mfaEnrollment'] : null;
    session_write_close();
    if (!$enrollment || ($enrollment['userId'] ?? '') !== $user['id'] || time() - (int) ($enrollment['createdAt'] ?? 0) > MFA_ENROLLMENT_SECONDS) {
        throw new ApiError('MFA_ENROLLMENT_EXPIRED', 'Authenticator setup expired. Start again.', 409);
    }
    $secret = (string) ($enrollment['secret'] ?? '');
    $step = mfa_matching_step($secret, $token);
    if ($step === null) {
        throttle_fail($throttles);
        throw new ApiError('INVALID_MFA_CODE', 'That authenticator code is not correct.', 422);
    }
    throttle_clear($throttles);
    $enabled = user_mfa_enable($user['id'], $secret, $step);
    admin_session_start();
    $_SESSION['mfaGeneration'] = $enabled['generation'];
    unset($_SESSION['mfaEnrollment']);
    session_write_close();
    return ['status' => user_mfa_status(user_by_id($user['id'])), 'recoveryCodes' => $enabled['recoveryCodes']];
}

function admin_disable_mfa(string $accessCode, string $token): array
{
    $user = current_admin();
    require_own_access_code($user, $accessCode);
    if (!user_mfa_enabled($user)) {
        return user_mfa_status($user);
    }
    $throttles = login_throttles($user);
    if (user_verify_factor($user['id'], $token) === null) {
        throttle_fail($throttles);
        throw new ApiError('INVALID_MFA_CODE', 'That authenticator or recovery code is not correct.', 401);
    }
    $updated = users_mutate_one($user['id'], function (array &$u) {
        $u['mfa'] = blank_mfa();
    });
    admin_session_start();
    $_SESSION['mfaGeneration'] = '';
    session_write_close();
    return user_mfa_status($updated);
}

/** Changes the signed-in user's own access code; other sessions of that user end. */
function admin_change_access_code(string $current, string $next): array
{
    $user = current_admin();
    require_own_access_code($user, $current);
    $next = v_access_code($next);
    $updated = users_mutate_one($user['id'], function (array &$u) use ($next) {
        $u['accessCodeHash'] = password_hash($next, PASSWORD_DEFAULT);
        $u['usesServerAccessCode'] = false;
        $u['authVersion']++;
    });
    admin_session_start();
    $_SESSION['authVersion'] = (int) $updated['authVersion'];
    session_write_close();
    return user_public($updated);
}

// ── One-time account setup (Settings → Team creates the link) ──────────────

function setup_user_or_fail(string $token): array
{
    $user = user_by_setup_token($token);
    if (!$user) {
        throw new ApiError('SETUP_LINK_INVALID', 'This setup link is invalid or has expired. Ask an admin for a new one.', 404);
    }
    return $user;
}

/** Step 1: choose an access code; returns the new authenticator secret. Nothing is saved yet. */
function admin_setup_start(string $token, string $accessCode): array
{
    $throttles = login_throttles(null);
    throttle_guard($throttles);
    $user = user_by_setup_token($token);
    if (!$user) {
        throttle_fail($throttles);
        throw new ApiError('SETUP_LINK_INVALID', 'This setup link is invalid or has expired. Ask an admin for a new one.', 404);
    }
    $accessCode = v_access_code($accessCode);
    $secret = mfa_base32_encode(random_bytes(20));
    admin_session_start();
    session_regenerate_id(true);
    $_SESSION = ['setup' => [
        'userId' => $user['id'],
        'tokenHash' => hash('sha256', $token),
        'codeHash' => password_hash($accessCode, PASSWORD_DEFAULT),
        'secret' => $secret,
        'createdAt' => time(),
    ]];
    session_write_close();
    return ['secret' => $secret, 'provisioningUri' => user_provisioning_uri($user, $secret), 'displayName' => $user['displayName']];
}

/** Step 2: confirm the authenticator; the account becomes active and is signed in. */
function admin_setup_complete(string $token, string $totp): array
{
    $user = setup_user_or_fail($token);
    $throttles = login_throttles($user);
    throttle_guard($throttles);
    admin_session_start();
    $setup = is_array($_SESSION['setup'] ?? null) ? $_SESSION['setup'] : null;
    session_write_close();
    if (!$setup || $setup['userId'] !== $user['id'] || !hash_equals((string) $setup['tokenHash'], hash('sha256', $token)) || time() - (int) $setup['createdAt'] > MFA_ENROLLMENT_SECONDS) {
        throw new ApiError('MFA_ENROLLMENT_EXPIRED', 'Setup expired. Open the link again and restart.', 409);
    }
    $step = mfa_matching_step((string) $setup['secret'], $totp);
    if ($step === null) {
        throttle_fail($throttles);
        throw new ApiError('INVALID_MFA_CODE', 'That authenticator code is not correct.', 422);
    }
    throttle_clear($throttles);
    $codes = mfa_new_recovery_codes();
    $generation = bin2hex(random_bytes(16));
    $active = users_mutate_one($user['id'], function (array &$u) use ($setup, $step, $codes, $generation) {
        $u['accessCodeHash'] = (string) $setup['codeHash'];
        $u['usesServerAccessCode'] = false;
        $u['status'] = 'active';
        $u['setup'] = null;
        $u['authVersion']++;
        $u['mfa'] = [
            'enabled' => true,
            'secret' => (string) $setup['secret'],
            'generation' => $generation,
            'enabledAt' => now_iso(),
            'lastUsedStep' => $step,
            'recoveryCodes' => mfa_hash_recovery_codes($codes),
        ];
    });
    return ['csrfToken' => admin_complete_login($active, $generation), 'recoveryCodes' => $codes, 'authenticated' => true, 'mfaRequired' => false];
}

function admin_logout(): void
{
    admin_session_start();
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'],
        'secure' => $params['secure'],
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_destroy();
}

/** Failed-attempt counter for one subject (client IP by default, or "user:<id>"), kept next to the data file. */
final class LoginThrottle
{
    private string $file;
    private string $key;

    public function __construct(?string $subject = null)
    {
        $this->file = ADMIN_DATA_DIR . '/login-throttle.json';
        $this->key = hash('sha256', $subject ?? (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    }

    public function retryAfter(): int
    {
        $entry = $this->read()[$this->key] ?? null;
        return $entry ? max(0, (int) ($entry['lockedUntil'] ?? 0) - time()) : 0;
    }

    public function recordFailure(): void
    {
        $this->update(function (array $entries) {
            $now = time();
            $entry = $entries[$this->key] ?? ['failures' => 0, 'first' => $now, 'lockedUntil' => 0];
            if ($now - (int) $entry['first'] > LOGIN_FAILURE_WINDOW_SECONDS) {
                $entry = ['failures' => 0, 'first' => $now, 'lockedUntil' => 0];
            }
            $entry['failures']++;
            if ($entry['failures'] >= LOGIN_MAX_FAILURES) {
                $lock = min(LOGIN_MAX_LOCK_SECONDS, 60 * (2 ** ($entry['failures'] - LOGIN_MAX_FAILURES)));
                $entry['lockedUntil'] = $now + $lock;
            }
            $entries[$this->key] = $entry;
            return array_filter($entries, fn ($e) => $now - (int) $e['first'] < LOGIN_FAILURE_WINDOW_SECONDS + LOGIN_MAX_LOCK_SECONDS);
        });
    }

    public function clear(): void
    {
        $this->update(function (array $entries) {
            unset($entries[$this->key]);
            return $entries;
        });
    }

    private function read(): array
    {
        $raw = is_file($this->file) ? @file_get_contents($this->file) : false;
        $data = $raw ? json_decode($raw, true) : null;
        return is_array($data) ? $data : [];
    }

    private function update(callable $fn): void
    {
        if (!is_dir(ADMIN_DATA_DIR) && !@mkdir(ADMIN_DATA_DIR, 0770, true)) {
            error_log('[nivello-admin] login throttle unavailable: data directory missing');
            return;
        }
        $handle = @fopen($this->file, 'c+');
        if ($handle === false) {
            error_log('[nivello-admin] login throttle unavailable: cannot open file');
            return;
        }
        try {
            flock($handle, LOCK_EX);
            $raw = stream_get_contents($handle);
            $entries = $raw ? json_decode($raw, true) : [];
            $entries = $fn(is_array($entries) ? $entries : []);
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode($entries));
            fflush($handle);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
