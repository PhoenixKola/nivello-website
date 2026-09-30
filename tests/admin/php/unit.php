<?php
// PHP-level checks for failure modes that are awkward to trigger over HTTP.
// Run: php tests/admin/php/unit.php   (prints JSON, exits 1 on failure)
declare(strict_types=1);

$tmp = sys_get_temp_dir() . '/nivello-admin-unit-' . bin2hex(random_bytes(4));
mkdir($tmp, 0770, true);
putenv('NIVELLO_ADMIN_DATA_DIR=' . $tmp . '/data');
putenv('NIVELLO_ENRICH_ALLOW_PRIVATE');

define('NIVELLO_ADMIN', true);
require __DIR__ . '/../../../public/admin-api/_bootstrap.php';
require __DIR__ . '/../../../public/admin-api/_discovery.php';

$results = [];
function check(string $name, callable $fn): void
{
    global $results;
    try {
        $fn();
        $results[] = ['name' => $name, 'ok' => true];
    } catch (Throwable $e) {
        $results[] = ['name' => $name, 'ok' => false, 'error' => get_class($e) . ': ' . $e->getMessage()];
    }
}
function ensure(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}
function store_at(string $dir): Store
{
    $class = new ReflectionClass(Store::class);
    $store = $class->newInstanceWithoutConstructor();
    $class->getConstructor()->invoke($store, $dir);
    return $store;
}
function expect_api_error(callable $fn, string $code): ApiError
{
    try {
        $fn();
    } catch (ApiError $e) {
        ensure($e->errorCode === $code, "expected $code, got {$e->errorCode}");
        return $e;
    }
    throw new RuntimeException("expected ApiError $code");
}

// ── Storage ─────────────────────────────────────────────────────────────────

check('fresh store initializes empty and writes atomically with a first backup', function () use ($tmp) {
    $dir = "$tmp/s1";
    $store = store_at($dir);
    ensure($store->read()['leads'] === [], 'empty leads');
    $store->mutate(function (array &$s) {
        $s['leads'][] = ['id' => 'lead_0000000000000001'];
    });
    ensure(count($store->read()['leads']) === 1, 'lead persisted');
    ensure(count(glob("$dir/backups/store-*.json")) === 1, 'first mutation creates a backup');
    ensure(glob("$dir/store.json.tmp-*") === [], 'no temp files left');
});

check('mutations that change nothing do not rewrite the file', function () use ($tmp) {
    $store = store_at("$tmp/s1");
    $before = filemtime("$tmp/s1/store.json") . hash_file('sha1', "$tmp/s1/store.json");
    clearstatcache();
    $store->mutate(function (array &$s, bool &$dirty) {
        $dirty = false;
    });
    clearstatcache();
    ensure($before === filemtime("$tmp/s1/store.json") . hash_file('sha1', "$tmp/s1/store.json"), 'file unchanged');
});

check('an interrupted write (leftover temp file) never affects reads', function () use ($tmp) {
    file_put_contents("$tmp/s1/store.json.tmp-deadbeef", '{"leads": [trunc');
    ensure(count(store_at("$tmp/s1")->read()['leads']) === 1, 'live file still valid');
});

check('corrupted JSON is preserved and recovered from the latest backup', function () use ($tmp) {
    $dir = "$tmp/s1";
    file_put_contents("$dir/store.json", '{"leads": [ BROKEN');
    $state = store_at($dir)->read();
    ensure(count($state['leads']) === 1, 'restored data');
    ensure(($state['settings']['lastRecovery']['reason'] ?? '') === 'corrupt', 'recovery recorded');
    $preserved = glob("$dir/corrupt/store-*.json");
    ensure(count($preserved) === 1 && str_contains(file_get_contents($preserved[0]), 'BROKEN'), 'bad file preserved');
});

check('corruption without any backup is never replaced by an empty state', function () use ($tmp) {
    $dir = "$tmp/s2";
    mkdir("$dir/backups", 0770, true);
    file_put_contents("$dir/store.json", 'NOT JSON AT ALL');
    expect_api_error(fn () => store_at($dir)->read(), 'STORE_CORRUPT');
    ensure(file_get_contents("$dir/store.json") === 'NOT JSON AT ALL', 'damaged file left untouched');
    ensure(count(glob("$dir/corrupt/store-*.json")) === 1, 'copy preserved');
});

check('a missing data file is restored from backups instead of starting empty', function () use ($tmp) {
    unlink("$tmp/s1/store.json");
    ensure(count(store_at("$tmp/s1")->read()['leads']) === 1, 'restored after deletion');
});

check('an unusable data directory produces a clear storage error', function () use ($tmp) {
    file_put_contents("$tmp/not-a-dir", 'x');
    expect_api_error(fn () => store_at("$tmp/not-a-dir/data")->read(), 'STORAGE_UNAVAILABLE');
});

check('backups rotate and keep the most recent ' . BACKUP_KEEP, function () use ($tmp) {
    $dir = "$tmp/s3";
    $store = store_at($dir);
    $store->mutate(function (array &$s) {
        $s['settings']['seeded'] = true;
    });
    for ($i = 0; $i < BACKUP_KEEP + 4; $i++) {
        touch(sprintf('%s/backups/store-20200101-%06d.json', $dir, $i));
    }
    $store->backupNow();
    ensure(count(glob("$dir/backups/store-*.json")) === BACKUP_KEEP, 'rotation');
});

// ── Session expiry ──────────────────────────────────────────────────────────

check('an idle session expires and reports SESSION_EXPIRED', function () use ($tmp) {
    ini_set('session.save_path', $tmp);
    ob_start();
    session_id('unittestsession01');
    admin_session_start();
    $_SESSION = ['auth' => true, 'loginAt' => time() - 100, 'lastSeen' => time() - SESSION_IDLE_SECONDS - 5, 'csrf' => 'x'];
    session_write_close();
    $session = current_session();
    ensure($session['expired'] === true && $session['authenticated'] === false, 'expired');
    expect_api_error(fn () => require_auth(), 'UNAUTHENTICATED');
    ob_end_clean();
});

// ── SSRF & Instagram ────────────────────────────────────────────────────────

check('enrichment refuses private, loopback, link-local, CGNAT and non-web targets', function () {
    foreach (['http://localhost/', 'http://127.0.0.1/', 'http://10.1.2.3/', 'http://192.168.1.10/', 'http://169.254.169.254/latest', 'http://100.64.0.9/', 'http://[::1]/', 'ftp://example.com/', 'http://example.com:8080/', 'http://user:pw@example.com/'] as $url) {
        try {
            safe_fetch_target($url);
            throw new RuntimeException("not blocked: $url");
        } catch (ApiError $e) {
            ensure($e->errorCode === 'ENRICH_BLOCKED', "$url blocked with {$e->errorCode}");
        }
    }
    ensure(safe_fetch_target('http://8.8.8.8/')['ip'] === '8.8.8.8', 'public literal allowed');
});

check('Instagram extraction skips post links and normalizes profiles', function () {
    $html = '<a href="https://instagram.com/p/abc/">post</a><a href="https://www.instagram.com/nivello.studio?hl=en">IG</a>';
    ensure(extract_instagram($html) === 'https://www.instagram.com/nivello.studio/', 'profile found');
    ensure(extract_instagram('<a href="https://instagram.com/explore/">x</a>') === null, 'reserved ignored');
    ensure(normalize_instagram_input('@studio_1') === 'https://www.instagram.com/studio_1/', 'handle normalized');
});

// ── Plan, score, CSV ────────────────────────────────────────────────────────

check('search plans are finite, deduplicated and rotate languages', function () {
    $base = ['country' => 'Albania', 'city' => 'Tirana', 'category' => 'dentist', 'target' => 10, 'languages' => ['en'], 'noWebsite' => false, 'requirePhone' => false, 'email' => false, 'instagram' => false];
    $one = build_plan($base);
    ensure(count($one) === 33, 'specific plan size ' . count($one));
    $two = build_plan(['languages' => ['en', 'it']] + $base);
    ensure(count($two) === 66 && $two[0]['lang'] === 'en' && $two[1]['lang'] === 'it', 'language rotation');
    $keys = array_map(fn ($p) => $p['query'] . '|' . $p['lang'] . '|' . $p['depth'], $two);
    ensure(count($keys) === count(array_unique($keys)), 'no duplicate specs');
    ensure(array_column($two, 'index') === range(0, 65), 'stable indexes');
    $broad = build_plan(['category' => ''] + $base);
    ensure(count($broad) === count(BROAD_CATEGORIES) * 4, 'broad plan size');
    ensure(!str_contains(implode(' ', array_column($broad, 'query')), 'businesses'), 'no literal "businesses" searches');
    ensure(build_plan($base) === $one, 'deterministic');
});

check('opportunity score is deterministic and explained', function () {
    $lead = blank_lead();
    $lead['phone'] = '+355 69 123 4567';
    $lead['reviewCount'] = 25;
    $score = lead_score($lead, 1_700_000_000);
    $labels = array_column($score['reasons'], 'label');
    ensure(in_array('Phone available', $labels, true) && in_array('No website', $labels, true) && in_array('No email', $labels, true), 'reasons');
    ensure($score['score'] === 40 + 15 - 4 + 12 + 8, 'score value ' . $score['score']);
    ensure(lead_score($lead, 1_700_000_000) === $score, 'deterministic');
});

check('a complete business profile is a transparent score reason', function () {
    $lead = blank_lead();
    $lead['phone'] = '+355 69 123 4567';
    $base = lead_score($lead, 1_700_000_000)['score'];
    $lead['category'] = 'Dentist';
    $lead['address'] = 'Rruga 1';
    $lead['city'] = 'Tirana';
    $score = lead_score($lead, 1_700_000_000);
    ensure(in_array('Complete business profile', array_column($score['reasons'], 'label'), true), 'reason listed');
    ensure($score['score'] === $base + 5, 'adds 5 points');
});

check('lead filters: follow-up buckets, minimum score, phone and created dates', function () {
    $now = strtotime('2026-03-10T12:00:00Z');
    $make = function (string $id, ?string $followUpAt, array $extra = []) {
        $lead = array_merge(blank_lead(), ['id' => $id, 'companyName' => $id, 'followUpAt' => $followUpAt, 'createdAt' => '2026-03-01T10:00:00Z'], $extra);
        return $lead;
    };
    $leads = [
        $make('overdue', '2026-03-09T09:00:00Z'),
        $make('today', '2026-03-10T15:00:00Z', ['phone' => '+39 010 555 1234']),
        $make('upcoming', '2026-03-12T09:00:00Z'),
        $make('none', null),
        $make('done', '2026-03-09T09:00:00Z', ['followUpCompletedAt' => '2026-03-09T10:00:00Z']),
    ];
    $ids = function (array $filters, int $tz = 0) use ($leads, $now) {
        $f = parse_lead_filters($filters);
        return array_column(array_values(array_filter($leads, fn ($l) => lead_matches($l, $f, $now, $tz))), 'id');
    };
    ensure($ids(['followUp' => 'overdue']) === ['overdue'], 'overdue');
    ensure($ids(['followUp' => 'today']) === ['today'], 'today');
    ensure($ids(['followUp' => 'upcoming']) === ['upcoming'], 'upcoming');
    ensure($ids(['followUp' => 'none']) === ['none', 'done'], 'none includes completed');
    ensure($ids(['hasPhone' => '1']) === ['today'], 'has phone');
    ensure($ids(['minScore' => '60']) === ['today'], 'min score ' . json_encode(array_map(fn ($l) => lead_score($l, $now)['score'], $leads)));
    ensure($ids(['createdFrom' => '2026-03-02']) === [] && count($ids(['createdTo' => '2026-03-01'])) === 5, 'created range is inclusive by day');
    // 15:00 UTC is already "tomorrow" in UTC+10 (offset -600), so it is no longer due today there.
    ensure($ids(['followUp' => 'today'], -600) === [], 'timezone decides today');
    ensure(parse_lead_filters(['followUp' => 'bogus', 'minScore' => '500', 'createdFrom' => '2026-02-31'])['followUp'] === '' && parse_lead_filters(['minScore' => '500'])['minScore'] === 100 && parse_lead_filters(['createdFrom' => '2026-02-31'])['createdFrom'] === '', 'invalid filters are dropped');
});

check('agenda places each dated record once, on the right local day', function () {
    require_once __DIR__ . '/../../../public/admin-api/_agenda.php';
    $now = strtotime('2026-03-10T12:00:00Z');
    $state = Store::emptyState();
    $lead = array_merge(blank_lead(), ['companyName' => 'Studio Rossi', 'followUpAt' => '2026-03-10T23:30:00Z']);
    $project = array_merge(blank_project(), ['name' => 'Aurora site', 'clientName' => 'Aurora Fitness', 'stage' => 'development', 'targetDate' => '2026-03-14']);
    $project['tasks'] = [
        ['id' => 'task_' . str_repeat('a', 16), 'title' => 'Deploy production', 'status' => 'todo', 'dueDate' => '2026-03-09', 'milestoneId' => null],
        ['id' => 'task_' . str_repeat('b', 16), 'title' => 'Old done task', 'status' => 'done', 'dueDate' => '2026-03-08', 'milestoneId' => null],
    ];
    $project['milestones'] = [['id' => 'pms_' . str_repeat('c', 16), 'title' => 'Launch', 'status' => 'in_progress', 'dueDate' => '2026-03-12']];
    $proposal = array_merge(blank_proposal(), ['number' => 'NIV-2026-001', 'title' => 'Website', 'status' => 'sent', 'validUntil' => '2026-03-13', 'clientCompany' => 'Client X']);
    $state['leads'][] = $lead;
    $state['projects'][] = $project;
    $state['proposals'][] = $proposal;
    $state['calendarEvents'][] = ['id' => 'evt_' . str_repeat('d', 16)] + calendar_event_fields(['title' => 'Trade fair', 'allDay' => true, 'start' => '2026-03-11', 'end' => '2026-03-13']) + ['createdAt' => now_iso(), 'updatedAt' => now_iso()];
    $state['calendarEvents'][] = ['id' => 'evt_' . str_repeat('e', 16)] + calendar_event_fields(['title' => 'Call accountant', 'allDay' => false, 'start' => '2026-03-10T14:00:00Z']) + ['createdAt' => now_iso(), 'updatedAt' => now_iso()];

    $items = agenda_items($state, '2026-03-01', '2026-03-31', 0, $now);
    $byId = array_column($items, null, 'id');
    ensure(count($items) === count($byId), 'ids are unique');
    ensure($byId['lead:' . $lead['id']]['date'] === '2026-03-10' && !$byId['lead:' . $lead['id']]['allDay'], 'follow-up on its UTC day');
    ensure(in_array('lead:' . $lead['id'], array_column(agenda_items($state, '2026-03-11', '2026-03-11', -60, $now), 'id'), true), 'follow-up moves to the next local day in UTC+1');
    ensure($byId['task:task_' . str_repeat('a', 16)]['date'] === '2026-03-09' && $byId['task:task_' . str_repeat('a', 16)]['link'] === ['type' => 'project', 'id' => $project['id'], 'tab' => 'tasks'], 'task links to its project tab');
    ensure($byId['task:task_' . str_repeat('b', 16)]['done'] === true, 'done task flagged');
    ensure($byId['milestone:pms_' . str_repeat('c', 16)]['link']['tab'] === 'milestones', 'milestone link');
    ensure($byId['project:' . $project['id']]['date'] === '2026-03-14', 'project target');
    ensure($byId['proposal:' . $proposal['id']]['link'] === ['type' => 'proposal', 'id' => $proposal['id'], 'tab' => null], 'proposal expiry link');
    ensure($byId['event:evt_' . str_repeat('d', 16)]['endDate'] === '2026-03-13' && $byId['event:evt_' . str_repeat('d', 16)]['allDay'], 'multi-day all-day event');
    ensure(count(agenda_items($state, '2026-03-15', '2026-03-31', 0, $now)) === 0, 'range excludes other days');

    $attention = overview_attention($state, [['id' => 'mon_' . str_repeat('f', 16), 'name' => 'Main site', 'state' => 'down', 'last' => ['error' => 'Timed out'], 'warnings' => []]], $now, 0);
    $urgency = array_column($attention, 'urgency', 'id');
    ensure(count($attention) === count($urgency), 'attention has no duplicates');
    ensure($urgency['task:task_' . str_repeat('a', 16)] === 'overdue', 'overdue task');
    ensure($urgency['lead:' . $lead['id']] === 'today', 'follow-up today');
    ensure($urgency['event:evt_' . str_repeat('e', 16)] === 'today', 'manual event today');
    ensure($urgency['proposal:' . $proposal['id']] === 'soon' && $urgency['project:' . $project['id']] === 'soon', 'expiring proposal and due project');
    ensure($urgency['health:mon_' . str_repeat('f', 16)] === 'issue', 'site down');
    ensure(!isset($urgency['task:task_' . str_repeat('b', 16)]) && !isset($urgency['milestone:pms_' . str_repeat('c', 16)]), 'done and non-urgent items stay out');
    ensure(array_key_first($urgency) === 'task:task_' . str_repeat('a', 16), 'overdue first');

    $upcoming = array_column(overview_upcoming($state, array_keys($urgency), $now, 0), 'id');
    ensure(in_array('milestone:pms_' . str_repeat('c', 16), $upcoming, true) && in_array('event:evt_' . str_repeat('d', 16), $upcoming, true), 'upcoming lists future items');
    ensure(!array_intersect($upcoming, array_keys($urgency)), 'upcoming never repeats attention items');
});

check('calendar events validate dates, order, length and text', function () {
    require_once __DIR__ . '/../../../public/admin-api/_agenda.php';
    expect_api_error(fn () => calendar_event_fields(['title' => '', 'start' => '2026-03-10']), 'VALIDATION_ERROR');
    expect_api_error(fn () => calendar_event_fields(['title' => 'X', 'allDay' => true, 'start' => '2026-03-10T10:00:00Z']), 'VALIDATION_ERROR');
    expect_api_error(fn () => calendar_event_fields(['title' => 'X', 'allDay' => true, 'start' => '2026-03-10', 'end' => '2026-03-09']), 'VALIDATION_ERROR');
    expect_api_error(fn () => calendar_event_fields(['title' => 'X', 'allDay' => false, 'start' => '2026-03-10T10:00:00Z', 'end' => '2028-03-10T10:00:00Z']), 'VALIDATION_ERROR');
    expect_api_error(fn () => calendar_event_fields(['title' => 'X', 'start' => '2026-03-10', 'category' => 'party']), 'VALIDATION_ERROR');
    expect_api_error(fn () => calendar_event_fields(['title' => str_repeat('x', 161), 'start' => '2026-03-10']), 'VALIDATION_ERROR');
    $timed = calendar_event_fields(['title' => ' Call ', 'allDay' => false, 'start' => '2026-03-10T10:00:00+01:00', 'end' => '2026-03-10T10:00:00+01:00']);
    ensure($timed['start'] === '2026-03-10T09:00:00Z' && $timed['end'] === null && $timed['title'] === 'Call', 'normalized timed event');
});

check('CSV export cells are protected against formula injection', function () {
    ensure(csv_safe('=SUM(A1)') === "'=SUM(A1)" && csv_safe('+1') === "'+1" && csv_safe('@x') === "'@x" && csv_safe('Acme') === 'Acme', 'escaping');
});

check('the access code comes from server secrets (hash preferred) and is never in the repository', function () {
    ensure(!defined('ADMIN_ACCESS_CODE'), 'no hardcoded access code constant');
    putenv('NIVELLO_ADMIN_ACCESS_CODE');
    putenv('NIVELLO_ADMIN_ACCESS_CODE_HASH=' . password_hash('correct horse battery', PASSWORD_DEFAULT));
    ensure(access_code_configured() && access_code_matches('correct horse battery') && !access_code_matches('wrong code'), 'hash verification');
    putenv('NIVELLO_ADMIN_ACCESS_CODE_HASH');
    putenv('NIVELLO_ADMIN_ACCESS_CODE=plain-secret-123');
    ensure(access_code_matches('plain-secret-123') && !access_code_matches('plain-secret-12'), 'plain fallback');
    putenv('NIVELLO_ADMIN_ACCESS_CODE=short');
    ensure(!access_code_configured() && !access_code_matches('short'), 'too-short codes are refused');
    putenv('NIVELLO_ADMIN_ACCESS_CODE');
});

check('IP-to-country lookup covers IPv4, IPv6 and mapped addresses and ignores private ranges', function () {
    require_once __DIR__ . '/../../../public/admin-api/_geoip.php';
    ensure(ip_country('79.106.0.1') === 'AL', 'Albanian IPv4');
    ensure(ip_country('::ffff:79.106.0.1') === 'AL', 'IPv4-mapped IPv6');
    ensure(ip_country('2.36.0.1') === 'IT', 'Italian IPv4');
    ensure(ip_country('2a02:e00::1') === 'DE', 'IPv6');
    foreach (['127.0.0.1', '192.168.1.1', '10.0.0.5', '::1', 'fd00::1', 'not-an-ip'] as $ip) {
        ensure(ip_country($ip) === null, "$ip has no country");
    }
});

// ── Operations suite ───────────────────────────────────────────────────────

require_once __DIR__ . '/../../../public/admin-api/_health.php';

check('IPv4-mapped, NAT64 and multicast addresses are not treated as public', function () {
    foreach (['::ffff:127.0.0.1', '::ffff:10.0.0.1', '64:ff9b::7f00:1', '::127.0.0.1', '224.0.0.1', 'ff02::1', 'fd00:ec2::254', '169.254.169.254'] as $ip) {
        ensure(!ip_is_public($ip), "$ip must be blocked");
    }
    foreach (['8.8.8.8', '::ffff:8.8.8.8', '2606:4700::1111'] as $ip) {
        ensure(ip_is_public($ip), "$ip must be allowed");
    }
});

check('document stores keep scalar counters and reject wrong types', function () use ($tmp) {
    $class = new ReflectionClass(Store::class);
    $doc = $class->newInstanceWithoutConstructor();
    $class->getConstructor()->invoke($doc, "$tmp/doc", 'counts', fn () => ['total' => 0, 'map' => []], false);
    $doc->mutate(function (array &$s) {
        $s['total'] += 3;
        $s['map']['a'] = 1;
    });
    ensure($doc->read()['total'] === 3, 'integer counter persisted');
    file_put_contents("$tmp/doc/counts.json", json_encode(['total' => 'x', 'map' => ['b' => 2]]));
    $read = $doc->read();
    ensure($read['total'] === 0 && $read['map'] === ['b' => 2], 'wrong-typed scalar falls back to the default');
});

check('site health opens one incident per outage and resolves it on recovery', function () {
    $state = health_blank();
    $monitor = new_monitor(['name' => 'Site', 'url' => 'https://example.com', 'expectedStatus' => 200, 'enabled' => true, 'notes' => '']);
    $state['monitors'][] = $monitor;
    $at = fn (int $minutesAgo) => now_iso(time() - $minutesAgo * 60);
    health_record_check($state, $monitor['id'], health_normalize_check($monitor, ['status' => 200, 'ms' => 120, 'at' => $at(30)], 'scheduled'));
    health_record_check($state, $monitor['id'], health_normalize_check($monitor, ['status' => 503, 'ms' => 80, 'at' => $at(20)], 'scheduled'));
    health_record_check($state, $monitor['id'], health_normalize_check($monitor, ['status' => 0, 'error' => 'Timed out', 'at' => $at(10)], 'scheduled'));
    ensure(count($state['incidents']) === 1 && $state['incidents'][0]['failedChecks'] === 2, 'one incident, two failed checks');
    ensure($state['incidents'][0]['cause'] === 'HTTP 503 (expected 200)', 'cause recorded');
    $view = health_view($state, $state['monitors'][0]);
    ensure($view['state'] === 'down' && $view['consecutiveFailures'] === 2 && $view['openIncident'], 'down while failing');
    ensure($view['uptime'] === 33.33, 'uptime from collected checks: ' . $view['uptime']);

    // A late, older success must not flip the current state.
    health_record_check($state, $monitor['id'], health_normalize_check($monitor, ['status' => 200, 'at' => $at(25)], 'scheduled'));
    ensure(health_view($state, $state['monitors'][0])['state'] === 'down', 'late result ignored for state');

    health_record_check($state, $monitor['id'], health_normalize_check($monitor, ['status' => 200, 'ms' => 4200, 'at' => $at(1), 'ssl' => ['expiresAt' => now_iso(time() + 5 * 86400)]], 'manual'));
    $view = health_view($state, $state['monitors'][0]);
    ensure($state['incidents'][0]['resolvedAt'] !== null, 'incident resolved');
    ensure($view['state'] === 'warning' && count($view['warnings']) === 2, 'slow + SSL expiry warnings');
    ensure(count($state['checks'][$monitor['id']]) === 5, 'history kept');
});

// cleanup
$it =new RecursiveIteratorIterator(new RecursiveDirectoryIterator($tmp, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
foreach ($it as $file) {
    $file->isDir() ? @rmdir($file->getPathname()) : @unlink($file->getPathname());
}
@rmdir($tmp);

$failed = array_values(array_filter($results, fn ($r) => !$r['ok']));
echo json_encode(['total' => count($results), 'failed' => $failed, 'results' => $results], JSON_PRETTY_PRINT), "\n";
exit($failed ? 1 : 0);
