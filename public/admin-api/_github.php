<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

final class GitHubError extends RuntimeException
{
    /**
     * Codes: TOKEN_MISSING, GITHUB_AUTH, WORKFLOW_NOT_FOUND, DISPATCH_REJECTED, GITHUB_UNAVAILABLE, GITHUB_ERROR
     */
    public function __construct(public readonly string $errorCode, string $message, public readonly int $status = 0)
    {
        parent::__construct($message);
    }
}

/** Minimal GitHub REST client for the lead-discovery workflow. The token never leaves the server. */
final class GitHubActions
{
    public function __construct(
        private string $token = '',
        private string $owner = GITHUB_OWNER,
        private string $repo = GITHUB_REPO,
        private string $workflow = GITHUB_WORKFLOW_FILE,
        private string $ref = GITHUB_WORKFLOW_REF,
        private string $apiBase = GITHUB_API_BASE
    ) {
        $this->token = $token !== '' ? $token : admin_secret('github_token');
        $this->apiBase = rtrim($apiBase, '/');
    }

    public function hasToken(): bool
    {
        return $this->token !== '';
    }

    public function workflowName(): string
    {
        return $this->workflow;
    }

    public function repoSlug(): string
    {
        return $this->owner . '/' . $this->repo;
    }

    public function ref(): string
    {
        return $this->ref;
    }

    /** @return array{found: bool, state: ?string, htmlUrl: ?string} */
    public function workflow(): array
    {
        $res = $this->request('GET', $this->workflowPath());
        if ($res['status'] === 404) {
            return ['found' => false, 'state' => null, 'htmlUrl' => null];
        }
        $this->assertOk($res, 'Could not read the workflow');
        return ['found' => true, 'state' => $res['json']['state'] ?? null, 'htmlUrl' => $res['json']['html_url'] ?? null];
    }

    public function dispatch(array $inputs): void
    {
        $inputs = array_map(fn ($v) => is_bool($v) ? ($v ? 'true' : 'false') : (string) $v, $inputs);
        $res = $this->request('POST', $this->workflowPath() . '/dispatches', ['ref' => $this->ref, 'inputs' => $inputs]);
        if ($res['status'] === 204 || $res['status'] === 200) {
            return;
        }
        if ($res['status'] === 404) {
            throw new GitHubError('WORKFLOW_NOT_FOUND', "Workflow {$this->workflow} was not found on branch {$this->ref}.", 404);
        }
        if ($res['status'] === 422) {
            throw new GitHubError('DISPATCH_REJECTED', 'GitHub rejected the workflow dispatch: ' . $this->message($res), 422);
        }
        $this->assertOk($res, 'Workflow dispatch failed');
    }

    /** Finds the run for a batch segment via its run-name. */
    public function findRun(string $batchId, int $segment): ?array
    {
        $res = $this->request('GET', $this->workflowPath() . '/runs?event=workflow_dispatch&per_page=30');
        $this->assertOk($res, 'Could not list workflow runs');
        $needle = $batchId . ' · segment ' . $segment;
        foreach ($res['json']['workflow_runs'] ?? [] as $run) {
            if (is_array($run) && str_contains((string) ($run['display_title'] ?? $run['name'] ?? ''), $needle)) {
                return self::runSummary($run);
            }
        }
        return null;
    }

    public function getRun(string $runId): ?array
    {
        $res = $this->request('GET', "/repos/{$this->owner}/{$this->repo}/actions/runs/" . rawurlencode($runId));
        if ($res['status'] === 404) {
            return null;
        }
        $this->assertOk($res, 'Could not read the workflow run');
        return self::runSummary($res['json']);
    }

    public function latestRun(): ?array
    {
        $res = $this->request('GET', $this->workflowPath() . '/runs?per_page=1');
        $this->assertOk($res, 'Could not list workflow runs');
        $run = $res['json']['workflow_runs'][0] ?? null;
        return is_array($run) ? self::runSummary($run) : null;
    }

    /** Returns true when GitHub accepted the cancel (or the run is already finished). */
    public function cancelRun(string $runId): bool
    {
        try {
            $res = $this->request('POST', "/repos/{$this->owner}/{$this->repo}/actions/runs/" . rawurlencode($runId) . '/cancel');
        } catch (GitHubError) {
            return false;
        }
        // 409 = run already completed; nothing left to cancel.
        return in_array($res['status'], [202, 204, 409], true);
    }

    public static function runSummary(array $run): array
    {
        return [
            'id' => (string) ($run['id'] ?? ''),
            'status' => (string) ($run['status'] ?? ''),
            'conclusion' => $run['conclusion'] ?? null,
            'htmlUrl' => $run['html_url'] ?? null,
            'title' => $run['display_title'] ?? ($run['name'] ?? null),
            'createdAt' => $run['created_at'] ?? null,
            'updatedAt' => $run['updated_at'] ?? null,
        ];
    }

    private function workflowPath(): string
    {
        return "/repos/{$this->owner}/{$this->repo}/actions/workflows/" . rawurlencode($this->workflow);
    }

    private function message(array $res): string
    {
        return mb_substr((string) ($res['json']['message'] ?? 'HTTP ' . $res['status']), 0, 200);
    }

    private function assertOk(array $res, string $what): void
    {
        $status = $res['status'];
        if ($status >= 200 && $status < 300) {
            return;
        }
        if ($status === 401 || $status === 403) {
            throw new GitHubError('GITHUB_AUTH', "$what: GitHub refused the token (HTTP $status). Check its repository access and Actions permission.", $status);
        }
        throw new GitHubError($status >= 500 ? 'GITHUB_UNAVAILABLE' : 'GITHUB_ERROR', "$what: " . $this->message($res), $status);
    }

    /** @return array{status: int, json: array} */
    private function request(string $method, string $path, ?array $body = null): array
    {
        if ($this->token === '') {
            throw new GitHubError('TOKEN_MISSING', 'The GitHub token is not configured on the server.');
        }
        if (!function_exists('curl_init')) {
            throw new GitHubError('GITHUB_UNAVAILABLE', 'PHP curl extension is not installed.');
        }
        $ch = curl_init($this->apiBase . $path);
        $headers = [
            'Accept: application/vnd.github+json',
            'Authorization: Bearer ' . $this->token,
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: nivello-admin',
        ];
        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => false,
        ];
        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $headers[] = 'Content-Type: application/json';
        }
        $options[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $options);
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($ch);
        curl_close($ch);
        if ($errno !== 0 || $status === 0) {
            throw new GitHubError('GITHUB_UNAVAILABLE', 'GitHub API is not reachable right now.');
        }
        $json = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
        return ['status' => $status, 'json' => is_array($json) ? $json : []];
    }
}

/** The public callback URL the runner posts to. */
function discovery_callback_url(): string
{
    $base = ADMIN_PUBLIC_BASE_URL;
    if ($base === '') {
        $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
        if ($host === '' || !preg_match('/^[A-Za-z0-9.\-:\[\]]+$/', $host)) {
            return '';
        }
        $base = (request_is_https() ? 'https://' : 'http://') . $host;
    }
    return rtrim($base, '/') . '/admin-api/github-callback.php';
}

/**
 * Configuration problems that block discovery, without touching the network.
 * @return list<array{code: string, message: string}>
 */
function discovery_config_issues(): array
{
    $issues = [];
    if (admin_secret('github_token') === '') {
        $issues[] = ['code' => 'TOKEN_MISSING', 'message' => 'GitHub token is not configured on the server.'];
    }
    if (strlen(admin_secret('callback_secret')) < 32) {
        $issues[] = ['code' => 'CALLBACK_SECRET_MISSING', 'message' => 'Callback secret is missing or shorter than 32 characters.'];
    }
    $url = discovery_callback_url();
    if ($url === '') {
        $issues[] = ['code' => 'CALLBACK_URL_MISSING', 'message' => 'Callback URL could not be determined. Set NIVELLO_ADMIN_PUBLIC_BASE_URL.'];
    } elseif (!str_starts_with($url, 'https://') && getenv('NIVELLO_ALLOW_HTTP_CALLBACK') !== '1') {
        $issues[] = ['code' => 'CALLBACK_URL_INSECURE', 'message' => 'Callback URL must use HTTPS.'];
    }
    return $issues;
}

/** Small file cache for GitHub status lookups so UI polling never hits the API directly. */
function github_cache(string $key, int $ttl, callable $compute): array
{
    $file = ADMIN_DATA_DIR . '/github-cache.json';
    $cache = is_file($file) ? json_decode((string) @file_get_contents($file), true) : [];
    $cache = is_array($cache) ? $cache : [];
    if (isset($cache[$key]) && time() - (int) ($cache[$key]['at'] ?? 0) < $ttl) {
        return $cache[$key]['value'];
    }
    $value = $compute();
    $cache[$key] = ['at' => time(), 'value' => $value];
    @file_put_contents($file, json_encode($cache), LOCK_EX);
    return $value;
}
