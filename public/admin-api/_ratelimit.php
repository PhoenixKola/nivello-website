<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/**
 * Fixed-window rate limiting for the public endpoints (analytics ingestion, contact capture).
 * Clients are keyed by a salted hash of the IP; the salt rotates daily, so no raw IP is stored
 * and yesterday's keys cannot be linked to today's.
 */
final class RateLimiter
{
    public static function hit(string $bucket, int $limit, int $windowSeconds): bool
    {
        $dir = ADMIN_DATA_DIR . '/ratelimit';
        if (!is_dir($dir) && !@mkdir($dir, 0770, true) && !is_dir($dir)) {
            // Storage problems must not turn into an open door, but also not into an outage.
            return true;
        }
        $handle = @fopen($dir . '/' . preg_replace('/[^a-z0-9_-]/', '', $bucket) . '.json', 'c+');
        if ($handle === false) {
            return true;
        }
        try {
            flock($handle, LOCK_EX);
            $raw = stream_get_contents($handle);
            $data = $raw ? json_decode($raw, true) : null;
            $today = gmdate('Y-m-d');
            if (!is_array($data) || ($data['saltDate'] ?? '') !== $today) {
                $data = ['saltDate' => $today, 'salt' => bin2hex(random_bytes(16)), 'windows' => []];
            }
            $now = time();
            $key = substr(hash('sha256', $data['salt'] . '|' . client_ip()), 0, 24);
            $windows = array_filter($data['windows'], fn ($w) => $now - (int) $w[0] < $windowSeconds);
            if (count($windows) > 5000) {
                $windows = array_slice($windows, -4000, null, true);
            }
            $entry = $windows[$key] ?? [$now, 0];
            $allowed = $entry[1] < $limit;
            if ($allowed) {
                $entry[1]++;
            }
            $windows[$key] = $entry;
            $data['windows'] = $windows;
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode($data));
            fflush($handle);
            return $allowed;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}

function client_ip(): string
{
    // Only the socket address: forwarded headers are client-controlled on shared hosting.
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** True when the request's Origin (or, failing that, Referer) is this site. */
function same_origin_request(): bool
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $source = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($source === '' || $source === 'null') {
        $source = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    }
    if ($host === '' || $source === '') {
        return false;
    }
    $parts = parse_url($source);
    if (!$parts || empty($parts['host'])) {
        return false;
    }
    $origin = strtolower($parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : ''));
    return $origin === $host;
}

/** Minimal JSON error for public endpoints: never reveals internals. */
function public_reject(int $status, string $code): never
{
    send_json($status, ['ok' => false, 'error' => ['code' => $code, 'message' => 'Request rejected.']]);
}
