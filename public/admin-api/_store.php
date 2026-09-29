<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

/**
 * JSON document store with an exclusive lock around every mutation and atomic
 * temp-file + rename writes, so readers never see half-written JSON.
 * The main CRM document is store.json (with rotating backups); other tools use
 * named documents such as analytics/2026-09-29.json through Store::document().
 */
final class Store
{
    public const SCHEMA_VERSION = 1;

    private static ?Store $instance = null;
    /** @var array<string, Store> */
    private static array $documents = [];

    private string $file;
    private string $lockFile;
    private string $backupDir;
    private string $corruptDir;
    /** @var resource|null */
    private $lock = null;
    private int $lockDepth = 0;
    private ?Closure $blank;

    private function __construct(private string $dir, private string $name = 'store', ?Closure $blank = null, private bool $withBackups = true)
    {
        $this->file = $dir . '/' . $name . '.json';
        $this->lockFile = $dir . '/' . $name . '.lock';
        $this->backupDir = $dir . '/backups';
        $this->corruptDir = $dir . '/corrupt';
        $this->blank = $blank;
    }

    public static function instance(): Store
    {
        return self::$instance ??= new Store(ADMIN_DATA_DIR);
    }

    /**
     * A separate JSON document under the data directory, e.g. "analytics/2026-09-29".
     * $blank returns the initial content. Documents without backups never replace a
     * corrupted file: it is preserved and an error is raised instead.
     */
    public static function document(string $relative, Closure $blank, bool $withBackups = false): Store
    {
        if (!preg_match('~^[a-z0-9_-]+(/[A-Za-z0-9_-]+)*$~', $relative)) {
            throw new ApiError('STORAGE_ERROR', 'Invalid document name.', 500);
        }
        $dir = str_contains($relative, '/') ? ADMIN_DATA_DIR . '/' . dirname($relative) : ADMIN_DATA_DIR;
        return self::$documents[$relative] ??= new Store($dir, basename($relative), $blank, $withBackups);
    }

    public function exists(): bool
    {
        return is_file($this->file);
    }

    public static function emptyState(): array
    {
        return [
            'schemaVersion' => self::SCHEMA_VERSION,
            'leads' => [],
            'notes' => [],
            'activities' => [],
            'batches' => [],
            'batchSeen' => [],
            'tags' => [],
            'savedViews' => [],
            'duplicateCandidates' => [],
            'inbox' => [],
            'projects' => [],
            'proposals' => [],
            'opsActivities' => [],
            'counters' => [],
            'settings' => [],
        ];
    }

    public function dir(): string
    {
        return $this->dir;
    }

    public function ensureDir(): void
    {
        foreach ($this->withBackups ? [$this->dir, $this->backupDir] : [$this->dir] as $path) {
            if (!is_dir($path) && !@mkdir($path, 0770, true) && !is_dir($path)) {
                throw new ApiError('STORAGE_UNAVAILABLE', 'The admin data directory does not exist and could not be created. See docs/NIVELLO-ADMIN-DEPLOYMENT.md.', 503);
            }
        }
        if (!is_writable($this->dir)) {
            throw new ApiError('STORAGE_UNAVAILABLE', 'The admin data directory is not writable by PHP.', 503);
        }
    }

    public function read(): array
    {
        $this->ensureDir();
        $this->acquire(LOCK_SH);
        try {
            $state = $this->load();
        } catch (StoreNeedsRecovery) {
            $this->release();
            // Recovery rewrites the file, which needs the exclusive lock.
            return $this->mutate(function (array &$state, bool &$dirty) {
                $dirty = false;
                return $state;
            });
        }
        $this->release();
        return $state;
    }

    /**
     * $fn receives the state by reference and a $dirty flag (default true).
     * Setting $dirty = false skips the write when nothing changed.
     */
    public function mutate(callable $fn): mixed
    {
        $this->ensureDir();
        $this->acquire(LOCK_EX);
        try {
            try {
                $state = $this->load();
            } catch (StoreNeedsRecovery $e) {
                $state = $this->recover($e->getMessage());
            }
            $dirty = true;
            $result = $fn($state, $dirty);
            if ($dirty) {
                $this->write($state);
                $this->maybeBackup($state);
            }
            return $result;
        } finally {
            $this->release();
        }
    }

    public function backupNow(): string
    {
        return $this->mutate(function (array &$state, bool &$dirty) {
            $name = $this->createBackup();
            $state['settings']['lastBackupAt'] = now_iso();
            return $name;
        });
    }

    public function info(): array
    {
        $backups = $this->listBackups();
        return [
            'writable' => is_dir($this->dir) && is_writable($this->dir),
            'fileSize' => is_file($this->file) ? (int) filesize($this->file) : 0,
            'backupCount' => count($backups),
            'lastBackupFile' => $backups ? basename($backups[0]) : null,
            'lastBackupAt' => $backups ? now_iso((int) filemtime($backups[0])) : null,
        ];
    }

    // ── internals ───────────────────────────────────────────────────────────

    private function acquire(int $mode): void
    {
        if ($this->lockDepth > 0) {
            $this->lockDepth++;
            return;
        }
        $handle = @fopen($this->lockFile, 'c');
        if ($handle === false) {
            throw new ApiError('STORAGE_UNAVAILABLE', 'Could not open the storage lock file.', 503);
        }
        if (!flock($handle, $mode)) {
            fclose($handle);
            throw new ApiError('STORAGE_UNAVAILABLE', 'Could not lock the data file.', 503);
        }
        $this->lock = $handle;
        $this->lockDepth = 1;
    }

    private function release(): void
    {
        if ($this->lockDepth === 0) {
            return;
        }
        $this->lockDepth--;
        if ($this->lockDepth === 0 && $this->lock) {
            flock($this->lock, LOCK_UN);
            fclose($this->lock);
            $this->lock = null;
        }
    }

    private function blankState(): array
    {
        return $this->blank ? ($this->blank)() : self::emptyState();
    }

    private function load(): array
    {
        if (!is_file($this->file)) {
            if ($this->withBackups && $this->listBackups()) {
                throw new StoreNeedsRecovery('missing');
            }
            return $this->blankState();
        }
        $raw = file_get_contents($this->file);
        $state = $raw === false ? null : $this->decode($raw);
        if ($state === null) {
            throw new StoreNeedsRecovery('corrupt');
        }
        return $state;
    }

    /** Returns a normalized state array, or null if the JSON is unusable. */
    private function decode(string $raw): ?array
    {
        $data = json_decode($raw, true, 512, JSON_BIGINT_AS_STRING);
        if (!is_array($data)) {
            return null;
        }
        if ($this->blank === null && (!isset($data['leads']) || !is_array($data['leads']))) {
            return null;
        }
        $state = $this->blankState();
        foreach ($state as $key => $default) {
            if ($key === 'schemaVersion') {
                continue;
            }
            if (!isset($data[$key])) {
                continue;
            }
            // Keep a stored value only when its type matches the blank default.
            if (is_array($default) ? is_array($data[$key]) : get_debug_type($data[$key]) === get_debug_type($default)) {
                $state[$key] = $data[$key];
            }
        }
        return $state;
    }

    private function recover(string $reason): array
    {
        $preserved = null;
        if ($reason === 'corrupt' && is_file($this->file)) {
            if (!is_dir($this->corruptDir)) {
                @mkdir($this->corruptDir, 0770, true);
            }
            $preserved = 'corrupt/' . $this->name . '-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json';
            if (!@copy($this->file, $this->dir . '/' . $preserved)) {
                throw new ApiError('STORE_CORRUPT', 'The data file is corrupted and could not be preserved. No changes were made.', 500);
            }
        }
        foreach ($this->withBackups ? $this->listBackups() : [] as $backup) {
            $raw = file_get_contents($backup);
            $state = $raw === false ? null : $this->decode($raw);
            if ($state !== null) {
                $state['settings']['lastRecovery'] = [
                    'at' => now_iso(),
                    'reason' => $reason,
                    'restoredFrom' => basename($backup),
                    'preservedAs' => $preserved,
                ];
                $this->write($state);
                error_log('[nivello-admin] store ' . $reason . '; restored from ' . basename($backup));
                return $state;
            }
        }
        // Never replace a damaged file with an empty state.
        throw new ApiError(
            'STORE_CORRUPT',
            $reason === 'missing'
                ? 'The data file is missing and no valid backup could be restored.'
                : 'The data file ' . $this->name . ' is corrupted and no valid backup was found. The damaged file was left in place' . ($preserved ? " and copied to $preserved" : '') . '.',
            500
        );
    }

    private function write(array $state): void
    {
        if ($this->blank === null) {
            $state['schemaVersion'] = self::SCHEMA_VERSION;
        }
        $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) {
            throw new ApiError('STORAGE_ERROR', 'Could not encode data.', 500);
        }
        foreach (glob($this->file . '.tmp-*') ?: [] as $stale) {
            if (filemtime($stale) < time() - 300) {
                @unlink($stale);
            }
        }
        $tmp = $this->file . '.tmp-' . bin2hex(random_bytes(6));
        $handle = @fopen($tmp, 'x');
        if ($handle === false) {
            throw new ApiError('STORAGE_UNAVAILABLE', 'Could not write to the data directory.', 503);
        }
        $written = fwrite($handle, $json);
        $flushed = fflush($handle);
        if (function_exists('fsync')) {
            @fsync($handle);
        }
        fclose($handle);
        if ($written !== strlen($json) || !$flushed || !self::replace($tmp, $this->file)) {
            @unlink($tmp);
            throw new ApiError('STORAGE_ERROR', 'Could not save data. The previous version is unchanged.', 500);
        }
    }

    /**
     * Atomic rename with a short retry: on Windows a virus scanner or indexer can hold the freshly
     * written target for a moment, which makes rename() fail transiently. POSIX renames succeed first time.
     */
    private static function replace(string $from, string $to): bool
    {
        for ($attempt = 0; $attempt < 8; $attempt++) {
            if (@rename($from, $to)) {
                return true;
            }
            usleep(25000 * ($attempt + 1));
        }
        return false;
    }

    private function maybeBackup(array &$state): void
    {
        if (!$this->withBackups) {
            return;
        }
        $last = iso_to_ts($state['settings']['lastBackupAt'] ?? null) ?? 0;
        if (time() - $last < BACKUP_MIN_INTERVAL_SECONDS) {
            return;
        }
        $this->createBackup();
        $state['settings']['lastBackupAt'] = now_iso();
        $this->write($state);
    }

    private function createBackup(): string
    {
        if (!is_file($this->file)) {
            $this->write($this->blankState());
        }
        $name = $this->name . '-' . gmdate('Ymd-His') . '.json';
        if (!@copy($this->file, $this->backupDir . '/' . $name)) {
            throw new ApiError('STORAGE_ERROR', 'Could not create a backup.', 500);
        }
        foreach (array_slice($this->listBackups(), BACKUP_KEEP) as $old) {
            @unlink($old);
        }
        return $name;
    }

    /** Newest first. */
    private function listBackups(): array
    {
        $files = glob($this->backupDir . '/' . $this->name . '-*.json') ?: [];
        rsort($files, SORT_STRING);
        return $files;
    }
}

final class StoreNeedsRecovery extends RuntimeException
{
}

/** Small helpers for list-of-records collections. */
function index_by_id(array $records): array
{
    $index = [];
    foreach ($records as $i => $record) {
        if (isset($record['id'])) {
            $index[$record['id']] = $i;
        }
    }
    return $index;
}

/** Activity for inbox items, projects and proposals (lead activity keeps its own log). */
function add_ops_activity(array &$state, string $entity, string $entityId, string $type, string $message, array $meta = []): void
{
    $state['opsActivities'][] = [
        'id' => new_id('act'),
        'entity' => $entity,
        'entityId' => $entityId,
        'type' => $type,
        'message' => $message,
        'meta' => $meta ?: new stdClass(),
        'at' => now_iso(),
    ];
    $overflow = count($state['opsActivities']) - 20000;
    if ($overflow > 0) {
        array_splice($state['opsActivities'], 0, $overflow);
    }
}

/** Clears references to deleted leads from the operations records (they keep their own data). */
function detach_leads(array &$state, array $drop): void
{
    foreach (['inbox', 'projects', 'proposals'] as $collection) {
        foreach ($state[$collection] as &$record) {
            if (isset($record['leadId']) && isset($drop[$record['leadId']])) {
                $record['leadId'] = null;
            }
        }
        unset($record);
    }
}

function ops_activities_for(array $state, string $entity, string $entityId, int $limit = 100): array
{
    $items = array_values(array_filter($state['opsActivities'], fn ($a) => $a['entity'] === $entity && $a['entityId'] === $entityId));
    return array_slice(array_reverse($items), 0, $limit);
}

function add_activity(array &$state, string $leadId, string $type, string $message, array $meta = []): void
{
    $state['activities'][] = [
        'id' => new_id('act'),
        'leadId' => $leadId,
        'type' => $type,
        'message' => $message,
        'meta' => $meta ?: new stdClass(),
        'at' => now_iso(),
    ];
    // Keep the log bounded; oldest entries go first.
    $overflow = count($state['activities']) - 60000;
    if ($overflow > 0) {
        array_splice($state['activities'], 0, $overflow);
    }
}
