<?php
declare(strict_types=1);

// Signed progress/result callbacks from the GitHub Actions lead-discovery runner (see _signed.php).

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_signed.php';
require __DIR__ . '/_discovery.php';

signed_run(3 * 1024 * 1024, fn (array $body) => DiscoveryService::create()->handleCallback($body), 'callback');
