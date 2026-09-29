<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $batches = array_reverse($state['batches']);
        $pageSize = v_int($_GET['pageSize'] ?? 10, 'Page size', 1, 50);
        $total = count($batches);
        $pages = max(1, (int) ceil($total / $pageSize));
        $page = min($pages, max(1, (int) ($_GET['page'] ?? 1)));
        return [
            'items' => array_map('batch_public', array_slice($batches, ($page - 1) * $pageSize, $pageSize)),
            'total' => $total,
            'page' => $page,
            'pages' => $pages,
            'pageSize' => $pageSize,
        ];
    },
    'GET get' => function () {
        $id = v_id($_GET['id'] ?? '', 'batch');
        $state = Store::instance()->read();
        $batch = find_batch($state, $id);
        if ($batch === null) {
            throw new ApiError('NOT_FOUND', 'Discovery batch not found.', 404);
        }
        return ['batch' => batch_public($batch)];
    },
    'POST delete' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'batch');
        $deleteLeads = v_bool($body['deleteLeads'] ?? false);
        return Store::instance()->mutate(function (array &$state) use ($id, $deleteLeads) {
            $batch = find_batch($state, $id);
            if ($batch === null) {
                throw new ApiError('NOT_FOUND', 'Discovery batch not found.', 404);
            }
            if (in_array($batch['status'], OPEN_BATCH_STATUSES, true)) {
                throw new ApiError('BATCH_ACTIVE', 'Stop this discovery before deleting it.', 409);
            }
            $deletedLeads = 0;
            // Leads survive batch deletion unless the admin explicitly chose to delete them too.
            if ($deleteLeads) {
                $drop = [];
                foreach ($state['leads'] as $lead) {
                    if (($lead['sourceBatchId'] ?? null) === $id) {
                        $drop[$lead['id']] = true;
                    }
                }
                $deletedLeads = count($drop);
                $state['leads'] = array_values(array_filter($state['leads'], fn ($l) => !isset($drop[$l['id']])));
                $state['notes'] = array_values(array_filter($state['notes'], fn ($n) => !isset($drop[$n['leadId']])));
                $state['activities'] = array_values(array_filter($state['activities'], fn ($a) => !isset($drop[$a['leadId']])));
                $state['duplicateCandidates'] = array_values(array_filter($state['duplicateCandidates'], fn ($d) => !isset($drop[$d['leadId']])));
                detach_leads($state, $drop);
            }
            $state['batches'] = array_values(array_filter($state['batches'], fn ($b) => $b['id'] !== $id));
            unset($state['batchSeen'][$id]);
            return ['deleted' => true, 'deletedLeads' => $deletedLeads];
        });
    },
]);
