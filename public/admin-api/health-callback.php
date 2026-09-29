<?php
declare(strict_types=1);

// Signed server-to-server endpoint for the scheduled Site Health workflow (see _signed.php).
//   {"event": "monitors"}                        -> enabled monitors to check
//   {"event": "results", "runId": "...", "results": [{monitorId, at, status, ms, error, ssl}]}

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_signed.php';
require __DIR__ . '/_health.php';

signed_run(512 * 1024, function (array $body) {
    $event = $body['event'] ?? null;
    if ($event === 'monitors') {
        $state = health_store()->read();
        $enabled = array_values(array_filter($state['monitors'], fn ($m) => $m['enabled']));
        return ['monitors' => array_map(fn ($m) => ['id' => $m['id'], 'url' => $m['url'], 'expectedStatus' => $m['expectedStatus']], $enabled)];
    }
    if ($event !== 'results') {
        throw new ApiError('UNKNOWN_EVENT', 'Unknown event.', 422);
    }
    $runId = is_string($body['runId'] ?? null) && preg_match('/^[A-Za-z0-9_.-]{1,64}$/', $body['runId']) ? $body['runId'] : null;
    $results = is_array($body['results'] ?? null) ? array_slice($body['results'], 0, HEALTH_MAX_MONITORS) : [];
    return health_store()->mutate(function (array &$state) use ($results, $runId) {
        if ($runId !== null && in_array($runId, $state['lastRun']['recentRunIds'] ?? [], true)) {
            return ['recorded' => 0, 'duplicateRun' => true];
        }
        $recorded = 0;
        $ignored = 0;
        foreach ($results as $result) {
            $id = is_array($result) ? ($result['monitorId'] ?? null) : null;
            $monitor = null;
            foreach ($state['monitors'] as $candidate) {
                if ($candidate['id'] === $id) {
                    $monitor = $candidate;
                }
            }
            // Deleted or paused since the run started: drop the result.
            if (!$monitor || !$monitor['enabled']) {
                $ignored++;
                continue;
            }
            health_record_check($state, $monitor['id'], health_normalize_check($monitor, $result, 'scheduled'));
            $recorded++;
        }
        $state['lastRun'] = [
            'at' => now_iso(),
            'runId' => $runId,
            'recorded' => $recorded,
            'recentRunIds' => $runId === null ? ($state['lastRun']['recentRunIds'] ?? []) : array_slice(array_merge($state['lastRun']['recentRunIds'] ?? [], [$runId]), -20),
        ];
        return ['recorded' => $recorded, 'ignored' => $ignored];
    });
}, 'health callback');
