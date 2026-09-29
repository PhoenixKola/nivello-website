<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

const SIGNED_MAX_SKEW_SECONDS = 300;

/**
 * Verifies a server-to-server request from a GitHub Actions runner and returns its JSON body.
 * Auth: X-Nivello-Timestamp + X-Nivello-Signature = "sha256=" . HMAC-SHA256(secret, timestamp . "." . body).
 */
function verify_signed_request(int $maxBytes): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        throw new ApiError('METHOD_NOT_ALLOWED', 'POST only.', 405);
    }
    $secret = admin_secret('callback_secret');
    if (strlen($secret) < 32) {
        throw new ApiError('CALLBACK_NOT_CONFIGURED', 'Callback secret is not configured on the server.', 503);
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxBytes) {
        throw new ApiError('PAYLOAD_TOO_LARGE', 'Callback body too large.', 413);
    }
    $raw = (string) file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if (strlen($raw) > $maxBytes) {
        throw new ApiError('PAYLOAD_TOO_LARGE', 'Callback body too large.', 413);
    }
    $timestamp = (string) ($_SERVER['HTTP_X_NIVELLO_TIMESTAMP'] ?? '');
    $signature = (string) ($_SERVER['HTTP_X_NIVELLO_SIGNATURE'] ?? '');
    $expected = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $raw, $secret);
    if (!preg_match('/^\d{9,11}$/', $timestamp) || !hash_equals($expected, $signature)) {
        throw new ApiError('INVALID_SIGNATURE', 'Invalid callback signature.', 401);
    }
    if (abs(time() - (int) $timestamp) > SIGNED_MAX_SKEW_SECONDS) {
        throw new ApiError('STALE_CALLBACK', 'Callback timestamp outside the allowed window.', 401);
    }
    $body = json_decode($raw, true, 64);
    if (!is_array($body)) {
        throw new ApiError('INVALID_JSON', 'Callback body must be a JSON object.', 400);
    }
    return $body;
}

/** Runs a signed endpoint: verifies the request, then responds with the handler's result. */
function signed_run(int $maxBytes, Closure $handler, string $logName): void
{
    try {
        respond_ok($handler(verify_signed_request($maxBytes)));
    } catch (ApiError $e) {
        respond_error($e->status, $e->errorCode, $e->getMessage());
    } catch (Throwable $e) {
        error_log("[nivello-admin] $logName failed: " . get_class($e) . ': ' . $e->getMessage());
        respond_error(500, 'INTERNAL_ERROR', 'Callback could not be processed.');
    }
}
