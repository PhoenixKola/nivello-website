<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_leads.php';

// Leads CSV export: selected ids, a discovery batch, or the current filters.
api_run([
    'POST leads' => function () {
        $body = json_body();
        $state = Store::instance()->read();
        if (isset($body['ids'])) {
            $ids = array_flip(v_ids($body['ids'], 'lead'));
            $leads = array_values(array_filter($state['leads'], fn ($l) => isset($ids[$l['id']])));
            $name = 'selected';
        } elseif (isset($body['batchId'])) {
            $batchId = v_id($body['batchId'], 'batch');
            $leads = array_values(array_filter($state['leads'], fn ($l) => ($l['sourceBatchId'] ?? null) === $batchId));
            $name = 'batch';
        } else {
            $leads = filter_leads($state['leads'], parse_lead_filters(is_array($body['filters'] ?? null) ? $body['filters'] : []), tz_offset_param($body['tzOffset'] ?? 0));
            $name = 'leads';
        }
        $csv = leads_to_csv($leads, tag_name_map($state), batch_label_map($state));
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="nivello-' . $name . '-' . gmdate('Ymd-His') . '.csv"');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('X-Row-Count: ' . count($leads));
        echo $csv;
        exit;
    },
]);
