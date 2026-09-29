<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/*
 * First-party, aggregate-only analytics. The public tracker (lib/analytics.ts) posts small events;
 * each UTC day is one aggregate document (analytics/YYYY-MM-DD.json). No IPs, user agents or
 * persistent identifiers are stored. "Sessions" are per-browser-tab session ids, not people.
 */

require_once __DIR__ . '/_geoip.php';

const ANALYTICS_EVENTS = ['page_view', 'cta_click', 'project_launcher_start', 'project_launcher_complete', 'contact_start', 'contact_submit', 'work_case_study_open'];
const ANALYTICS_DEVICES = ['mobile', 'tablet', 'desktop'];
const ANALYTICS_LOCALES = ['en', 'it'];
const ANALYTICS_MAX_KEYS = 400;
const ANALYTICS_MAX_SESSIONS_PER_DAY = 50000;
const ANALYTICS_MAX_RANGE_DAYS = 366;

function analytics_blank(): array
{
    return [
        'pageViews' => 0,
        'sessions' => 0,
        'pages' => [],
        'landingPages' => [],
        'referrers' => [],
        'devices' => [],
        'locales' => [],
        'countries' => [],
        'events' => [],
        'labels' => [],
        'sessionIds' => [],
    ];
}

function analytics_day(string $date): Store
{
    return Store::document('analytics/' . $date, fn () => analytics_blank());
}

/** Increments a bounded counter map; once full, new keys are folded into "(other)". */
function bump(array &$map, string $key, int $max = ANALYTICS_MAX_KEYS): void
{
    // A prefix keeps numeric-looking keys as JSON object keys.
    $k = 'k:' . $key;
    if (!isset($map[$k]) && count($map) >= $max) {
        $k = 'k:(other)';
    }
    $map[$k] = ($map[$k] ?? 0) + 1;
}

function unkey(array $map): array
{
    $out = [];
    foreach ($map as $k => $v) {
        $out[substr((string) $k, 2)] = (int) $v;
    }
    return $out;
}

function normalize_path(mixed $path): ?string
{
    if (!is_string($path) || $path === '' || strlen($path) > 300 || $path[0] !== '/') {
        return null;
    }
    $path = preg_replace('/[?#].*$/', '', $path);
    if (!preg_match('#^/[A-Za-z0-9/_.~%-]*$#', $path)) {
        return null;
    }
    $path = preg_replace('~/+~', '/', $path);
    if ($path !== '/' && !str_ends_with($path, '/')) {
        $path .= '/';
    }
    if (str_starts_with($path, '/admin')) {
        return null;
    }
    return mb_substr($path, 0, 160);
}

/** Legacy zone names some browsers still report, mapped to the current IANA name. */
const ANALYTICS_TZ_ALIASES = [
    'Europe/Kiev' => 'Europe/Kyiv', 'Asia/Calcutta' => 'Asia/Kolkata', 'Asia/Saigon' => 'Asia/Ho_Chi_Minh',
    'Asia/Katmandu' => 'Asia/Kathmandu', 'Asia/Rangoon' => 'Asia/Yangon', 'Atlantic/Faeroe' => 'Atlantic/Faroe',
    'America/Buenos_Aires' => 'America/Argentina/Buenos_Aires', 'Europe/Belfast' => 'Europe/London',
    'Asia/Istanbul' => 'Europe/Istanbul', 'Europe/Nicosia' => 'Asia/Nicosia', 'US/Eastern' => 'America/New_York',
    'US/Central' => 'America/Chicago', 'US/Mountain' => 'America/Denver', 'US/Pacific' => 'America/Los_Angeles',
];

/**
 * Fallback country from the browser's time zone (e.g. Europe/Rome -> IT). Coarse: countries sharing
 * an offset are often reported under one zone. Returns '(unknown)' for UTC-style or unknown zones.
 */
function timezone_country(mixed $zone): string
{
    if (!is_string($zone) || !preg_match('#^[A-Za-z][A-Za-z0-9_+\-]*(/[A-Za-z0-9_+\-]+){0,2}$#', $zone) || strlen($zone) > 64) {
        return '(unknown)';
    }
    $zone = ANALYTICS_TZ_ALIASES[$zone] ?? $zone;
    try {
        $code = (new DateTimeZone($zone))->getLocation()['country_code'] ?? '??';
    } catch (Throwable) {
        return '(unknown)';
    }
    return is_string($code) && preg_match('/^[A-Z]{2}$/', $code) ? $code : '(unknown)';
}

function referrer_host(mixed $referrer): string
{
    if (!is_string($referrer) || $referrer === '' || strlen($referrer) > 500) {
        return '(direct)';
    }
    $host = strtolower((string) (parse_url($referrer, PHP_URL_HOST) ?? ''));
    if ($host === '' || !preg_match('/^[a-z0-9.-]{1,120}$/', $host)) {
        return '(direct)';
    }
    $own = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    $host = preg_replace('/^www\./', '', $host);
    if ($own !== '' && $host === preg_replace('/^www\./', '', $own)) {
        return '(internal)';
    }
    return $host;
}

/**
 * Validates one public event and returns its normalized form (or throws).
 * @return array{event: string, path: string, session: string, locale: string, device: string, referrer: string, label: ?string}
 */
function analytics_validate(array $in): array
{
    $event = $in['e'] ?? null;
    if (!is_string($event) || !in_array($event, ANALYTICS_EVENTS, true)) {
        throw new ApiError('INVALID_EVENT', 'Unknown event.', 422);
    }
    $session = $in['s'] ?? null;
    if (!is_string($session) || !preg_match('/^[a-f0-9]{16,32}$/', $session)) {
        throw new ApiError('INVALID_EVENT', 'Invalid session.', 422);
    }
    $path = normalize_path($in['p'] ?? null);
    if ($path === null) {
        throw new ApiError('INVALID_EVENT', 'Invalid path.', 422);
    }
    $label = $in['c'] ?? null;
    if ($label !== null && (!is_string($label) || !preg_match('/^[a-z0-9_]{1,40}$/', $label))) {
        throw new ApiError('INVALID_EVENT', 'Invalid label.', 422);
    }
    $locale = in_array($in['l'] ?? null, ANALYTICS_LOCALES, true) ? $in['l'] : (str_starts_with($path, '/it/') ? 'it' : 'en');
    return [
        'event' => $event,
        'path' => $path,
        'session' => $session,
        'locale' => $locale,
        'device' => in_array($in['d'] ?? null, ANALYTICS_DEVICES, true) ? $in['d'] : 'unknown',
        'referrer' => referrer_host($in['r'] ?? null),
        // IP lookup in memory (never stored); the browser time zone is only a fallback, e.g. for local testing.
        'country' => ip_country((string) ($_SERVER['REMOTE_ADDR'] ?? '')) ?? timezone_country($in['z'] ?? null),
        'label' => $label,
    ];
}

function analytics_record(array $in, ?string $date = null): void
{
    $e = analytics_validate($in);
    analytics_day($date ?? gmdate('Y-m-d'))->mutate(function (array &$day) use ($e) {
        $newSession = !isset($day['sessionIds'][$e['session']]);
        if ($newSession) {
            $day['sessions']++;
            if (count($day['sessionIds']) < ANALYTICS_MAX_SESSIONS_PER_DAY) {
                $day['sessionIds'][$e['session']] = 1;
            }
            bump($day['landingPages'], $e['path']);
            if ($e['referrer'] !== '(internal)') {
                bump($day['referrers'], $e['referrer']);
            }
            bump($day['devices'], $e['device'], 10);
            bump($day['locales'], $e['locale'], 10);
            bump($day['countries'], $e['country'], 300);
        }
        if ($e['event'] === 'page_view') {
            $day['pageViews']++;
            bump($day['pages'], $e['path']);
            return;
        }
        bump($day['events'], $e['event'], 20);
        if ($e['label'] !== null) {
            bump($day['labels'], $e['event'] . ':' . $e['label']);
        }
    });
}

function parse_day(mixed $value, string $label): string
{
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) || !checkdate((int) substr($value, 5, 2), (int) substr($value, 8, 2), (int) substr($value, 0, 4))) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a date (YYYY-MM-DD).", 422);
    }
    return $value;
}

/** @return list<string> dates from..to inclusive */
function date_range(string $from, string $to): array
{
    $start = strtotime($from . 'T00:00:00Z');
    $end = strtotime($to . 'T00:00:00Z');
    if ($end < $start) {
        throw new ApiError('VALIDATION_ERROR', 'The start date must be before the end date.', 422);
    }
    $days = intdiv($end - $start, 86400) + 1;
    if ($days > ANALYTICS_MAX_RANGE_DAYS) {
        throw new ApiError('VALIDATION_ERROR', 'Choose a range of at most one year.', 422);
    }
    $dates = [];
    for ($i = 0; $i < $days; $i++) {
        $dates[] = gmdate('Y-m-d', $start + $i * 86400);
    }
    return $dates;
}

function top_n(array $counts, int $n = 10): array
{
    arsort($counts);
    $out = [];
    foreach (array_slice($counts, 0, $n, true) as $label => $count) {
        $out[] = ['label' => (string) $label, 'count' => $count];
    }
    return $out;
}

/** Aggregates the daily documents of a range. Missing days count as zero. */
function analytics_summary(string $from, string $to): array
{
    $dates = date_range($from, $to);
    $totals = ['pageViews' => 0, 'sessions' => 0];
    $events = array_fill_keys(array_diff(ANALYTICS_EVENTS, ['page_view']), 0);
    $maps = ['pages' => [], 'landingPages' => [], 'referrers' => [], 'devices' => [], 'locales' => [], 'countries' => [], 'labels' => []];
    $series = [];
    $unreadable = [];
    foreach ($dates as $date) {
        $store = analytics_day($date);
        $day = analytics_blank();
        if ($store->exists()) {
            try {
                $day = $store->read();
            } catch (ApiError) {
                $unreadable[] = $date;
            }
        }
        $dayEvents = unkey($day['events']);
        $totals['pageViews'] += $day['pageViews'];
        $totals['sessions'] += $day['sessions'];
        foreach ($dayEvents as $name => $count) {
            if (isset($events[$name])) {
                $events[$name] += $count;
            }
        }
        foreach ($maps as $name => $_) {
            foreach (unkey($day[$name]) as $key => $count) {
                $maps[$name][$key] = ($maps[$name][$key] ?? 0) + $count;
            }
        }
        $series[] = [
            'date' => $date,
            'pageViews' => $day['pageViews'],
            'sessions' => $day['sessions'],
            'contactSubmits' => $dayEvents['contact_submit'] ?? 0,
            'launcherCompletes' => $dayEvents['project_launcher_complete'] ?? 0,
        ];
    }
    $byEvent = ['cta_click' => [], 'work_case_study_open' => [], 'project_launcher_complete' => [], 'contact_submit' => []];
    foreach ($maps['labels'] as $key => $count) {
        [$name, $label] = array_pad(explode(':', $key, 2), 2, '');
        if (isset($byEvent[$name]) && $label !== '') {
            $byEvent[$name][$label] = $count;
        }
    }
    $rate = fn (int $n) => $totals['sessions'] > 0 ? round($n / $totals['sessions'] * 100, 1) : null;
    return [
        'from' => $from,
        'to' => $to,
        'totals' => $totals + [
            'contactSubmits' => $events['contact_submit'],
            'contactStarts' => $events['contact_start'],
            'launcherStarts' => $events['project_launcher_start'],
            'launcherCompletes' => $events['project_launcher_complete'],
            'caseStudyOpens' => $events['work_case_study_open'],
            'ctaClicks' => $events['cta_click'],
            'contactConversionRate' => $rate($events['contact_submit']),
            'launcherConversionRate' => $rate($events['project_launcher_complete']),
        ],
        'series' => $series,
        'topPages' => top_n($maps['pages']),
        'topLandingPages' => top_n($maps['landingPages']),
        'topReferrers' => top_n($maps['referrers']),
        'devices' => top_n($maps['devices'], 5),
        'locales' => top_n($maps['locales'], 5),
        'countries' => top_n($maps['countries'], 12),
        'ctas' => top_n($byEvent['cta_click']),
        'caseStudies' => top_n($byEvent['work_case_study_open']),
        'launcherOutcomes' => top_n($byEvent['project_launcher_complete']),
        'contactSources' => top_n($byEvent['contact_submit'], 5),
        'unreadableDays' => $unreadable,
    ];
}
