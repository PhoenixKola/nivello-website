<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';
require __DIR__ . '/_ops.php';

const LEAD_SORTS = ['updated', 'created', 'score', 'company', 'followUp'];

function find_lead_index(array $state, string $id): int
{
    foreach ($state['leads'] as $i => $lead) {
        if ($lead['id'] === $id) {
            return $i;
        }
    }
    throw new ApiError('NOT_FOUND', 'Lead not found. It may have been deleted.', 404);
}

function lead_detail(array $state, string $id): array
{
    $lead = $state['leads'][find_lead_index($state, $id)];
    $notes = array_values(array_filter($state['notes'], fn ($n) => $n['leadId'] === $id));
    usort($notes, fn ($a, $b) => strcmp($b['createdAt'], $a['createdAt']));
    $activities = array_values(array_filter($state['activities'], fn ($a) => $a['leadId'] === $id));
    usort($activities, fn ($a, $b) => strcmp($b['at'], $a['at']));
    $batch = null;
    foreach ($state['batches'] as $b) {
        if ($b['id'] === ($lead['sourceBatchId'] ?? null)) {
            $batch = ['id' => $b['id'], 'label' => batch_label($b), 'status' => $b['status']];
        }
    }
    $pendingDuplicates = count(array_filter($state['duplicateCandidates'], fn ($d) => $d['leadId'] === $id && $d['status'] === 'pending'));
    return [
        'lead' => $lead,
        'score' => lead_score($lead),
        'notes' => $notes,
        'activities' => array_slice($activities, 0, 150),
        'batch' => $batch,
        'pendingDuplicates' => $pendingDuplicates,
        'related' => related_to_lead($state, $id),
    ];
}

function valid_tag_ids(array $state, mixed $ids): array
{
    if (!is_array($ids) || count($ids) > 30) {
        throw new ApiError('VALIDATION_ERROR', 'Tags must be a list of at most 30 tags.', 422);
    }
    $known = array_column($state['tags'], 'id');
    foreach ($ids as $id) {
        if (!in_array($id, $known, true)) {
            throw new ApiError('VALIDATION_ERROR', 'Unknown tag.', 422);
        }
    }
    return array_values(array_unique($ids));
}

/** Applies validated field changes to a lead and logs meaningful activity. */
function apply_lead_changes(array &$state, int $i, array $changes): void
{
    $validators = lead_field_validators();
    $lead = &$state['leads'][$i];
    $tagNames = tag_name_map($state);
    $changed = [];

    foreach ($changes as $field => $value) {
        if ($field === 'tags') {
            $tags = valid_tag_ids($state, $value);
            foreach (array_diff($tags, $lead['tags']) as $added) {
                add_activity($state, $lead['id'], 'tag_added', 'Tag added: ' . ($tagNames[$added] ?? 'tag'));
            }
            foreach (array_diff($lead['tags'], $tags) as $removed) {
                add_activity($state, $lead['id'], 'tag_removed', 'Tag removed: ' . ($tagNames[$removed] ?? 'tag'));
            }
            $lead['tags'] = $tags;
            continue;
        }
        if (!isset($validators[$field])) {
            throw new ApiError('VALIDATION_ERROR', "Field \"$field\" cannot be edited.", 422);
        }
        $new = $validators[$field]($value);
        if ($new === $lead[$field]) {
            continue;
        }
        $old = $lead[$field];
        $lead[$field] = $new;
        match ($field) {
            'status' => add_activity($state, $lead['id'], 'status_changed', 'Status changed: ' . (LEAD_STATUS_LABELS[$old] ?? $old) . ' → ' . LEAD_STATUS_LABELS[$new], ['from' => $old, 'to' => $new]),
            'followUpAt' => $new === null
                ? add_activity($state, $lead['id'], 'follow_up_scheduled', 'Follow-up cleared')
                : add_activity($state, $lead['id'], 'follow_up_scheduled', 'Follow-up scheduled', ['at' => $new]),
            default => $changed[] = $field,
        };
        if ($field === 'followUpAt') {
            $lead['followUpCompletedAt'] = null;
        }
        if ($field === 'companyName' || $field === 'phone' || $field === 'address') {
            $lead['fingerprint'] = lead_fingerprint($lead);
        }
    }
    if ($changed) {
        $labels = [
            'companyName' => 'company name', 'contactPerson' => 'contact person', 'contactRole' => 'role',
            'preferredContact' => 'preferred contact', 'companySize' => 'company size', 'nextAction' => 'next action',
            'googleMapsUrl' => 'Google Maps URL', 'lastContactedAt' => 'last contacted', 'whatsapp' => 'WhatsApp',
        ];
        $readable = array_map(fn ($f) => $labels[$f] ?? $f, $changed);
        add_activity($state, $lead['id'], 'lead_updated', 'Lead updated: ' . implode(', ', $readable), ['fields' => $changed]);
    }
    $lead['updatedAt'] = now_iso();
}

function delete_leads(array &$state, array $ids): int
{
    $drop = array_flip($ids);
    $before = count($state['leads']);
    $state['leads'] = array_values(array_filter($state['leads'], fn ($l) => !isset($drop[$l['id']])));
    $state['notes'] = array_values(array_filter($state['notes'], fn ($n) => !isset($drop[$n['leadId']])));
    $state['activities'] = array_values(array_filter($state['activities'], fn ($a) => !isset($drop[$a['leadId']])));
    $state['duplicateCandidates'] = array_values(array_filter($state['duplicateCandidates'], fn ($d) => !isset($drop[$d['leadId']])));
    detach_leads($state, $drop);
    return $before - count($state['leads']);
}

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $filters = parse_lead_filters($_GET);
        $matched = filter_leads($state['leads'], $filters);
        $now = time();

        $sort = in_array($_GET['sort'] ?? '', LEAD_SORTS, true) ? $_GET['sort'] : 'updated';
        $dir = ($_GET['dir'] ?? 'desc') === 'asc' ? 1 : -1;
        $scores = [];
        if ($sort === 'score') {
            foreach ($matched as $lead) {
                $scores[$lead['id']] = lead_score($lead, $now)['score'];
            }
        }
        usort($matched, function ($a, $b) use ($sort, $dir, $scores) {
            $cmp = match ($sort) {
                'created' => strcmp($a['createdAt'], $b['createdAt']),
                'score' => $scores[$a['id']] <=> $scores[$b['id']],
                'company' => strcasecmp($a['companyName'], $b['companyName']),
                'followUp' => ($a['followUpAt'] ?? '9999') <=> ($b['followUpAt'] ?? '9999'),
                default => strcmp($a['updatedAt'], $b['updatedAt']),
            };
            return $cmp * $dir ?: strcmp($a['id'], $b['id']);
        });

        $requested = (int) ($_GET['pageSize'] ?? 25);
        $pageSize = in_array($requested, [10, 25, 50, 100], true) ? $requested : 25;
        $total = count($matched);
        $pages = max(1, (int) ceil($total / $pageSize));
        $page = min($pages, max(1, (int) ($_GET['page'] ?? 1)));
        $items = array_map(fn ($l) => lead_summary($l, $now), array_slice($matched, ($page - 1) * $pageSize, $pageSize));

        $facet = function (string $field) use ($state) {
            $counts = [];
            foreach ($state['leads'] as $lead) {
                $value = trim((string) $lead[$field]);
                if ($value !== '') {
                    $counts[$value] = ($counts[$value] ?? 0) + 1;
                }
            }
            arsort($counts);
            return array_keys(array_slice($counts, 0, 300, true));
        };

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'pages' => $pages,
            'facets' => ['countries' => $facet('country'), 'cities' => $facet('city'), 'categories' => $facet('category')],
            'ids' => isset($_GET['withIds']) ? array_column($matched, 'id') : null,
        ];
    },

    'GET followups' => function () {
        $state = Store::instance()->read();
        $bucket = v_enum($_GET['bucket'] ?? 'overdue', 'Bucket', ['overdue', 'today', 'upcoming', 'done']);
        // The browser's UTC offset (minutes, as from Date#getTimezoneOffset) defines "today".
        $offset = v_int($_GET['tzOffset'] ?? 0, 'Timezone offset', -900, 900) * 60;
        $now = time();
        $localNow = $now - $offset;
        $todayEnd = $localNow - ($localNow % 86400) + 86399 + $offset;
        $buckets = ['overdue' => [], 'today' => [], 'upcoming' => [], 'done' => []];
        foreach ($state['leads'] as $lead) {
            $ts = iso_to_ts($lead['followUpAt'] ?? null);
            if ($ts === null) {
                continue;
            }
            $closed = !empty($lead['followUpCompletedAt']) || in_array($lead['status'], CLOSED_STATUSES, true);
            $key = $closed ? 'done' : ($ts < $now ? 'overdue' : ($ts <= $todayEnd ? 'today' : 'upcoming'));
            $buckets[$key][] = $lead;
        }
        $items = $buckets[$bucket];
        usort($items, fn ($a, $b) => $bucket === 'done' ? strcmp($b['followUpAt'], $a['followUpAt']) : strcmp($a['followUpAt'], $b['followUpAt']));
        $pageSize = 25;
        $total = count($items);
        $pages = max(1, (int) ceil($total / $pageSize));
        $page = min($pages, max(1, (int) ($_GET['page'] ?? 1)));
        return [
            'items' => array_map(fn ($l) => lead_summary($l, $now), array_slice($items, ($page - 1) * $pageSize, $pageSize)),
            'total' => $total,
            'page' => $page,
            'pages' => $pages,
            'counts' => array_map('count', $buckets),
        ];
    },

    'GET get' => function () {
        return lead_detail(Store::instance()->read(), v_id($_GET['id'] ?? '', 'lead'));
    },

    'POST create' => function () {
        $body = json_body();
        $force = v_bool($body['force'] ?? false);
        $fields = is_array($body['lead'] ?? null) ? $body['lead'] : [];
        return Store::instance()->mutate(function (array &$state) use ($fields, $force) {
            $lead = blank_lead();
            $validators = lead_field_validators();
            foreach ($validators as $field => $validate) {
                if (array_key_exists($field, $fields)) {
                    $lead[$field] = $validate($fields[$field]);
                }
            }
            if ($lead['companyName'] === '') {
                throw new ApiError('VALIDATION_ERROR', 'Company name is required.', 422);
            }
            $lead['tags'] = valid_tag_ids($state, $fields['tags'] ?? []);
            $lead['categories'] = $lead['category'] !== '' ? [$lead['category']] : [];
            $lead['fingerprint'] = lead_fingerprint($lead);
            $match = LeadIndex::build($state['leads'])->match($lead);
            if ($match && !$force) {
                throw new ApiError('DUPLICATE_LEAD', 'A similar lead already exists (' . $match[1] . ').', 409, ['leadId' => $match[0]]);
            }
            $state['leads'][] = $lead;
            add_activity($state, $lead['id'], 'created', 'Lead created manually');
            return lead_detail($state, $lead['id']);
        });
    },

    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'lead');
        $changes = $body['changes'] ?? null;
        if (!is_array($changes) || !$changes || array_is_list($changes)) {
            throw new ApiError('VALIDATION_ERROR', 'No changes provided.', 422);
        }
        return Store::instance()->mutate(function (array &$state) use ($id, $changes) {
            apply_lead_changes($state, find_lead_index($state, $id), $changes);
            return lead_detail($state, $id);
        });
    },

    'POST delete' => function () {
        $ids = v_ids(json_body()['ids'] ?? null, 'lead');
        return ['deleted' => Store::instance()->mutate(fn (array &$state) => delete_leads($state, $ids))];
    },

    'POST bulk' => function () {
        $body = json_body();
        $ids = v_ids($body['ids'] ?? null, 'lead');
        $op = v_enum($body['op'] ?? '', 'Bulk action', ['status', 'priority', 'followUp', 'addTag', 'removeTag']);
        $value = $body['value'] ?? null;
        return Store::instance()->mutate(function (array &$state) use ($ids, $op, $value) {
            $positions = index_by_id($state['leads']);
            $tagNames = tag_name_map($state);
            if (in_array($op, ['addTag', 'removeTag'], true) && !isset($tagNames[$value])) {
                throw new ApiError('VALIDATION_ERROR', 'Unknown tag.', 422);
            }
            $updated = 0;
            foreach ($ids as $id) {
                if (!isset($positions[$id])) {
                    continue;
                }
                $i = $positions[$id];
                $lead = $state['leads'][$i];
                $changes = match ($op) {
                    'status' => ['status' => $value],
                    'priority' => ['priority' => $value],
                    'followUp' => ['followUpAt' => $value],
                    'addTag' => ['tags' => array_values(array_unique([...$lead['tags'], $value]))],
                    'removeTag' => ['tags' => array_values(array_diff($lead['tags'], [$value]))],
                };
                apply_lead_changes($state, $i, $changes);
                $updated++;
            }
            return ['updated' => $updated];
        });
    },

    'POST note' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'lead');
        $text = v_string($body['body'] ?? '', 'Note', 4000, true);
        return Store::instance()->mutate(function (array &$state) use ($id, $text) {
            $i = find_lead_index($state, $id);
            $state['notes'][] = ['id' => new_id('note'), 'leadId' => $id, 'body' => $text, 'createdAt' => now_iso()];
            add_activity($state, $id, 'note_added', 'Note added');
            $state['leads'][$i]['updatedAt'] = now_iso();
            return lead_detail($state, $id);
        });
    },

    'POST delete-note' => function () {
        $body = json_body();
        $noteId = v_id($body['noteId'] ?? '', 'note');
        return Store::instance()->mutate(function (array &$state) use ($noteId) {
            foreach ($state['notes'] as $i => $note) {
                if ($note['id'] === $noteId) {
                    array_splice($state['notes'], $i, 1);
                    return lead_detail($state, $note['leadId']);
                }
            }
            throw new ApiError('NOT_FOUND', 'Note not found.', 404);
        });
    },

    'POST log-contact' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'lead');
        $type = v_enum($body['type'] ?? '', 'Contact type', array_keys(CONTACT_LOG_TYPES));
        $outcome = v_string($body['outcome'] ?? '', 'Outcome', 500);
        $followUp = array_key_exists('followUpAt', $body) ? v_datetime($body['followUpAt'], 'Follow-up') : false;
        $nextAction = array_key_exists('nextAction', $body) ? v_string($body['nextAction'], 'Next action', 300) : null;
        return Store::instance()->mutate(function (array &$state) use ($id, $type, $outcome, $followUp, $nextAction) {
            $i = find_lead_index($state, $id);
            $lead = &$state['leads'][$i];
            $lead['lastContactedAt'] = now_iso();
            add_activity($state, $id, 'contact_logged', CONTACT_LOG_TYPES[$type] . ($outcome !== '' ? ': ' . $outcome : ''), ['type' => $type]);
            if ($lead['status'] === 'new') {
                $lead['status'] = 'contacted';
                add_activity($state, $id, 'status_changed', 'Status changed: New → Contacted', ['from' => 'new', 'to' => 'contacted']);
            }
            $changes = [];
            if ($followUp !== false) {
                $changes['followUpAt'] = $followUp;
            }
            if ($nextAction !== null) {
                $changes['nextAction'] = $nextAction;
            }
            unset($lead);
            if ($changes) {
                apply_lead_changes($state, $i, $changes);
            } else {
                $state['leads'][$i]['updatedAt'] = now_iso();
            }
            return lead_detail($state, $id);
        });
    },

    'POST complete-follow-up' => function () {
        $id = v_id(json_body()['id'] ?? '', 'lead');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = find_lead_index($state, $id);
            if ($state['leads'][$i]['followUpAt'] === null) {
                throw new ApiError('VALIDATION_ERROR', 'This lead has no follow-up to complete.', 422);
            }
            $state['leads'][$i]['followUpCompletedAt'] = now_iso();
            $state['leads'][$i]['updatedAt'] = now_iso();
            add_activity($state, $id, 'follow_up_completed', 'Follow-up marked done');
            return lead_detail($state, $id);
        });
    },

    'POST enrich' => function () {
        $id = v_id(json_body()['id'] ?? '', 'lead');
        $store = Store::instance();
        $result = enrich_lead_instagram($store, $id);
        return ['result' => $result] + lead_detail($store->read(), $id);
    },
]);
