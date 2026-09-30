<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_ops.php';

/*
 * Agenda: a derived, read-only view over dates that already live on their own records
 * (lead follow-ups, project tasks, milestones and target dates, proposal validity) plus the
 * few manual Calendar events. Calendar and the Overview both read from here, so each dated
 * thing exists once and always links back to the record that owns it.
 *
 * Calendar dates (YYYY-MM-DD) are all-day. Instants (lead follow-ups, timed events) are placed
 * on the viewer's local day using the browser's UTC offset, like the Follow-ups page.
 */

const AGENDA_SOURCES = ['lead', 'task', 'milestone', 'project', 'proposal', 'event'];
const CALENDAR_EVENT_CATEGORIES = ['', 'meeting', 'call', 'deadline', 'reminder', 'other'];
const CALENDAR_EVENT_LIMIT = 5000;
const AGENDA_MAX_RANGE_DAYS = 120;

function day_add(string $date, int $days): string
{
    return gmdate('Y-m-d', strtotime($date . 'T00:00:00Z') + $days * 86400);
}

/** One agenda entry. Timed entries carry `at`; all-day entries only `date`. */
function agenda_item(string $id, string $source, string $title, string $context, string $date, array $link, array $extra = []): array
{
    return array_merge([
        'id' => $id,
        'source' => $source,
        'title' => $title,
        'context' => $context,
        'date' => $date,
        'endDate' => null,
        'at' => null,
        'endAt' => null,
        'allDay' => true,
        'done' => false,
        'status' => '',
        'link' => $link + ['tab' => null],
    ], $extra);
}

/** Every dated item overlapping the local-date range [$from, $to], sorted by day then time. */
function agenda_items(array $state, string $from, string $to, int $tzOffset, int $now): array
{
    $todayEnd = local_day_end($now, $tzOffset);
    $in = fn (string $date, ?string $end = null) => $date <= $to && ($end ?? $date) >= $from;
    $items = [];

    foreach ($state['leads'] as $lead) {
        $ts = iso_to_ts($lead['followUpAt'] ?? null);
        if ($ts === null) {
            continue;
        }
        $date = local_date($ts, $tzOffset);
        if ($in($date)) {
            $items[] = agenda_item('lead:' . $lead['id'], 'lead', $lead['companyName'], $lead['nextAction'] !== '' ? $lead['nextAction'] : 'Follow-up', $date, ['type' => 'lead', 'id' => $lead['id']], [
                'at' => $lead['followUpAt'],
                'allDay' => false,
                'done' => follow_up_bucket($lead, $now, $todayEnd) === 'done',
                'status' => $lead['status'],
            ]);
        }
    }

    foreach ($state['projects'] as $project) {
        $client = $project['clientName'];
        foreach ($project['tasks'] ?? [] as $task) {
            if ($task['dueDate'] && $in($task['dueDate'])) {
                $items[] = agenda_item('task:' . $task['id'], 'task', $task['title'], $project['name'], $task['dueDate'], ['type' => 'project', 'id' => $project['id'], 'tab' => 'tasks'], [
                    'done' => $task['status'] === 'done',
                    'status' => $task['status'],
                ]);
            }
        }
        foreach ($project['milestones'] ?? [] as $milestone) {
            if ($milestone['dueDate'] && $in($milestone['dueDate'])) {
                $items[] = agenda_item('milestone:' . $milestone['id'], 'milestone', $milestone['title'], $project['name'], $milestone['dueDate'], ['type' => 'project', 'id' => $project['id'], 'tab' => 'milestones'], [
                    'done' => $milestone['status'] === 'completed',
                    'status' => $milestone['status'],
                ]);
            }
        }
        if ($project['targetDate'] && $in($project['targetDate'])) {
            $items[] = agenda_item('project:' . $project['id'], 'project', $project['name'], $client, $project['targetDate'], ['type' => 'project', 'id' => $project['id']], [
                'done' => !in_array($project['stage'], PROJECT_OPEN_STAGES, true),
                'status' => $project['stage'],
            ]);
        }
    }

    foreach ($state['proposals'] as $proposal) {
        if ($proposal['validUntil'] && $in($proposal['validUntil'])) {
            $items[] = agenda_item('proposal:' . $proposal['id'], 'proposal', trim($proposal['number'] . ' ' . $proposal['title']), $proposal['clientCompany'] ?: $proposal['clientName'], $proposal['validUntil'], ['type' => 'proposal', 'id' => $proposal['id']], [
                'done' => !in_array($proposal['status'], ['draft', 'sent'], true),
                'status' => $proposal['status'],
            ]);
        }
    }

    foreach ($state['calendarEvents'] as $event) {
        [$date, $endDate] = calendar_event_days($event, $tzOffset);
        if ($in($date, $endDate)) {
            $items[] = agenda_item('event:' . $event['id'], 'event', $event['title'], $event['notes'] !== '' ? mb_substr($event['notes'], 0, 140) : '', $date, ['type' => 'event', 'id' => $event['id']], [
                'endDate' => $endDate !== $date ? $endDate : null,
                'at' => $event['allDay'] ? null : $event['start'],
                'endAt' => $event['allDay'] ? null : $event['end'],
                'allDay' => $event['allDay'],
                'status' => $event['category'],
            ]);
        }
    }

    usort($items, fn ($a, $b) => [$a['date'], $a['allDay'] ? 0 : 1, (string) $a['at'], $a['title']] <=> [$b['date'], $b['allDay'] ? 0 : 1, (string) $b['at'], $b['title']]);
    return $items;
}

// ── Manual Calendar events ──────────────────────────────────────────────────

/** [first local day, last local day] of an event. */
function calendar_event_days(array $event, int $tzOffset): array
{
    if ($event['allDay']) {
        return [$event['start'], $event['end'] ?? $event['start']];
    }
    $start = local_date(iso_to_ts($event['start']) ?? 0, $tzOffset);
    $end = $event['end'] ? local_date(iso_to_ts($event['end']) ?? 0, $tzOffset) : $start;
    return [$start, max($start, $end)];
}

/** Validates event input; all-day events use dates, timed events use instants. */
function calendar_event_fields(array $in): array
{
    $allDay = v_bool($in['allDay'] ?? true);
    if ($allDay) {
        $start = v_date($in['start'] ?? null, 'Start date');
        $end = v_date($in['end'] ?? null, 'End date');
    } else {
        $start = v_datetime($in['start'] ?? null, 'Start');
        $end = v_datetime($in['end'] ?? null, 'End');
    }
    if ($start === null) {
        throw new ApiError('VALIDATION_ERROR', 'The event needs a start.', 422);
    }
    if ($end !== null && $end < $start) {
        throw new ApiError('VALIDATION_ERROR', 'The event cannot end before it starts.', 422);
    }
    $span = ($end !== null ? (iso_to_ts($end) ?? 0) : 0) - (iso_to_ts($start) ?? 0);
    if ($end !== null && $span > 366 * 86400) {
        throw new ApiError('VALIDATION_ERROR', 'Events can span at most one year.', 422);
    }
    return [
        'title' => v_string($in['title'] ?? '', 'Title', 160, true),
        'start' => $start,
        'end' => $end === $start ? null : $end,
        'allDay' => $allDay,
        'notes' => v_string($in['notes'] ?? '', 'Notes', 2000),
        'category' => v_enum($in['category'] ?? '', 'Category', CALENDAR_EVENT_CATEGORIES),
    ];
}

function calendar_event_index(array $state, string $id): int
{
    foreach ($state['calendarEvents'] as $i => $event) {
        if ($event['id'] === $id) {
            return $i;
        }
    }
    throw new ApiError('NOT_FOUND', 'Event not found. It may have been deleted.', 404);
}

// ── Overview ────────────────────────────────────────────────────────────────

const ATTENTION_ORDER = ['overdue' => 0, 'issue' => 1, 'today' => 2, 'new' => 3, 'soon' => 4];

/**
 * Actionable items for the Overview, most urgent first. Each record appears once:
 * overdue or today from the agenda, soon for proposals/projects within 7 days,
 * plus new inquiries and monitors that are down or warning.
 */
function overview_attention(array $state, array $monitors, int $now, int $tzOffset): array
{
    $today = local_date($now, $tzOffset);
    $soon = day_add($today, 7);
    $todayEnd = local_day_end($now, $tzOffset);
    $items = [];
    foreach (agenda_items($state, '2000-01-01', $soon, $tzOffset, $now) as $item) {
        if ($item['done']) {
            continue;
        }
        $urgency = null;
        if ($item['source'] === 'lead') {
            $bucket = follow_up_bucket(['followUpAt' => $item['at'], 'followUpCompletedAt' => null, 'status' => $item['status']], $now, $todayEnd);
            $urgency = in_array($bucket, ['overdue', 'today'], true) ? $bucket : null;
        } elseif ($item['source'] === 'event') {
            $urgency = $item['date'] <= $today && ($item['endDate'] ?? $item['date']) >= $today ? 'today' : null;
        } elseif ($item['date'] < $today) {
            $urgency = 'overdue';
        } elseif ($item['date'] === $today) {
            $urgency = 'today';
        } elseif (in_array($item['source'], ['proposal', 'project'], true) && ($item['source'] !== 'proposal' || $item['status'] === 'sent')) {
            $urgency = 'soon';
        }
        if ($urgency !== null) {
            $items[] = ['urgency' => $urgency] + $item;
        }
    }
    foreach ($state['inbox'] as $inquiry) {
        if ($inquiry['status'] === 'new') {
            $at = iso_to_ts($inquiry['createdAt']) ?? $now;
            $items[] = ['urgency' => 'new'] + agenda_item('inbox:' . $inquiry['id'], 'inbox', $inquiry['name'], $inquiry['company'] ?: ($inquiry['projectType'] ?: inbox_excerpt($inquiry['message'])), local_date($at, $tzOffset), ['type' => 'inbox', 'id' => $inquiry['id']], [
                'at' => $inquiry['createdAt'],
                'allDay' => false,
                'status' => $inquiry['delivery'] === 'failed' ? 'delivery_failed' : 'new',
            ]);
        }
    }
    foreach ($monitors as $monitor) {
        if (in_array($monitor['state'], ['down', 'warning'], true)) {
            $items[] = ['urgency' => 'issue'] + agenda_item('health:' . $monitor['id'], 'health', $monitor['name'], $monitor['state'] === 'down' ? ($monitor['last']['error'] ?? 'Down') : implode(', ', $monitor['warnings']), $today, ['type' => 'health', 'id' => $monitor['id']], [
                'status' => $monitor['state'],
            ]);
        }
    }
    usort($items, fn ($a, $b) => [ATTENTION_ORDER[$a['urgency']], $a['date'], (string) $a['at']] <=> [ATTENTION_ORDER[$b['urgency']], $b['date'], (string) $b['at']]);
    return $items;
}

/** Open agenda items after today, up to $days ahead, without anything already in the attention list. */
function overview_upcoming(array $state, array $attentionIds, int $now, int $tzOffset, int $days = 14): array
{
    $today = local_date($now, $tzOffset);
    $skip = array_flip($attentionIds);
    $items = array_filter(
        agenda_items($state, day_add($today, 1), day_add($today, $days), $tzOffset, $now),
        fn ($item) => !$item['done'] && !isset($skip[$item['id']]) && $item['date'] > $today
    );
    return array_values($items);
}
