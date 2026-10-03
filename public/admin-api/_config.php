<?php
// Nivello admin configuration: non-secret settings only. The access code, GitHub token and
// callback secret live outside the repository (see admin_secret() below).
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

// Persistent data lives outside the web root so deploys (which rewrite public_html) cannot touch it.
// NIVELLO_ADMIN_DATA_DIR may override it for local development and tests.
function admin_private_root(string $documentRoot): string
{
    $documentRoot = rtrim(str_replace(chr(92), '/', $documentRoot), '/');
    // Hetzner konsoleH serves /usr/www/users/<login>; the private home is /usr/home/<login>.
    if (preg_match('#^/usr/www/users/([^/]+)$#', $documentRoot, $m) && is_dir('/usr/home/' . $m[1])) {
        return '/usr/home/' . $m[1];
    }
    return dirname($documentRoot);
}

define(
    'ADMIN_DATA_DIR',
    getenv('NIVELLO_ADMIN_DATA_DIR')
        ?: admin_private_root((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__ . '/..')) . '/nivello-admin-data'
);

/**
 * Server-side secrets, read from (in order):
 *   1. environment variables (NIVELLO_ADMIN_ACCESS_CODE[_HASH], NIVELLO_GITHUB_TOKEN, NIVELLO_ADMIN_CALLBACK_SECRET)
 *   2. a PHP file outside the web root: <parent of public_html>/nivello-admin-secrets.php
 *      returning ['access_code' or 'access_code_hash' => '...', 'github_token' => '...', 'callback_secret' => '...']
 * See docs/NIVELLO-ADMIN-DEPLOYMENT.md. Never commit real values: the repository is public.
 */
function admin_secret(string $key): string
{
    static $file = null;
    $env = [
        'access_code' => 'NIVELLO_ADMIN_ACCESS_CODE',
        'access_code_hash' => 'NIVELLO_ADMIN_ACCESS_CODE_HASH',
        'github_token' => 'NIVELLO_GITHUB_TOKEN',
        'callback_secret' => 'NIVELLO_ADMIN_CALLBACK_SECRET',
    ][$key] ?? null;
    if ($env !== null && ($value = getenv($env)) !== false && $value !== '') {
        return $value;
    }
    if ($file === null) {
        $path = getenv('NIVELLO_ADMIN_SECRETS_FILE') ?: dirname(ADMIN_DATA_DIR) . '/nivello-admin-secrets.php';
        $loaded = is_file($path) ? (static fn () => include $path)() : [];
        $file = is_array($loaded) ? $loaded : [];
    }
    return is_string($file[$key] ?? null) ? $file[$key] : '';
}

// GitHub Actions lead discovery (non-secret settings).
define('GITHUB_OWNER', getenv('NIVELLO_GITHUB_OWNER') ?: 'PhoenixKola');
define('GITHUB_REPO', getenv('NIVELLO_GITHUB_REPO') ?: 'nivello-website');
define('GITHUB_WORKFLOW_FILE', getenv('NIVELLO_GITHUB_WORKFLOW_FILE') ?: 'nivello-lead-discovery.yml');
define('GITHUB_WORKFLOW_REF', getenv('NIVELLO_GITHUB_WORKFLOW_REF') ?: 'main');
// Overridable only so local tests can point at the mock GitHub API (scripts/mock-github-actions.mjs).
define('GITHUB_API_BASE', getenv('NIVELLO_GITHUB_API_BASE') ?: 'https://api.github.com');
// Public base URL the runner calls back to. Empty = derive from the current HTTPS request host.
define('ADMIN_PUBLIC_BASE_URL', getenv('NIVELLO_ADMIN_PUBLIC_BASE_URL') ?: '');

const SESSION_IDLE_SECONDS = 12 * 3600;
const SESSION_MAX_SECONDS = 7 * 24 * 3600;
const MFA_PENDING_SECONDS = 5 * 60;
const MFA_ENROLLMENT_SECONDS = 10 * 60;

const LOGIN_MAX_FAILURES = 5;
const LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_LOCK_SECONDS = 15 * 60;

const BACKUP_MIN_INTERVAL_SECONDS = 6 * 3600;
const BACKUP_KEEP = 14;

const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024;
const MAX_CSV_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 10000;
const MAX_TARGET_LEADS = 5000;
