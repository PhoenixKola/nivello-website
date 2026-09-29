<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ops.php';

function project_detail(array $state, string $id): array
{
    $project = $state['projects'][ops_index($state, 'projects', $id, 'Project')];
    $inquiry = ops_find($state, 'inbox', $project['inboxId']);
    $proposals = array_values(array_map('proposal_summary', array_filter($state['proposals'], fn ($p) => $p['projectId'] === $id || $p['id'] === $project['proposalId'])));
    return [
        'project' => project_view($state, $project, gmdate('Y-m-d')),
        'inquiry' => $inquiry ? inbox_summary($inquiry) : null,
        'proposals' => $proposals,
        'activities' => ops_activities_for($state, 'project', $id),
    ];
}

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $today = gmdate('Y-m-d');
        $q = mb_strtolower(trim((string) ($_GET['q'] ?? '')));
        $views = [];
        $counts = array_fill_keys(PROJECT_STAGES, 0);
        $stats = ['active' => 0, 'dueSoon' => 0, 'overdue' => 0, 'pipelineValue' => []];
        foreach ($state['projects'] as $project) {
            $counts[$project['stage']]++;
            $view = project_view($state, $project, $today);
            if (in_array($project['stage'], PROJECT_OPEN_STAGES, true)) {
                $stats['active']++;
                if ($project['value'] !== null) {
                    $stats['pipelineValue'][$project['currency']] = ($stats['pipelineValue'][$project['currency']] ?? 0) + $project['value'];
                }
            }
            if ($view['due'] === 'soon') {
                $stats['dueSoon']++;
            } elseif ($view['due'] === 'overdue') {
                $stats['overdue']++;
            }
            if ($q !== '' && !str_contains(mb_strtolower($project['name'] . ' ' . $project['clientName'] . ' ' . $project['nextAction'] . ' ' . implode(' ', $project['tags'])), $q)) {
                continue;
            }
            $views[] = $view;
        }
        usort($views, fn ($a, $b) => strcmp($b['updatedAt'], $a['updatedAt']));
        $stats['pipelineValue'] = $stats['pipelineValue'] ?: new stdClass();
        return ['projects' => $views, 'counts' => $counts, 'stats' => $stats, 'stages' => PROJECT_STAGE_LABELS];
    },
    'GET get' => fn () => project_detail(Store::instance()->read(), v_id($_GET['id'] ?? '', 'prj', 'Project id')),
    'POST create' => function () {
        $fields = json_body()['project'] ?? [];
        if (!is_array($fields)) {
            throw new ApiError('VALIDATION_ERROR', 'Project details are required.', 422);
        }
        return Store::instance()->mutate(function (array &$state) use ($fields) {
            if (count($state['projects']) >= PROJECT_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Project limit reached.', 422);
            }
            $project = blank_project();
            apply_project_changes($state, $project, $fields);
            if ($project['clientName'] === '' && $project['leadId']) {
                $project['clientName'] = ops_find($state, 'leads', $project['leadId'])['companyName'];
            }
            $state['projects'][] = $project;
            add_ops_activity($state, 'project', $project['id'], 'created', 'Project created in ' . PROJECT_STAGE_LABELS[$project['stage']]);
            if ($project['leadId']) {
                add_activity($state, $project['leadId'], 'project_linked', 'Project "' . $project['name'] . '" created', ['projectId' => $project['id']]);
            }
            return project_detail($state, $project['id']);
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'prj', 'Project id');
        $changes = $body['changes'] ?? null;
        if (!is_array($changes) || !$changes) {
            throw new ApiError('VALIDATION_ERROR', 'No changes provided.', 422);
        }
        return Store::instance()->mutate(function (array &$state, bool &$dirty) use ($id, $changes) {
            $i = ops_index($state, 'projects', $id, 'Project');
            $project = $state['projects'][$i];
            $before = $project;
            $log = apply_project_changes($state, $project, $changes);
            unset($before['updatedAt'], $project['updatedAt']);
            if ($before === $project) {
                $dirty = false;
                return project_detail($state, $id);
            }
            $project['updatedAt'] = now_iso();
            $state['projects'][$i] = $project;
            foreach ($log as $message) {
                add_ops_activity($state, 'project', $id, str_starts_with($message, 'Moved') ? 'stage' : 'update', $message);
            }
            if (!$log) {
                add_ops_activity($state, 'project', $id, 'update', 'Details updated');
            }
            return project_detail($state, $id);
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'prj', 'Project id');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'projects', $id, 'Project');
            array_splice($state['projects'], $i, 1);
            foreach (['inbox', 'proposals'] as $collection) {
                foreach ($state[$collection] as &$record) {
                    if ($record['projectId'] === $id) {
                        $record['projectId'] = null;
                    }
                }
                unset($record);
            }
            $state['opsActivities'] = array_values(array_filter($state['opsActivities'], fn ($a) => !($a['entity'] === 'project' && $a['entityId'] === $id)));
            return ['deleted' => true];
        });
    },
]);
