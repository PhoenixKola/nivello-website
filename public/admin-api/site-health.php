<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_health.php';

function monitor_detail(array $state, string $id): array
{
    $monitor = health_monitor($state, $id);
    return [
        'monitor' => health_view($state, $monitor, HEALTH_CHECKS_KEEP),
        'incidents' => array_values(array_reverse(array_filter($state['incidents'], fn ($i) => $i['monitorId'] === $id))),
    ];
}

api_run([
    'GET list' => fn () => health_overview(health_store()->read()),
    'GET get' => function () {
        $id = v_id($_GET['id'] ?? '', 'mon', 'Monitor id');
        return monitor_detail(health_store()->read(), $id);
    },
    'GET incidents' => function () {
        $state = health_store()->read();
        return ['incidents' => array_slice(array_reverse($state['incidents']), 0, 200)];
    },
    'POST create' => function () {
        $fields = monitor_input(json_body()['monitor'] ?? []);
        return health_store()->mutate(function (array &$state) use ($fields) {
            if (count($state['monitors']) >= HEALTH_MAX_MONITORS) {
                throw new ApiError('VALIDATION_ERROR', 'Monitor limit reached (' . HEALTH_MAX_MONITORS . ').', 422);
            }
            foreach ($state['monitors'] as $existing) {
                if (rtrim($existing['url'], '/') === rtrim($fields['url'], '/')) {
                    throw new ApiError('VALIDATION_ERROR', "\"{$existing['name']}\" already monitors this URL.", 422);
                }
            }
            $monitor = new_monitor($fields);
            $state['monitors'][] = $monitor;
            return ['monitor' => health_view($state, $monitor)];
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'mon', 'Monitor id');
        $snapshot = health_store()->read();
        $current = health_monitor($snapshot, $id);
        // Validate (and resolve DNS) outside the lock.
        $fields = monitor_input($body['monitor'] ?? [], $current);
        return health_store()->mutate(function (array &$state) use ($id, $fields) {
            $monitor = &health_monitor($state, $id);
            $urlChanged = $monitor['url'] !== $fields['url'];
            $monitor = array_merge($monitor, $fields, ['updatedAt' => now_iso()]);
            if ($urlChanged) {
                // History belongs to the old URL.
                $monitor = array_merge($monitor, ['last' => null, 'lastSuccessAt' => null, 'lastFailureAt' => null, 'consecutiveFailures' => 0, 'ssl' => null]);
                unset($state['checks'][$id]);
                foreach ($state['incidents'] as &$incident) {
                    if ($incident['monitorId'] === $id && $incident['resolvedAt'] === null) {
                        $incident['resolvedAt'] = now_iso();
                    }
                }
                unset($incident);
            }
            unset($monitor);
            return monitor_detail($state, $id);
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'mon', 'Monitor id');
        return health_store()->mutate(function (array &$state) use ($id) {
            health_monitor($state, $id);
            $state['monitors'] = array_values(array_filter($state['monitors'], fn ($m) => $m['id'] !== $id));
            unset($state['checks'][$id]);
            $state['incidents'] = array_values(array_filter($state['incidents'], fn ($i) => $i['monitorId'] !== $id));
            return ['deleted' => true];
        });
    },
    'POST check' => function () {
        $id = v_id(json_body()['id'] ?? '', 'mon', 'Monitor id');
        $snapshot = health_store()->read();
        $monitor = health_monitor($snapshot, $id);
        // The network check runs outside the store lock.
        $result = health_check_url($monitor['url'], (int) $monitor['expectedStatus']);
        return health_store()->mutate(function (array &$state) use ($id, $result) {
            $monitor = health_monitor($state, $id);
            health_record_check($state, $id, health_normalize_check($monitor, $result, 'manual'));
            return monitor_detail($state, $id);
        });
    },
]);
