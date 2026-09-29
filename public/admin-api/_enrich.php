<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/** True only for globally routable IPs (blocks loopback, private, link-local, CGNAT, reserved, multicast). */
function ip_is_public(string $ip): bool
{
    $packed = @inet_pton($ip);
    if ($packed === false) {
        return false;
    }
    if (strlen($packed) === 16) {
        // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d) and NAT64 (64:ff9b::a.b.c.d) addresses
        // reach the embedded IPv4 address, so judge that instead.
        $prefix = bin2hex(substr($packed, 0, 12));
        $embedded = substr($packed, 12);
        if ($prefix === '00000000000000000000ffff' || $prefix === '0064ff9b0000000000000000' || ($prefix === '000000000000000000000000' && bin2hex($embedded) !== '00000001' && bin2hex($embedded) !== '00000000')) {
            return ip_is_public((string) inet_ntop($embedded));
        }
        if ($packed[0] === "\xff") {
            return false; // multicast
        }
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return false;
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $long = ip2long($ip);
        foreach ([['100.64.0.0', 10], ['192.0.0.0', 24], ['198.18.0.0', 15], ['0.0.0.0', 8], ['224.0.0.0', 4]] as [$net, $bits]) {
            $mask = -1 << (32 - $bits);
            if (($long & $mask) === (ip2long($net) & $mask)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Resolves and validates a URL for a server-side fetch.
 * @return array{url: string, host: string, port: int, ip: string}
 */
function safe_fetch_target(string $url): array
{
    $parts = parse_url($url);
    $scheme = strtolower($parts['scheme'] ?? '');
    $host = strtolower($parts['host'] ?? '');
    if (!in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
        throw new ApiError('ENRICH_BLOCKED', 'Only public http(s) website addresses can be checked.', 422);
    }
    $port = (int) ($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
    // Local test harness only (never set in production): lets tests fetch a mock site on localhost.
    $allowPrivate = getenv('NIVELLO_ENRICH_ALLOW_PRIVATE') === '1';
    if (!$allowPrivate && !in_array($port, [80, 443], true)) {
        throw new ApiError('ENRICH_BLOCKED', 'Only standard web ports can be checked.', 422);
    }
    if (!$allowPrivate && (in_array($host, ['localhost'], true) || str_ends_with($host, '.localhost') || str_ends_with($host, '.local') || str_ends_with($host, '.internal'))) {
        throw new ApiError('ENRICH_BLOCKED', 'Private network addresses are not allowed.', 422);
    }
    // IPv6 literals arrive bracketed ("[::1]"); check them as IPs, not hostnames.
    $literal = trim($host, '[]');
    $ips = filter_var($literal, FILTER_VALIDATE_IP) ? [$literal] : (gethostbynamel($host) ?: []);
    if (!$ips) {
        throw new ApiError('ENRICH_FAILED', 'The website domain could not be resolved.', 422);
    }
    foreach ($ips as $ip) {
        if (!$allowPrivate && !ip_is_public($ip)) {
            throw new ApiError('ENRICH_BLOCKED', 'Private network addresses are not allowed.', 422);
        }
    }
    return ['url' => $url, 'host' => $host, 'port' => $port, 'ip' => $ips[0]];
}

/** Fetches one homepage (following up to 3 validated redirects) and returns the HTML. */
function fetch_public_page(string $url, int $maxBytes = 1500000): string
{
    for ($hop = 0; $hop < 4; $hop++) {
        $target = safe_fetch_target($url);
        $body = '';
        $ch = curl_init($target['url']);
        curl_setopt_array($ch, [
            CURLOPT_RESOLVE => [$target['host'] . ':' . $target['port'] . ':' . $target['ip']],
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; NivelloAdmin/1.0; +https://www.nivello.it)',
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
            CURLOPT_HEADER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, string $chunk) use (&$body, $maxBytes) {
                $body .= $chunk;
                return strlen($body) > $maxBytes ? 0 : strlen($chunk);
            },
        ]);
        curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $redirect = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        $errno = curl_errno($ch);
        curl_close($ch);

        if ($status >= 300 && $status < 400 && $redirect !== '') {
            $url = $redirect;
            continue;
        }
        if ($status === 0 || ($errno !== 0 && $errno !== CURLE_WRITE_ERROR)) {
            throw new ApiError('ENRICH_FAILED', 'The website could not be reached.', 422);
        }
        if ($status >= 400) {
            throw new ApiError('ENRICH_FAILED', "The website answered with HTTP $status.", 422);
        }
        return $body;
    }
    throw new ApiError('ENRICH_FAILED', 'The website redirected too many times.', 422);
}

function extract_instagram(string $html): ?string
{
    if (!preg_match_all('~https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]{1,30})/?(?=["\'?#\s<>])~i', $html, $matches)) {
        return null;
    }
    foreach ($matches[1] as $handle) {
        if (!in_array(strtolower($handle), INSTAGRAM_RESERVED, true)) {
            return 'https://www.instagram.com/' . $handle . '/';
        }
    }
    return null;
}

/** @return array{instagram: ?string} */
function enrich_instagram_from_website(string $website): array
{
    return ['instagram' => extract_instagram(fetch_public_page($website))];
}
