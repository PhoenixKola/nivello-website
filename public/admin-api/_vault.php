<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/*
 * Encrypted project credentials. Secrets and notes are encrypted at rest with authenticated encryption:
 * libsodium secretbox (XSalsa20-Poly1305) when available, otherwise OpenSSL AES-256-GCM. The 32-byte
 * master key comes from the private secrets file / environment (credentials_key), never from the
 * repository, never from a user's access code, and is never returned or logged. If no key or no safe
 * primitive is available, the vault refuses to store or reveal anything (fail closed).
 *
 * Stored in <data>/vault/credentials.json (0600), separate from the main CRM document and its exports.
 */

const CREDENTIAL_TYPES = ['hosting', 'sftp', 'domain', 'email', 'cms', 'database', 'github', 'api', 'other'];
const CREDENTIAL_LIMIT = 2000;

function vault_store(): Store
{
    return Store::document('vault/credentials', fn () => ['version' => 1, 'items' => []]);
}

function vault_protect_file(): void
{
    @chmod(ADMIN_DATA_DIR . '/vault', 0700);
    @chmod(ADMIN_DATA_DIR . '/vault/credentials.json', 0600);
    @chmod(ADMIN_DATA_DIR . '/vault/credentials.lock', 0600);
}

/** The best available authenticated cipher, or null. */
function vault_algorithm(): ?string
{
    if (function_exists('sodium_crypto_secretbox') && function_exists('sodium_crypto_secretbox_open')) {
        return 'sodium-secretbox';
    }
    if (function_exists('openssl_encrypt') && in_array('aes-256-gcm', array_map('strtolower', openssl_get_cipher_methods()), true)) {
        return 'aes-256-gcm';
    }
    return null;
}

/** The decoded 32-byte master key, or null when it is missing or malformed. */
function vault_key(): ?string
{
    $raw = trim(admin_secret('credentials_key'));
    if ($raw === '') {
        return null;
    }
    $raw = str_starts_with($raw, 'base64:') ? substr($raw, 7) : $raw;
    $key = base64_decode($raw, true);
    return is_string($key) && strlen($key) === 32 ? $key : null;
}

function vault_key_id(string $key): string
{
    return substr(hash('sha256', 'nivello-vault|' . $key), 0, 12);
}

/** Why the vault cannot be used right now, or null when it can. */
function vault_problem(): ?string
{
    if (vault_algorithm() === null) {
        return 'PHP on this server has neither libsodium nor OpenSSL AES-256-GCM, so credentials cannot be stored safely.';
    }
    if (vault_key() === null) {
        return 'The credentials master key (credentials_key) is not configured. See docs/NIVELLO-ADMIN-DEPLOYMENT.md.';
    }
    return null;
}

function vault_require(): array
{
    $problem = vault_problem();
    if ($problem !== null) {
        throw new ApiError('VAULT_UNAVAILABLE', $problem, 503);
    }
    return [vault_key(), vault_algorithm()];
}

/** Encrypts a payload bound to one credential id; returns the stored envelope. */
function vault_encrypt(array $payload, string $credentialId): array
{
    [$key, $alg] = vault_require();
    $plain = json_encode(['id' => $credentialId] + $payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if ($alg === 'sodium-secretbox') {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = sodium_crypto_secretbox($plain, $nonce, $key);
        $tag = '';
    } else {
        $nonce = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, $credentialId, 16);
        if ($cipher === false) {
            throw new ApiError('VAULT_UNAVAILABLE', 'Encryption failed. Nothing was saved.', 500);
        }
    }
    return ['alg' => $alg, 'keyId' => vault_key_id($key), 'nonce' => base64_encode($nonce), 'tag' => base64_encode($tag), 'data' => base64_encode($cipher)];
}

function vault_decrypt(array $envelope, string $credentialId): array
{
    $key = vault_key();
    if ($key === null) {
        throw new ApiError('VAULT_UNAVAILABLE', 'The credentials master key (credentials_key) is not configured.', 503);
    }
    if (!hash_equals((string) ($envelope['keyId'] ?? ''), vault_key_id($key))) {
        throw new ApiError('VAULT_KEY_MISMATCH', 'This credential was encrypted with a different master key. Restore the original credentials_key to read it.', 409);
    }
    $nonce = base64_decode((string) ($envelope['nonce'] ?? ''), true);
    $data = base64_decode((string) ($envelope['data'] ?? ''), true);
    $plain = false;
    if (($envelope['alg'] ?? '') === 'sodium-secretbox' && function_exists('sodium_crypto_secretbox_open') && $nonce !== false && $data !== false) {
        $plain = sodium_crypto_secretbox_open($data, $nonce, $key);
    } elseif (($envelope['alg'] ?? '') === 'aes-256-gcm' && function_exists('openssl_decrypt') && $nonce !== false && $data !== false) {
        $tag = base64_decode((string) ($envelope['tag'] ?? ''), true);
        $plain = $tag === false ? false : openssl_decrypt($data, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, $credentialId);
    }
    $payload = is_string($plain) ? json_decode($plain, true) : null;
    if (!is_array($payload) || ($payload['id'] ?? null) !== $credentialId) {
        throw new ApiError('VAULT_DECRYPT_FAILED', 'This credential could not be decrypted. It may be damaged or use an unsupported cipher on this server.', 409);
    }
    unset($payload['id']);
    return $payload;
}

function vault_items(): array
{
    return vault_store()->read()['items'];
}

/** Metadata only: never the secret or the notes. */
function credential_public(array $item): array
{
    $people = project_people_index();
    return [
        'id' => $item['id'],
        'projectId' => $item['projectId'],
        'type' => $item['type'],
        'label' => $item['label'],
        'username' => $item['username'],
        'urlOrHost' => $item['urlOrHost'],
        'hasSecret' => (bool) $item['hasSecret'],
        'hasNotes' => (bool) $item['hasNotes'],
        'createdAt' => $item['createdAt'],
        'updatedAt' => $item['updatedAt'],
        'createdBy' => $people[$item['createdByUserId'] ?? ''] ?? null,
        'updatedBy' => $people[$item['updatedByUserId'] ?? ''] ?? null,
    ];
}

function credential_fields(array $in): array
{
    return [
        'type' => v_enum($in['type'] ?? 'other', 'Type', CREDENTIAL_TYPES),
        'label' => v_string($in['label'] ?? '', 'Label', 80, true),
        'username' => v_string($in['username'] ?? '', 'Username or email', 200),
        'urlOrHost' => v_string($in['urlOrHost'] ?? '', 'URL or host', 300),
    ];
}

/** Removes every credential of a deleted project. */
function vault_delete_project(string $projectId): void
{
    if (!vault_store()->exists()) {
        return;
    }
    vault_store()->mutate(function (array &$state, bool &$dirty) use ($projectId) {
        $before = count($state['items']);
        $state['items'] = array_values(array_filter($state['items'], fn ($i) => $i['projectId'] !== $projectId));
        $dirty = count($state['items']) !== $before;
    });
}
