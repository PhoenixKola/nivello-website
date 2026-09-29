<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_enrich.php';

/*
 * Site Health: uptime monitors for Nivello and client sites.
 * One document (health/state.json) holds monitors, a capped check history per monitor and incidents.
 * Checks come from the scheduled GitHub Actions workflow (signed callback) or from "Check now" (PHP).
 * Uptime is the share of the checks actually collected, not an SLA figure.
 */

const HEALTH_MAX_MONITORS = 50;
const HEALTH_CHECKS_KEEP = 240;
const HEALTH_INCIDENTS_KEEP = 300;
const HEALTH_SLOW_MS = 3000;
const HEALTH_SSL_WARN_DAYS = 14;
const HEALTH_UPTIME_DAYS = 30;
const HEALTH_TIMEOUT_SECONDS = 10;

function health_blank(): array
{
    return ['monitors' => [], 'checks' => [], 'incidents' => [], 'lastRun' => []];
}

function health_store(): Store
{
    return Store::document('health/state', fn () => health_blank());
}

/** Validates a monitor URL as a public http(s) target (resolving DNS). */
function health_target(string $url): array
{
    try {
        return safe_fetch_target($url);
    } catch (ApiError $e) {
        throw new ApiError('MONITOR_BLOCKED', str_replace('website', 'site', $e->getMessage()), 422);
    }
}

function monitor_input(array $in, ?array $existing = null): array
{
    $name = v_string($in['name'] ?? ($existing['name'] ?? ''), 'Name', 80, true);
    $url = v_url($in['url'] ?? ($existing['url'] ?? ''), 'URL', false);
    if (!$existing || $url !== $existing['url']) {
        health_target($url);
    }
    return [
        'name' => $name,
        'url' => $url,
        'expectedStatus' => array_key_exists('expectedStatus', $in) ? v_int($in['expectedStatus'], 'Expected status', 100, 599) : ($existing['expectedStatus'] ?? 200),
        'enabled' => array_key_exists('enabled', $in) ? v_bool($in['enabled']) : ($existing['enabled'] ?? true),
        'notes' => v_string($in['notes'] ?? ($existing['notes'] ?? ''), 'Notes', 1000),
    ];
}

function new_monitor(array $fields): array
{
    $now = now_iso();
    return ['id' => new_id('mon')] + $fields + [
        'createdAt' => $now,
        'updatedAt' => $now,
        'last' => null,
        'lastSuccessAt' => null,
        'lastFailureAt' => null,
        'consecutiveFailures' => 0,
        'ssl' => null,
    ];
}

function &health_monitor(array &$state, string $id): array
{
    foreach ($state['monitors'] as $i => $monitor) {
        if ($monitor['id'] === $id) {
            return $state['monitors'][$i];
        }
    }
    throw new ApiError('NOT_FOUND', 'Monitor not found.', 404);
}

/** Normalizes one check result (from PHP or the runner) against the monitor's expectation. */
function health_normalize_check(array $monitor, array $in, string $source): array
{
    $status = isset($in['status']) && is_int($in['status']) && $in['status'] >= 0 && $in['status'] <= 999 ? $in['status'] : 0;
    $ms = isset($in['ms']) && is_numeric($in['ms']) ? max(0, min(120000, (int) $in['ms'])) : null;
    $at = iso_to_ts($in['at'] ?? null);
    // Results cannot be future-dated or older than a day (a late runner is not a fresh check).
    if ($at === null || $at > time() + 300 || $at < time() - 86400) {
        $at = time();
    }
    $error = is_string($in['error'] ?? null) ? mb_substr(trim($in['error']), 0, 200) : null;
    $ok = $status !== 0 && $status === (int) $monitor['expectedStatus'];
    if (!$ok && $error === null) {
        $error = $status === 0 ? 'No response' : "HTTP $status (expected {$monitor['expectedStatus']})";
    }
    $ssl = null;
    if (is_array($in['ssl'] ?? null)) {
        $expires = iso_to_ts($in['ssl']['expiresAt'] ?? null);
        if ($expires !== null) {
            $ssl = ['expiresAt' => now_iso($expires), 'issuer' => is_string($in['ssl']['issuer'] ?? null) ? mb_substr($in['ssl']['issuer'], 0, 120) : null];
        }
    }
    return ['at' => now_iso($at), 'ok' => $ok, 'status' => $status, 'ms' => $ms, 'error' => $ok ? null : $error, 'source' => $source, 'ssl' => $ssl];
}

/** Stores a check: history, monitor summary and incident open/close. */
function health_record_check(array &$state, string $monitorId, array $check): void
{
    $monitor = &health_monitor($state, $monitorId);
    $history = $state['checks'][$monitorId] ?? [];
    $history[] = ['at' => $check['at'], 'ok' => $check['ok'], 'status' => $check['status'], 'ms' => $check['ms'], 'error' => $check['error'], 'source' => $check['source']];
    usort($history, fn ($a, $b) => strcmp($a['at'], $b['at']));
    $state['checks'][$monitorId] = array_slice($history, -HEALTH_CHECKS_KEEP);

    // An older result arriving late must not overwrite the current state.
    if ($monitor['last'] !== null && strcmp($check['at'], $monitor['last']['at']) < 0) {
        return;
    }
    $monitor['last'] = ['at' => $check['at'], 'ok' => $check['ok'], 'status' => $check['status'], 'ms' => $check['ms'], 'error' => $check['error']];
    if ($check['ssl']) {
        $monitor['ssl'] = $check['ssl'] + ['checkedAt' => $check['at']];
    }
    if ($check['ok']) {
        $monitor['lastSuccessAt'] = $check['at'];
        $monitor['consecutiveFailures'] = 0;
        foreach ($state['incidents'] as &$incident) {
            if ($incident['monitorId'] === $monitorId && $incident['resolvedAt'] === null) {
                $incident['resolvedAt'] = $check['at'];
            }
        }
        unset($incident);
        return;
    }
    $monitor['lastFailureAt'] = $check['at'];
    $monitor['consecutiveFailures']++;
    foreach ($state['incidents'] as &$incident) {
        if ($incident['monitorId'] === $monitorId && $incident['resolvedAt'] === null) {
            $incident['failedChecks']++;
            $incident['lastError'] = $check['error'];
            unset($incident);
            return;
        }
    }
    unset($incident);
    $state['incidents'][] = [
        'id' => new_id('inc'),
        'monitorId' => $monitorId,
        'monitorName' => $monitor['name'],
        'startedAt' => $check['at'],
        'resolvedAt' => null,
        'cause' => $check['error'],
        'lastError' => $check['error'],
        'failedChecks' => 1,
    ];
    if (count($state['incidents']) > HEALTH_INCIDENTS_KEEP) {
        $state['incidents'] = array_values(array_slice($state['incidents'], -HEALTH_INCIDENTS_KEEP));
    }
}

function health_ssl_days(?array $ssl): ?int
{
    $expires = iso_to_ts($ssl['expiresAt'] ?? null);
    return $expires === null ? null : (int) floor(($expires - time()) / 86400);
}

/** Derived state for the UI: healthy | warning | down | paused | pending, with reasons. */
function health_view(array $state, array $monitor, int $recent = 30): array
{
    $checks = $state['checks'][$monitor['id']] ?? [];
    $since = now_iso(time() - HEALTH_UPTIME_DAYS * 86400);
    $window = array_values(array_filter($checks, fn ($c) => strcmp($c['at'], $since) >= 0));
    $okCount = count(array_filter($window, fn ($c) => $c['ok']));
    $times = array_values(array_filter(array_map(fn ($c) => $c['ok'] ? $c['ms'] : null, $window), fn ($v) => $v !== null));
    $sslDays = str_starts_with($monitor['url'], 'https://') ? health_ssl_days($monitor['ssl']) : null;

    $warnings = [];
    if ($monitor['last'] && $monitor['last']['ok'] && $monitor['last']['ms'] !== null && $monitor['last']['ms'] > HEALTH_SLOW_MS) {
        $warnings[] = 'Slow response (' . round($monitor['last']['ms'] / 1000, 1) . ' s)';
    }
    if ($sslDays !== null && $sslDays < HEALTH_SSL_WARN_DAYS) {
        $warnings[] = $sslDays < 0 ? 'SSL certificate expired' : "SSL certificate expires in $sslDays day" . ($sslDays === 1 ? '' : 's');
    }
    $status = match (true) {
        !$monitor['enabled'] => 'paused',
        $monitor['last'] === null => 'pending',
        !$monitor['last']['ok'] => 'down',
        (bool) $warnings => 'warning',
        default => 'healthy',
    };
    return $monitor + [
        'state' => $status,
        'warnings' => $warnings,
        'sslDaysLeft' => $sslDays,
        'uptime' => $window ? round($okCount / count($window) * 100, 2) : null,
        'uptimeChecks' => count($window),
        'avgMs' => $times ? (int) round(array_sum($times) / count($times)) : null,
        'recent' => array_slice($checks, -$recent),
        'openIncident' => (bool) array_filter($state['incidents'], fn ($i) => $i['monitorId'] === $monitor['id'] && $i['resolvedAt'] === null),
    ];
}

function health_overview(array $state): array
{
    $views = array_map(fn ($m) => health_view($state, $m), $state['monitors']);
    $counts = ['healthy' => 0, 'warning' => 0, 'down' => 0, 'paused' => 0, 'pending' => 0];
    foreach ($views as $view) {
        $counts[$view['state']]++;
    }
    $open = array_values(array_filter($state['incidents'], fn ($i) => $i['resolvedAt'] === null));
    return [
        'monitors' => $views,
        'counts' => $counts,
        'openIncidents' => array_reverse($open),
        'lastRun' => $state['lastRun'] ?: null,
    ];
}

/**
 * Checks one URL from PHP ("Check now"). Every hop is re-validated and pinned to its resolved IP,
 * so a redirect or DNS change cannot point the check at a private address.
 */
function health_check_url(string $url, int $expectedStatus): array
{
    $follow = $expectedStatus < 300 || $expectedStatus >= 400;
    $started = microtime(true);
    $ssl = null;
    for ($hop = 0; $hop < 5; $hop++) {
        try {
            $target = safe_fetch_target($url);
        } catch (ApiError $e) {
            return ['status' => 0, 'ms' => null, 'error' => 'Blocked: ' . $e->getMessage(), 'ssl' => $ssl, 'at' => now_iso()];
        }
        $ch = curl_init($target['url']);
        curl_setopt_array($ch, [
            CURLOPT_RESOLVE => [$target['host'] . ':' . $target['port'] . ':' . $target['ip']],
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => HEALTH_TIMEOUT_SECONDS,
            CURLOPT_USERAGENT => 'NivelloSiteHealth/1.0 (+https://www.nivello.it)',
            CURLOPT_NOBODY => false,
            CURLOPT_CERTINFO => true,
            CURLOPT_RETURNTRANSFER => false,
            // The body is not needed; stop reading after 256 KB so huge pages cannot stall the check.
            CURLOPT_WRITEFUNCTION => function ($ch, string $chunk) use (&$received) {
                $received += strlen($chunk);
                return $received > 262144 ? 0 : strlen($chunk);
            },
        ]);
        $received = 0;
        curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $redirect = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        if (str_starts_with($target['url'], 'https://')) {
            $ssl = health_certinfo($ch) ?? $ssl;
        }
        unset($ch);
        if ($follow && $status >= 300 && $status < 400 && $redirect !== '') {
            $url = $redirect;
            continue;
        }
        $ms = (int) round((microtime(true) - $started) * 1000);
        if ($status === 0 || ($errno !== 0 && $errno !== CURLE_WRITE_ERROR)) {
            return ['status' => 0, 'ms' => $ms, 'error' => $errno === CURLE_OPERATION_TIMEDOUT ? 'Timed out' : ($error !== '' ? mb_substr($error, 0, 160) : 'No response'), 'ssl' => $ssl, 'at' => now_iso()];
        }
        return ['status' => $status, 'ms' => $ms, 'error' => null, 'ssl' => $ssl, 'at' => now_iso()];
    }
    return ['status' => 0, 'ms' => null, 'error' => 'Too many redirects', 'ssl' => $ssl, 'at' => now_iso()];
}

function health_certinfo(CurlHandle $ch): ?array
{
    $info = curl_getinfo($ch, CURLINFO_CERTINFO);
    $leaf = is_array($info) ? ($info[0] ?? null) : null;
    if (!is_array($leaf)) {
        return null;
    }
    $expires = isset($leaf['Expire date']) ? strtotime((string) $leaf['Expire date']) : false;
    if ($expires === false) {
        return null;
    }
    $issuer = null;
    if (isset($leaf['Issuer']) && preg_match('/(?:^|,\s*)O\s*=\s*([^,]+)/', (string) $leaf['Issuer'], $m)) {
        $issuer = trim($m[1]);
    }
    return ['expiresAt' => now_iso($expires), 'issuer' => $issuer];
}
