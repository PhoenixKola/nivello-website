<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ops.php';

/** Allowed status moves. Accepted and rejected are final; duplicate a proposal to revise it. */
const PROPOSAL_TRANSITIONS = [
    'draft' => ['sent'],
    'sent' => ['draft', 'accepted', 'rejected', 'expired'],
    'expired' => ['sent', 'rejected'],
    'accepted' => [],
    'rejected' => [],
];
const LEAD_STATUS_ORDER = ['new' => 0, 'contacted' => 1, 'follow_up' => 1, 'interested' => 2, 'proposal' => 3, 'won' => 4, 'lost' => 4];

function proposal_detail(array $state, string $id): array
{
    $proposal = $state['proposals'][ops_index($state, 'proposals', $id, 'Proposal')];
    $project = ops_find($state, 'projects', $proposal['projectId']);
    return [
        'proposal' => $proposal,
        'lead' => lead_brief(ops_find($state, 'leads', $proposal['leadId'])),
        'project' => $project ? ['id' => $project['id'], 'name' => $project['name'], 'stage' => $project['stage']] : null,
        'activities' => ops_activities_for($state, 'proposal', $id),
    ];
}

/** Moves the linked lead forward (never backwards) and logs it on the lead. */
function advance_lead(array &$state, ?string $leadId, string $status, string $message): void
{
    if (!$leadId) {
        return;
    }
    foreach ($state['leads'] as &$lead) {
        if ($lead['id'] === $leadId) {
            if (LEAD_STATUS_ORDER[$status] > LEAD_STATUS_ORDER[$lead['status']] && $lead['status'] !== 'lost') {
                $lead['status'] = $status;
                $lead['updatedAt'] = now_iso();
            }
            add_activity($state, $leadId, 'proposal', $message);
        }
    }
    unset($lead);
}

function prefill_client(array $state, array &$proposal): void
{
    if ($proposal['projectId'] && !$proposal['leadId']) {
        $proposal['leadId'] = ops_find($state, 'projects', $proposal['projectId'])['leadId'] ?? null;
    }
    $lead = ops_find($state, 'leads', $proposal['leadId']);
    $project = ops_find($state, 'projects', $proposal['projectId']);
    if ($proposal['clientCompany'] === '') {
        $proposal['clientCompany'] = $lead['companyName'] ?? ($project['clientName'] ?? '');
    }
    if ($proposal['clientName'] === '' && $lead) {
        $proposal['clientName'] = $lead['contactPerson'];
    }
    if ($proposal['clientEmail'] === '' && $lead) {
        $proposal['clientEmail'] = $lead['email'];
    }
}

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $status = $_GET['status'] ?? 'all';
        $status = $status === 'all' ? 'all' : v_enum($status, 'Status', PROPOSAL_STATUSES);
        $q = mb_strtolower(trim((string) ($_GET['q'] ?? '')));
        $counts = array_fill_keys(PROPOSAL_STATUSES, 0);
        $items = [];
        foreach ($state['proposals'] as $proposal) {
            $counts[$proposal['status']]++;
            if ($status !== 'all' && $proposal['status'] !== $status) {
                continue;
            }
            if ($q !== '' && !str_contains(mb_strtolower($proposal['number'] . ' ' . $proposal['title'] . ' ' . $proposal['clientName'] . ' ' . $proposal['clientCompany']), $q)) {
                continue;
            }
            $items[] = proposal_summary($proposal);
        }
        usort($items, fn ($a, $b) => strcmp($b['updatedAt'], $a['updatedAt']));
        return ['proposals' => $items, 'counts' => $counts];
    },
    'GET get' => fn () => proposal_detail(Store::instance()->read(), v_id($_GET['id'] ?? '', 'prop', 'Proposal id')),
    'POST create' => function () {
        $fields = json_body()['proposal'] ?? [];
        if (!is_array($fields)) {
            throw new ApiError('VALIDATION_ERROR', 'Proposal details are required.', 422);
        }
        return Store::instance()->mutate(function (array &$state) use ($fields) {
            if (count($state['proposals']) >= PROPOSAL_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Proposal limit reached.', 422);
            }
            $proposal = blank_proposal();
            apply_proposal_fields($state, $proposal, $fields);
            prefill_client($state, $proposal);
            $proposal['number'] = next_proposal_number($state);
            $state['proposals'][] = $proposal;
            add_ops_activity($state, 'proposal', $proposal['id'], 'created', "Proposal {$proposal['number']} created");
            if ($proposal['projectId']) {
                add_ops_activity($state, 'project', $proposal['projectId'], 'proposal', "Proposal {$proposal['number']} created");
            }
            return proposal_detail($state, $proposal['id']);
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'prop', 'Proposal id');
        $fields = $body['proposal'] ?? null;
        if (!is_array($fields) || !$fields) {
            throw new ApiError('VALIDATION_ERROR', 'No changes provided.', 422);
        }
        return Store::instance()->mutate(function (array &$state) use ($id, $fields) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            $proposal = $state['proposals'][$i];
            if (!in_array($proposal['status'], PROPOSAL_EDITABLE, true)) {
                throw new ApiError('PROPOSAL_LOCKED', 'Accepted, rejected and expired proposals are kept as they were. Duplicate it to make a new version.', 409);
            }
            apply_proposal_fields($state, $proposal, $fields);
            $state['proposals'][$i] = $proposal;
            return proposal_detail($state, $id);
        });
    },
    'POST status' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'prop', 'Proposal id');
        $status = v_enum($body['status'] ?? '', 'Status', PROPOSAL_STATUSES);
        $projectMode = v_enum($body['project'] ?? 'none', 'Project option', ['none', 'create', 'update']);
        return Store::instance()->mutate(function (array &$state) use ($id, $status, $projectMode) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            $proposal = &$state['proposals'][$i];
            $from = $proposal['status'];
            if (!in_array($status, PROPOSAL_TRANSITIONS[$from], true)) {
                throw new ApiError('INVALID_TRANSITION', "A proposal cannot move from $from to $status.", 409);
            }
            if ($status === 'sent' && !$proposal['items']) {
                throw new ApiError('VALIDATION_ERROR', 'Add at least one line item before sending.', 422);
            }
            $now = now_iso();
            $proposal['status'] = $status;
            $proposal['updatedAt'] = $now;
            $number = $proposal['number'];
            match ($status) {
                'sent' => $proposal['sentAt'] = $now,
                'accepted' => $proposal['acceptedAt'] = $now,
                'rejected' => $proposal['rejectedAt'] = $now,
                default => null,
            };
            $labels = ['draft' => 'moved back to draft', 'sent' => 'marked as sent', 'accepted' => 'accepted', 'rejected' => 'rejected', 'expired' => 'marked as expired'];
            add_ops_activity($state, 'proposal', $id, 'status', "Proposal {$labels[$status]}", ['from' => $from, 'to' => $status]);
            if ($status === 'sent') {
                advance_lead($state, $proposal['leadId'], 'proposal', "Proposal $number sent");
            } elseif ($status === 'accepted') {
                advance_lead($state, $proposal['leadId'], 'won', "Proposal $number accepted");
            } elseif ($status === 'rejected') {
                advance_lead($state, $proposal['leadId'], 'new', "Proposal $number rejected");
            }
            if ($proposal['projectId']) {
                add_ops_activity($state, 'project', $proposal['projectId'], 'proposal', "Proposal $number {$labels[$status]}");
            }

            if ($status === 'accepted' && $projectMode !== 'none') {
                $p = $proposal['projectId'] ? ops_index($state, 'projects', $proposal['projectId'], 'Project') : null;
                if ($p === null) {
                    if ($projectMode === 'update') {
                        throw new ApiError('VALIDATION_ERROR', 'This proposal is not linked to a project yet.', 422);
                    }
                    if (count($state['projects']) >= PROJECT_LIMIT) {
                        throw new ApiError('VALIDATION_ERROR', 'Project limit reached.', 422);
                    }
                    $project = blank_project();
                    $project['name'] = $proposal['title'];
                    $project['clientName'] = $proposal['clientCompany'] ?: $proposal['clientName'];
                    $project['leadId'] = $proposal['leadId'];
                    $project['stage'] = 'approved';
                    $project['nextAction'] = 'Kick-off';
                    $state['projects'][] = $project;
                    $p = count($state['projects']) - 1;
                    $proposal['projectId'] = $project['id'];
                    add_ops_activity($state, 'project', $project['id'], 'created', "Project created from accepted proposal $number");
                }
                $project = &$state['projects'][$p];
                $project['proposalId'] = $id;
                $project['value'] = $proposal['totals']['total'];
                $project['currency'] = $proposal['currency'];
                if (in_array($project['stage'], ['lead', 'discovery', 'proposal'], true)) {
                    add_ops_activity($state, 'project', $project['id'], 'stage', 'Moved from ' . PROJECT_STAGE_LABELS[$project['stage']] . ' to Approved (proposal accepted)');
                    $project['stage'] = 'approved';
                    $project['stageChangedAt'] = $now;
                }
                $project['updatedAt'] = $now;
                unset($project);
            }
            unset($proposal);
            return proposal_detail($state, $id);
        });
    },
    'POST duplicate' => function () {
        $id = v_id(json_body()['id'] ?? '', 'prop', 'Proposal id');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $source = $state['proposals'][ops_index($state, 'proposals', $id, 'Proposal')];
            if (count($state['proposals']) >= PROPOSAL_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Proposal limit reached.', 422);
            }
            $copy = blank_proposal();
            foreach (['title', 'language', 'leadId', 'projectId', 'clientName', 'clientCompany', 'clientEmail', 'currency', 'intro', 'scope', 'assumptions', 'terms', 'notes', 'items', 'discount', 'tax', 'milestones', 'totals'] as $field) {
                $copy[$field] = $source[$field];
            }
            $copy['number'] = next_proposal_number($state);
            $state['proposals'][] = $copy;
            add_ops_activity($state, 'proposal', $copy['id'], 'created', "Duplicated from {$source['number']}");
            return proposal_detail($state, $copy['id']);
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'prop', 'Proposal id');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            if ($state['proposals'][$i]['status'] !== 'draft') {
                throw new ApiError('PROPOSAL_LOCKED', 'Only drafts can be deleted; sent and decided proposals are kept for the record.', 409);
            }
            array_splice($state['proposals'], $i, 1);
            foreach ($state['projects'] as &$project) {
                if ($project['proposalId'] === $id) {
                    $project['proposalId'] = null;
                }
            }
            unset($project);
            $state['opsActivities'] = array_values(array_filter($state['opsActivities'], fn ($a) => !($a['entity'] === 'proposal' && $a['entityId'] === $id)));
            return ['deleted' => true];
        });
    },
]);
