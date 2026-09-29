<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_leads.php';

function tags_with_counts(array $state): array
{
    $counts = [];
    foreach ($state['leads'] as $lead) {
        foreach ($lead['tags'] ?? [] as $tagId) {
            $counts[$tagId] = ($counts[$tagId] ?? 0) + 1;
        }
    }
    $tags = array_map(fn ($t) => $t + ['count' => $counts[$t['id']] ?? 0], $state['tags']);
    usort($tags, fn ($a, $b) => strcasecmp($a['name'], $b['name']));
    return $tags;
}

function assert_unique_tag_name(array $state, string $name, ?string $exceptId = null): void
{
    foreach ($state['tags'] as $tag) {
        if ($tag['id'] !== $exceptId && mb_strtolower($tag['name']) === mb_strtolower($name)) {
            throw new ApiError('VALIDATION_ERROR', "A tag named \"$name\" already exists.", 422);
        }
    }
}

api_run([
    'GET list' => fn () => ['tags' => tags_with_counts(Store::instance()->read())],
    'POST create' => function () {
        $body = json_body();
        $name = v_string($body['name'] ?? '', 'Tag name', 40, true);
        $color = v_enum($body['color'] ?? 'blue', 'Tag color', TAG_COLORS);
        return Store::instance()->mutate(function (array &$state) use ($name, $color) {
            assert_unique_tag_name($state, $name);
            if (count($state['tags']) >= 200) {
                throw new ApiError('VALIDATION_ERROR', 'Tag limit reached (200).', 422);
            }
            $tag = ['id' => new_id('tag'), 'name' => $name, 'color' => $color, 'createdAt' => now_iso()];
            $state['tags'][] = $tag;
            return ['tag' => $tag, 'tags' => tags_with_counts($state)];
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'tag');
        $name = v_string($body['name'] ?? '', 'Tag name', 40, true);
        $color = v_enum($body['color'] ?? 'blue', 'Tag color', TAG_COLORS);
        return Store::instance()->mutate(function (array &$state) use ($id, $name, $color) {
            assert_unique_tag_name($state, $name, $id);
            foreach ($state['tags'] as $i => $tag) {
                if ($tag['id'] === $id) {
                    $state['tags'][$i]['name'] = $name;
                    $state['tags'][$i]['color'] = $color;
                    return ['tags' => tags_with_counts($state)];
                }
            }
            throw new ApiError('NOT_FOUND', 'Tag not found.', 404);
        });
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'tag');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $before = count($state['tags']);
            $state['tags'] = array_values(array_filter($state['tags'], fn ($t) => $t['id'] !== $id));
            if (count($state['tags']) === $before) {
                throw new ApiError('NOT_FOUND', 'Tag not found.', 404);
            }
            // Deleting a tag only unassigns it; the leads themselves are untouched.
            foreach ($state['leads'] as $i => $lead) {
                if (in_array($id, $lead['tags'] ?? [], true)) {
                    $state['leads'][$i]['tags'] = array_values(array_diff($lead['tags'], [$id]));
                }
            }
            foreach ($state['savedViews'] as $i => $view) {
                if (($view['filters']['tag'] ?? '') === $id) {
                    $state['savedViews'][$i]['filters']['tag'] = '';
                }
            }
            return ['tags' => tags_with_counts($state)];
        });
    },
]);
