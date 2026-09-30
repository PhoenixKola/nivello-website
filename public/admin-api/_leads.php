<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

const LEAD_STATUSES = ['new', 'contacted', 'follow_up', 'interested', 'proposal', 'won', 'lost'];
const LEAD_STATUS_LABELS = [
    'new' => 'New', 'contacted' => 'Contacted', 'follow_up' => 'Follow-up', 'interested' => 'Interested',
    'proposal' => 'Proposal', 'won' => 'Won', 'lost' => 'Lost',
];
const LEAD_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const COMPANY_SIZES = ['unknown', 'solo', '2-10', '11-50', '51-200', '200+'];
const CONTACT_METHODS = ['', 'phone', 'whatsapp', 'email', 'instagram', 'in_person', 'other'];
const CONTACT_LOG_TYPES = ['call' => 'Called', 'whatsapp' => 'WhatsApp', 'email' => 'Email', 'meeting' => 'Meeting', 'other' => 'Other'];
const TAG_COLORS = ['blue', 'gold', 'purple', 'green', 'red', 'teal', 'pink', 'slate'];
const CLOSED_STATUSES = ['won', 'lost'];

/** Fields a user may edit, with their validators. */
function lead_field_validators(): array
{
    return [
        'companyName' => fn ($v) => v_string($v, 'Company name', 200, true),
        'category' => fn ($v) => v_string($v, 'Category', 120),
        'address' => fn ($v) => v_string($v, 'Address', 300),
        'city' => fn ($v) => v_string($v, 'City', 120),
        'country' => fn ($v) => v_string($v, 'Country', 120),
        'phone' => fn ($v) => v_phone($v),
        'whatsapp' => fn ($v) => v_phone($v, 'WhatsApp'),
        'website' => fn ($v) => v_url($v, 'Website'),
        'email' => fn ($v) => v_email($v),
        'instagram' => fn ($v) => normalize_instagram_input($v),
        'googleMapsUrl' => fn ($v) => v_url($v, 'Google Maps URL'),
        'contactPerson' => fn ($v) => v_string($v, 'Contact person', 120),
        'contactRole' => fn ($v) => v_string($v, 'Role', 120),
        'preferredContact' => fn ($v) => v_enum($v ?? '', 'Preferred contact method', CONTACT_METHODS),
        'companySize' => fn ($v) => v_enum($v, 'Company size', COMPANY_SIZES),
        'priority' => fn ($v) => v_enum($v, 'Priority', LEAD_PRIORITIES),
        'status' => fn ($v) => v_enum($v, 'Status', LEAD_STATUSES),
        'nextAction' => fn ($v) => v_string($v, 'Next action', 300),
        'followUpAt' => fn ($v) => v_datetime($v, 'Follow-up'),
        'lastContactedAt' => fn ($v) => v_datetime($v, 'Last contacted'),
    ];
}

function normalize_instagram_input(mixed $value): string
{
    $value = v_string($value, 'Instagram', 200);
    if ($value === '') {
        return '';
    }
    $handle = null;
    if (preg_match('~^@?([A-Za-z0-9._]{1,30})$~', $value, $m)) {
        $handle = $m[1];
    } elseif (preg_match('~instagram\.com/([A-Za-z0-9._]{1,30})~i', $value, $m)) {
        $handle = $m[1];
    }
    if ($handle === null || in_array(strtolower($handle), INSTAGRAM_RESERVED, true)) {
        throw new ApiError('VALIDATION_ERROR', 'Instagram must be a profile URL or @handle.', 422);
    }
    return 'https://www.instagram.com/' . $handle . '/';
}

const INSTAGRAM_RESERVED = ['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'share', 'direct', 'about', 'developer', 'legal', 'privacy'];

function blank_lead(): array
{
    $now = now_iso();
    return [
        'id' => new_id('lead'),
        'sourceId' => '',
        'fingerprint' => '',
        'companyName' => '',
        'category' => '',
        'categories' => [],
        'address' => '',
        'city' => '',
        'country' => '',
        'phone' => '',
        'whatsapp' => '',
        'website' => '',
        'email' => '',
        'instagram' => '',
        'googleMapsUrl' => '',
        'latitude' => null,
        'longitude' => null,
        'rating' => null,
        'reviewCount' => null,
        'contactPerson' => '',
        'contactRole' => '',
        'preferredContact' => '',
        'companySize' => 'unknown',
        'priority' => 'normal',
        'status' => 'new',
        'nextAction' => '',
        'lastContactedAt' => null,
        'followUpAt' => null,
        'followUpCompletedAt' => null,
        'tags' => [],
        'source' => 'manual',
        'sourceBatchId' => null,
        'sourceQuery' => '',
        'sourceLang' => '',
        'enrichment' => new stdClass(),
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
}

// ── Identity & dedupe ───────────────────────────────────────────────────────

function norm_text(string $value): string
{
    $value = mb_strtolower(trim($value));
    if (function_exists('iconv')) {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($ascii !== false && $ascii !== '') {
            $value = $ascii;
        }
    }
    return trim(preg_replace('/[^a-z0-9]+/', ' ', $value) ?? '');
}

function phone_key(string $phone): string
{
    $digits = preg_replace('/\D/', '', $phone) ?? '';
    return strlen($digits) >= 7 ? substr($digits, -9) : '';
}

function lead_fingerprint(array $lead): string
{
    $name = norm_text((string) ($lead['companyName'] ?? ''));
    if ($name === '') {
        return '';
    }
    $anchor = phone_key((string) ($lead['phone'] ?? ''))
        ?: norm_text((string) ($lead['address'] ?? ''))
        ?: norm_text((string) ($lead['city'] ?? ''));
    return sha1($name . '|' . $anchor);
}

/** Lookup maps from identity keys to lead ids. */
final class LeadIndex
{
    public array $bySource = [];
    public array $byFingerprint = [];
    public array $byPhone = [];

    public static function build(array $leads): LeadIndex
    {
        $index = new LeadIndex();
        foreach ($leads as $lead) {
            $index->add($lead);
        }
        return $index;
    }

    public function add(array $lead): void
    {
        if (!empty($lead['sourceId'])) {
            $this->bySource[$lead['sourceId']] = $lead['id'];
        }
        if (!empty($lead['fingerprint'])) {
            $this->byFingerprint[$lead['fingerprint']] = $lead['id'];
        }
        $phone = phone_key((string) ($lead['phone'] ?? ''));
        if ($phone !== '') {
            $this->byPhone[$phone] = $lead['id'];
        }
    }

    /** @return array{0: string, 1: string}|null [leadId, reason] */
    public function match(array $candidate): ?array
    {
        if (!empty($candidate['sourceId']) && isset($this->bySource[$candidate['sourceId']])) {
            return [$this->bySource[$candidate['sourceId']], 'Same Google Maps place'];
        }
        if (!empty($candidate['fingerprint']) && isset($this->byFingerprint[$candidate['fingerprint']])) {
            return [$this->byFingerprint[$candidate['fingerprint']], 'Same name and phone/address'];
        }
        $phone = phone_key((string) ($candidate['phone'] ?? ''));
        if ($phone !== '' && isset($this->byPhone[$phone])) {
            return [$this->byPhone[$phone], 'Same phone number'];
        }
        return null;
    }
}

/** Contact/company fields a duplicate candidate may contribute. */
const MERGEABLE_FIELDS = ['phone', 'email', 'website', 'instagram', 'whatsapp', 'address', 'category', 'googleMapsUrl', 'rating', 'reviewCount', 'latitude', 'longitude', 'sourceId'];

function candidate_fills(array $existing, array $candidate): array
{
    $fills = [];
    foreach (MERGEABLE_FIELDS as $field) {
        $new = $candidate[$field] ?? null;
        $old = $existing[$field] ?? null;
        if (($old === null || $old === '') && $new !== null && $new !== '') {
            $fills[] = $field;
        }
    }
    return $fills;
}

/** Records a duplicate for review when it adds information or the match is not exact. */
function record_duplicate_candidate(array &$state, array $existing, array $candidate, string $reason, string $source): bool
{
    $fills = candidate_fills($existing, $candidate);
    if (!$fills && $reason === 'Same Google Maps place') {
        return false;
    }
    $candidateKey = $candidate['sourceId'] ?: $candidate['fingerprint'];
    foreach ($state['duplicateCandidates'] as $existingCandidate) {
        if ($existingCandidate['leadId'] === $existing['id'] && $existingCandidate['candidateKey'] === $candidateKey && $existingCandidate['status'] === 'pending') {
            return false;
        }
    }
    $snapshot = array_intersect_key($candidate, array_flip(array_merge(['companyName', 'city', 'country'], MERGEABLE_FIELDS)));
    $state['duplicateCandidates'][] = [
        'id' => new_id('dup'),
        'leadId' => $existing['id'],
        'candidateKey' => $candidateKey,
        'candidate' => $snapshot,
        'reason' => $reason,
        'fills' => $fills,
        'source' => $source,
        'status' => 'pending',
        'createdAt' => now_iso(),
    ];
    return true;
}

// ── Score ───────────────────────────────────────────────────────────────────

/** Score bands shared by filters, analytics and the UI ("High opportunity" = 70+). */
const LEAD_SCORE_HIGH = 70;

/**
 * Deterministic opportunity score (0–100) with its reasons. All rules live here so they can be tuned
 * in one place; the score is always derived, never stored. It ranks leads, it does not predict conversion.
 */
function lead_score(array $lead, ?int $now = null): array
{
    $now ??= time();
    $score = 40;
    $reasons = [];
    $add = function (int $delta, string $label) use (&$score, &$reasons) {
        $score += $delta;
        $reasons[] = ['delta' => $delta, 'label' => $label];
    };

    $hasPhone = ($lead['phone'] ?? '') !== '' || ($lead['whatsapp'] ?? '') !== '';
    $hasEmail = ($lead['email'] ?? '') !== '';
    $hasInstagram = ($lead['instagram'] ?? '') !== '';
    $hasWebsite = ($lead['website'] ?? '') !== '';

    $hasPhone ? $add(15, 'Phone available') : $add(-8, 'No phone');
    $hasEmail ? $add(10, 'Email available') : $add(-4, 'No email');
    if ($hasInstagram) {
        $add(8, 'Instagram available');
    }
    $hasWebsite ? $add(-5, 'Already has a website') : $add(12, 'No website');
    if (!$hasPhone && !$hasEmail && !$hasInstagram) {
        $add(-25, 'No way to contact');
    }
    if (($lead['category'] ?? '') !== '' && ($lead['address'] ?? '') !== '' && ($lead['city'] ?? '') !== '') {
        $add(5, 'Complete business profile');
    }

    $reviews = (int) ($lead['reviewCount'] ?? 0);
    if ($reviews >= 20) {
        $add(8, "Established business ($reviews reviews)");
    } elseif ($reviews >= 5) {
        $add(4, "Some reviews ($reviews)");
    }
    if ((float) ($lead['rating'] ?? 0) >= 4.3 && $reviews >= 5) {
        $add(3, 'Well rated');
    }

    match ($lead['priority'] ?? 'normal') {
        'urgent' => $add(10, 'Urgent priority'),
        'high' => $add(6, 'High priority'),
        'low' => $add(-5, 'Low priority'),
        default => null,
    };

    $status = $lead['status'] ?? 'new';
    if (in_array($status, ['interested', 'proposal'], true)) {
        $add(10, 'Showed interest');
    }
    if ($status === 'lost') {
        $add(-30, 'Marked lost');
    }

    $followUp = iso_to_ts($lead['followUpAt'] ?? null);
    if ($followUp !== null && empty($lead['followUpCompletedAt']) && !in_array($status, CLOSED_STATUSES, true)) {
        $followUp >= $now ? $add(5, 'Follow-up scheduled') : $add(3, 'Follow-up due');
    }

    $lastTouch = iso_to_ts($lead['lastContactedAt'] ?? null);
    if ($status !== 'new' && !in_array($status, CLOSED_STATUSES, true) && ($lastTouch === null || $now - $lastTouch > 60 * 86400)) {
        $add(-10, 'No contact in 60+ days');
    }

    return ['score' => max(0, min(100, $score)), 'reasons' => $reasons];
}

// ── Filtering ───────────────────────────────────────────────────────────────

function parse_lead_filters(array $input): array
{
    $list = function ($value, array $allowed) {
        $items = is_array($value) ? $value : (is_string($value) && $value !== '' ? explode(',', $value) : []);
        return array_values(array_intersect($items, $allowed));
    };
    $flag = fn ($v) => $v === true || $v === '1' || $v === 'true';
    $batch = (string) ($input['batch'] ?? '');
    $tag = (string) ($input['tag'] ?? '');
    $day = function ($v) {
        $v = substr(is_string($v) ? $v : '', 0, 10);
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) && checkdate((int) substr($v, 5, 2), (int) substr($v, 8, 2), (int) substr($v, 0, 4)) ? $v : '';
    };
    $minScore = is_numeric($input['minScore'] ?? null) ? (int) $input['minScore'] : 0;
    $followUp = (string) ($input['followUp'] ?? '');
    return [
        'q' => mb_substr(trim((string) ($input['q'] ?? '')), 0, 120),
        'status' => $list($input['status'] ?? [], LEAD_STATUSES),
        'priority' => $list($input['priority'] ?? [], LEAD_PRIORITIES),
        'country' => mb_substr(trim((string) ($input['country'] ?? '')), 0, 120),
        'city' => mb_substr(trim((string) ($input['city'] ?? '')), 0, 120),
        'category' => mb_substr(trim((string) ($input['category'] ?? '')), 0, 120),
        'tag' => preg_match('/^tag_[a-f0-9]{16}$/', $tag) ? $tag : '',
        'batch' => preg_match('/^batch_[a-f0-9]{16}$/', $batch) ? $batch : '',
        'noWebsite' => $flag($input['noWebsite'] ?? false),
        'hasEmail' => $flag($input['hasEmail'] ?? false),
        'hasInstagram' => $flag($input['hasInstagram'] ?? false),
        'followUpDue' => $flag($input['followUpDue'] ?? false),
        'hasPhone' => $flag($input['hasPhone'] ?? false),
        'hasWebsite' => $flag($input['hasWebsite'] ?? false),
        'minScore' => max(0, min(100, $minScore)),
        'followUp' => in_array($followUp, FOLLOW_UP_FILTERS, true) ? $followUp : '',
        'createdFrom' => $day($input['createdFrom'] ?? null),
        'createdTo' => $day($input['createdTo'] ?? null),
    ];
}

const FOLLOW_UP_FILTERS = ['overdue', 'today', 'upcoming', 'none'];

/** The browser's UTC offset (minutes, as from Date#getTimezoneOffset), which defines "today". */
function tz_offset_param(mixed $value): int
{
    return is_numeric($value) ? max(-900, min(900, (int) $value)) : 0;
}

/** Last second of the local day containing $now. */
function local_day_end(int $now, int $tzOffset): int
{
    $offset = $tzOffset * 60;
    $local = $now - $offset;
    return $local - (($local % 86400) + 86400) % 86400 + 86399 + $offset;
}

/** Local calendar date (YYYY-MM-DD) of a timestamp. */
function local_date(int $ts, int $tzOffset): string
{
    return gmdate('Y-m-d', $ts - $tzOffset * 60);
}

/** overdue | today | upcoming for an open follow-up, done when completed or the lead is closed, null when none. */
function follow_up_bucket(array $lead, int $now, int $todayEnd): ?string
{
    $ts = iso_to_ts($lead['followUpAt'] ?? null);
    if ($ts === null) {
        return null;
    }
    if (!empty($lead['followUpCompletedAt']) || in_array($lead['status'], CLOSED_STATUSES, true)) {
        return 'done';
    }
    return $ts < $now ? 'overdue' : ($ts <= $todayEnd ? 'today' : 'upcoming');
}

function follow_up_is_due(array $lead, int $now): bool
{
    $ts = iso_to_ts($lead['followUpAt'] ?? null);
    return $ts !== null && $ts <= $now && empty($lead['followUpCompletedAt']) && !in_array($lead['status'], CLOSED_STATUSES, true);
}

function lead_matches(array $lead, array $f, int $now, int $tzOffset = 0): bool
{
    if ($f['status'] && !in_array($lead['status'], $f['status'], true)) {
        return false;
    }
    if ($f['priority'] && !in_array($lead['priority'], $f['priority'], true)) {
        return false;
    }
    $eq = fn ($a, $b) => $b === '' || mb_strtolower((string) $a) === mb_strtolower($b);
    if (!$eq($lead['country'], $f['country']) || !$eq($lead['city'], $f['city']) || !$eq($lead['category'], $f['category'])) {
        return false;
    }
    if ($f['tag'] !== '' && !in_array($f['tag'], $lead['tags'] ?? [], true)) {
        return false;
    }
    if ($f['batch'] !== '' && ($lead['sourceBatchId'] ?? null) !== $f['batch']) {
        return false;
    }
    if ($f['noWebsite'] && $lead['website'] !== '') {
        return false;
    }
    if ($f['hasEmail'] && $lead['email'] === '') {
        return false;
    }
    if ($f['hasInstagram'] && $lead['instagram'] === '') {
        return false;
    }
    if ($f['followUpDue'] && !follow_up_is_due($lead, $now)) {
        return false;
    }
    if (($f['hasPhone'] ?? false) && $lead['phone'] === '' && $lead['whatsapp'] === '') {
        return false;
    }
    if (($f['hasWebsite'] ?? false) && $lead['website'] === '') {
        return false;
    }
    if (($f['followUp'] ?? '') !== '') {
        $bucket = follow_up_bucket($lead, $now, local_day_end($now, $tzOffset));
        if ($f['followUp'] === 'none' ? in_array($bucket, ['overdue', 'today', 'upcoming'], true) : $bucket !== $f['followUp']) {
            return false;
        }
    }
    $createdDay = local_date(iso_to_ts($lead['createdAt']) ?? 0, $tzOffset);
    if ((($f['createdFrom'] ?? '') !== '' && $createdDay < $f['createdFrom']) || (($f['createdTo'] ?? '') !== '' && $createdDay > $f['createdTo'])) {
        return false;
    }
    if (($f['minScore'] ?? 0) > 0 && lead_score($lead, $now)['score'] < $f['minScore']) {
        return false;
    }
    if ($f['q'] !== '') {
        $haystack = mb_strtolower(implode(' ', [
            $lead['companyName'], $lead['category'], $lead['city'], $lead['country'], $lead['address'],
            $lead['phone'], $lead['email'], $lead['website'], $lead['contactPerson'], $lead['instagram'],
        ]));
        foreach (preg_split('/\s+/', mb_strtolower($f['q'])) as $term) {
            if ($term !== '' && !str_contains($haystack, $term)) {
                return false;
            }
        }
    }
    return true;
}

function filter_leads(array $leads, array $filters, int $tzOffset = 0): array
{
    $now = time();
    return array_values(array_filter($leads, fn ($lead) => lead_matches($lead, $filters, $now, $tzOffset)));
}

// ── CSV ─────────────────────────────────────────────────────────────────────

/** Prevents spreadsheet formula injection in exported cells. */
function csv_safe(mixed $value): string
{
    $value = is_array($value) ? implode('; ', $value) : (string) ($value ?? '');
    return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
}

function leads_to_csv(array $leads, array $tagNames, array $batchLabels): string
{
    $columns = [
        'Company', 'Category', 'Status', 'Priority', 'Score', 'Phone', 'WhatsApp', 'Email', 'Website', 'Instagram',
        'Address', 'City', 'Country', 'Google Maps URL', 'Rating', 'Reviews', 'Contact person', 'Role',
        'Preferred contact', 'Company size', 'Next action', 'Follow-up at', 'Last contacted', 'Tags',
        'Source', 'Source batch', 'Place ID', 'Created', 'Updated', 'Lead ID',
    ];
    $out = fopen('php://temp', 'w+');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $columns, ',', '"', '');
    $now = time();
    foreach ($leads as $lead) {
        fputcsv($out, array_map('csv_safe', [
            $lead['companyName'], $lead['category'], LEAD_STATUS_LABELS[$lead['status']] ?? $lead['status'], $lead['priority'],
            lead_score($lead, $now)['score'], $lead['phone'], $lead['whatsapp'], $lead['email'], $lead['website'], $lead['instagram'],
            $lead['address'], $lead['city'], $lead['country'], $lead['googleMapsUrl'], $lead['rating'], $lead['reviewCount'],
            $lead['contactPerson'], $lead['contactRole'], $lead['preferredContact'], $lead['companySize'], $lead['nextAction'],
            $lead['followUpAt'], $lead['lastContactedAt'],
            array_values(array_filter(array_map(fn ($id) => $tagNames[$id] ?? null, $lead['tags'] ?? []))),
            $lead['source'], $batchLabels[$lead['sourceBatchId'] ?? ''] ?? '', $lead['sourceId'],
            $lead['createdAt'], $lead['updatedAt'], $lead['id'],
        ]), ',', '"', '');
    }
    rewind($out);
    $csv = stream_get_contents($out);
    fclose($out);
    return $csv;
}

/** Parses CSV text into [headers, rows] with a row limit. Rows are header-keyed arrays. */
function parse_csv(string $body, int $maxRows): array
{
    if (str_starts_with($body, "\xEF\xBB\xBF")) {
        $body = substr($body, 3);
    }
    $handle = fopen('php://temp', 'w+');
    fwrite($handle, $body);
    rewind($handle);
    $headers = fgetcsv($handle, null, ',', '"', '');
    if (!$headers || $headers === [null]) {
        fclose($handle);
        return [[], []];
    }
    $headers = array_map(fn ($h) => trim((string) $h), $headers);
    $rows = [];
    while (($cells = fgetcsv($handle, null, ',', '"', '')) !== false) {
        if ($cells === [null]) {
            continue;
        }
        if (count($rows) >= $maxRows) {
            break;
        }
        $row = [];
        foreach ($headers as $i => $header) {
            $row[$header] = isset($cells[$i]) ? (string) $cells[$i] : '';
        }
        $rows[] = $row;
    }
    fclose($handle);
    return [$headers, $rows];
}

function tag_name_map(array $state): array
{
    $map = [];
    foreach ($state['tags'] as $tag) {
        $map[$tag['id']] = $tag['name'];
    }
    return $map;
}

function batch_label(array $batch): string
{
    $p = $batch['params'];
    return trim(($p['category'] !== '' ? $p['category'] : 'All categories') . ' · ' . $p['city'] . ' · ' . gmdate('j M', iso_to_ts($batch['createdAt']) ?? time()));
}

function batch_label_map(array $state): array
{
    $map = [];
    foreach ($state['batches'] as $batch) {
        $map[$batch['id']] = batch_label($batch);
    }
    return $map;
}

/** Public shape of a lead for list views. */
function lead_summary(array $lead, int $now): array
{
    $score = lead_score($lead, $now);
    return [
        'id' => $lead['id'],
        'companyName' => $lead['companyName'],
        'category' => $lead['category'],
        'city' => $lead['city'],
        'country' => $lead['country'],
        'phone' => $lead['phone'],
        'whatsapp' => $lead['whatsapp'],
        'email' => $lead['email'],
        'website' => $lead['website'],
        'instagram' => $lead['instagram'],
        'googleMapsUrl' => $lead['googleMapsUrl'],
        'contactPerson' => $lead['contactPerson'],
        'status' => $lead['status'],
        'priority' => $lead['priority'],
        'tags' => $lead['tags'],
        'followUpAt' => $lead['followUpAt'],
        'followUpCompletedAt' => $lead['followUpCompletedAt'],
        'nextAction' => $lead['nextAction'],
        'score' => $score['score'],
        'updatedAt' => $lead['updatedAt'],
        'createdAt' => $lead['createdAt'],
    ];
}
