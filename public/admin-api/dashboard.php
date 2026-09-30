<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';
require __DIR__ . '/_agenda.php';
require __DIR__ . '/_health.php';
require __DIR__ . '/_analytics.php';

/** Activity worth seeing on the Overview; imports, edits, tags and notes stay on the record itself. */
const FEED_LEAD_TYPES = ['created', 'status_changed', 'follow_up_completed', 'contact_logged', 'inbox_linked'];
const FEED_OPS_TYPES = [
    'inbox' => ['received', 'lead_created', 'lead_linked', 'project_created'],
    'project' => ['created', 'stage', 'task_completed', 'milestone_completed', 'proposal_tasks'],
    'proposal' => ['created', 'status'],
];

/** Runs one dashboard block; a failing module shows as unavailable instead of breaking the Overview. */
function dashboard_block(Closure $fn): mixed
{
    try {
        return $fn();
    } catch (Throwable $e) {
        error_log('[nivello-admin] dashboard block failed: ' . get_class($e) . ': ' . $e->getMessage());
        return null;
    }
}

/** Newest meaningful activity across leads, inquiries, projects and proposals, each linked to its record. */
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
    for ($i = count($state['activities']) - 1, $n = 0; $i >= 0 && $n < $limit; $i--) {
        $a = $state['activities'][$i];
        if (in_array($a['type'], FEED_LEAD_TYPES, true)) {
            $items[] = ['id' => $a['id'], 'entity' => 'lead', 'entityId' => $a['leadId'], 'message' => $a['message'], 'at' => $a['at'], 'label' => $names['lead:' . $a['leadId']] ?? null];
            $n++;
        }
    }
    for ($i = count($state['opsActivities']) - 1, $n = 0; $i >= 0 && $n < $limit; $i--) {
        $a = $state['opsActivities'][$i];
        if (in_array($a['type'], FEED_OPS_TYPES[$a['entity']] ?? [], true)) {
            $items[] = ['id' => $a['id'], 'entity' => $a['entity'], 'entityId' => $a['entityId'], 'message' => $a['message'], 'at' => $a['at'], 'label' => $names[$a['entity'] . ':' . $a['entityId']] ?? null];
            $n++;
        }
    }
    usort($items, fn ($a, $b) => strcmp($b['at'], $a['at']));
    return array_slice($items, 0, $limit);
}

function add_money(array &$totals, string $currency, int $cents): void
{
    $totals[$currency] = ($totals[$currency] ?? 0) + $cents;
}

/** Headline numbers from live records only. */
function overview_kpis(array $state, int $now, int $tzOffset): array
{
    $today = local_date($now, $tzOffset);
    $todayEnd = local_day_end($now, $tzOffset);
    $kpis = ['activeProjects' => 0, 'pipelineValue' => [], 'proposalsAwaiting' => 0, 'proposalsAwaitingValue' => [], 'followUpsDue' => 0, 'overdueTasks' => 0, 'unreadInbox' => 0, 'inboxFailed' => 0];
    foreach ($state['projects'] as $project) {
        if (in_array($project['stage'], PROJECT_OPEN_STAGES, true)) {
            $kpis['activeProjects']++;
            if ($project['value'] !== null) {
                add_money($kpis['pipelineValue'], $project['currency'], $project['value']);
            }
        }
        foreach ($project['tasks'] ?? [] as $task) {
            $kpis['overdueTasks'] += $task['status'] !== 'done' && $task['dueDate'] !== null && $task['dueDate'] < $today ? 1 : 0;
        }
    }
    foreach ($state['proposals'] as $proposal) {
        if ($proposal['status'] === 'sent') {
            $kpis['proposalsAwaiting']++;
            add_money($kpis['proposalsAwaitingValue'], $proposal['currency'], $proposal['totals']['total']);
        }
    }
    foreach ($state['leads'] as $lead) {
        $kpis['followUpsDue'] += in_array(follow_up_bucket($lead, $now, $todayEnd), ['overdue', 'today'], true) ? 1 : 0;
    }
    foreach ($state['inbox'] as $inquiry) {
        $kpis['unreadInbox'] += $inquiry['status'] === 'new' ? 1 : 0;
        $kpis['inboxFailed'] += $inquiry['status'] === 'new' && $inquiry['delivery'] === 'failed' ? 1 : 0;
    }
    $kpis['pipelineValue'] = $kpis['pipelineValue'] ?: new stdClass();
    $kpis['proposalsAwaitingValue'] = $kpis['proposalsAwaitingValue'] ?: new stdClass();
    return $kpis;
}

/** Leads by status, proposals by status (count + value) and projects by stage. */
function overview_pipeline(array $state): array
{
    $leads = array_fill_keys(LEAD_STATUSES, 0);
    foreach ($state['leads'] as $lead) {
        $leads[$lead['status']] = ($leads[$lead['status']] ?? 0) + 1;
    }
    $proposals = [];
    foreach (PROPOSAL_STATUSES as $status) {
        $proposals[$status] = ['count' => 0, 'value' => []];
    }
    foreach ($state['proposals'] as $proposal) {
        $proposals[$proposal['status']]['count']++;
        add_money($proposals[$proposal['status']]['value'], $proposal['currency'], $proposal['totals']['total']);
    }
    foreach ($proposals as &$row) {
        $row['value'] = $row['value'] ?: new stdClass();
    }
    unset($row);
    $projects = array_fill_keys(PROJECT_STAGES, 0);
    foreach ($state['projects'] as $project) {
        $projects[$project['stage']]++;
    }
    return ['leads' => $leads, 'proposals' => $proposals, 'projects' => $projects];
}

api_run([
    'GET summary' => function () {
        $state = Store::instance()->read();
        $now = time();
        $tzOffset = tz_offset_param($_GET['tzOffset'] ?? 0);
        $weekAgo = $now - 7 * 86400;

        $monitors = dashboard_block(fn () => health_overview(health_store()->read())['monitors']);
        $attention = overview_attention($state, $monitors ?? [], $now, $tzOffset);
        $counts = array_fill_keys(array_keys(ATTENTION_ORDER), 0);
        foreach ($attention as $item) {
            $counts[$item['urgency']]++;
        }

        return [
            'today' => local_date($now, $tzOffset),
            'totals' => [
                'leads' => count($state['leads']),
                'importedThisWeek' => count(array_filter($state['leads'], fn ($l) => (iso_to_ts($l['createdAt']) ?? 0) >= $weekAgo)),
            ],
            'kpis' => overview_kpis($state, $now, $tzOffset),
            'attention' => ['items' => array_slice($attention, 0, 40), 'counts' => $counts, 'total' => count($attention)],
            'upcoming' => array_slice(overview_upcoming($state, array_column($attention, 'id'), $now, $tzOffset), 0, 30),
            'pipeline' => overview_pipeline($state),
            'pendingDuplicates' => count(array_filter($state['duplicateCandidates'], fn ($d) => $d['status'] === 'pending')),
            'monitors' => $monitors === null ? null : count($monitors),
            'feed' => dashboard_block(fn () => recent_activity($state)),
            'analytics' => dashboard_block(function () {
                $summary = analytics_summary(gmdate('Y-m-d', time() - 6 * 86400), gmdate('Y-m-d'));
                return ['totals' => $summary['totals'], 'series' => array_map(fn ($d) => ['date' => $d['date'], 'pageViews' => $d['pageViews']], $summary['series'])];
            }),
        ];
    },
]);
