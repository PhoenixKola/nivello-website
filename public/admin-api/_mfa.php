<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/** File-backed TOTP configuration. The seed stays outside public_html. */
function mfa_store(): Store
{
    return Store::document('auth/mfa', fn () => [
        'version' => 1,
        'enabled' => false,
        'secret' => '',
        'generation' => '',
        'enabledAt' => '',
        'lastUsedStep' => -1,
        'recoveryCodes' => [],
    ]);
}

function mfa_state(): array
{
    return mfa_store()->read();
}

function mfa_status(): array
{
    $state = mfa_state();
    return [
        'enabled' => !empty($state['enabled']) && is_string($state['secret']) && $state['secret'] !== '',
        'enabledAt' => is_string($state['enabledAt'] ?? null) && $state['enabledAt'] !== '' ? $state['enabledAt'] : null,
        'recoveryCodesRemaining' => count(is_array($state['recoveryCodes'] ?? null) ? $state['recoveryCodes'] : []),
    ];
}

function mfa_enabled(): bool
{
    return mfa_status()['enabled'];
}

function mfa_generation(): string
{
    $state = mfa_state();
    return !empty($state['enabled']) && is_string($state['generation'] ?? null) ? $state['generation'] : '';
}

function mfa_session_authorized(array $session): bool
{
    $generation = mfa_generation();
    return $generation === '' || hash_equals($generation, (string) ($session['mfaGeneration'] ?? ''));
}

function mfa_base32_encode(string $bytes): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $buffer = 0;
    $bits = 0;
    $encoded = '';
    foreach (unpack('C*', $bytes) ?: [] as $byte) {
        $buffer = ($buffer << 8) | $byte;
        $bits += 8;
        while ($bits >= 5) {
            $bits -= 5;
            $encoded .= $alphabet[($buffer >> $bits) & 31];
        }
        $buffer &= $bits > 0 ? (1 << $bits) - 1 : 0;
    }
    if ($bits > 0) {
        $encoded .= $alphabet[($buffer << (5 - $bits)) & 31];
    }
    return $encoded;
}

function mfa_base32_decode(string $encoded): string
{
    $encoded = strtoupper(preg_replace('/[^A-Z2-7]/i', '', $encoded) ?? '');
    $alphabet = array_flip(str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'));
    $buffer = 0;
    $bits = 0;
    $decoded = '';
    foreach (str_split($encoded) as $char) {
        if (!isset($alphabet[$char])) {
            return '';
        }
        $buffer = ($buffer << 5) | $alphabet[$char];
        $bits += 5;
        if ($bits >= 8) {
            $bits -= 8;
            $decoded .= chr(($buffer >> $bits) & 255);
            $buffer &= $bits > 0 ? (1 << $bits) - 1 : 0;
        }
    }
    return $decoded;
}

/** RFC 6238 code. $digits is exposed for the RFC test vectors. */
function mfa_totp_code(string $secret, int $timestamp, int $digits = 6): string
{
    $key = mfa_base32_decode($secret);
    if ($key === '' || $digits < 6 || $digits > 8) {
        return '';
    }
    $counter = intdiv($timestamp, 30);
    $message = pack('N2', ($counter >> 32) & 0xffffffff, $counter & 0xffffffff);
    $digest = hash_hmac('sha1', $message, $key, true);
    $offset = ord($digest[19]) & 15;
    $binary = (unpack('N', substr($digest, $offset, 4))[1] ?? 0) & 0x7fffffff;
    $modulus = 10 ** $digits;
    return str_pad((string) ($binary % $modulus), $digits, '0', STR_PAD_LEFT);
}

function mfa_matching_step(string $secret, string $token, ?int $timestamp = null): ?int
{
    $token = preg_replace('/\s+/', '', $token) ?? '';
    if (!preg_match('/^\d{6}$/', $token)) {
        return null;
    }
    $now = $timestamp ?? time();
    $current = intdiv($now, 30);
    foreach ([0, -1, 1] as $offset) {
        $step = $current + $offset;
        if ($step >= 0 && hash_equals(mfa_totp_code($secret, $step * 30), $token)) {
            return $step;
        }
    }
    return null;
}

function mfa_recovery_code(): string
{
    $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $raw = '';
    for ($i = 0; $i < 12; $i++) {
        $raw .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return implode('-', str_split($raw, 4));
}

function mfa_normalize_recovery_code(string $code): string
{
    return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $code) ?? '');
}

function mfa_new_recovery_codes(int $count = 10): array
{
    $codes = [];
    while (count($codes) < $count) {
        $code = mfa_recovery_code();
        $codes[$code] = true;
    }
    return array_keys($codes);
}

function mfa_hash_recovery_codes(array $codes): array
{
    return array_map(
        fn (string $code) => password_hash(mfa_normalize_recovery_code($code), PASSWORD_DEFAULT),
        $codes
    );
}

/** Verifies and consumes a TOTP time step or one recovery code atomically. */
function mfa_verify_factor(string $token): ?array
{
    $result = mfa_store()->mutate(function (array &$state, bool &$dirty) use ($token) {
        if (empty($state['enabled']) || !is_string($state['secret'] ?? null) || $state['secret'] === '') {
            $dirty = false;
            return null;
        }

        $step = mfa_matching_step($state['secret'], $token);
        if ($step !== null) {
            $last = is_int($state['lastUsedStep'] ?? null) ? $state['lastUsedStep'] : -1;
            if ($step <= $last) {
                $dirty = false;
                return null;
            }
            $state['lastUsedStep'] = $step;
            return ['kind' => 'totp', 'generation' => (string) $state['generation']];
        }

        $normalized = mfa_normalize_recovery_code($token);
        if (!preg_match('/^[A-Z2-9]{12}$/', $normalized)) {
            $dirty = false;
            return null;
        }
        foreach (is_array($state['recoveryCodes'] ?? null) ? $state['recoveryCodes'] : [] as $index => $hash) {
            if (is_string($hash) && password_verify($normalized, $hash)) {
                array_splice($state['recoveryCodes'], $index, 1);
                return ['kind' => 'recovery', 'generation' => (string) $state['generation']];
            }
        }
        $dirty = false;
        return null;
    });
    mfa_protect_file();
    return $result;
}

function mfa_provisioning_uri(string $secret): string
{
    $issuer = 'Nivello';
    $label = 'Nivello Admin';
    return 'otpauth://totp/' . rawurlencode($issuer . ':' . $label)
        . '?secret=' . rawurlencode($secret)
        . '&issuer=' . rawurlencode($issuer)
        . '&algorithm=SHA1&digits=6&period=30';
}

function mfa_protect_file(): void
{
    @chmod(ADMIN_DATA_DIR . '/auth/mfa.json', 0600);
    @chmod(ADMIN_DATA_DIR . '/auth/mfa.lock', 0600);
}

function mfa_enable(string $secret, int $step): array
{
    $recoveryCodes = mfa_new_recovery_codes();
    $generation = bin2hex(random_bytes(16));
    mfa_store()->mutate(function (array &$state) use ($secret, $step, $recoveryCodes, $generation) {
        $state = [
            'version' => 1,
            'enabled' => true,
            'secret' => $secret,
            'generation' => $generation,
            'enabledAt' => now_iso(),
            'lastUsedStep' => $step,
            'recoveryCodes' => mfa_hash_recovery_codes($recoveryCodes),
        ];
    });
    mfa_protect_file();
    return ['generation' => $generation, 'recoveryCodes' => $recoveryCodes];
}

function mfa_disable(): void
{
    mfa_store()->mutate(function (array &$state) {
        $state = [
            'version' => 1,
            'enabled' => false,
            'secret' => '',
            'generation' => '',
            'enabledAt' => '',
            'lastUsedStep' => -1,
            'recoveryCodes' => [],
        ];
    });
    mfa_protect_file();
}
