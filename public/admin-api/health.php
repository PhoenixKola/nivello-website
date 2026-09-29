<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_discovery.php';
require __DIR__ . '/_health.php';

/** GitHub Actions integration status. Secrets are only reported as present/missing. */
function discovery_health(bool $refresh): array
{
    $github = new GitHubActions();
    $issues = discovery_config_issues();
    $base = [
        'repo' => $github->repoSlug(),
        'workflow' => $github->workflowName(),
        'ref' => $github->ref(),
        'callbackUrl' => discovery_callback_url(),
        'tokenConfigured' => $github->hasToken(),
        'callbackSecretConfigured' => strlen(admin_secret('callback_secret')) >= 32,
    ];
    if (!$github->hasToken()) {
        return $base + ['available' => false, 'issues' => $issues, 'apiReachable' => null, 'workflowFound' => null, 'latestRun' => null];
    }
    $remote = github_cache('health', $refresh ? 0 : 60, function () use ($github) {
        try {
            $workflow = $github->workflow();
            $latest = $workflow['found'] ? $github->latestRun() : null;
            return ['apiReachable' => true, 'workflowFound' => $workflow['found'], 'latestRun' => $latest, 'error' => null];
        } catch (GitHubError $e) {
            return ['apiReachable' => $e->errorCode !== 'GITHUB_UNAVAILABLE', 'workflowFound' => null, 'latestRun' => null, 'error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]];
        }
    });
    if ($remote['error']) {
        $issues[] = $remote['error'];
    } elseif ($remote['workflowFound'] === false) {
        $issues[] = ['code' => 'WORKFLOW_NOT_FOUND', 'message' => "Workflow {$github->workflowName()} is not on branch {$github->ref()} yet."];
    }
    unset($remote['error']);
    return $base + $remote + ['available' => !$issues, 'issues' => $issues];
}

api_run([
    'GET status' => function () {
        $storage = ['ok' => true, 'error' => null];
        $counts = ['leads' => 0, 'batches' => 0, 'openBatches' => 0, 'tags' => 0, 'pendingDuplicates' => 0, 'newInquiries' => 0, 'siteIssues' => 0];
        $recovery = null;
        try {
            $state = Store::instance()->read();
            $counts = [
                'leads' => count($state['leads']),
                'batches' => count($state['batches']),
                'openBatches' => count(array_filter($state['batches'], fn ($b) => in_array($b['status'], OPEN_BATCH_STATUSES, true))),
                'tags' => count($state['tags']),
                'pendingDuplicates' => count(array_filter($state['duplicateCandidates'], fn ($d) => $d['status'] === 'pending')),
                'newInquiries' => count(array_filter($state['inbox'], fn ($i) => $i['status'] === 'new')),
                'siteIssues' => 0,
            ];
            $recovery = $state['settings']['lastRecovery'] ?? null;
        } catch (ApiError $e) {
            $storage = ['ok' => false, 'error' => $e->getMessage()];
        }
        try {
            $overview = health_overview(health_store()->read());
            $counts['siteIssues'] = $overview['counts']['down'] + $overview['counts']['warning'];
        } catch (Throwable) {
            // Site Health problems never affect the CRM status.
        }
        return [
            'api' => ['ok' => true, 'time' => now_iso()],
            'storage' => $storage + Store::instance()->info() + ['lastRecovery' => $recovery],
            'discovery' => discovery_health(($_GET['refresh'] ?? '') === '1'),
            'counts' => $counts,
        ];
    },
    'POST backup' => function () {
        $file = Store::instance()->backupNow();
        return ['file' => $file, 'info' => Store::instance()->info()];
    },
]);
