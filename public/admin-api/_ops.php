<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_leads.php';

/*
 * Operations suite models: Contact Inbox, Project Pipeline and Proposals.
 * They live in the main CRM store next to leads, so links and conversions are one atomic write.
 * Records reference each other by id (leadId, inboxId, projectId, proposalId); nothing is copied twice.
 * Money is stored as integer cents.
 */

const INBOX_STATUSES = ['new', 'replied', 'qualified', 'converted', 'closed', 'spam'];
const INBOX_LIMIT = 10000;
const PROJECT_STAGES = ['lead', 'discovery', 'proposal', 'approved', 'design', 'development', 'qa', 'delivered', 'maintenance', 'archived'];
const PROJECT_STAGE_LABELS = [
    'lead' => 'Lead', 'discovery' => 'Discovery', 'proposal' => 'Proposal', 'approved' => 'Approved', 'design' => 'Design',
    'development' => 'Development', 'qa' => 'QA', 'delivered' => 'Delivered', 'maintenance' => 'Maintenance', 'archived' => 'Archived',
];
/** Stages where work is still ahead (used for "active", "due soon" and "overdue"). */
const PROJECT_OPEN_STAGES = ['lead', 'discovery', 'proposal', 'approved', 'design', 'development', 'qa'];
const PROJECT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PROJECT_LIMIT = 2000;
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
const PROPOSAL_EDITABLE = ['draft', 'sent'];
const PROPOSAL_UNITS = ['fixed', 'hour', 'day', 'month', 'item', 'page'];
const PROPOSAL_LIMIT = 2000;
const MONEY_MAX_CENTS = 100_000_000_00;

// ── Generic helpers ─────────────────────────────────────────────────────────

function ops_index(array $state, string $collection, string $id, string $label): int
{
    foreach ($state[$collection] as $i => $record) {
        if ($record['id'] === $id) {
            return $i;
        }
    }
    throw new ApiError('NOT_FOUND', "$label not found. It may have been deleted.", 404);
}

function ops_find(array $state, string $collection, ?string $id): ?array
{
    if ($id === null) {
        return null;
    }
    foreach ($state[$collection] as $record) {
        if ($record['id'] === $id) {
            return $record;
        }
    }
    return null;
}

function v_date(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) || !checkdate((int) substr($value, 5, 2), (int) substr($value, 8, 2), (int) substr($value, 0, 4))) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a date (YYYY-MM-DD).", 422);
    }
    return $value;
}

/** Decimal amount (e.g. 1500.5) to cents, validated. */
function v_money(mixed $value, string $label, bool $allowNull = false): ?int
{
    if (($value === null || $value === '') && $allowNull) {
        return null;
    }
    if (!is_int($value) && !is_float($value) && !(is_string($value) && is_numeric($value))) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a number.", 422);
    }
    $cents = (int) round((float) $value * 100);
    if ($cents < 0 || $cents > MONEY_MAX_CENTS) {
        throw new ApiError('VALIDATION_ERROR', "$label is out of range.", 422);
    }
    return $cents;
}

function v_links(mixed $value): array
{
    if ($value === null) {
        return [];
    }
    if (!is_array($value) || count($value) > 12) {
        throw new ApiError('VALIDATION_ERROR', 'Links must be a list of at most 12 links.', 422);
    }
    $links = [];
    foreach ($value as $link) {
        $url = v_url($link['url'] ?? '', 'Link URL', false);
        if (parse_url($url, PHP_URL_USER) !== null || parse_url($url, PHP_URL_PASS) !== null) {
            throw new ApiError('VALIDATION_ERROR', 'Links cannot contain credentials.', 422);
        }
        $links[] = ['label' => v_string($link['label'] ?? '', 'Link label', 60) ?: hostname_of($url), 'url' => $url];
    }
    return $links;
}

function hostname_of(string $url): string
{
    return preg_replace('/^www\./', '', (string) parse_url($url, PHP_URL_HOST)) ?: $url;
}

function v_simple_tags(mixed $value): array
{
    if ($value === null) {
        return [];
    }
    if (!is_array($value) || count($value) > 10) {
        throw new ApiError('VALIDATION_ERROR', 'Use at most 10 tags.', 422);
    }
    $tags = [];
    foreach ($value as $tag) {
        $tag = v_string($tag, 'Tag', 24);
        if ($tag !== '' && !in_array(mb_strtolower($tag), array_map('mb_strtolower', $tags), true)) {
            $tags[] = $tag;
        }
    }
    return $tags;
}

/** Validates an optional reference to another record; null clears it. */
function v_ref(array $state, mixed $value, string $collection, string $prefix, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    $id = v_id($value, $prefix, $label);
    if (!ops_find($state, $collection, $id)) {
        throw new ApiError('VALIDATION_ERROR', "$label does not exist.", 422);
    }
    return $id;
}

function lead_brief(?array $lead): ?array
{
    return $lead ? ['id' => $lead['id'], 'companyName' => $lead['companyName'], 'status' => $lead['status'], 'email' => $lead['email']] : null;
}

// ── Inbox ───────────────────────────────────────────────────────────────────

/** Public capture payload -> normalized inquiry fields (throws on invalid input). */
function inbox_capture_fields(array $in): array
{
    $str = fn (string $key, int $max) => is_string($in[$key] ?? null) ? mb_substr(trim(str_replace("\0", '', $in[$key])), 0, $max) : '';
    $email = $str('email', 200);
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ApiError('INVALID', 'Invalid email.', 422);
    }
    $fields = [
        'name' => $str('name', 120),
        'email' => mb_strtolower($email),
        'company' => $str('company', 160),
        'projectType' => $str('projectType', 80),
        'budget' => $str('budget', 60),
        'timing' => $str('timing', 60),
        'deadline' => $str('deadline', 120),
        'message' => $str('message', 8000),
        'brief' => $str('projectBrief', 400),
        'source' => preg_match('/^[a-z0-9_]{1,40}$/', (string) ($in['source'] ?? '')) ? $in['source'] : 'direct',
        'page' => normalize_capture_path($in['page'] ?? null),
        'locale' => in_array($in['locale'] ?? null, ['en', 'it'], true) ? $in['locale'] : 'en',
    ];
    if ($fields['name'] === '' || $fields['message'] === '') {
        throw new ApiError('INVALID', 'Name and message are required.', 422);
    }
    return $fields;
}

function normalize_capture_path(mixed $path): string
{
    return is_string($path) && preg_match('#^/[A-Za-z0-9/_.~%-]{0,200}$#', $path) ? $path : '';
}

function new_inbox_item(array $fields, string $submissionId, string $delivery): array
{
    $now = now_iso();
    return ['id' => new_id('inq'), 'submissionId' => $submissionId] + $fields + [
        'delivery' => $delivery,
        'status' => 'new',
        'leadId' => null,
        'projectId' => null,
        'notes' => [],
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
}

function inbox_excerpt(string $message): string
{
    $flat = trim((string) preg_replace('/\s+/', ' ', $message));
    return mb_strlen($flat) > 140 ? rtrim(mb_substr($flat, 0, 139)) . '…' : $flat;
}

function inbox_summary(array $item): array
{
    return [
        'id' => $item['id'],
        'name' => $item['name'],
        'email' => $item['email'],
        'company' => $item['company'],
        'projectType' => $item['projectType'],
        'budget' => $item['budget'],
        'status' => $item['status'],
        'delivery' => $item['delivery'],
        'leadId' => $item['leadId'],
        'projectId' => $item['projectId'],
        'createdAt' => $item['createdAt'],
        'excerpt' => inbox_excerpt($item['message']),
    ];
}

/** Finds a lead for an inquiry: same email first, then the usual name/phone identity. */
function lead_for_inquiry(array $state, array $item): ?string
{
    foreach ($state['leads'] as $lead) {
        if ($lead['email'] !== '' && mb_strtolower($lead['email']) === $item['email']) {
            return $lead['id'];
        }
    }
    $candidate = ['companyName' => $item['company'] ?: $item['name'], 'city' => '', 'phone' => ''];
    $candidate['fingerprint'] = lead_fingerprint($candidate);
    $match = LeadIndex::build($state['leads'])->match($candidate);
    return $match[0] ?? null;
}

/** Converts an inquiry to a lead (or links the matching one). Returns [leadId, created]. */
function convert_inquiry_to_lead(array &$state, int $i): array
{
    $item = &$state['inbox'][$i];
    if ($item['leadId'] && ops_find($state, 'leads', $item['leadId'])) {
        return [$item['leadId'], false];
    }
    $existing = lead_for_inquiry($state, $item);
    if ($existing) {
        $item['leadId'] = $existing;
        add_activity($state, $existing, 'inbox_linked', 'Website inquiry from ' . $item['name'] . ' linked', ['inboxId' => $item['id']]);
        add_ops_activity($state, 'inbox', $item['id'], 'lead_linked', 'Linked to existing lead', ['leadId' => $existing]);
        return [$existing, false];
    }
    $lead = blank_lead();
    $lead['companyName'] = $item['company'] ?: $item['name'];
    $lead['contactPerson'] = $item['company'] ? $item['name'] : '';
    $lead['email'] = $item['email'];
    $lead['preferredContact'] = 'email';
    $lead['status'] = 'interested';
    $lead['source'] = 'inbox';
    $lead['sourceQuery'] = $item['projectType'];
    $lead['nextAction'] = 'Reply to website inquiry';
    $lead['fingerprint'] = lead_fingerprint($lead);
    $state['leads'][] = $lead;
    $item['leadId'] = $lead['id'];
    add_activity($state, $lead['id'], 'created', 'Lead created from a website inquiry', ['inboxId' => $item['id']]);
    add_ops_activity($state, 'inbox', $item['id'], 'lead_created', 'Converted to a new lead', ['leadId' => $lead['id']]);
    return [$lead['id'], true];
}

// ── Projects ────────────────────────────────────────────────────────────────

function blank_project(): array
{
    $now = now_iso();
    return [
        'id' => new_id('prj'),
        'name' => '',
        'clientName' => '',
        'leadId' => null,
        'inboxId' => null,
        'proposalId' => null,
        'stage' => 'lead',
        'priority' => 'normal',
        'value' => null,
        'currency' => 'EUR',
        'startDate' => null,
        'targetDate' => null,
        'deliveredDate' => null,
        'nextAction' => '',
        'notes' => '',
        'links' => [],
        'tags' => [],
        'stageChangedAt' => $now,
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
}

/** Applies validated changes; returns human-readable change messages for the activity log. */
function apply_project_changes(array &$state, array &$project, array $in): array
{
    $log = [];
    $set = function (string $field, mixed $value, ?string $message = null) use (&$project, &$log) {
        if ($project[$field] !== $value) {
            $project[$field] = $value;
            if ($message) {
                $log[] = $message;
            }
        }
    };
    if (array_key_exists('name', $in)) {
        $set('name', v_string($in['name'], 'Project name', 120, true), 'Renamed');
    }
    if (array_key_exists('clientName', $in)) {
        $set('clientName', v_string($in['clientName'], 'Client', 120));
    }
    if (array_key_exists('priority', $in)) {
        $set('priority', v_enum($in['priority'], 'Priority', PROJECT_PRIORITIES), 'Priority set to ' . $in['priority']);
    }
    if (array_key_exists('value', $in)) {
        $set('value', v_money($in['value'], 'Value', true), 'Value updated');
    }
    if (array_key_exists('currency', $in)) {
        $set('currency', v_enum($in['currency'], 'Currency', CURRENCIES));
    }
    foreach (['startDate' => 'Start date', 'targetDate' => 'Target date', 'deliveredDate' => 'Delivered date'] as $field => $label) {
        if (array_key_exists($field, $in)) {
            $date = v_date($in[$field], $label);
            $set($field, $date, $field === 'targetDate' ? ($date ? "Target date set to $date" : 'Target date cleared') : null);
        }
    }
    if (array_key_exists('nextAction', $in)) {
        $set('nextAction', v_string($in['nextAction'], 'Next action', 200));
    }
    if (array_key_exists('notes', $in)) {
        $set('notes', v_string($in['notes'], 'Notes', 10000));
    }
    if (array_key_exists('links', $in)) {
        $set('links', v_links($in['links']));
    }
    if (array_key_exists('tags', $in)) {
        $set('tags', v_simple_tags($in['tags']));
    }
    foreach (['leadId' => ['leads', 'lead', 'Lead'], 'inboxId' => ['inbox', 'inq', 'Inquiry'], 'proposalId' => ['proposals', 'prop', 'Proposal']] as $field => [$collection, $prefix, $label]) {
        if (array_key_exists($field, $in)) {
            $set($field, v_ref($state, $in[$field], $collection, $prefix, $label), $in[$field] ? "$label linked" : "$label unlinked");
        }
    }
    if (array_key_exists('stage', $in)) {
        $stage = v_enum($in['stage'], 'Stage', PROJECT_STAGES);
        if ($stage !== $project['stage']) {
            $log[] = 'Moved from ' . PROJECT_STAGE_LABELS[$project['stage']] . ' to ' . PROJECT_STAGE_LABELS[$stage];
            $project['stage'] = $stage;
            $project['stageChangedAt'] = now_iso();
            if ($stage === 'delivered' && !$project['deliveredDate']) {
                $project['deliveredDate'] = gmdate('Y-m-d');
            }
        }
    }
    if ($project['name'] === '') {
        throw new ApiError('VALIDATION_ERROR', 'Project name is required.', 422);
    }
    $project['updatedAt'] = now_iso();
    return $log;
}

function project_due_state(array $project, string $today): ?string
{
    if (!$project['targetDate'] || !in_array($project['stage'], PROJECT_OPEN_STAGES, true)) {
        return null;
    }
    if ($project['targetDate'] < $today) {
        return 'overdue';
    }
    return $project['targetDate'] <= gmdate('Y-m-d', strtotime($today . 'T00:00:00Z') + 14 * 86400) ? 'soon' : null;
}

function project_view(array $state, array $project, string $today): array
{
    $lead = ops_find($state, 'leads', $project['leadId']);
    return $project + [
        'due' => project_due_state($project, $today),
        'lead' => lead_brief($lead),
        'proposalCount' => count(array_filter($state['proposals'], fn ($p) => $p['projectId'] === $project['id'])),
    ];
}

// ── Proposals ───────────────────────────────────────────────────────────────

function next_proposal_number(array &$state, ?int $year = null): string
{
    $year ??= (int) gmdate('Y');
    $key = "proposal-$year";
    $used = [];
    foreach ($state['proposals'] as $proposal) {
        $used[$proposal['number']] = true;
    }
    $n = (int) ($state['counters'][$key] ?? 0);
    do {
        $n++;
        $number = sprintf('NIV-%d-%03d', $year, $n);
    } while (isset($used[$number]));
    $state['counters'][$key] = $n;
    return $number;
}

/** Validates line items, discount, tax and milestones and computes authoritative totals (cents). */
function proposal_compute(array $in): array
{
    $rawItems = $in['items'] ?? [];
    if (!is_array($rawItems) || count($rawItems) > 60) {
        throw new ApiError('VALIDATION_ERROR', 'Use at most 60 line items.', 422);
    }
    $items = [];
    $subtotal = 0;
    $optionalTotal = 0;
    foreach (array_values($rawItems) as $n => $raw) {
        $label = 'Line ' . ($n + 1);
        $description = v_string($raw['description'] ?? '', "$label description", 300);
        if ($description === '') {
            throw new ApiError('VALIDATION_ERROR', "$label needs a description.", 422);
        }
        $quantity = $raw['quantity'] ?? 1;
        if (!is_numeric($quantity) || (float) $quantity <= 0 || (float) $quantity > 100000) {
            throw new ApiError('VALIDATION_ERROR', "$label quantity must be a positive number.", 422);
        }
        $quantity = round((float) $quantity, 2);
        $unitPrice = v_money($raw['unitPrice'] ?? 0, "$label price");
        $total = (int) round($quantity * $unitPrice);
        if ($total > MONEY_MAX_CENTS) {
            throw new ApiError('VALIDATION_ERROR', "$label total is out of range.", 422);
        }
        $optional = v_bool($raw['optional'] ?? false);
        $items[] = [
            'description' => $description,
            'details' => v_string($raw['details'] ?? '', "$label details", 1000),
            'quantity' => $quantity,
            'unit' => v_enum($raw['unit'] ?? 'fixed', "$label unit", PROPOSAL_UNITS),
            'unitPrice' => $unitPrice,
            'optional' => $optional,
            'total' => $total,
        ];
        if ($optional) {
            $optionalTotal += $total;
        } else {
            $subtotal += $total;
        }
    }

    $discountIn = is_array($in['discount'] ?? null) ? $in['discount'] : [];
    $discountType = v_enum($discountIn['type'] ?? 'none', 'Discount type', ['none', 'percent', 'amount']);
    $discountValue = 0.0;
    $discount = 0;
    if ($discountType === 'percent') {
        $discountValue = (float) ($discountIn['value'] ?? 0);
        if ($discountValue < 0 || $discountValue > 100) {
            throw new ApiError('VALIDATION_ERROR', 'Discount must be between 0 and 100%.', 422);
        }
        $discountValue = round($discountValue, 2);
        $discount = (int) round($subtotal * $discountValue / 100);
    } elseif ($discountType === 'amount') {
        $discount = v_money($discountIn['value'] ?? 0, 'Discount');
        if ($discount > $subtotal) {
            throw new ApiError('VALIDATION_ERROR', 'The discount cannot exceed the subtotal.', 422);
        }
        $discountValue = $discount / 100;
    }

    $taxIn = is_array($in['tax'] ?? null) ? $in['tax'] : [];
    $taxRate = isset($taxIn['rate']) && $taxIn['rate'] !== '' && $taxIn['rate'] !== null ? (float) $taxIn['rate'] : 0.0;
    if ($taxRate < 0 || $taxRate > 50) {
        throw new ApiError('VALIDATION_ERROR', 'Tax rate must be between 0 and 50%.', 422);
    }
    $taxRate = round($taxRate, 2);
    $taxable = $subtotal - $discount;
    $tax = (int) round($taxable * $taxRate / 100);
    $total = $taxable + $tax;

    $rawMilestones = $in['milestones'] ?? [];
    if (!is_array($rawMilestones) || count($rawMilestones) > 12) {
        throw new ApiError('VALIDATION_ERROR', 'Use at most 12 payment milestones.', 422);
    }
    $milestones = [];
    $percentSum = 0.0;
    foreach (array_values($rawMilestones) as $n => $raw) {
        $percent = $raw['percent'] ?? null;
        if (!is_numeric($percent) || (float) $percent <= 0 || (float) $percent > 100) {
            throw new ApiError('VALIDATION_ERROR', 'Milestone ' . ($n + 1) . ' needs a percentage between 0 and 100.', 422);
        }
        $percentSum += round((float) $percent, 2);
        $milestones[] = [
            'label' => v_string($raw['label'] ?? '', 'Milestone label', 120) ?: 'Payment ' . ($n + 1),
            'due' => v_string($raw['due'] ?? '', 'Milestone timing', 120),
            'percent' => round((float) $percent, 2),
            'amount' => 0,
        ];
    }
    if ($milestones && abs($percentSum - 100) > 0.001) {
        throw new ApiError('VALIDATION_ERROR', 'Payment milestones must add up to 100% (currently ' . rtrim(rtrim(number_format($percentSum, 2, '.', ''), '0'), '.') . '%).', 422);
    }
    // Amounts are derived from the total; the last milestone absorbs rounding so they always sum exactly.
    $allocated = 0;
    foreach ($milestones as $n => &$milestone) {
        $milestone['amount'] = $n === count($milestones) - 1 ? $total - $allocated : (int) round($total * $milestone['percent'] / 100);
        $allocated += $milestone['amount'];
    }
    unset($milestone);

    return [
        'items' => $items,
        'discount' => ['type' => $discountType, 'value' => $discountValue],
        'tax' => ['label' => v_string($taxIn['label'] ?? '', 'Tax label', 40) ?: 'VAT', 'rate' => $taxRate],
        'milestones' => $milestones,
        'totals' => ['subtotal' => $subtotal, 'discount' => $discount, 'tax' => $tax, 'total' => $total, 'optional' => $optionalTotal],
    ];
}

function blank_proposal(): array
{
    $now = now_iso();
    return [
        'id' => new_id('prop'),
        'number' => '',
        'title' => '',
        'status' => 'draft',
        'language' => 'en',
        'leadId' => null,
        'projectId' => null,
        'clientName' => '',
        'clientCompany' => '',
        'clientEmail' => '',
        'currency' => 'EUR',
        'issueDate' => gmdate('Y-m-d'),
        'validUntil' => gmdate('Y-m-d', time() + 30 * 86400),
        'intro' => '',
        'scope' => '',
        'assumptions' => '',
        'terms' => '',
        'notes' => '',
        'items' => [],
        'discount' => ['type' => 'none', 'value' => 0],
        'tax' => ['label' => 'VAT', 'rate' => 0],
        'milestones' => [],
        'totals' => ['subtotal' => 0, 'discount' => 0, 'tax' => 0, 'total' => 0, 'optional' => 0],
        'createdAt' => $now,
        'updatedAt' => $now,
        'sentAt' => null,
        'acceptedAt' => null,
        'rejectedAt' => null,
    ];
}

function apply_proposal_fields(array $state, array &$proposal, array $in): void
{
    $text = ['title' => [160, true], 'clientName' => [120, false], 'clientCompany' => [160, false], 'intro' => [4000, false], 'scope' => [8000, false], 'assumptions' => [4000, false], 'terms' => [6000, false], 'notes' => [4000, false]];
    foreach ($text as $field => [$max, $required]) {
        if (array_key_exists($field, $in)) {
            $proposal[$field] = v_string($in[$field], ucfirst($field), $max, $required);
        }
    }
    if (array_key_exists('clientEmail', $in)) {
        $proposal['clientEmail'] = $in['clientEmail'] === '' || $in['clientEmail'] === null ? '' : v_email($in['clientEmail'], 'Client email');
    }
    if (array_key_exists('currency', $in)) {
        $proposal['currency'] = v_enum($in['currency'], 'Currency', CURRENCIES);
    }
    if (array_key_exists('language', $in)) {
        $proposal['language'] = v_enum($in['language'], 'Document language', ['en', 'it']);
    }
    if (array_key_exists('issueDate', $in)) {
        $proposal['issueDate'] = v_date($in['issueDate'], 'Issue date') ?? gmdate('Y-m-d');
    }
    if (array_key_exists('validUntil', $in)) {
        $proposal['validUntil'] = v_date($in['validUntil'], 'Valid until');
    }
    if (array_key_exists('leadId', $in)) {
        $proposal['leadId'] = v_ref($state, $in['leadId'], 'leads', 'lead', 'Lead');
    }
    if (array_key_exists('projectId', $in)) {
        $proposal['projectId'] = v_ref($state, $in['projectId'], 'projects', 'prj', 'Project');
    }
    if (array_key_exists('items', $in) || array_key_exists('discount', $in) || array_key_exists('tax', $in) || array_key_exists('milestones', $in)) {
        $computed = proposal_compute([
            'items' => $in['items'] ?? $proposal['items'],
            'discount' => $in['discount'] ?? $proposal['discount'],
            'tax' => $in['tax'] ?? $proposal['tax'],
            'milestones' => $in['milestones'] ?? $proposal['milestones'],
        ]);
        foreach ($computed as $key => $value) {
            $proposal[$key] = $value;
        }
    }
    if ($proposal['title'] === '') {
        throw new ApiError('VALIDATION_ERROR', 'Title is required.', 422);
    }
    if ($proposal['validUntil'] && $proposal['validUntil'] < $proposal['issueDate']) {
        throw new ApiError('VALIDATION_ERROR', 'The validity date must be after the issue date.', 422);
    }
    $proposal['updatedAt'] = now_iso();
}

function proposal_summary(array $p): array
{
    return [
        'id' => $p['id'],
        'number' => $p['number'],
        'title' => $p['title'],
        'status' => $p['status'],
        'clientName' => $p['clientName'],
        'clientCompany' => $p['clientCompany'],
        'currency' => $p['currency'],
        'total' => $p['totals']['total'],
        'issueDate' => $p['issueDate'],
        'validUntil' => $p['validUntil'],
        'pastValidity' => $p['status'] === 'sent' && $p['validUntil'] !== null && $p['validUntil'] < gmdate('Y-m-d'),
        'leadId' => $p['leadId'],
        'projectId' => $p['projectId'],
        'updatedAt' => $p['updatedAt'],
        'sentAt' => $p['sentAt'],
        'acceptedAt' => $p['acceptedAt'],
    ];
}

/** Everything linked to a lead, for the lead drawer. */
function related_to_lead(array $state, string $leadId): array
{
    return [
        'inbox' => array_values(array_map('inbox_summary', array_filter($state['inbox'], fn ($i) => $i['leadId'] === $leadId))),
        'projects' => array_values(array_map(fn ($p) => ['id' => $p['id'], 'name' => $p['name'], 'stage' => $p['stage'], 'targetDate' => $p['targetDate']], array_filter($state['projects'], fn ($p) => $p['leadId'] === $leadId))),
        'proposals' => array_values(array_map(fn ($p) => proposal_summary($p), array_filter($state['proposals'], fn ($p) => $p['leadId'] === $leadId))),
    ];
}
