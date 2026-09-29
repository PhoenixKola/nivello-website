<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';

function open_batches(): array
{
    $state = Store::instance()->read();
    $open = array_filter($state['batches'], fn ($b) => in_array($b['status'], OPEN_BATCH_STATUSES, true));
    return array_values(array_map('batch_public', $open));
}

api_run([
    'POST start' => function () {
        $params = validate_discovery_params(json_body());
        return ['batch' => DiscoveryService::create()->start($params)];
    },
    // Polled by the admin UI while batches are open. Progress arrives through runner callbacks;
    // this only advances the local queue and reconciles stale runs (no GitHub call otherwise).
    'POST status' => function () {
        DiscoveryService::create()->pump();
        process_enrichment_queue(Store::instance());
        return ['open' => open_batches(), 'at' => now_iso()];
    },
    'POST stop' => function () {
        $id = v_id(json_body()['id'] ?? '', 'batch');
        return ['batch' => DiscoveryService::create()->stop($id)];
    },
    'POST reconcile' => function () {
        $id = v_id(json_body()['id'] ?? '', 'batch');
        DiscoveryService::create()->pump(true, $id);
        $state = Store::instance()->read();
        $batch = find_batch($state, $id);
        if ($batch === null) {
            throw new ApiError('NOT_FOUND', 'Discovery batch not found.', 404);
        }
        return ['batch' => batch_public($batch)];
    },
]);
