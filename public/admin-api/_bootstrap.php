<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/_config.php';

final class ApiError extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 400,
        public readonly array $details = []
    ) {
        parent::__construct($message);
    }
}

require_once __DIR__ . '/_store.php';
require_once __DIR__ . '/_auth.php';

// ── Time & ids ──────────────────────────────────────────────────────────────

function now_iso(?int $ts = null): string
{
    return gmdate('Y-m-d\TH:i:s\Z', $ts ?? time());
}

function iso_to_ts(mixed $iso): ?int
{
    if (!is_string($iso) || $iso === '') {
        return null;
    }
    $ts = strtotime($iso);
    return $ts === false ? null : $ts;
}

function new_id(string $prefix): string
{
    return $prefix . '_' . bin2hex(random_bytes(8));
}

// ── Responses ───────────────────────────────────────────────────────────────

function send_json(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function respond_ok(mixed $data = null, int $status = 200): never
{
    send_json($status, ['ok' => true, 'data' => $data]);
}

function respond_error(int $status, string $code, string $message, array $details = []): never
{
    $error = ['code' => $code, 'message' => $message];
    if ($details) {
        $error['details'] = $details;
    }
    send_json($status, ['ok' => false, 'error' => $error]);
}

function json_body(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > MAX_JSON_BODY_BYTES) {
        throw new ApiError('PAYLOAD_TOO_LARGE', 'Request body is too large.', 413);
    }
    $raw = file_get_contents('php://input', false, null, 0, MAX_JSON_BODY_BYTES + 1);
    if ($raw === false || $raw === '') {
        return [];
    }
    if (strlen($raw) > MAX_JSON_BODY_BYTES) {
        throw new ApiError('PAYLOAD_TOO_LARGE', 'Request body is too large.', 413);
    }
    $data = json_decode($raw, true, 64);
    if (!is_array($data)) {
        throw new ApiError('INVALID_JSON', 'Request body must be a JSON object.', 400);
    }
    return $data;
}

/**
 * Runs one endpoint. $routes maps "METHOD action" to a handler returning response data.
 * Every route requires an authenticated session (and CSRF for non-GET) unless $public is true.
 */
function api_run(array $routes, bool $public = false): never
{
    try {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        $action = (string) ($_GET['action'] ?? '');
        $key = $method . ' ' . $action;
        if (!isset($routes[$key])) {
            $known = array_filter(array_keys($routes), fn ($k) => str_ends_with($k, ' ' . $action));
            throw $known
                ? new ApiError('METHOD_NOT_ALLOWED', 'Method not allowed for this action.', 405)
                : new ApiError('NOT_FOUND', 'Unknown API action.', 404);
        }
        if (!$public) {
            require_auth();
            if ($method !== 'GET') {
                require_csrf();
            }
        }
        respond_ok($routes[$key]());
    } catch (ApiError $e) {
        respond_error($e->status, $e->errorCode, $e->getMessage(), $e->details);
    } catch (Throwable $e) {
        error_log('[nivello-admin] ' . $e);
        respond_error(500, 'INTERNAL_ERROR', 'Unexpected server error. Details were written to the PHP error log.');
    }
}

// ── Validation ──────────────────────────────────────────────────────────────

function v_string(mixed $value, string $label, int $max, bool $required = false): string
{
    if ($value === null) {
        $value = '';
    }
    if (!is_string($value) && !is_int($value) && !is_float($value)) {
        throw new ApiError('VALIDATION_ERROR', "$label must be text.", 422);
    }
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value) ?? '');
    if ($required && $value === '') {
        throw new ApiError('VALIDATION_ERROR', "$label is required.", 422);
    }
    if (mb_strlen($value) > $max) {
        throw new ApiError('VALIDATION_ERROR', "$label must be at most $max characters.", 422);
    }
    return $value;
}

function v_enum(mixed $value, string $label, array $allowed): string
{
    if (!is_string($value) || !in_array($value, $allowed, true)) {
        throw new ApiError('VALIDATION_ERROR', "$label has an invalid value.", 422);
    }
    return $value;
}

function v_int(mixed $value, string $label, int $min, int $max): int
{
    if (is_string($value) && preg_match('/^-?\d+$/', trim($value))) {
        $value = (int) trim($value);
    }
    if (!is_int($value) || $value < $min || $value > $max) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a whole number between $min and $max.", 422);
    }
    return $value;
}

function v_bool(mixed $value): bool
{
    return $value === true || $value === 1 || $value === '1' || $value === 'true';
}

function v_url(mixed $value, string $label, bool $allowEmpty = true): string
{
    $value = v_string($value, $label, 500);
    if ($value === '') {
        if (!$allowEmpty) {
            throw new ApiError('VALIDATION_ERROR', "$label is required.", 422);
        }
        return '';
    }
    if (!preg_match('~^https?://~i', $value)) {
        $value = 'https://' . $value;
    }
    $parts = parse_url($value);
    if (!$parts || empty($parts['host']) || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) || !str_contains($parts['host'], '.')) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a valid http(s) URL.", 422);
    }
    return $value;
}

function v_email(mixed $value, string $label = 'Email'): string
{
    $value = strtolower(v_string($value, $label, 200));
    if ($value !== '' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
        throw new ApiError('VALIDATION_ERROR', "$label is not a valid email address.", 422);
    }
    return $value;
}

function v_phone(mixed $value, string $label = 'Phone'): string
{
    $value = v_string($value, $label, 40);
    if ($value !== '' && (!preg_match('/^[+0-9 ()\-.\/]{5,40}$/', $value) || strlen(preg_replace('/\D/', '', $value)) < 5)) {
        throw new ApiError('VALIDATION_ERROR', "$label is not a valid phone number.", 422);
    }
    return $value;
}

function v_datetime(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    $ts = is_string($value) ? iso_to_ts($value) : null;
    if ($ts === null || $ts < 946684800 || $ts > 4102444800) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a valid date and time.", 422);
    }
    return now_iso($ts);
}

function v_id(mixed $value, string $prefix, string $label = 'Id'): string
{
    if (!is_string($value) || !preg_match('/^' . preg_quote($prefix, '/') . '_[a-f0-9]{16}$/', $value)) {
        throw new ApiError('VALIDATION_ERROR', "$label is invalid.", 422);
    }
    return $value;
}

function v_ids(mixed $value, string $prefix, int $max = 5000): array
{
    if (!is_array($value) || !array_is_list($value) || count($value) === 0) {
        throw new ApiError('VALIDATION_ERROR', 'Select at least one item.', 422);
    }
    if (count($value) > $max) {
        throw new ApiError('VALIDATION_ERROR', "At most $max items can be changed at once.", 422);
    }
    return array_values(array_unique(array_map(fn ($id) => v_id($id, $prefix), $value)));
}
