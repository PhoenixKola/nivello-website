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

function ensure_proposal_shape(array &$proposal): void
{
    foreach (['inboxId' => null, 'clientCode' => '', 'clientSector' => '', 'clientAddress' => '', 'clientPhone' => '', 'clientLogo' => null, 'expiredAt' => null, 'acceptance' => ['place' => '', 'date' => null], 'versions' => []] as $key => $default) {
        if (!array_key_exists($key, $proposal)) $proposal[$key] = $default;
    }
    if (!isset($proposal['sections']) || !is_array($proposal['sections']) || !$proposal['sections']) {
        $sectionItems = [];
        foreach (array_values($proposal['items'] ?? []) as $index => $item) {
            $title = $item['title'] ?? $item['description'] ?? '';
            $description = isset($item['title']) ? ($item['description'] ?? '') : ($item['details'] ?? '');
            $sectionItems[] = $item + [
                'id' => 'pitem_' . substr(hash('sha256', $proposal['id'] . '-item-' . $index), 0, 16),
                'title' => $title,
                'description' => $description,
                'details' => $description,
                'code' => 'A' . ($index + 1),
            ];
        }
        $proposal['sections'] = [[
            'id' => 'psec_' . substr(hash('sha256', $proposal['id'] . '-section-0'), 0, 16),
            'title' => $proposal['language'] === 'it' ? 'Servizi' : 'Services',
            'note' => '', 'order' => 0, 'items' => $sectionItems,
            'subtotal' => array_sum(array_map(fn ($item) => $item['optional'] ? 0 : $item['total'], $sectionItems)),
        ]];
    }
}

function proposal_private_dir(string $id, string $kind): string
{
    $base = ADMIN_DATA_DIR . '/proposals/' . $kind . '/' . $id;
    if (!is_dir($base) && !@mkdir($base, 0770, true) && !is_dir($base)) throw new ApiError('STORAGE_UNAVAILABLE', 'Could not create the proposal file directory.', 503);
    return $base;
}

function proposal_detail(array $state, string $id): array
{
    $proposal = $state['proposals'][ops_index($state, 'proposals', $id, 'Proposal')];
    ensure_proposal_shape($proposal);
    $project = ops_find($state, 'projects', $proposal['projectId']);
    $inquiry = ops_find($state, 'inbox', $proposal['inboxId']);
    return [
        'proposal' => $proposal,
        'lead' => lead_brief(ops_find($state, 'leads', $proposal['leadId'])),
        'inquiry' => $inquiry ? inbox_summary($inquiry) : null,
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
            $proposal['number'] = next_proposal_number($state, $proposal['clientCode']);
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
            ensure_proposal_shape($proposal);
            $wasSent = $proposal['status'] === 'sent';
            if (!in_array($proposal['status'], PROPOSAL_EDITABLE, true)) {
                throw new ApiError('PROPOSAL_LOCKED', 'Accepted, rejected and expired proposals are kept as they were. Duplicate it to make a new version.', 409);
            }
            apply_proposal_fields($state, $proposal, $fields);
            if ($wasSent) {
                $revision = count($proposal['versions']) + 1;
                $now = now_iso();
                $proposal['sentAt'] = $now;
                $snapshot = $proposal;
                $snapshot['versions'] = [];
                $proposal['versions'][] = ['revision' => $revision, 'createdAt' => $now, 'number' => $proposal['number'], 'files' => ['docx' => false, 'pdf' => false], 'snapshot' => $snapshot];
                add_ops_activity($state, 'proposal', $id, 'revision', "Sent proposal revised as version $revision");
            }
            $state['proposals'][$i] = $proposal;
            return proposal_detail($state, $id);
        });
    },
    'POST status' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'prop', 'Proposal id');
        $status = v_enum($body['status'] ?? '', 'Status', PROPOSAL_STATUSES);
        $projectMode = v_enum($body['project'] ?? 'none', 'Project option', ['none', 'create', 'update']);
        $createTasks = v_bool($body['createTasks'] ?? false);
        return Store::instance()->mutate(function (array &$state) use ($id, $status, $projectMode, $createTasks) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            $proposal = &$state['proposals'][$i];
            ensure_proposal_shape($proposal);
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
                'expired' => $proposal['expiredAt'] = $now,
                default => null,
            };
            $labels = ['draft' => 'moved back to draft', 'sent' => 'marked as sent', 'accepted' => 'accepted', 'rejected' => 'rejected', 'expired' => 'marked as expired'];
            add_ops_activity($state, 'proposal', $id, 'status', "Proposal {$labels[$status]}", ['from' => $from, 'to' => $status]);
            if ($status === 'sent') {
                $revision = count($proposal['versions']) + 1;
                $snapshot = $proposal;
                $snapshot['versions'] = [];
                $proposal['versions'][] = ['revision' => $revision, 'createdAt' => $now, 'number' => $number, 'files' => ['docx' => false, 'pdf' => false], 'snapshot' => $snapshot];
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
                if ($createTasks) {
                    $project['milestones'] ??= [];
                    $project['tasks'] ??= [];
                    foreach ($proposal['sections'] as $section) {
                        $existingMilestone = null;
                        foreach ($project['milestones'] as $candidate) if (($candidate['proposalSectionId'] ?? null) === $section['id']) $existingMilestone = $candidate['id'];
                        if (!$existingMilestone) {
                            $milestoneId = new_id('mile');
                            $project['milestones'][] = ['id' => $milestoneId, 'projectId' => $project['id'], 'proposalSectionId' => $section['id'], 'title' => $section['title'], 'description' => $section['note'], 'status' => 'not_started', 'dueDate' => null, 'order' => count($project['milestones']), 'createdAt' => $now, 'updatedAt' => $now, 'completedAt' => null];
                        } else $milestoneId = $existingMilestone;
                        foreach ($section['items'] as $item) {
                            if (array_filter($project['tasks'], fn ($task) => ($task['proposalItemId'] ?? null) === $item['id'])) continue;
                            $project['tasks'][] = ['id' => new_id('task'), 'projectId' => $project['id'], 'milestoneId' => $milestoneId, 'proposalItemId' => $item['id'], 'title' => $item['title'], 'description' => $item['description'], 'status' => 'todo', 'priority' => 'normal', 'dueDate' => null, 'assignee' => '', 'order' => count($project['tasks']), 'createdAt' => $now, 'updatedAt' => $now, 'completedAt' => null];
                        }
                    }
                    add_ops_activity($state, 'project', $project['id'], 'proposal_tasks', "Tasks created from proposal $number");
                }
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
            ensure_proposal_shape($source);
            foreach (['title', 'language', 'leadId', 'projectId', 'inboxId', 'clientCode', 'clientName', 'clientCompany', 'clientEmail', 'clientSector', 'clientAddress', 'clientPhone', 'currency', 'intro', 'scope', 'assumptions', 'terms', 'notes', 'items', 'sections', 'discount', 'tax', 'milestones', 'totals', 'acceptance'] as $field) {
                $copy[$field] = $source[$field];
            }
            $copy['number'] = next_proposal_number($state, $copy['clientCode']);
            $state['proposals'][] = $copy;
            add_ops_activity($state, 'proposal', $copy['id'], 'created', "Duplicated from {$source['number']}");
            return proposal_detail($state, $copy['id']);
        });
    },
    'POST upload-logo' => function () {
        $id = v_id($_POST['id'] ?? '', 'prop', 'Proposal id');
        if (!isset($_FILES['logo']) || !is_uploaded_file($_FILES['logo']['tmp_name'])) throw new ApiError('VALIDATION_ERROR', 'Choose a logo to upload.', 422);
        $file = $_FILES['logo'];
        if (($file['size'] ?? 0) < 1 || $file['size'] > 2_000_000) throw new ApiError('VALIDATION_ERROR', 'Logo must be smaller than 2 MB.', 422);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $ext = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'][$mime] ?? null;
        if (!$ext) throw new ApiError('VALIDATION_ERROR', 'Use a PNG, JPEG, or WebP logo.', 422);
        return Store::instance()->mutate(function (array &$state) use ($id, $file, $mime, $ext) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            ensure_proposal_shape($state['proposals'][$i]);
            $dir = proposal_private_dir($id, 'logos');
            foreach (glob($dir . '/*') ?: [] as $old) @unlink($old);
            $name = bin2hex(random_bytes(16)) . '.' . $ext;
            if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) throw new ApiError('STORAGE_ERROR', 'Could not store the logo.', 500);
            $state['proposals'][$i]['clientLogo'] = ['mime' => $mime, 'size' => (int) $file['size'], 'file' => $name];
            add_ops_activity($state, 'proposal', $id, 'logo', 'Client logo updated');
            return proposal_detail($state, $id);
        });
    },
    'POST remove-logo' => function () {
        $id = v_id(json_body()['id'] ?? '', 'prop', 'Proposal id');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            ensure_proposal_shape($state['proposals'][$i]);
            $dir = ADMIN_DATA_DIR . '/proposals/logos/' . $id;
            foreach (glob($dir . '/*') ?: [] as $old) @unlink($old);
            $state['proposals'][$i]['clientLogo'] = null;
            return proposal_detail($state, $id);
        });
    },
    'POST archive-files' => function () {
        $id = v_id($_POST['id'] ?? '', 'prop', 'Proposal id');
        $revision = filter_var($_POST['revision'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 999]]);
        if (!$revision) throw new ApiError('VALIDATION_ERROR', 'Invalid revision.', 422);
        return Store::instance()->mutate(function (array &$state) use ($id, $revision) {
            $i = ops_index($state, 'proposals', $id, 'Proposal');
            ensure_proposal_shape($state['proposals'][$i]);
            $versionIndex = array_search($revision, array_column($state['proposals'][$i]['versions'], 'revision'), true);
            if ($versionIndex === false) throw new ApiError('NOT_FOUND', 'Proposal revision not found.', 404);
            $dir = proposal_private_dir($id, 'files') . '/v' . $revision;
            if (!is_dir($dir) && !@mkdir($dir, 0770, true) && !is_dir($dir)) throw new ApiError('STORAGE_UNAVAILABLE', 'Could not create the revision directory.', 503);
            foreach (['docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'PK'], 'pdf' => ['application/pdf', '%PDF-']] as $format => [$expected, $signature]) {
                if (!isset($_FILES[$format]) || !is_uploaded_file($_FILES[$format]['tmp_name'])) continue;
                if (($state['proposals'][$i]['versions'][$versionIndex]['files'][$format] ?? false) === true) throw new ApiError('PROPOSAL_LOCKED', strtoupper($format) . ' snapshot is immutable.', 409);
                $file = $_FILES[$format];
                if (($file['size'] ?? 0) < 10 || $file['size'] > 12_000_000) throw new ApiError('VALIDATION_ERROR', strtoupper($format) . ' file size is invalid.', 422);
                $head = file_get_contents($file['tmp_name'], false, null, 0, strlen($signature));
                if ($head !== $signature) throw new ApiError('VALIDATION_ERROR', strtoupper($format) . ' file signature is invalid.', 422);
                $target = $dir . '/' . preg_replace('/[^A-Z0-9._-]/i', '-', $state['proposals'][$i]['number']) . '.' . $format;
                if (!move_uploaded_file($file['tmp_name'], $target)) throw new ApiError('STORAGE_ERROR', 'Could not archive ' . strtoupper($format) . '.', 500);
                $state['proposals'][$i]['versions'][$versionIndex]['files'][$format] = true;
            }
            return proposal_detail($state, $id);
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
