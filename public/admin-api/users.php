<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';

/** Settings → Team. Every action is authenticated + CSRF-checked by api_run; secrets never leave the server. */

function team_payload(): array
{
    $me = current_admin();
    return ['users' => array_map('user_public', users_all()), 'meId' => $me['id']];
}

/** Display fields shared by create and update; login and email must be unique. */
function team_fields(array $in, array $users, ?string $selfId): array
{
    $fields = [];
    if (array_key_exists('displayName', $in)) {
        $fields['displayName'] = v_string($in['displayName'], 'Display name', 60, true);
    }
    if (array_key_exists('title', $in)) {
        $fields['title'] = v_string($in['title'], 'Title', 60);
    }
    if (array_key_exists('login', $in)) {
        $fields['login'] = v_login($in['login']);
    }
    if (array_key_exists('email', $in)) {
        $fields['email'] = $in['email'] === '' || $in['email'] === null ? '' : mb_strtolower(v_email($in['email'], 'Email'));
    }
    foreach ($users as $other) {
        if ($other['id'] === $selfId) {
            continue;
        }
        if (isset($fields['login']) && mb_strtolower($other['login']) === $fields['login']) {
            throw new ApiError('VALIDATION_ERROR', 'Another account already uses that username.', 422);
        }
        if (!empty($fields['email']) && mb_strtolower($other['email']) === $fields['email']) {
            throw new ApiError('VALIDATION_ERROR', 'Another account already uses that email.', 422);
        }
    }
    return $fields;
}

/** Refuses a change that would leave no active admin; changes to your own account need an explicit confirmation. */
function guard_last_admin(string $targetId, bool $confirmSelf): void
{
    $users = users_all();
    $remaining = array_filter($users, fn ($u) => $u['id'] !== $targetId && $u['status'] === 'active' && $u['role'] === 'admin');
    if (!$remaining) {
        throw new ApiError('LAST_ADMIN', 'This is the last active admin. Activate another admin first.', 409);
    }
    if ($targetId === current_admin()['id'] && !$confirmSelf) {
        throw new ApiError('CONFIRM_SELF', 'This affects your own account and will sign you out. Confirm to continue.', 409);
    }
}

function setup_url(string $token): string
{
    return '/admin/#/setup?token=' . $token;
}

api_run([
    'GET list' => fn () => team_payload(),
    'GET people' => fn () => ['users' => array_map('user_brief', users_all())],
    'POST create' => function () {
        $in = json_body()['user'] ?? null;
        if (!is_array($in)) {
            throw new ApiError('VALIDATION_ERROR', 'User details are required.', 422);
        }
        $fields = team_fields($in + ['login' => '', 'displayName' => ''], users_all(), null);
        [$token, $setup] = new_setup_token();
        $actor = current_admin();
        $created = users_store()->mutate(function (array &$state) use ($fields, $setup) {
            users_migrate($state);
            if (count($state['users']) >= ADMIN_USER_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'User limit reached.', 422);
            }
            $user = array_replace(blank_admin_user(), $fields, ['status' => 'invited', 'setup' => $setup]);
            $state['users'][] = $user;
            return $user;
        });
        users_protect_file();
        error_log('[nivello-admin] admin user ' . $created['id'] . ' created by ' . $actor['id']);
        return team_payload() + ['created' => user_public($created), 'setupUrl' => setup_url($token)];
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'usr', 'User');
        $in = is_array($body['user'] ?? null) ? $body['user'] : [];
        $fields = team_fields(array_intersect_key($in, array_flip(['displayName', 'title', 'login', 'email'])), users_all(), $id);
        users_mutate_one($id, function (array &$user) use ($fields) {
            $user = array_replace($user, $fields);
        });
        return team_payload();
    },
    'POST set-status' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'usr', 'User');
        $status = v_enum($body['status'] ?? '', 'Status', ['active', 'disabled']);
        if ($status === 'disabled') {
            guard_last_admin($id, v_bool($body['confirmSelf'] ?? false));
        }
        users_mutate_one($id, function (array &$user) use ($status) {
            if ($status === 'disabled') {
                $user['status'] = 'disabled';
                $user['authVersion']++;
                $user['setup'] = null;
                return;
            }
            // Re-enabled accounts without credentials go back to "invited" and need a setup link.
            $hasCredentials = $user['accessCodeHash'] !== '' || !empty($user['usesServerAccessCode']);
            $user['status'] = $hasCredentials ? 'active' : 'invited';
        });
        return team_payload();
    },
    'POST setup-link' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'usr', 'User');
        $target = user_by_id($id) ?? throw new ApiError('NOT_FOUND', 'User not found.', 404);
        $reset = $target['status'] === 'active';
        if ($reset) {
            // Resetting an active account clears its access code and authenticator until the new setup is done.
            guard_last_admin($id, v_bool($body['confirmSelf'] ?? false));
        }
        [$token, $setup] = new_setup_token();
        users_mutate_one($id, function (array &$user) use ($setup, $reset) {
            if ($user['status'] === 'disabled') {
                throw new ApiError('VALIDATION_ERROR', 'Enable the account first.', 422);
            }
            $user['setup'] = $setup;
            if ($reset) {
                $user['status'] = 'invited';
                $user['accessCodeHash'] = '';
                $user['usesServerAccessCode'] = false;
                $user['mfa'] = blank_mfa();
                $user['authVersion']++;
            }
        });
        return team_payload() + ['setupUrl' => setup_url($token)];
    },
]);
