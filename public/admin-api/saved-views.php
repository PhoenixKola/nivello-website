<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_leads.php';

/** Normalizes stored filters through the same parser the list endpoint uses. */
function clean_view_filters(mixed $filters): array
{
    if (!is_array($filters)) {
        throw new ApiError('VALIDATION_ERROR', 'View filters are invalid.', 422);
    }
    $parsed = parse_lead_filters($filters);
    $parsed['createdFrom'] = $parsed['createdFrom'] ? now_iso($parsed['createdFrom']) : null;
    $parsed['createdTo'] = $parsed['createdTo'] ? now_iso($parsed['createdTo']) : null;
    return $parsed;
}

api_run([
    'GET list' => fn () => ['views' => Store::instance()->read()['savedViews']],
    'POST create' => function () {
        $body = json_body();
        $name = v_string($body['name'] ?? '', 'View name', 60, true);
        $filters = clean_view_filters($body['filters'] ?? null);
        return Store::instance()->mutate(function (array &$state) use ($name, $filters) {
            if (count($state['savedViews']) >= 50) {
                throw new ApiError('VALIDATION_ERROR', 'Saved view limit reached (50).', 422);
            }
            $view = ['id' => new_id('view'), 'name' => $name, 'filters' => $filters, 'createdAt' => now_iso()];
            $state['savedViews'][] = $view;
            return ['view' => $view, 'views' => $state['savedViews']];
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'view');
        $name = v_string($body['name'] ?? '', 'View name', 60, true);
        $filters = array_key_exists('filters', $body) ? clean_view_filters($body['filters']) : null;
        return Store::instance()->mutate(function (array &$state) use ($id, $name, $filters) {
            foreach ($state['savedViews'] as $i => $view) {
                if ($view['id'] === $id) {
                    $state['savedViews'][$i]['name'] = $name;
                    if ($filters !== null) {
                        $state['savedViews'][$i]['filters'] = $filters;
                    }
                    return ['views' => $state['savedViews']];
                }
            }
            throw new ApiError('NOT_FOUND', 'Saved view not found.', 404);
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'view');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $state['savedViews'] = array_values(array_filter($state['savedViews'], fn ($v) => $v['id'] !== $id));
            return ['views' => $state['savedViews']];
        });
    },
]);
