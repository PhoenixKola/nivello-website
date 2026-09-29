<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_leads.php';
require_once __DIR__ . '/_github.php';
require_once __DIR__ . '/_enrich.php';

/*
 * Lead discovery runs on demand in GitHub Actions (.github/workflows/nivello-lead-discovery.yml).
 * PHP owns the queue, the search plan, qualification, dedupe and counters; the runner scrapes
 * and reports through signed callbacks (github-callback.php). The JSON store is the source of truth.
 */

const DISCOVERY_LANGUAGES = ['en', 'it', 'sq', 'de', 'fr', 'es'];
const OPEN_BATCH_STATUSES = ['queued', 'dispatching', 'starting', 'working', 'retrying'];
/** Batches that own the single GitHub Actions slot. */
const ACTIVE_BATCH_STATUSES = ['dispatching', 'starting', 'working', 'retrying'];
const RUNNING_BATCH_STATUSES = ['starting', 'working', 'retrying'];

const MAX_SEGMENTS = 30;
const MAX_CRASH_REDISPATCHES = 2;
const DISPATCH_MAX_ATTEMPTS = 5;
const DISPATCH_RETRY_SECONDS = 60;
const START_TIMEOUT_SECONDS = 20 * 60;
const STALE_CALLBACK_SECONDS = 4 * 60;
const RECONCILE_INTERVAL_SECONDS = 60;
const MAX_ROWS_PER_CHUNK = 500;
const PROCESSED_CHUNKS_KEPT = 400;

/** Scales discovery timeouts. Only the local test harness sets NIVELLO_TEST_TIME_SCALE (e.g. 0.02). */
function dt(float $seconds): int
{
    static $scale = null;
    $scale ??= is_numeric(getenv('NIVELLO_TEST_TIME_SCALE')) ? max(0.001, (float) getenv('NIVELLO_TEST_TIME_SCALE')) : 1.0;
    return max(1, (int) round($seconds * $scale));
}

const GENERIC_CATEGORY_TERMS = ['', 'business', 'businesses', 'company', 'companies', 'shop', 'shops', 'store', 'stores', 'all', 'any', 'local business', 'local businesses', 'service', 'services', 'everything'];

const BROAD_CATEGORIES = [
    'accountant', 'architect', 'auto repair', 'bakery', 'barber', 'beauty salon', 'cafe', 'car dealer', 'car rental',
    'cleaning service', 'clothing store', 'construction company', 'dentist', 'doctor', 'electrician', 'florist',
    'furniture store', 'gym', 'hair salon', 'hardware store', 'hotel', 'insurance agency', 'lawyer', 'locksmith',
    'marketing agency', 'mechanic', 'moving company', 'optician', 'pharmacy', 'photographer', 'physiotherapist',
    'plumber', 'printing shop', 'real estate agency', 'restaurant', 'roofing contractor', 'school', 'security service',
    'supermarket', 'travel agency', 'veterinary clinic', 'web designer', 'appliance repair', 'logistics company',
    'engineering company', 'interior designer', 'IT services', 'car wash', 'pet store',
];

const SPECIFIC_QUERY_VARIATIONS = [
    '{c} in {city}, {country}', '{c} near {city}, {country}', '{c} around {city}, {country}',
    '{c} central {city}, {country}', '{c} north {city}, {country}', '{c} south {city}, {country}',
    '{c} east {city}, {country}', '{c} west {city}, {country}', 'local {c} in {city}, {country}',
    '{c} companies in {city}, {country}', '{c} services in {city}, {country}',
];
const BROAD_QUERY_VARIATIONS = ['{c} in {city}, {country}', '{c} near {city}, {country}'];

// ── Params & plan ───────────────────────────────────────────────────────────

function validate_discovery_params(array $in): array
{
    $languages = $in['languages'] ?? ['en'];
    if (!is_array($languages) || !$languages) {
        throw new ApiError('VALIDATION_ERROR', 'Select at least one search language.', 422);
    }
    foreach ($languages as $lang) {
        if (!in_array($lang, DISCOVERY_LANGUAGES, true)) {
            throw new ApiError('VALIDATION_ERROR', 'Unsupported search language.', 422);
        }
    }
    $noWebsite = v_bool($in['noWebsite'] ?? false);
    return [
        'country' => v_string($in['country'] ?? '', 'Country', 80, true),
        'city' => v_string($in['city'] ?? '', 'City', 80, true),
        'category' => v_string($in['category'] ?? '', 'Business category', 80),
        'target' => v_int($in['target'] ?? null, 'Qualified leads wanted', 1, MAX_TARGET_LEADS),
        'languages' => array_values(array_intersect(DISCOVERY_LANGUAGES, $languages)),
        'noWebsite' => $noWebsite,
        'requirePhone' => v_bool($in['requirePhone'] ?? false),
        // Website enrichment contradicts "only businesses without a website".
        'email' => !$noWebsite && v_bool($in['email'] ?? false),
        'instagram' => !$noWebsite && v_bool($in['instagram'] ?? false),
    ];
}

function is_generic_category(string $category): bool
{
    return in_array(mb_strtolower(trim($category)), GENERIC_CATEGORY_TERMS, true);
}

/** Deterministic, finite list of small scraper passes for a batch. */
function build_plan(array $p): array
{
    $generic = is_generic_category($p['category']);
    $categories = $generic ? BROAD_CATEGORIES : [$p['category']];
    $variations = $generic ? BROAD_QUERY_VARIATIONS : SPECIFIC_QUERY_VARIATIONS;
    $tiers = $generic ? [[2, 150], [6, 300]] : [[2, 150], [5, 240], [10, 360]];
    $plan = [];
    $seen = [];
    foreach ($tiers as [$depth, $maxTime]) {
        foreach ($variations as $variation) {
            foreach ($categories as $category) {
                foreach ($p['languages'] as $lang) {
                    $query = strtr($variation, ['{c}' => $category, '{city}' => $p['city'], '{country}' => $p['country']]);
                    $key = mb_strtolower($query) . '|' . $lang . '|' . $depth;
                    if (isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;
                    $plan[] = [
                        'index' => count($plan),
                        'query' => $query,
                        'lang' => $lang,
                        'depth' => $depth,
                        'maxTime' => $p['email'] ? (int) ($maxTime * 1.5) : $maxTime,
                        'category' => $category,
                    ];
                }
            }
        }
    }
    return $plan;
}

function new_batch(array $params): array
{
    $now = now_iso();
    return [
        'id' => new_id('batch'),
        'createdAt' => $now,
        'updatedAt' => $now,
        'startedAt' => null,
        'finishedAt' => null,
        'status' => 'queued',
        'params' => $params,
        'planLength' => count(build_plan($params)),
        'planIndex' => 0,
        'currentPass' => null,
        'lastPass' => null,
        'counters' => [
            'checked' => 0, 'imported' => 0, 'duplicates' => 0, 'rejected' => 0,
            'rejectedWebsite' => 0, 'rejectedPhone' => 0, 'rejectedInvalid' => 0,
        ],
        'passesCompleted' => 0,
        'passesFailed' => 0,
        'consecutiveFailures' => 0,
        'error' => null,
        'github' => [
            'segment' => 0,
            'runId' => null,
            'runUrl' => null,
            'runStatus' => null,
            'dispatchedAt' => null,
            'dispatchAttempts' => 0,
            'nextDispatchAt' => null,
            'crashRedispatches' => 0,
            'lastCallbackAt' => null,
            'lastSeq' => 0,
            'lastReconcileAt' => null,
            'cancel' => null,
        ],
        'runner' => ['state' => 'ok', 'message' => null],
        'processedChunks' => [],
        'events' => [],
    ];
}

function batch_event(array &$batch, string $level, string $message): void
{
    $batch['events'][] = ['at' => now_iso(), 'level' => $level, 'message' => $message];
    if (count($batch['events']) > 20) {
        $batch['events'] = array_slice($batch['events'], -20);
    }
}

function batch_public(array $batch): array
{
    $out = $batch;
    unset($out['processedChunks']);
    $out['label'] = batch_label($batch);
    $out['isOpen'] = in_array($batch['status'], OPEN_BATCH_STATUSES, true);
    return $out;
}

function &find_batch(array &$state, string $id): ?array
{
    $null = null;
    foreach ($state['batches'] as $i => $batch) {
        if ($batch['id'] === $id) {
            return $state['batches'][$i];
        }
    }
    return $null;
}

/** Marks the batch complete/exhausted when appropriate. Complete only when the target is met. */
function settle_batch_status(array &$b, bool $planDone = false): void
{
    if ($b['counters']['imported'] >= $b['params']['target']) {
        $b['status'] = 'complete';
        $b['finishedAt'] = now_iso();
        $b['currentPass'] = null;
        batch_event($b, 'success', sprintf('Target reached: %d qualified leads imported.', $b['counters']['imported']));
        return;
    }
    if ($planDone || $b['planIndex'] >= $b['planLength']) {
        $b['status'] = 'exhausted';
        $b['finishedAt'] = now_iso();
        $b['currentPass'] = null;
        batch_event($b, 'warning', sprintf('Search plan exhausted: %d / %d qualified leads imported.', $b['counters']['imported'], $b['params']['target']));
    }
}

function fail_batch(array &$b, string $code, string $message): void
{
    $b['status'] = 'error';
    $b['finishedAt'] = now_iso();
    $b['currentPass'] = null;
    $b['error'] = ['code' => $code, 'message' => $message . ' ' . $b['counters']['imported'] . ' imported leads are kept.'];
    batch_event($b, 'warning', $message);
}

/** Schedules the next GitHub Actions run for the same logical batch. */
function schedule_segment(array &$b, string $reason): void
{
    $b['status'] = 'dispatching';
    $b['github']['segment']++;
    $b['github']['runId'] = null;
    $b['github']['runUrl'] = null;
    $b['github']['runStatus'] = null;
    $b['github']['dispatchedAt'] = null;
    $b['github']['dispatchAttempts'] = 0;
    $b['github']['nextDispatchAt'] = now_iso();
    $b['github']['lastSeq'] = 0;
    $b['currentPass'] = null;
    batch_event($b, 'info', $reason);
}

// ── Service ─────────────────────────────────────────────────────────────────

final class DiscoveryService
{
    public function __construct(private Store $store, private GitHubActions $github)
    {
    }

    public static function create(): DiscoveryService
    {
        return new DiscoveryService(Store::instance(), new GitHubActions());
    }

    /** Validates GitHub availability, stores the batch, and dispatches it when the slot is free. */
    public function start(array $params): array
    {
        $issues = discovery_config_issues();
        if ($issues) {
            throw new ApiError('DISCOVERY_UNAVAILABLE', 'Lead discovery is unavailable: ' . $issues[0]['message'] . ' CRM and lead management are still available.', 503, ['issues' => $issues]);
        }
        try {
            $workflow = $this->github->workflow();
        } catch (GitHubError $e) {
            throw new ApiError('DISCOVERY_UNAVAILABLE', 'Lead discovery is unavailable: ' . $e->getMessage(), 503, ['issues' => [['code' => $e->errorCode, 'message' => $e->getMessage()]]]);
        }
        if (!$workflow['found']) {
            throw new ApiError('DISCOVERY_UNAVAILABLE', "Lead discovery is unavailable: workflow {$this->github->workflowName()} was not found on branch {$this->github->ref()}.", 503, ['issues' => [['code' => 'WORKFLOW_NOT_FOUND', 'message' => 'Workflow not found on the configured branch.']]]);
        }
        $batch = new_batch($params);
        $this->store->mutate(function (array &$state) use ($batch) {
            $state['batches'][] = $batch;
        });
        $this->pump();
        $state = $this->store->read();
        return batch_public(find_batch($state, $batch['id']) ?? $batch);
    }

    /**
     * Advances the Nivello-side queue: dispatches the next batch or continuation segment and
     * reconciles stale runs. Cheap when nothing is due: no GitHub calls, no writes.
     */
    public function pump(bool $forceReconcileId = false, ?string $reconcileId = null): void
    {
        $lock = @fopen(ADMIN_DATA_DIR . '/dispatch.lock', 'c');
        if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
            if ($lock) {
                fclose($lock);
            }
            return;
        }
        try {
            $activeId = $this->activeOrPromote();
            if ($activeId === null) {
                return;
            }
            $state = $this->store->read();
            $batch = find_batch($state, $activeId);
            if ($batch === null) {
                return;
            }
            if ($batch['status'] === 'dispatching') {
                if ((iso_to_ts($batch['github']['nextDispatchAt']) ?? 0) <= time()) {
                    $this->dispatch($batch);
                }
                return;
            }
            $this->reconcile($batch, $forceReconcileId && $reconcileId === $activeId);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    public function stop(string $id): array
    {
        $runId = null;
        $found = $this->store->mutate(function (array &$state, bool &$dirty) use ($id, &$runId) {
            $b = &find_batch($state, $id);
            if ($b === null) {
                $dirty = false;
                return false;
            }
            if (!in_array($b['status'], OPEN_BATCH_STATUSES, true)) {
                $dirty = false;
                return true;
            }
            // Terminal first: every later callback for this batch is refused.
            $runId = $b['github']['runId'];
            $b['status'] = 'stopped';
            $b['finishedAt'] = now_iso();
            $b['updatedAt'] = now_iso();
            if ($b['currentPass']) {
                $b['lastPass'] = $b['currentPass'] + ['stoppedAt' => now_iso()];
            }
            $b['currentPass'] = null;
            $b['github']['cancel'] = $runId ? 'requested' : 'none';
            batch_event($b, 'info', 'Stopped by admin. ' . $b['counters']['imported'] . ' imported leads kept.');
            return true;
        });
        if (!$found) {
            throw new ApiError('NOT_FOUND', 'Discovery batch not found.', 404);
        }
        if ($runId !== null) {
            $cancelled = false;
            try {
                $cancelled = $this->github->cancelRun($runId);
            } catch (GitHubError) {
                $cancelled = false;
            }
            $this->store->mutate(function (array &$state) use ($id, $cancelled) {
                $b = &find_batch($state, $id);
                if ($b !== null) {
                    $b['github']['cancel'] = $cancelled ? 'cancelled' : 'failed';
                    if (!$cancelled) {
                        batch_event($b, 'warning', 'GitHub did not confirm the run cancellation. The batch stays stopped and late results are ignored.');
                    }
                }
            });
        }
        $this->pump();
        $state = $this->store->read();
        return batch_public(find_batch($state, $id));
    }

    // ── queue & dispatch ────────────────────────────────────────────────────

    private function activeOrPromote(): ?string
    {
        $state = $this->store->read();
        foreach ($state['batches'] as $batch) {
            if (in_array($batch['status'], ACTIVE_BATCH_STATUSES, true)) {
                return $batch['id'];
            }
        }
        $hasQueued = false;
        foreach ($state['batches'] as $batch) {
            $hasQueued = $hasQueued || $batch['status'] === 'queued';
        }
        if (!$hasQueued) {
            return null;
        }
        return $this->store->mutate(function (array &$state, bool &$dirty) {
            foreach ($state['batches'] as $batch) {
                if (in_array($batch['status'], ACTIVE_BATCH_STATUSES, true)) {
                    $dirty = false;
                    return $batch['id'];
                }
            }
            foreach ($state['batches'] as $i => $batch) {
                if ($batch['status'] === 'queued') {
                    $b = &$state['batches'][$i];
                    schedule_segment($b, 'Dispatching to GitHub Actions.');
                    $b['updatedAt'] = now_iso();
                    return $b['id'];
                }
            }
            $dirty = false;
            return null;
        });
    }

    private function dispatch(array $batch): void
    {
        $p = $batch['params'];
        $segment = $batch['github']['segment'];
        $inputs = [
            'batch_id' => $batch['id'],
            'segment' => (string) $segment,
            'callback_url' => discovery_callback_url(),
            'country' => $p['country'],
            'city' => $p['city'],
            'category' => $p['category'],
            'target' => (string) $p['target'],
            'languages' => implode(',', $p['languages']),
            'no_website' => $p['noWebsite'],
            'require_phone' => $p['requirePhone'],
            'email' => $p['email'],
            'instagram' => $p['instagram'],
        ];
        $error = null;
        try {
            $this->github->dispatch($inputs);
        } catch (GitHubError $e) {
            $error = $e;
        }
        $this->store->mutate(function (array &$state, bool &$dirty) use ($batch, $segment, $error) {
            $b = &find_batch($state, $batch['id']);
            if ($b === null || $b['status'] !== 'dispatching' || $b['github']['segment'] !== $segment) {
                $dirty = false;
                return;
            }
            $b['updatedAt'] = now_iso();
            if ($error === null) {
                $b['status'] = 'starting';
                $b['startedAt'] ??= now_iso();
                $b['github']['dispatchedAt'] = now_iso();
                $b['github']['nextDispatchAt'] = null;
                $b['runner'] = ['state' => 'ok', 'message' => null];
                batch_event($b, 'info', $segment > 1 ? "Continuation run dispatched (segment $segment)." : 'GitHub Actions run dispatched.');
                return;
            }
            if ($error->errorCode === 'GITHUB_UNAVAILABLE' && $b['github']['dispatchAttempts'] + 1 < DISPATCH_MAX_ATTEMPTS) {
                $b['github']['dispatchAttempts']++;
                $b['github']['nextDispatchAt'] = now_iso(time() + dt(DISPATCH_RETRY_SECONDS));
                $b['runner'] = ['state' => 'degraded', 'message' => $error->getMessage() . ' Retrying the dispatch automatically.'];
                batch_event($b, 'warning', 'Dispatch failed: ' . $error->getMessage());
                return;
            }
            fail_batch($b, $error->errorCode, 'Lead discovery could not be dispatched: ' . $error->getMessage());
        });
    }

    /** Looks at the GitHub run only when the batch is stale or on explicit refresh. */
    private function reconcile(array $batch, bool $force): void
    {
        $gh = $batch['github'];
        $now = time();
        $lastSignal = max(iso_to_ts($gh['lastCallbackAt']) ?? 0, iso_to_ts($gh['dispatchedAt']) ?? 0);
        $stale = $now - $lastSignal > dt(STALE_CALLBACK_SECONDS);
        $throttled = $now - (iso_to_ts($gh['lastReconcileAt']) ?? 0) < dt(RECONCILE_INTERVAL_SECONDS);
        if (!$force && (!$stale || $throttled)) {
            return;
        }
        $run = null;
        $lookupError = null;
        try {
            $run = $gh['runId'] ? $this->github->getRun($gh['runId']) : $this->github->findRun($batch['id'], $gh['segment']);
        } catch (GitHubError $e) {
            $lookupError = $e;
        }

        $this->store->mutate(function (array &$state, bool &$dirty) use ($batch, $gh, $run, $lookupError, $now) {
            $b = &find_batch($state, $batch['id']);
            if ($b === null || !in_array($b['status'], RUNNING_BATCH_STATUSES, true) || $b['github']['segment'] !== $gh['segment']) {
                $dirty = false;
                return;
            }
            $b['github']['lastReconcileAt'] = now_iso();
            if ($lookupError !== null) {
                $b['runner'] = ['state' => 'degraded', 'message' => 'Could not check the GitHub run: ' . $lookupError->getMessage()];
                return;
            }
            if ($run === null) {
                if ($b['status'] === 'starting' && $now - (iso_to_ts($b['github']['dispatchedAt']) ?? $now) > dt(START_TIMEOUT_SECONDS)) {
                    fail_batch($b, 'RUN_NOT_STARTED', 'The GitHub Actions run never started. Check that Actions is enabled for the repository.');
                }
                return;
            }
            $b['github']['runId'] ??= $run['id'];
            $b['github']['runUrl'] ??= $run['htmlUrl'];
            $b['github']['runStatus'] = $run['status'] . ($run['conclusion'] ? ':' . $run['conclusion'] : '');
            if ($run['status'] !== 'completed') {
                $b['runner'] = ['state' => 'ok', 'message' => $run['status'] === 'queued' ? 'Waiting for a GitHub Actions runner.' : null];
                return;
            }
            // The run ended without a final callback (crash, timeout, cancelled externally).
            if ($b['counters']['imported'] >= $b['params']['target'] || $b['planIndex'] >= $b['planLength']) {
                settle_batch_status($b, true);
            } elseif ($b['github']['crashRedispatches'] < MAX_CRASH_REDISPATCHES && $b['github']['segment'] < MAX_SEGMENTS) {
                $b['github']['crashRedispatches']++;
                schedule_segment($b, 'The GitHub run ended unexpectedly (' . ($run['conclusion'] ?? 'unknown') . '). Continuing from the last checkpoint.');
            } else {
                fail_batch($b, 'RUN_ENDED', 'The GitHub Actions run ended without finishing (' . ($run['conclusion'] ?? 'unknown') . ').');
            }
            $b['updatedAt'] = now_iso();
        });
    }

    // ── callbacks from the runner ───────────────────────────────────────────

    /** Handles one authenticated runner callback. Always returns whether the runner must stop. */
    public function handleCallback(array $body): array
    {
        $event = v_enum($body['event'] ?? '', 'Event', ['run_started', 'pass_started', 'heartbeat', 'pass_result', 'pass_failed', 'segment_end', 'finished']);
        $batchId = v_id($body['batchId'] ?? '', 'batch', 'Batch');
        $segment = v_int($body['segment'] ?? null, 'Segment', 1, MAX_SEGMENTS);
        $seq = v_int($body['seq'] ?? 0, 'Sequence', 0, 1000000);
        $runId = isset($body['runId']) && preg_match('/^\d{1,20}$/', (string) $body['runId']) ? (string) $body['runId'] : null;
        $runUrl = isset($body['runUrl']) && preg_match('~^https://github\.com/[\w.\-]+/[\w.\-]+/actions/runs/\d+~', (string) $body['runUrl']) ? (string) $body['runUrl'] : null;

        $afterPump = false;
        $response = $this->store->mutate(function (array &$state, bool &$dirty) use ($event, $batchId, $segment, $seq, $runId, $runUrl, $body, &$afterPump) {
            $b = &find_batch($state, $batchId);
            if ($b === null) {
                throw new ApiError('NOT_FOUND', 'Unknown batch.', 404);
            }
            // Stopped/terminal batches and superseded segments never change again.
            // A fast runner may report before the dispatch itself was recorded.
            $accepting = in_array($b['status'], RUNNING_BATCH_STATUSES, true) || ($event === 'run_started' && $b['status'] === 'dispatching');
            if (!$accepting || $segment !== $b['github']['segment']) {
                $dirty = false;
                return callback_reply($b, true);
            }
            $b['github']['lastCallbackAt'] = now_iso();
            $b['runner'] = ['state' => 'ok', 'message' => null];
            $b['github']['runId'] ??= $runId;
            $b['github']['runUrl'] ??= $runUrl;
            $b['updatedAt'] = now_iso();
            $fresh = $seq > (int) $b['github']['lastSeq'];
            if ($fresh) {
                $b['github']['lastSeq'] = $seq;
            }

            switch ($event) {
                case 'run_started':
                    $b['github']['segmentStartIndex'] = $b['planIndex'];
                    $b['status'] = 'working';
                    $b['github']['runStatus'] = 'in_progress';
                    batch_event($b, 'info', $segment > 1 ? "Continuation run started (segment $segment)." : 'GitHub Actions runner started.');
                    $reply = callback_reply($b, false);
                    $reply['plan'] = array_values(array_slice(build_plan($b['params']), $b['planIndex']));
                    $reply['params'] = $b['params'];
                    return $reply;

                case 'pass_started':
                case 'heartbeat':
                    if ($fresh) {
                        $pass = callback_pass($body, $b);
                        $b['currentPass'] = $pass + [
                            'startedAt' => $event === 'pass_started' ? now_iso() : ($b['currentPass']['startedAt'] ?? now_iso()),
                            'scraperStatus' => mb_substr((string) ($body['scraperStatus'] ?? ($event === 'pass_started' ? 'pending' : '')), 0, 40),
                        ];
                        $b['status'] = ($body['retrying'] ?? false) ? 'retrying' : 'working';
                        if (isset($body['message']) && is_string($body['message']) && $body['message'] !== '') {
                            $b['runner'] = ['state' => 'degraded', 'message' => mb_substr($body['message'], 0, 300)];
                        }
                    }
                    return callback_reply($b, false);

                case 'pass_result':
                    $chunkId = v_string($body['chunkId'] ?? '', 'Chunk id', 120, true);
                    if (in_array($chunkId, $b['processedChunks'], true)) {
                        $dirty = false;
                        return callback_reply($b, false) + ['duplicateChunk' => true];
                    }
                    $rows = $body['rows'] ?? [];
                    if (!is_array($rows) || count($rows) > MAX_ROWS_PER_CHUNK) {
                        throw new ApiError('VALIDATION_ERROR', 'Invalid rows.', 422);
                    }
                    $rows = array_values(array_filter($rows, 'is_array'));
                    $pass = callback_pass($body, $b);
                    import_discovery_rows($state, $b, array_map('callback_row', $rows), $pass);
                    $b['processedChunks'][] = $chunkId;
                    $b['processedChunks'] = array_slice($b['processedChunks'], -PROCESSED_CHUNKS_KEPT);
                    if ($body['final'] ?? false) {
                        $b['passesCompleted']++;
                        $b['consecutiveFailures'] = 0;
                        $b['lastPass'] = $pass + ['rows' => (int) ($body['totalRows'] ?? count($rows)), 'finishedAt' => now_iso()];
                        $b['planIndex'] = max($b['planIndex'], $pass['index'] + 1);
                        $b['currentPass'] = null;
                        batch_event($b, 'info', sprintf('Pass %d finished (%s).', $pass['index'] + 1, $pass['query']));
                    }
                    settle_batch_status($b);
                    $afterPump = !in_array($b['status'], RUNNING_BATCH_STATUSES, true);
                    return callback_reply($b, !in_array($b['status'], RUNNING_BATCH_STATUSES, true));

                case 'pass_failed':
                    $pass = callback_pass($body, $b);
                    $reason = mb_substr(v_string($body['reason'] ?? 'Unknown error', 'Reason', 500), 0, 300);
                    if ($body['skipped'] ?? false) {
                        if ($fresh || $pass['index'] >= $b['planIndex']) {
                            $b['passesFailed']++;
                            $b['consecutiveFailures']++;
                            $b['planIndex'] = max($b['planIndex'], $pass['index'] + 1);
                            $b['lastPass'] = $pass + ['failed' => true, 'error' => $reason, 'finishedAt' => now_iso()];
                            $b['currentPass'] = null;
                            batch_event($b, 'warning', sprintf('Pass %d skipped: %s', $pass['index'] + 1, $reason));
                        }
                        $b['status'] = 'working';
                    } else {
                        $b['status'] = 'retrying';
                        $b['currentPass'] = $pass + ['lastError' => $reason, 'startedAt' => $b['currentPass']['startedAt'] ?? now_iso()];
                        batch_event($b, 'warning', sprintf('Pass %d attempt %d failed: %s', $pass['index'] + 1, $pass['attempt'], $reason));
                    }
                    return callback_reply($b, false);

                case 'segment_end':
                    $b['planIndex'] = max($b['planIndex'], v_int($body['nextIndex'] ?? $b['planIndex'], 'Next index', 0, $b['planLength']));
                    if ($b['counters']['imported'] >= $b['params']['target'] || $b['planIndex'] >= $b['planLength']) {
                        settle_batch_status($b, true);
                    } elseif ($b['planIndex'] <= (int) ($b['github']['segmentStartIndex'] ?? -1)) {
                        fail_batch($b, 'NO_PROGRESS', 'A GitHub Actions run ended without completing any search pass.');
                    } elseif ($b['github']['segment'] >= MAX_SEGMENTS) {
                        fail_batch($b, 'SEGMENT_LIMIT', 'Discovery reached the maximum number of GitHub Actions runs.');
                    } else {
                        schedule_segment($b, 'Run time budget used; continuing in a new GitHub Actions run.');
                    }
                    $afterPump = true;
                    return callback_reply($b, true);

                case 'finished':
                    $b['planIndex'] = max($b['planIndex'], v_int($body['nextIndex'] ?? $b['planIndex'], 'Next index', 0, $b['planLength']));
                    $reason = v_enum($body['reason'] ?? '', 'Reason', ['target_reached', 'plan_exhausted', 'error']);
                    if ($reason === 'error') {
                        fail_batch($b, 'RUNNER_ERROR', mb_substr(v_string($body['message'] ?? 'The discovery runner failed.', 'Message', 500), 0, 300));
                    } else {
                        // The server's own counters decide complete vs exhausted.
                        settle_batch_status($b, true);
                    }
                    $afterPump = true;
                    return callback_reply($b, true);
            }
            $dirty = false;
            return callback_reply($b, false);
        });
        if ($afterPump) {
            $this->pump();
        }
        return $response;
    }
}

function callback_reply(array $b, bool $stop): array
{
    return [
        'status' => $b['status'],
        'stop' => $stop,
        'imported' => $b['counters']['imported'],
        'target' => $b['params']['target'],
        'remaining' => max(0, $b['params']['target'] - $b['counters']['imported']),
        'planIndex' => $b['planIndex'],
    ];
}

/** Validates the pass reference sent by the runner against the server-side plan. */
function callback_pass(array $body, array $b): array
{
    $index = v_int($body['passIndex'] ?? null, 'Pass index', 0, max(0, $b['planLength'] - 1));
    $spec = build_plan($b['params'])[$index];
    return [
        'index' => $index,
        'query' => $spec['query'],
        'lang' => $spec['lang'],
        'depth' => $spec['depth'],
        'attempt' => v_int($body['attempt'] ?? 1, 'Attempt', 1, 20),
    ];
}

const CALLBACK_ROW_FIELDS = ['title', 'category', 'address', 'website', 'phone', 'review_count', 'review_rating', 'latitude', 'longitude', 'link', 'place_id', 'data_id', 'cid', 'complete_address', 'emails'];

/** Keeps only known scraper columns as bounded strings. */
function callback_row(array $row): array
{
    $clean = [];
    foreach (CALLBACK_ROW_FIELDS as $field) {
        $value = $row[$field] ?? '';
        $clean[$field] = is_scalar($value) ? mb_substr((string) $value, 0, 2000) : '';
    }
    return $clean;
}

/** Processes a few queued Instagram lookups within a small time budget. */
function process_enrichment_queue(Store $store, float $budgetSeconds = 6.0): void
{
    $deadline = microtime(true) + $budgetSeconds;
    $state = $store->read();
    $pending = [];
    foreach ($state['leads'] as $lead) {
        if (($lead['enrichment']['instagram'] ?? null) === 'pending') {
            $pending[] = $lead['id'];
            if (count($pending) >= 2) {
                break;
            }
        }
    }
    foreach ($pending as $leadId) {
        if (microtime(true) > $deadline) {
            return;
        }
        enrich_lead_instagram($store, $leadId);
    }
}

// ── Row import ──────────────────────────────────────────────────────────────

function clean_cell(array $row, string ...$keys): string
{
    foreach ($keys as $key) {
        if (isset($row[$key]) && trim((string) $row[$key]) !== '') {
            return trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $row[$key]) ?? '');
        }
    }
    return '';
}

function safe_url(string $value): string
{
    if ($value === '') {
        return '';
    }
    if (!preg_match('~^https?://~i', $value)) {
        $value = 'https://' . $value;
    }
    $parts = parse_url($value);
    return ($parts && !empty($parts['host']) && str_contains($parts['host'], '.') && mb_strlen($value) <= 500) ? $value : '';
}

function safe_float(string $value, float $min, float $max): ?float
{
    return is_numeric($value) && (float) $value >= $min && (float) $value <= $max ? round((float) $value, 6) : null;
}

/** Maps one scraper CSV row onto a lead record (no validation exceptions; bad values are dropped). */
function scraper_row_to_lead(array $row, array $batch, array $pass): array
{
    $lead = blank_lead();
    $address = [];
    $rawAddress = clean_cell($row, 'complete_address');
    if ($rawAddress !== '' && str_starts_with($rawAddress, '{')) {
        $decoded = json_decode($rawAddress, true);
        $address = is_array($decoded) ? $decoded : [];
    }
    $emails = array_values(array_filter(
        array_map('trim', preg_split('/[,;\s]+/', clean_cell($row, 'emails', 'email'))),
        fn ($e) => $e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)
    ));
    $phone = mb_substr(clean_cell($row, 'phone'), 0, 40);
    $country = trim((string) ($address['country'] ?? ''));

    $lead['companyName'] = mb_substr(clean_cell($row, 'title', 'name'), 0, 200);
    $lead['category'] = mb_substr(clean_cell($row, 'category'), 0, 120);
    $lead['categories'] = $lead['category'] !== '' ? [$lead['category']] : [];
    $lead['address'] = mb_substr(clean_cell($row, 'address'), 0, 300);
    $lead['city'] = mb_substr(trim((string) ($address['city'] ?? '')) ?: $batch['params']['city'], 0, 120);
    $lead['country'] = mb_strlen($country) > 3 ? mb_substr($country, 0, 120) : $batch['params']['country'];
    $lead['phone'] = preg_match('/\d{5}/', preg_replace('/\D/', '', $phone) ?? '') ? $phone : '';
    $lead['website'] = safe_url(clean_cell($row, 'website', 'web_site'));
    $lead['email'] = strtolower($emails[0] ?? '');
    $lead['googleMapsUrl'] = safe_url(clean_cell($row, 'link'));
    $lead['latitude'] = safe_float(clean_cell($row, 'latitude'), -90, 90);
    $lead['longitude'] = safe_float(clean_cell($row, 'longitude', 'longtitude'), -180, 180);
    $lead['rating'] = safe_float(clean_cell($row, 'review_rating', 'rating'), 0, 5);
    $reviews = clean_cell($row, 'review_count');
    $lead['reviewCount'] = is_numeric($reviews) ? max(0, (int) $reviews) : null;
    $lead['sourceId'] = mb_substr(clean_cell($row, 'place_id', 'data_id', 'cid'), 0, 200);
    $lead['fingerprint'] = lead_fingerprint($lead);
    $lead['source'] = 'discovery';
    $lead['sourceBatchId'] = $batch['id'];
    $lead['sourceQuery'] = $pass['query'];
    $lead['sourceLang'] = $pass['lang'];
    return $lead;
}

function import_discovery_rows(array &$state, array &$batch, array $rows, array $pass): void
{
    $id = $batch['id'];
    if (!isset($state['batchSeen'][$id]) || !is_array($state['batchSeen'][$id])) {
        $state['batchSeen'][$id] = [];
    }
    $seen = &$state['batchSeen'][$id];
    $index = LeadIndex::build($state['leads']);
    $leadPositions = index_by_id($state['leads']);
    $c = &$batch['counters'];
    $p = $batch['params'];

    foreach ($rows as $row) {
        if ($c['imported'] >= $p['target']) {
            break;
        }
        $lead = scraper_row_to_lead($row, $batch, $pass);
        $keys = array_values(array_filter([
            $lead['sourceId'] !== '' ? 's:' . $lead['sourceId'] : null,
            $lead['fingerprint'] !== '' ? 'f:' . $lead['fingerprint'] : null,
        ]));
        if (!$keys) {
            $keys = ['r:' . sha1(clean_cell($row, 'link') . '|' . clean_cell($row, 'address') . '|' . clean_cell($row, 'title'))];
        }
        // Same business seen earlier in this batch (another pass or language): not counted again.
        foreach ($keys as $key) {
            if (isset($seen[$key])) {
                continue 2;
            }
        }
        foreach ($keys as $key) {
            $seen[$key] = 1;
        }
        $c['checked']++;

        if ($lead['companyName'] === '') {
            $c['rejected']++;
            $c['rejectedInvalid']++;
            continue;
        }
        if ($p['noWebsite'] && $lead['website'] !== '') {
            $c['rejected']++;
            $c['rejectedWebsite']++;
            continue;
        }
        if ($p['requirePhone'] && $lead['phone'] === '') {
            $c['rejected']++;
            $c['rejectedPhone']++;
            continue;
        }
        $match = $index->match($lead);
        if ($match !== null) {
            $c['duplicates']++;
            [$existingId, $reason] = $match;
            if (isset($leadPositions[$existingId])) {
                record_duplicate_candidate($state, $state['leads'][$leadPositions[$existingId]], $lead, $reason, 'discovery');
            }
            continue;
        }
        if ($p['instagram'] && $lead['website'] !== '') {
            $lead['enrichment'] = ['instagram' => 'pending'];
        }
        $state['leads'][] = $lead;
        $leadPositions[$lead['id']] = count($state['leads']) - 1;
        $index->add($lead);
        $c['imported']++;
        add_activity($state, $lead['id'], 'imported', 'Imported from discovery: ' . $pass['query'] . ' (' . $pass['lang'] . ')', ['batchId' => $id]);
    }
}

/** Looks for an Instagram profile on the lead's website and records the outcome. */
function enrich_lead_instagram(Store $store, string $leadId): array
{
    $state = $store->read();
    $lead = null;
    foreach ($state['leads'] as $candidate) {
        if ($candidate['id'] === $leadId) {
            $lead = $candidate;
            break;
        }
    }
    if ($lead === null) {
        throw new ApiError('NOT_FOUND', 'Lead not found.', 404);
    }
    if ($lead['website'] === '') {
        throw new ApiError('VALIDATION_ERROR', 'This lead has no website to check.', 422);
    }
    $found = null;
    $error = null;
    try {
        $found = enrich_instagram_from_website($lead['website'])['instagram'];
    } catch (ApiError $e) {
        $error = $e->getMessage();
    }
    return $store->mutate(function (array &$state) use ($leadId, $found, $error) {
        foreach ($state['leads'] as $i => $lead) {
            if ($lead['id'] !== $leadId) {
                continue;
            }
            $enrichment = is_array($lead['enrichment'] ?? null) ? $lead['enrichment'] : [];
            $enrichment['instagram'] = $error ? 'failed' : ($found ? 'found' : 'not_found');
            $enrichment['instagramCheckedAt'] = now_iso();
            $state['leads'][$i]['enrichment'] = $enrichment;
            if ($found && $lead['instagram'] === '') {
                $state['leads'][$i]['instagram'] = $found;
                $state['leads'][$i]['updatedAt'] = now_iso();
                add_activity($state, $leadId, 'enriched', 'Instagram found on website: ' . $found);
            } elseif ($error) {
                add_activity($state, $leadId, 'enriched', 'Instagram lookup failed: ' . $error);
            } elseif (!$found) {
                add_activity($state, $leadId, 'enriched', 'No Instagram link found on the website.');
            }
            return ['instagram' => $found ?: $lead['instagram'], 'status' => $enrichment['instagram'], 'error' => $error];
        }
        return ['instagram' => null, 'status' => 'failed', 'error' => 'Lead was deleted.'];
    });
}
