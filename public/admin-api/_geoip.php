<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/*
 * IP-to-country lookup for aggregate analytics. The address is used in memory for this lookup only;
 * it is never stored or logged. Tables are built by scripts/build-geoip.mjs from
 * sapics/ip-location-db "geo-whois-asn-country" (data © NRO, https://www.nro.net, CC BY 4.0).
 */

/** ISO country code for an IP address, or null when it is private, reserved or unknown. */
function ip_country(string $ip): ?string
{
    $packed = @inet_pton($ip);
    if ($packed === false) {
        return null;
    }
    if (strlen($packed) === 16 && str_starts_with($packed, str_repeat("\0", 10) . "\xff\xff")) {
        $packed = substr($packed, 12); // IPv4-mapped IPv6
    }
    // Private and reserved ranges have no country (the source data mislabels some of them).
    if (filter_var((string) inet_ntop($packed), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return null;
    }
    [$file, $keyBytes, $key] = strlen($packed) === 4
        ? [__DIR__ . '/_geo-ipv4.bin', 4, $packed]
        : [__DIR__ . '/_geo-ipv6.bin', 8, substr($packed, 0, 8)];
    $handle = @fopen($file, 'rb');
    if ($handle === false) {
        return null;
    }
    try {
        $size = $keyBytes + 2;
        $count = intdiv((int) fstat($handle)['size'], $size);
        // Binary search for the last range whose start <= key (big-endian bytes compare lexicographically).
        $lo = 0;
        $hi = $count - 1;
        $found = -1;
        while ($lo <= $hi) {
            $mid = ($lo + $hi) >> 1;
            fseek($handle, $mid * $size);
            $start = (string) fread($handle, $keyBytes);
            if (strcmp($start, $key) <= 0) {
                $found = $mid;
                $lo = $mid + 1;
            } else {
                $hi = $mid - 1;
            }
        }
        if ($found < 0) {
            return null;
        }
        fseek($handle, $found * $size + $keyBytes);
        $code = (string) fread($handle, 2);
        return preg_match('/^[A-Z]{2}$/', $code) ? $code : null;
    } finally {
        fclose($handle);
    }
}
