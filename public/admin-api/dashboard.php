<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';
require __DIR__ . '/_ops.php';
require __DIR__ . '/_health.php';
require __DIR__ . '/_analytics.php';

/** Runs one dashboard block; a failing module shows as unavailable instead of breaking the Overview. */
function dashboard_block(Closure $fn): ?array
{
    try {
        return $fn();
    } catch (Throwable $e) {
        error_log('[nivello-admin] dashboard block failed: ' . get_class($e) . ': ' . $e->getMessage());
        return null;
    }
}

function ops_overview(array $state): array
{
    $today = gmdate('Y-m-d');
    $newInquiries = array_values(array_filter($state['inbox'], fn ($i) => $i['status'] === 'new'));
    usort($newInquiries, fn ($a, $b) => strcmp($b['createdAt'], $a['createdAt']));

    $projects = ['active' => 0, 'dueSoon' => 0, 'overdue' => 0, 'awaitingProposal' => 0, 'inDevelopment' => 0, 'inQa' => 0, 'recentlyDelivered' => 0, 'value' => []];
    $due = [];
    $monthAgo = gmdate('Y-m-d', time() - 30 * 86400);
    foreach ($state['projects'] as $project) {
        if (in_array($project['stage'], PROJECT_OPEN_STAGES, true)) {
            $projects['active']++;
            if ($project['value'] !== null) {
                $projects['value'][$project['currency']] = ($projects['value'][$project['currency']] ?? 0) + $project['value'];
            }
        }
        $projects['awaitingProposal'] += $project['stage'] === 'proposal' ? 1 : 0;
        $projects['inDevelopment'] += $project['stage'] === 'development' ? 1 : 0;
        $projects['inQa'] += $project['stage'] === 'qa' ? 1 : 0;
        if ($project['stage'] === 'delivered' && ($project['deliveredDate'] ?? '') >= $monthAgo) {
            $projects['recentlyDelivered']++;
        }
        $dueState = project_due_state($project, $today);
        if ($dueState) {
            $projects[$dueState === 'soon' ? 'dueSoon' : 'overdue']++;
            $due[] = ['id' => $project['id'], 'name' => $project['name'], 'clientName' => $project['clientName'], 'targetDate' => $project['targetDate'], 'due' => $dueState, 'stage' => $project['stage']];
        }
    }
    usort($due, fn ($a, $b) => strcmp($a['targetDate'], $b['targetDate']));
    $projects['value'] = $projects['value'] ?: new stdClass();

    $proposals = ['draft' => 0, 'sent' => 0, 'accepted' => 0, 'acceptedThisMonth' => 0, 'sentValue' => [], 'awaiting' => []];
    $monthStart = gmdate('Y-m-01');
    foreach ($state['proposals'] as $proposal) {
        if (isset($proposals[$proposal['status']])) {
            $proposals[$proposal['status']]++;
        }
        if ($proposal['status'] === 'sent') {
            $proposals['sentValue'][$proposal['currency']] = ($proposals['sentValue'][$proposal['currency']] ?? 0) + $proposal['totals']['total'];
            $proposals['awaiting'][] = proposal_summary($proposal);
        }
        if ($proposal['status'] === 'accepted' && substr((string) $proposal['acceptedAt'], 0, 10) >= $monthStart) {
            $proposals['acceptedThisMonth']++;
        }
    }
    usort($proposals['awaiting'], fn ($a, $b) => strcmp((string) $a['sentAt'], (string) $b['sentAt']));
    $proposals['awaiting'] = array_slice($proposals['awaiting'], 0, 5);
    $proposals['sentValue'] = $proposals['sentValue'] ?: new stdClass();

    $failed = count(array_filter($state['inbox'], fn ($i) => $i['delivery'] === 'failed' && in_array($i['status'], ['new', 'qualified'], true)));
    return [
        'inbox' => ['new' => count($newInquiries), 'failedDelivery' => $failed, 'latest' => array_map('inbox_summary', array_slice($newInquiries, 0, 5))],
        'projects' => $projects + ['due' => array_slice($due, 0, 6)],
        'proposals' => $proposals,
    ];
}

/** Lead and operations activity merged, newest first, each with a label and a record to open. */
function recent_activity(array $state, int $limit = 12): array
{
    $names = [];
    foreach ($state['leads'] as $lead) {
        $names['lead:' . $lead['id']] = $lead['companyName'];
    }
    foreach ($state['inbox'] as $item) {
        $names['inbox:' . $item['id']] = $item['name'];
    }
    foreach ($state['projects'] as $project) {
        $names['project:' . $project['id']] = $project['name'];
    }
    foreach ($state['proposals'] as $proposal) {
        $names['proposal:' . $proposal['id']] = $proposal['number'] . ' ' . $proposal['title'];
    }
    $items = [];
    foreach (array_slice($state['activities'], -$limit) as $a) {
        $items[] = ['id' => $a['id'], 'entity' => 'lead', 'entityId' => $a['leadId'], 'message' => $a['message'], 'at' => $a['at'], 'label' => $names['lead:' . $a['leadId']] ?? null];
    }
    foreach (array_slice($state['opsActivities'], -$limit) as $a) {
        $items[] = ['id' => $a['id'], 'entity' => $a['entity'], 'entityId' => $a['entityId'], 'message' => $a['message'], 'at' => $a['at'], 'label' => $names[$a['entity'] . ':' . $a['entityId']] ?? null];
    }
    usort($items, fn ($a, $b) => strcmp($b['at'], $a['at']));
    return array_slice($items, 0, $limit);
}

function top_counts(array $counts, int $limit = 6): array
{
    arsort($counts);
    $out = [];
    foreach (array_slice($counts, 0, $limit, true) as $label => $count) {
        $out[] = ['label' => (string) $label, 'count' => $count];
    }
    return $out;
}

api_run([
    'GET summary' => function () {
        $state = Store::instance()->read();
        $now = time();
        $weekAgo = $now - 7 * 86400;
        $todayEnd = strtotime('tomorrow', $now) - 1;

        $byStatus = array_fill_keys(LEAD_STATUSES, 0);
        $cities = [];
        $categories = [];
        $importedThisWeek = 0;
        $followUpsDue = 0;
        $upcoming = [];
        $names = [];
        foreach ($state['leads'] as $lead) {
            $names[$lead['id']] = $lead['companyName'];
            $byStatus[$lead['status']] = ($byStatus[$lead['status']] ?? 0) + 1;
            if ($lead['city'] !== '') {
                $cities[$lead['city']] = ($cities[$lead['city']] ?? 0) + 1;
            }
            if ($lead['category'] !== '') {
                $categories[$lead['category']] = ($categories[$lead['category']] ?? 0) + 1;
            }
            if ((iso_to_ts($lead['createdAt']) ?? 0) >= $weekAgo) {
                $importedThisWeek++;
            }
            $follow = iso_to_ts($lead['followUpAt'] ?? null);
            $open = $follow !== null && empty($lead['followUpCompletedAt']) && !in_array($lead['status'], CLOSED_STATUSES, true);
            if ($open && $follow <= $todayEnd) {
                $followUpsDue++;
            }
            if ($open) {
                $upcoming[] = [
                    'id' => $lead['id'], 'companyName' => $lead['companyName'], 'followUpAt' => $lead['followUpAt'],
                    'nextAction' => $lead['nextAction'], 'status' => $lead['status'], 'overdue' => $follow < $now,
                ];
            }
        }
        usort($upcoming, fn ($a, $b) => strcmp($a['followUpAt'], $b['followUpAt']));

        $recent = array_slice(array_reverse($state['activities']), 0, 10);
        $recent = array_map(fn ($a) => $a + ['companyName' => $names[$a['leadId']] ?? null], $recent);

        return [
            'totals' => [
                'leads' => count($state['leads']),
                'new' => $byStatus['new'],
                'followUpsDue' => $followUpsDue,
                'contacted' => $byStatus['contacted'],
                'interested' => $byStatus['interested'],
                'won' => $byStatus['won'],
                'lost' => $byStatus['lost'],
                'importedThisWeek' => $importedThisWeek,
            ],
            'byStatus' => $byStatus,
            'topCities' => top_counts($cities),
            'topCategories' => top_counts($categories),
            'recentActivity' => $recent,
            'upcomingFollowUps' => array_slice($upcoming, 0, 8),
            'pendingDuplicates' => count(array_filter($state['duplicateCandidates'], fn ($d) => $d['status'] === 'pending')),
            'ops' => dashboard_block(fn () => ops_overview($state)),
            'feed' => dashboard_block(fn () => recent_activity($state)),
            'health' => dashboard_block(function () {
                $overview = health_overview(health_store()->read());
                $attention = array_values(array_filter($overview['monitors'], fn ($m) => in_array($m['state'], ['down', 'warning'], true)));
                return [
                    'counts' => $overview['counts'],
                    'total' => count($overview['monitors']),
                    'attention' => array_map(fn ($m) => ['id' => $m['id'], 'name' => $m['name'], 'state' => $m['state'], 'detail' => $m['state'] === 'down' ? ($m['last']['error'] ?? 'Down') : implode(', ', $m['warnings'])], array_slice($attention, 0, 5)),
                ];
            }),
            'analytics' => dashboard_block(function () {
                $summary = analytics_summary(gmdate('Y-m-d', time() - 6 * 86400), gmdate('Y-m-d'));
                return ['totals' => $summary['totals'], 'series' => array_map(fn ($d) => ['date' => $d['date'], 'pageViews' => $d['pageViews']], $summary['series'])];
            }),
        ];
    },
]);
