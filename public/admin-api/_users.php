<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/*
 * Admin identities. Each user has their own login identifier, access-code hash, authenticator (TOTP)
 * state, recovery codes, session version and failure counters. Nothing here is shared between users:
 * a code issued to one user's authenticator can never authenticate another user.
 *
 * Stored privately in <data>/auth/users.json (0600). Private details (emails, codes) are never in the
 * repository: the first user is migrated from the existing server access code + authenticator, and
 * further users are created in Settings → Team with a one-time setup link.
 */

const ADMIN_ROLES = ['admin'];
const ADMIN_USER_STATUSES = ['active', 'invited', 'disabled'];
const ADMIN_SETUP_LINK_SECONDS = 72 * 3600;
const ADMIN_ACCESS_CODE_MIN = 12;
const ADMIN_USER_LIMIT = 25;
/** The existing single admin becomes this account; the server access code keeps working for it. */
const ADMIN_LEGACY_USER = ['displayName' => 'Francesko CTO', 'title' => 'CTO', 'login' => 'francesko'];

function users_store(): Store
{
    return Store::document('auth/users', fn () => ['version' => 1, 'users' => []]);
}

function blank_mfa(): array
{
    return ['enabled' => false, 'secret' => '', 'generation' => '', 'enabledAt' => '', 'lastUsedStep' => -1, 'recoveryCodes' => []];
}

function blank_admin_user(): array
{
    $now = now_iso();
    return [
        'id' => new_id('usr'),
        'displayName' => '',
        'title' => '',
        'email' => '',
        'login' => '',
        'role' => 'admin',
        'status' => 'invited',
        'accessCodeHash' => '',
        // true = this user signs in with the server-configured access code (the pre-multi-user setup).
        'usesServerAccessCode' => false,
        'mfa' => blank_mfa(),
        'authVersion' => 1,
        'setup' => null,
        'createdAt' => $now,
        'updatedAt' => $now,
        'lastLoginAt' => null,
    ];
}

/** Normalizes a stored record so older/partial records keep loading. */
function normalize_admin_user(array $user): array
{
    $user = array_replace(blank_admin_user(), $user);
    $user['mfa'] = array_replace(blank_mfa(), is_array($user['mfa'] ?? null) ? $user['mfa'] : []);
    if (!in_array($user['status'], ADMIN_USER_STATUSES, true)) {
        $user['status'] = 'disabled';
    }
    if (!in_array($user['role'], ADMIN_ROLES, true)) {
        $user['role'] = 'admin';
    }
    return $user;
}

/** The first read seeds the legacy owner account from the server access code and the old global authenticator. */
function users_migrate(array &$state): bool
{
    if (!empty($state['users'])) {
        return false;
    }
    $user = blank_admin_user();
    $user['displayName'] = ADMIN_LEGACY_USER['displayName'];
    $user['title'] = ADMIN_LEGACY_USER['title'];
    $user['login'] = ADMIN_LEGACY_USER['login'];
    $user['status'] = 'active';
    $user['usesServerAccessCode'] = true;
    if (function_exists('mfa_state')) {
        $legacy = mfa_state();
        if (!empty($legacy['enabled']) && is_string($legacy['secret'] ?? null) && $legacy['secret'] !== '') {
            $user['mfa'] = array_replace(blank_mfa(), array_intersect_key($legacy, blank_mfa()));
        }
    }
    $state['users'] = [$user];
    return true;
}

function users_protect_file(): void
{
    @chmod(ADMIN_DATA_DIR . '/auth/users.json', 0600);
    @chmod(ADMIN_DATA_DIR . '/auth/users.lock', 0600);
}

function users_all(): array
{
    $state = users_store()->read();
    if (empty($state['users'])) {
        $state = users_store()->mutate(function (array &$s, bool &$dirty) {
            $dirty = users_migrate($s);
            return $s;
        });
        users_protect_file();
    }
    return array_map('normalize_admin_user', $state['users']);
}

function user_by_id(string $id): ?array
{
    foreach (users_all() as $user) {
        if ($user['id'] === $id) {
            return $user;
        }
    }
    return null;
}

/** Matches a login identifier (username or email, case-insensitive). */
function user_by_identifier(string $identifier): ?array
{
    $needle = mb_strtolower(trim($identifier));
    if ($needle === '') {
        return null;
    }
    foreach (users_all() as $user) {
        if ($user['login'] !== '' && mb_strtolower($user['login']) === $needle) {
            return $user;
        }
        if ($user['email'] !== '' && mb_strtolower($user['email']) === $needle) {
            return $user;
        }
    }
    return null;
}

/** Applies $fn to one user inside the users-document lock and returns the normalized result. */
function users_mutate_one(string $id, callable $fn): array
{
    $result = users_store()->mutate(function (array &$state) use ($id, $fn) {
        users_migrate($state);
        foreach ($state['users'] as $i => $user) {
            if ($user['id'] === $id) {
                $user = normalize_admin_user($user);
                $fn($user, $state);
                $user['updatedAt'] = now_iso();
                $state['users'][$i] = $user;
                return $user;
            }
        }
        throw new ApiError('NOT_FOUND', 'User not found.', 404);
    });
    users_protect_file();
    return $result;
}

/** Safe shape for the browser: never hashes, secrets, recovery codes or setup tokens. */
function user_public(array $user): array
{
    return [
        'id' => $user['id'],
        'displayName' => $user['displayName'],
        'title' => $user['title'],
        'email' => $user['email'],
        'login' => $user['login'],
        'role' => $user['role'],
        'status' => $user['status'],
        'mfaEnabled' => user_mfa_enabled($user),
        'usesServerAccessCode' => (bool) $user['usesServerAccessCode'],
        'setupPending' => $user['status'] === 'invited',
        'setupExpiresAt' => is_array($user['setup']) ? $user['setup']['expiresAt'] : null,
        'createdAt' => $user['createdAt'],
        'updatedAt' => $user['updatedAt'],
        'lastLoginAt' => $user['lastLoginAt'],
    ];
}

/** Minimal shape for pickers and attribution. */
function user_brief(array $user): array
{
    return ['id' => $user['id'], 'displayName' => $user['displayName'], 'title' => $user['title'], 'status' => $user['status']];
}

function user_mfa_enabled(array $user): bool
{
    return !empty($user['mfa']['enabled']) && is_string($user['mfa']['secret'] ?? null) && $user['mfa']['secret'] !== '';
}

function user_access_code_matches(array $user, string $code): bool
{
    if ($user['accessCodeHash'] !== '') {
        return password_verify($code, $user['accessCodeHash']);
    }
    return !empty($user['usesServerAccessCode']) && access_code_configured() && access_code_matches($code);
}

function v_access_code(mixed $value): string
{
    if (!is_string($value) || mb_strlen($value) < ADMIN_ACCESS_CODE_MIN || strlen($value) > 200) {
        throw new ApiError('VALIDATION_ERROR', 'Choose an access code of at least ' . ADMIN_ACCESS_CODE_MIN . ' characters.', 422);
    }
    return $value;
}

function v_login(mixed $value): string
{
    $login = mb_strtolower(trim(is_string($value) ? $value : ''));
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,39}$/', $login)) {
        throw new ApiError('VALIDATION_ERROR', 'Username must be 3–40 characters: letters, numbers, dots, dashes or underscores.', 422);
    }
    return $login;
}

/** Verifies and consumes one TOTP step or recovery code of a single user, atomically. */
function user_verify_factor(string $userId, string $token): ?array
{
    $result = users_store()->mutate(function (array &$state, bool &$dirty) use ($userId, $token) {
        $dirty = false;
        foreach ($state['users'] as $i => $raw) {
            if (($raw['id'] ?? null) !== $userId) {
                continue;
            }
            $user = normalize_admin_user($raw);
            if (!user_mfa_enabled($user)) {
                return null;
            }
            $step = mfa_matching_step($user['mfa']['secret'], $token);
            if ($step !== null) {
                if ($step <= (int) $user['mfa']['lastUsedStep']) {
                    return null;
                }
                $user['mfa']['lastUsedStep'] = $step;
                $state['users'][$i] = $user;
                $dirty = true;
                return ['kind' => 'totp', 'generation' => (string) $user['mfa']['generation']];
            }
            $normalized = mfa_normalize_recovery_code($token);
            if (!preg_match('/^[A-Z2-9]{12}$/', $normalized)) {
                return null;
            }
            foreach ($user['mfa']['recoveryCodes'] as $index => $hash) {
                if (is_string($hash) && password_verify($normalized, $hash)) {
                    array_splice($user['mfa']['recoveryCodes'], $index, 1);
                    $state['users'][$i] = $user;
                    $dirty = true;
                    return ['kind' => 'recovery', 'generation' => (string) $user['mfa']['generation']];
                }
            }
            return null;
        }
        return null;
    });
    users_protect_file();
    return $result;
}

function user_mfa_status(array $user): array
{
    return [
        'enabled' => user_mfa_enabled($user),
        'enabledAt' => $user['mfa']['enabledAt'] !== '' ? $user['mfa']['enabledAt'] : null,
        'recoveryCodesRemaining' => count($user['mfa']['recoveryCodes']),
    ];
}

/** Enables an authenticator for one user; returns the plain recovery codes once. */
function user_mfa_enable(string $userId, string $secret, int $step): array
{
    $codes = mfa_new_recovery_codes();
    $generation = bin2hex(random_bytes(16));
    users_mutate_one($userId, function (array &$user) use ($secret, $step, $codes, $generation) {
        $user['mfa'] = [
            'enabled' => true,
            'secret' => $secret,
            'generation' => $generation,
            'enabledAt' => now_iso(),
            'lastUsedStep' => $step,
            'recoveryCodes' => mfa_hash_recovery_codes($codes),
        ];
    });
    return ['generation' => $generation, 'recoveryCodes' => $codes];
}

function user_provisioning_uri(array $user, string $secret): string
{
    $label = 'Nivello Admin (' . ($user['login'] ?: $user['displayName']) . ')';
    return 'otpauth://totp/' . rawurlencode('Nivello:' . $label)
        . '?secret=' . rawurlencode($secret)
        . '&issuer=Nivello&algorithm=SHA1&digits=6&period=30';
}

function active_admin_count(array $users): int
{
    return count(array_filter($users, fn ($u) => $u['status'] === 'active' && $u['role'] === 'admin'));
}

/** A fresh one-time setup token; only its hash is stored. */
function new_setup_token(): array
{
    $token = bin2hex(random_bytes(24));
    return [$token, ['tokenHash' => hash('sha256', $token), 'expiresAt' => now_iso(time() + ADMIN_SETUP_LINK_SECONDS)]];
}

function user_by_setup_token(string $token): ?array
{
    if (!preg_match('/^[a-f0-9]{48}$/', $token)) {
        return null;
    }
    $hash = hash('sha256', $token);
    foreach (users_all() as $user) {
        $setup = $user['setup'];
        if ($user['status'] !== 'disabled' && is_array($setup) && hash_equals((string) ($setup['tokenHash'] ?? ''), $hash) && (iso_to_ts($setup['expiresAt'] ?? null) ?? 0) > time()) {
            return $user;
        }
    }
    return null;
}

// ── Attribution ─────────────────────────────────────────────────────────────

/** The authenticated user for this request (set by require_auth()). */
function current_admin(): ?array
{
    return $GLOBALS['__admin_user'] ?? null;
}

/** Actor fields for activity records; empty for unauthenticated contexts (callbacks, runners). */
function activity_actor(): array
{
    $user = current_admin();
    return $user ? ['actorId' => $user['id'], 'actorName' => $user['displayName']] : [];
}
