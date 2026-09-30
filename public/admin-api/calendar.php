<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_agenda.php';

api_run([
    'GET list' => function () {
        $from = v_date($_GET['from'] ?? null, 'From') ?? throw new ApiError('VALIDATION_ERROR', 'From is required.', 422);
        $to = v_date($_GET['to'] ?? null, 'To') ?? throw new ApiError('VALIDATION_ERROR', 'To is required.', 422);
        if ($to < $from || strtotime($to) - strtotime($from) > AGENDA_MAX_RANGE_DAYS * 86400) {
            throw new ApiError('VALIDATION_ERROR', 'Choose a range of at most ' . AGENDA_MAX_RANGE_DAYS . ' days.', 422);
        }
        $tzOffset = tz_offset_param($_GET['tzOffset'] ?? 0);
        $now = time();
        return [
            'from' => $from,
            'to' => $to,
            'today' => local_date($now, $tzOffset),
            'items' => agenda_items(Store::instance()->read(), $from, $to, $tzOffset, $now),
        ];
    },

    'GET event' => function () {
        $state = Store::instance()->read();
        return ['event' => $state['calendarEvents'][calendar_event_index($state, v_id($_GET['id'] ?? '', 'evt', 'Event'))]];
    },

    'POST event-create' => function () {
        $input = json_body()['event'] ?? null;
        $fields = calendar_event_fields(is_array($input) ? $input : []);
        return Store::instance()->mutate(function (array &$state) use ($fields) {
            if (count($state['calendarEvents']) >= CALENDAR_EVENT_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Calendar event limit reached (' . CALENDAR_EVENT_LIMIT . ').', 422);
            }
            $now = now_iso();
            $event = ['id' => new_id('evt')] + $fields + ['createdAt' => $now, 'updatedAt' => $now];
            $state['calendarEvents'][] = $event;
            return ['event' => $event];
        });
    },

    'POST event-update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'evt', 'Event');
        $fields = calendar_event_fields(is_array($body['event'] ?? null) ? $body['event'] : []);
        return Store::instance()->mutate(function (array &$state) use ($id, $fields) {
            $i = calendar_event_index($state, $id);
            $state['calendarEvents'][$i] = $fields + $state['calendarEvents'][$i];
            $state['calendarEvents'][$i]['updatedAt'] = now_iso();
            return ['event' => $state['calendarEvents'][$i]];
        });
    },

    'POST event-delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'evt', 'Event');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            array_splice($state['calendarEvents'], calendar_event_index($state, $id), 1);
            return ['deleted' => true];
        });
    },
]);
