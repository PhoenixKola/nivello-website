<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ops.php';

const INBOX_STATUS_LABELS = ['new' => 'New', 'replied' => 'Replied', 'qualified' => 'Qualified', 'converted' => 'Converted', 'closed' => 'Closed', 'spam' => 'Spam'];

function inbox_detail(array $state, string $id): array
{
    $item = $state['inbox'][ops_index($state, 'inbox', $id, 'Inquiry')];
    $project = ops_find($state, 'projects', $item['projectId']);
    return [
        'item' => $item,
        'lead' => lead_brief(ops_find($state, 'leads', $item['leadId'])),
        'project' => $project ? ['id' => $project['id'], 'name' => $project['name'], 'stage' => $project['stage']] : null,
        'activities' => ops_activities_for($state, 'inbox', $id),
    ];
}

function inbox_counts(array $state): array
{
    $counts = array_fill_keys(INBOX_STATUSES, 0);
    foreach ($state['inbox'] as $item) {
        $counts[$item['status']]++;
    }
    return $counts;
}

function set_inbox_status(array &$state, array &$item, string $status, ?string $reason = null): void
{
    if ($item['status'] === $status) {
        return;
    }
    add_ops_activity($state, 'inbox', $item['id'], 'status', $reason ?? 'Status changed to ' . INBOX_STATUS_LABELS[$status], ['from' => $item['status'], 'to' => $status]);
    $item['status'] = $status;
    $item['updatedAt'] = now_iso();
}

/** Runs $fn with a reference to one inquiry inside a locked mutation, then returns its detail. */
function with_inquiry(string $id, Closure $fn): array
{
    return Store::instance()->mutate(function (array &$state) use ($id, $fn) {
        $i = ops_index($state, 'inbox', $id, 'Inquiry');
        $fn($state, $i);
        return inbox_detail($state, $id);
    });
}

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $status = $_GET['status'] ?? 'all';
        $status = $status === 'all' ? 'all' : v_enum($status, 'Status', INBOX_STATUSES);
        $q = mb_strtolower(trim((string) ($_GET['q'] ?? '')));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $pageSize = 30;
        $items = array_filter($state['inbox'], function ($item) use ($status, $q) {
            // "All" hides spam; spam has its own filter.
            if ($status === 'all' ? $item['status'] === 'spam' : $item['status'] !== $status) {
                return false;
            }
            if ($q === '') {
                return true;
            }
            return str_contains(mb_strtolower($item['name'] . ' ' . $item['email'] . ' ' . $item['company'] . ' ' . $item['message'] . ' ' . $item['projectType']), $q);
        });
        usort($items, fn ($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
        $total = count($items);
        return [
            'items' => array_map('inbox_summary', array_slice($items, ($page - 1) * $pageSize, $pageSize)),
            'total' => $total,
            'page' => $page,
            'pages' => max(1, (int) ceil($total / $pageSize)),
            'counts' => inbox_counts($state),
        ];
    },
    'GET get' => fn () => inbox_detail(Store::instance()->read(), v_id($_GET['id'] ?? '', 'inq', 'Inquiry id')),
    'POST status' => function () {
        $body = json_body();
        $status = v_enum($body['status'] ?? '', 'Status', INBOX_STATUSES);
        return with_inquiry(v_id($body['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) use ($status) {
            set_inbox_status($state, $state['inbox'][$i], $status);
        });
    },
    'POST note' => function () {
        $body = json_body();
        $text = v_string($body['body'] ?? '', 'Note', 5000, true);
        return with_inquiry(v_id($body['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) use ($text) {
            $state['inbox'][$i]['notes'][] = ['id' => new_id('note'), 'body' => $text, 'createdAt' => now_iso()];
            $state['inbox'][$i]['updatedAt'] = now_iso();
            add_ops_activity($state, 'inbox', $state['inbox'][$i]['id'], 'note', 'Note added');
        });
    },
    'POST delete-note' => function () {
        $body = json_body();
        $noteId = v_id($body['noteId'] ?? '', 'note', 'Note id');
        return with_inquiry(v_id($body['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) use ($noteId) {
            $before = count($state['inbox'][$i]['notes']);
            $state['inbox'][$i]['notes'] = array_values(array_filter($state['inbox'][$i]['notes'], fn ($n) => $n['id'] !== $noteId));
            if (count($state['inbox'][$i]['notes']) === $before) {
                throw new ApiError('NOT_FOUND', 'Note not found.', 404);
            }
        });
    },
    'POST mark-replied' => function () {
        return with_inquiry(v_id(json_body()['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) {
            $item = &$state['inbox'][$i];
            if (in_array($item['status'], ['new'], true)) {
                set_inbox_status($state, $item, 'replied', 'Marked as replied');
            }
            if ($item['leadId']) {
                foreach ($state['leads'] as &$lead) {
                    if ($lead['id'] === $item['leadId']) {
                        $lead['lastContactedAt'] = now_iso();
                        if ($lead['status'] === 'new') {
                            $lead['status'] = 'contacted';
                        }
                        $lead['updatedAt'] = now_iso();
                        add_activity($state, $lead['id'], 'contact', 'Replied to website inquiry by email');
                    }
                }
                unset($lead);
            }
        });
    },
    'POST convert-lead' => function () {
        return with_inquiry(v_id(json_body()['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) {
            convert_inquiry_to_lead($state, $i);
            if (in_array($state['inbox'][$i]['status'], ['new', 'replied', 'qualified'], true)) {
                set_inbox_status($state, $state['inbox'][$i], 'converted', 'Converted to lead');
            }
        });
    },
    'POST link-lead' => function () {
        $body = json_body();
        return with_inquiry(v_id($body['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) use ($body) {
            $leadId = v_ref($state, $body['leadId'] ?? null, 'leads', 'lead', 'Lead');
            $item = &$state['inbox'][$i];
            if ($item['leadId'] === $leadId) {
                return;
            }
            $item['leadId'] = $leadId;
            $item['updatedAt'] = now_iso();
            add_ops_activity($state, 'inbox', $item['id'], $leadId ? 'lead_linked' : 'lead_unlinked', $leadId ? 'Linked to a lead' : 'Lead unlinked', $leadId ? ['leadId' => $leadId] : []);
            if ($leadId) {
                add_activity($state, $leadId, 'inbox_linked', 'Website inquiry from ' . $item['name'] . ' linked', ['inboxId' => $item['id']]);
            }
        });
    },
    'POST create-project' => function () {
        return with_inquiry(v_id(json_body()['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) {
            $item = &$state['inbox'][$i];
            if ($item['projectId'] && ops_find($state, 'projects', $item['projectId'])) {
                throw new ApiError('ALREADY_LINKED', 'This inquiry already has a project.', 409);
            }
            if (count($state['projects']) >= PROJECT_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Project limit reached.', 422);
            }
            $project = blank_project();
            $client = $item['company'] ?: $item['name'];
            $project['name'] = mb_substr(($item['projectType'] ?: 'Project') . ' for ' . $client, 0, 120);
            $project['clientName'] = $client;
            $project['leadId'] = $item['leadId'] && ops_find($state, 'leads', $item['leadId']) ? $item['leadId'] : null;
            $project['inboxId'] = $item['id'];
            $project['stage'] = 'discovery';
            $project['nextAction'] = 'Discovery call';
            $project['notes'] = trim(implode("\n", array_filter([
                $item['budget'] ? 'Budget: ' . $item['budget'] : '',
                $item['timing'] ? 'Timing: ' . $item['timing'] : '',
                $item['deadline'] ? 'Deadline: ' . $item['deadline'] : '',
            ])));
            $state['projects'][] = $project;
            $item['projectId'] = $project['id'];
            $item['updatedAt'] = now_iso();
            add_ops_activity($state, 'project', $project['id'], 'created', 'Project created from a website inquiry', ['inboxId' => $item['id']]);
            add_ops_activity($state, 'inbox', $item['id'], 'project_created', 'Project created', ['projectId' => $project['id']]);
            if (in_array($item['status'], ['new', 'replied', 'qualified'], true)) {
                set_inbox_status($state, $item, 'converted', 'Converted to project');
            }
        });
    },
    'POST link-project' => function () {
        $body = json_body();
        return with_inquiry(v_id($body['id'] ?? '', 'inq', 'Inquiry id'), function (array &$state, int $i) use ($body) {
            $projectId = v_ref($state, $body['projectId'] ?? null, 'projects', 'prj', 'Project');
            $item = &$state['inbox'][$i];
            if ($item['projectId'] === $projectId) {
                return;
            }
            $item['projectId'] = $projectId;
            $item['updatedAt'] = now_iso();
            add_ops_activity($state, 'inbox', $item['id'], $projectId ? 'project_linked' : 'project_unlinked', $projectId ? 'Linked to a project' : 'Project unlinked');
            if ($projectId) {
                $p = ops_index($state, 'projects', $projectId, 'Project');
                if (!$state['projects'][$p]['inboxId']) {
                    $state['projects'][$p]['inboxId'] = $item['id'];
                }
            }
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'inq', 'Inquiry id');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'inbox', $id, 'Inquiry');
            if (!in_array($state['inbox'][$i]['status'], ['spam', 'closed'], true)) {
                throw new ApiError('VALIDATION_ERROR', 'Only closed or spam inquiries can be deleted.', 422);
            }
            array_splice($state['inbox'], $i, 1);
            foreach ($state['projects'] as &$project) {
                if ($project['inboxId'] === $id) {
                    $project['inboxId'] = null;
                }
            }
            unset($project);
            $state['opsActivities'] = array_values(array_filter($state['opsActivities'], fn ($a) => !($a['entity'] === 'inbox' && $a['entityId'] === $id)));
            return ['deleted' => true];
        });
    },
]);
