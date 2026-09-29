<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_analytics.php';

api_run([
    'GET summary' => function () {
        $to = isset($_GET['to']) ? parse_day($_GET['to'], 'End date') : gmdate('Y-m-d');
        $from = isset($_GET['from']) ? parse_day($_GET['from'], 'Start date') : gmdate('Y-m-d', strtotime($to . 'T00:00:00Z') - 6 * 86400);
        $current = analytics_summary($from, $to);
        // Same-length previous period, for trend deltas.
        $days = count($current['series']);
        $prevTo = gmdate('Y-m-d', strtotime($from . 'T00:00:00Z') - 86400);
        $prevFrom = gmdate('Y-m-d', strtotime($prevTo . 'T00:00:00Z') - ($days - 1) * 86400);
        $previous = analytics_summary($prevFrom, $prevTo)['totals'];
        return $current + ['previous' => [
            'pageViews' => $previous['pageViews'],
            'sessions' => $previous['sessions'],
            'contactSubmits' => $previous['contactSubmits'],
            'launcherCompletes' => $previous['launcherCompletes'],
        ]];
    },
]);
