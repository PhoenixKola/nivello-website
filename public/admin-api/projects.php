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

function project_work_index(array $items, string $id, string $label): int
{
    foreach ($items as $index => $item) {
        if (($item['id'] ?? null) === $id) return $index;
    }
    throw new ApiError('NOT_FOUND', "$label not found.", 404);
}

function project_milestone_input(array $input, array $current = []): array
{
    $now = now_iso();
    $status = array_key_exists('status', $input) ? v_enum($input['status'], 'Milestone status', PROJECT_MILESTONE_STATUSES) : ($current['status'] ?? 'not_started');
    return array_replace([
        'id' => new_id('mile'), 'projectId' => '', 'title' => '', 'description' => '', 'status' => 'not_started',
        'dueDate' => null, 'order' => 0, 'createdAt' => $now, 'updatedAt' => $now, 'completedAt' => null,
    ], $current, [
        'title' => v_string($input['title'] ?? ($current['title'] ?? ''), 'Milestone title', 160, true),
        'description' => v_string($input['description'] ?? ($current['description'] ?? ''), 'Milestone description', 2000),
        'status' => $status,
        'dueDate' => array_key_exists('dueDate', $input) ? v_date($input['dueDate'], 'Milestone due date') : ($current['dueDate'] ?? null),
        'updatedAt' => $now,
        'completedAt' => $status === 'completed' ? ($current['completedAt'] ?? $now) : null,
    ]);
}

function project_task_input(array $input, array $project, array $current = []): array
{
    $now = now_iso();
    $milestoneId = array_key_exists('milestoneId', $input) ? ($input['milestoneId'] ?: null) : ($current['milestoneId'] ?? null);
    if ($milestoneId !== null && !array_filter($project['milestones'] ?? [], fn ($m) => $m['id'] === $milestoneId)) {
        throw new ApiError('VALIDATION_ERROR', 'The selected milestone does not belong to this project.', 422);
    }
    $status = array_key_exists('status', $input) ? v_enum($input['status'], 'Task status', PROJECT_TASK_STATUSES) : ($current['status'] ?? 'todo');
    return array_replace([
        'id' => new_id('task'), 'projectId' => $project['id'], 'milestoneId' => null, 'proposalItemId' => null,
        'title' => '', 'description' => '', 'status' => 'todo', 'priority' => 'normal', 'dueDate' => null,
        'assignee' => '', 'order' => 0, 'createdAt' => $now, 'updatedAt' => $now, 'completedAt' => null,
    ], $current, [
        'title' => v_string($input['title'] ?? ($current['title'] ?? ''), 'Task title', 200, true),
        'description' => v_string($input['description'] ?? ($current['description'] ?? ''), 'Task description', 4000),
        'status' => $status,
        'priority' => array_key_exists('priority', $input) ? v_enum($input['priority'], 'Task priority', PROJECT_TASK_PRIORITIES) : ($current['priority'] ?? 'normal'),
        'dueDate' => array_key_exists('dueDate', $input) ? v_date($input['dueDate'], 'Task due date') : ($current['dueDate'] ?? null),
        'assignee' => v_string($input['assignee'] ?? ($current['assignee'] ?? ''), 'Assignee', 120),
        'milestoneId' => $milestoneId,
        'updatedAt' => $now,
        'completedAt' => $status === 'done' ? ($current['completedAt'] ?? $now) : null,
    ]);
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
    'POST milestone-create' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $input = is_array($body['milestone'] ?? null) ? $body['milestone'] : [];
        return Store::instance()->mutate(function (array &$state) use ($projectId, $input) {
            $i = ops_index($state, 'projects', $projectId, 'Project');
            $state['projects'][$i]['milestones'] ??= [];
            $milestone = project_milestone_input($input);
            $milestone['projectId'] = $projectId;
            $milestone['order'] = count($state['projects'][$i]['milestones']);
            $state['projects'][$i]['milestones'][] = $milestone;
            $state['projects'][$i]['updatedAt'] = now_iso();
            add_ops_activity($state, 'project', $projectId, 'milestone_created', 'Milestone created: ' . $milestone['title'], ['milestoneId' => $milestone['id']]);
            return project_detail($state, $projectId);
        });
    },
    'POST milestone-update' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $id = v_id($body['id'] ?? '', 'mile', 'Milestone id');
        $input = is_array($body['changes'] ?? null) ? $body['changes'] : [];
        return Store::instance()->mutate(function (array &$state) use ($projectId, $id, $input) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $items = $state['projects'][$pi]['milestones'] ?? [];
            $mi = project_work_index($items, $id, 'Milestone');
            $before = $items[$mi];
            $after = project_milestone_input($input, $before);
            $state['projects'][$pi]['milestones'][$mi] = $after;
            $state['projects'][$pi]['updatedAt'] = now_iso();
            $event = $before['status'] !== 'completed' && $after['status'] === 'completed' ? 'milestone_completed' : ($before['status'] === 'completed' && $after['status'] !== 'completed' ? 'milestone_reopened' : 'milestone_updated');
            add_ops_activity($state, 'project', $projectId, $event, ($event === 'milestone_completed' ? 'Milestone completed: ' : ($event === 'milestone_reopened' ? 'Milestone reopened: ' : 'Milestone updated: ')) . $after['title'], ['milestoneId' => $id]);
            return project_detail($state, $projectId);
        });
    },
    'POST milestone-reorder' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $ids = is_array($body['ids'] ?? null) ? array_values($body['ids']) : [];
        return Store::instance()->mutate(function (array &$state) use ($projectId, $ids) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $items = $state['projects'][$pi]['milestones'] ?? [];
            if (count($ids) !== count($items) || array_diff($ids, array_column($items, 'id')) || array_diff(array_column($items, 'id'), $ids)) throw new ApiError('VALIDATION_ERROR', 'Milestone order is incomplete.', 422);
            $byId = array_column($items, null, 'id');
            $state['projects'][$pi]['milestones'] = array_map(function ($id, $order) use ($byId) { $item = $byId[$id]; $item['order'] = $order; $item['updatedAt'] = now_iso(); return $item; }, $ids, array_keys($ids));
            add_ops_activity($state, 'project', $projectId, 'milestone_reordered', 'Milestones reordered');
            return project_detail($state, $projectId);
        });
    },
    'POST milestone-delete' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $id = v_id($body['id'] ?? '', 'mile', 'Milestone id');
        return Store::instance()->mutate(function (array &$state) use ($projectId, $id) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $items = $state['projects'][$pi]['milestones'] ?? [];
            $mi = project_work_index($items, $id, 'Milestone');
            $title = $items[$mi]['title'];
            array_splice($state['projects'][$pi]['milestones'], $mi, 1);
            $state['projects'][$pi]['tasks'] ??= [];
            foreach ($state['projects'][$pi]['tasks'] as &$task) if ($task['milestoneId'] === $id) $task['milestoneId'] = null;
            unset($task);
            $state['projects'][$pi]['updatedAt'] = now_iso();
            add_ops_activity($state, 'project', $projectId, 'milestone_deleted', 'Milestone deleted: ' . $title);
            return project_detail($state, $projectId);
        });
    },
    'POST task-create' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $input = is_array($body['task'] ?? null) ? $body['task'] : [];
        return Store::instance()->mutate(function (array &$state) use ($projectId, $input) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $state['projects'][$pi]['tasks'] ??= [];
            $task = project_task_input($input, $state['projects'][$pi]);
            $task['order'] = count($state['projects'][$pi]['tasks']);
            $state['projects'][$pi]['tasks'][] = $task;
            $state['projects'][$pi]['updatedAt'] = now_iso();
            add_ops_activity($state, 'project', $projectId, 'task_created', 'Task created: ' . $task['title'], ['taskId' => $task['id']]);
            return project_detail($state, $projectId);
        });
    },
    'POST task-update' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $id = v_id($body['id'] ?? '', 'task', 'Task id');
        $input = is_array($body['changes'] ?? null) ? $body['changes'] : [];
        return Store::instance()->mutate(function (array &$state) use ($projectId, $id, $input) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $items = $state['projects'][$pi]['tasks'] ?? [];
            $ti = project_work_index($items, $id, 'Task');
            $before = $items[$ti];
            $after = project_task_input($input, $state['projects'][$pi], $before);
            $state['projects'][$pi]['tasks'][$ti] = $after;
            $state['projects'][$pi]['updatedAt'] = now_iso();
            $event = $before['status'] !== 'done' && $after['status'] === 'done' ? 'task_completed' : ($before['status'] === 'done' && $after['status'] !== 'done' ? 'task_reopened' : 'task_updated');
            add_ops_activity($state, 'project', $projectId, $event, ($event === 'task_completed' ? 'Task completed: ' : ($event === 'task_reopened' ? 'Task reopened: ' : 'Task updated: ')) . $after['title'], ['taskId' => $id]);
            return project_detail($state, $projectId);
        });
    },
    'POST task-delete' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project id');
        $id = v_id($body['id'] ?? '', 'task', 'Task id');
        return Store::instance()->mutate(function (array &$state) use ($projectId, $id) {
            $pi = ops_index($state, 'projects', $projectId, 'Project');
            $items = $state['projects'][$pi]['tasks'] ?? [];
            $ti = project_work_index($items, $id, 'Task');
            $title = $items[$ti]['title'];
            array_splice($state['projects'][$pi]['tasks'], $ti, 1);
            $state['projects'][$pi]['updatedAt'] = now_iso();
            add_ops_activity($state, 'project', $projectId, 'task_deleted', 'Task deleted: ' . $title);
            return project_detail($state, $projectId);
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
