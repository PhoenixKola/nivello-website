<?php
declare(strict_types=1);

// Public, write-only analytics ingestion for the marketing site. Never returns analytics data.

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ratelimit.php';
require __DIR__ . '/_analytics.php';

const TRACK_MAX_BYTES = 2048;

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        public_reject(405, 'METHOD_NOT_ALLOWED');
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > TRACK_MAX_BYTES) {
        public_reject(413, 'PAYLOAD_TOO_LARGE');
    }
    if (!same_origin_request()) {
        public_reject(403, 'FORBIDDEN');
    }
    if (!RateLimiter::hit('analytics', 300, 3600)) {
        public_reject(429, 'RATE_LIMITED');
    }
    $raw = (string) file_get_contents('php://input', false, null, 0, TRACK_MAX_BYTES + 1);
    if (strlen($raw) > TRACK_MAX_BYTES) {
        public_reject(413, 'PAYLOAD_TOO_LARGE');
    }
    $body = json_decode($raw, true, 4);
    if (!is_array($body)) {
        public_reject(400, 'INVALID');
    }
    analytics_record($body);
    http_response_code(204);
    header('Cache-Control: no-store');
    exit;
} catch (ApiError $e) {
    public_reject($e->status >= 500 ? 503 : 422, $e->status >= 500 ? 'UNAVAILABLE' : 'INVALID');
} catch (Throwable $e) {
    error_log('[nivello-admin] analytics ingestion failed: ' . get_class($e));
    public_reject(503, 'UNAVAILABLE');
}
