<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_leads.php';

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $leads = [];
        foreach ($state['leads'] as $lead) {
            $leads[$lead['id']] = $lead;
        }
        $items = [];
        foreach (array_reverse($state['duplicateCandidates']) as $candidate) {
            if ($candidate['status'] !== 'pending' || !isset($leads[$candidate['leadId']])) {
                continue;
            }
            $existing = $leads[$candidate['leadId']];
            $items[] = [
                'id' => $candidate['id'],
                'reason' => $candidate['reason'],
                'source' => $candidate['source'],
                'createdAt' => $candidate['createdAt'],
                'candidate' => $candidate['candidate'],
                'existing' => array_intersect_key($existing, array_flip(array_merge(['id', 'companyName', 'city', 'country', 'status', 'priority'], MERGEABLE_FIELDS))),
                'fills' => candidate_fills($existing, $candidate['candidate']),
            ];
        }
        $pageSize = 10;
        $total = count($items);
        $pages = max(1, (int) ceil($total / $pageSize));
        $page = min($pages, max(1, (int) ($_GET['page'] ?? 1)));
        return ['items' => array_slice($items, ($page - 1) * $pageSize, $pageSize), 'total' => $total, 'page' => $page, 'pages' => $pages];
    },
    'POST merge' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'dup');
        $fields = $body['fields'] ?? [];
        if (!is_array($fields) || array_diff($fields, MERGEABLE_FIELDS)) {
            throw new ApiError('VALIDATION_ERROR', 'Choose which fields to merge.', 422);
        }
        return Store::instance()->mutate(function (array &$state) use ($id, $fields) {
            foreach ($state['duplicateCandidates'] as $ci => $candidate) {
                if ($candidate['id'] !== $id) {
                    continue;
                }
                if ($candidate['status'] !== 'pending') {
                    throw new ApiError('CONFLICT', 'This duplicate was already resolved.', 409);
                }
                foreach ($state['leads'] as $li => $lead) {
                    if ($lead['id'] !== $candidate['leadId']) {
                        continue;
                    }
                    // Only explicitly chosen contact/company fields change; CRM fields (status, notes, tags) never do.
                    $applied = [];
                    foreach ($fields as $field) {
                        $value = $candidate['candidate'][$field] ?? null;
                        if ($value !== null && $value !== '') {
                            $state['leads'][$li][$field] = $value;
                            $applied[] = $field;
                        }
                    }
                    $state['leads'][$li]['fingerprint'] = lead_fingerprint($state['leads'][$li]);
                    $state['leads'][$li]['updatedAt'] = now_iso();
                    $state['duplicateCandidates'][$ci]['status'] = 'merged';
                    $state['duplicateCandidates'][$ci]['resolvedAt'] = now_iso();
                    add_activity($state, $lead['id'], 'duplicate_merged', $applied ? 'Duplicate merged: ' . implode(', ', $applied) : 'Duplicate reviewed (no fields changed)', ['fields' => $applied]);
                    return ['merged' => $applied, 'leadId' => $lead['id']];
                }
                throw new ApiError('NOT_FOUND', 'The existing lead no longer exists.', 404);
            }
            throw new ApiError('NOT_FOUND', 'Duplicate not found.', 404);
        });
    },
    'POST dismiss' => function () {
        $id = v_id(json_body()['id'] ?? '', 'dup');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            foreach ($state['duplicateCandidates'] as $i => $candidate) {
                if ($candidate['id'] === $id) {
                    $state['duplicateCandidates'][$i]['status'] = 'dismissed';
                    $state['duplicateCandidates'][$i]['resolvedAt'] = now_iso();
                    return ['dismissed' => true];
                }
            }
            throw new ApiError('NOT_FOUND', 'Duplicate not found.', 404);
        });
    },
]);
