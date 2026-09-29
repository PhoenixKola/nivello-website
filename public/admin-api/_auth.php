<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

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

/** Returns the session's auth state without keeping the session locked. */
function current_session(): array
{
    admin_session_start();
    $now = time();
    $authenticated = !empty($_SESSION['auth']);
    $expired = false;
    if ($authenticated) {
        $idle = $now - (int) ($_SESSION['lastSeen'] ?? 0);
        $age = $now - (int) ($_SESSION['loginAt'] ?? 0);
        if ($idle > SESSION_IDLE_SECONDS || $age > SESSION_MAX_SECONDS) {
            $_SESSION = [];
            session_regenerate_id(true);
            $authenticated = false;
            $expired = true;
        } else {
            $_SESSION['lastSeen'] = $now;
        }
    }
    $csrf = $authenticated ? (string) ($_SESSION['csrf'] ?? '') : '';
    // Release the session lock so long-running requests (scraper polling) never block the UI.
    session_write_close();
    return ['authenticated' => $authenticated, 'expired' => $expired, 'csrf' => $csrf];
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
}

function require_csrf(): void
{
    $expected = (string) ($GLOBALS['__admin_csrf'] ?? '');
    $given = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($expected === '' || $given === '' || !hash_equals($expected, $given)) {
        throw new ApiError('CSRF_INVALID', 'Security token missing or invalid. Reload the page and try again.', 403);
    }
}

/** The access code is configured as a password hash (preferred) or plain value, never in the repository. */
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

function admin_login(string $code): string
{
    if (!access_code_configured()) {
        throw new ApiError('ACCESS_NOT_CONFIGURED', 'The admin access code is not configured on the server. See docs/NIVELLO-ADMIN-DEPLOYMENT.md.', 503);
    }
    $throttle = new LoginThrottle();
    $retryAfter = $throttle->retryAfter();
    if ($retryAfter > 0) {
        throw new ApiError('TOO_MANY_ATTEMPTS', "Too many failed attempts. Try again in {$retryAfter} seconds.", 429, ['retryAfter' => $retryAfter]);
    }
    if (!access_code_matches($code)) {
        $throttle->recordFailure();
        usleep(400000);
        throw new ApiError('INVALID_CODE', 'That access code is not correct.', 401);
    }
    $throttle->clear();

    admin_session_start();
    session_regenerate_id(true);
    $now = time();
    $_SESSION = [
        'auth' => true,
        'loginAt' => $now,
        'lastSeen' => $now,
        'csrf' => bin2hex(random_bytes(32)),
    ];
    $csrf = $_SESSION['csrf'];
    session_write_close();
    return $csrf;
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

/** Per-client failed-login counter kept next to the data file. */
final class LoginThrottle
{
    private string $file;
    private string $key;

    public function __construct()
    {
        $this->file = ADMIN_DATA_DIR . '/login-throttle.json';
        $this->key = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
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
