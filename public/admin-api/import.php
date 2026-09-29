<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_leads.php';

const IMPORT_FIELDS = [
    'companyName' => ['company', 'company name', 'name', 'business', 'business name', 'title'],
    'category' => ['category', 'type', 'industry', 'business category'],
    'phone' => ['phone', 'telephone', 'tel', 'phone number', 'mobile'],
    'whatsapp' => ['whatsapp'],
    'email' => ['email', 'e-mail', 'emails', 'email address'],
    'website' => ['website', 'web', 'site', 'url', 'web_site', 'web site'],
    'instagram' => ['instagram', 'ig', 'instagram url'],
    'address' => ['address', 'street', 'full address'],
    'city' => ['city', 'town'],
    'country' => ['country'],
    'googleMapsUrl' => ['google maps url', 'maps', 'google maps', 'link', 'maps url'],
    'contactPerson' => ['contact', 'contact person', 'contact name', 'owner'],
    'contactRole' => ['role', 'title role', 'position', 'job title'],
    'nextAction' => ['next action'],
    'note' => ['note', 'notes', 'comment', 'comments'],
    'sourceId' => ['place id', 'place_id', 'source id'],
];

function import_dir(): string
{
    $dir = ADMIN_DATA_DIR . '/imports';
    if (!is_dir($dir) && !@mkdir($dir, 0770, true) && !is_dir($dir)) {
        throw new ApiError('STORAGE_UNAVAILABLE', 'Could not prepare the import area.', 503);
    }
    foreach (glob($dir . '/*.json') ?: [] as $old) {
        if (filemtime($old) < time() - 3600) {
            @unlink($old);
        }
    }
    return $dir;
}

function auto_mapping(array $headers): array
{
    $mapping = [];
    foreach ($headers as $header) {
        $normalized = strtolower(trim(str_replace(['_', '-'], ' ', $header)));
        foreach (IMPORT_FIELDS as $field => $aliases) {
            if (in_array($field, $mapping, true)) {
                continue;
            }
            $aliasNormalized = array_map(fn ($a) => str_replace(['_', '-'], ' ', $a), $aliases);
            if (in_array($normalized, $aliasNormalized, true)) {
                $mapping[$header] = $field;
                break;
            }
        }
    }
    return $mapping;
}

function clean_mapping(mixed $mapping, array $headers): array
{
    if (!is_array($mapping)) {
        throw new ApiError('VALIDATION_ERROR', 'Column mapping is invalid.', 422);
    }
    $clean = [];
    foreach ($mapping as $header => $field) {
        if ($field === '' || $field === null) {
            continue;
        }
        if (!in_array($header, $headers, true) || !isset(IMPORT_FIELDS[$field])) {
            throw new ApiError('VALIDATION_ERROR', 'Column mapping is invalid.', 422);
        }
        if (in_array($field, $clean, true)) {
            throw new ApiError('VALIDATION_ERROR', 'Each lead field can only be mapped once.', 422);
        }
        $clean[$header] = $field;
    }
    if (!in_array('companyName', $clean, true)) {
        throw new ApiError('VALIDATION_ERROR', 'Map a column to Company name.', 422);
    }
    return $clean;
}

/**
 * Validates every row with the same rules as manual edits.
 * @return array{rows: list<array>, counts: array}
 */
function evaluate_rows(array $state, array $rows, array $mapping): array
{
    $validators = lead_field_validators();
    $index = LeadIndex::build($state['leads']);
    $seen = [];
    $out = [];
    $counts = ['total' => count($rows), 'new' => 0, 'duplicate' => 0, 'invalid' => 0];
    foreach ($rows as $n => $row) {
        $lead = blank_lead();
        $note = '';
        $errors = [];
        foreach ($mapping as $header => $field) {
            $value = (string) ($row[$header] ?? '');
            if ($field === 'note') {
                $note = mb_substr(trim($value), 0, 4000);
                continue;
            }
            if ($field === 'sourceId') {
                $lead['sourceId'] = mb_substr(trim($value), 0, 200);
                continue;
            }
            try {
                $lead[$field] = $validators[$field]($value);
            } catch (ApiError $e) {
                if ($field === 'companyName') {
                    $errors[] = $e->getMessage();
                } else {
                    // Optional fields with bad values are dropped rather than failing the row.
                    $errors[] = $e->getMessage() . ' (ignored)';
                }
            }
        }
        $lead['categories'] = $lead['category'] !== '' ? [$lead['category']] : [];
        $lead['fingerprint'] = lead_fingerprint($lead);
        $status = 'new';
        $reason = null;
        $matchId = null;
        if ($lead['companyName'] === '') {
            $status = 'invalid';
            $reason = 'Missing company name';
        } else {
            $key = $lead['sourceId'] !== '' ? 's:' . $lead['sourceId'] : 'f:' . $lead['fingerprint'];
            if (isset($seen[$key])) {
                $status = 'duplicate';
                $reason = 'Repeated in this file';
            } elseif ($match = $index->match($lead)) {
                $status = 'duplicate';
                [$matchId, $reason] = $match;
            }
            $seen[$key] = true;
        }
        $counts[$status]++;
        $out[] = ['row' => $n + 2, 'status' => $status, 'reason' => $reason, 'matchId' => $matchId, 'lead' => $lead, 'note' => $note, 'warnings' => $errors];
    }
    return ['rows' => $out, 'counts' => $counts];
}

api_run([
    'POST preview' => function () {
        $file = $_FILES['file'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            throw new ApiError('VALIDATION_ERROR', 'Choose a CSV file to upload.', 422);
        }
        if ($file['size'] > MAX_CSV_UPLOAD_BYTES) {
            throw new ApiError('PAYLOAD_TOO_LARGE', 'CSV files can be at most 5 MB.', 413);
        }
        $body = (string) file_get_contents($file['tmp_name']);
        if (!mb_check_encoding($body, 'UTF-8')) {
            $body = mb_convert_encoding($body, 'UTF-8', 'Windows-1252');
        }
        [$headers, $rows] = parse_csv($body, MAX_CSV_ROWS + 1);
        if (!$headers || !$rows) {
            throw new ApiError('VALIDATION_ERROR', 'The file has no data rows. The first row must contain column names.', 422);
        }
        if (count($rows) > MAX_CSV_ROWS) {
            throw new ApiError('VALIDATION_ERROR', 'CSV files can contain at most ' . MAX_CSV_ROWS . ' rows.', 422);
        }
        $headers = array_values(array_filter($headers, fn ($h) => $h !== ''));
        $token = bin2hex(random_bytes(16));
        file_put_contents(import_dir() . "/$token.json", json_encode(['headers' => $headers, 'rows' => $rows, 'name' => mb_substr((string) $file['name'], 0, 120)]), LOCK_EX);
        $mapping = auto_mapping($headers);
        $evaluation = in_array('companyName', $mapping, true)
            ? evaluate_rows(Store::instance()->read(), $rows, $mapping)
            : ['rows' => [], 'counts' => ['total' => count($rows), 'new' => 0, 'duplicate' => 0, 'invalid' => count($rows)]];
        return [
            'token' => $token,
            'fileName' => $file['name'],
            'headers' => $headers,
            'mapping' => $mapping,
            'fields' => array_keys(IMPORT_FIELDS),
            'counts' => $evaluation['counts'],
            'sample' => array_slice($evaluation['rows'], 0, 25),
        ];
    },
    'POST evaluate' => function () {
        $body = json_body();
        $token = (string) ($body['token'] ?? '');
        $upload = load_upload($token);
        $mapping = clean_mapping($body['mapping'] ?? null, $upload['headers']);
        $evaluation = evaluate_rows(Store::instance()->read(), $upload['rows'], $mapping);
        return ['counts' => $evaluation['counts'], 'sample' => array_slice($evaluation['rows'], 0, 25)];
    },
    'POST commit' => function () {
        $body = json_body();
        $token = (string) ($body['token'] ?? '');
        $upload = load_upload($token);
        $mapping = clean_mapping($body['mapping'] ?? null, $upload['headers']);
        $result = Store::instance()->mutate(function (array &$state) use ($upload, $mapping) {
            $evaluation = evaluate_rows($state, $upload['rows'], $mapping);
            $positions = index_by_id($state['leads']);
            $imported = 0;
            $candidates = 0;
            foreach ($evaluation['rows'] as $row) {
                if ($row['status'] === 'duplicate' && $row['matchId'] && isset($positions[$row['matchId']])) {
                    if (record_duplicate_candidate($state, $state['leads'][$positions[$row['matchId']]], $row['lead'], $row['reason'], 'csv')) {
                        $candidates++;
                    }
                }
                if ($row['status'] !== 'new') {
                    continue;
                }
                $lead = $row['lead'];
                $lead['source'] = 'csv';
                $lead['sourceQuery'] = 'CSV import: ' . $upload['name'];
                $state['leads'][] = $lead;
                add_activity($state, $lead['id'], 'imported', 'Imported from CSV: ' . $upload['name']);
                if ($row['note'] !== '') {
                    $state['notes'][] = ['id' => new_id('note'), 'leadId' => $lead['id'], 'body' => $row['note'], 'createdAt' => now_iso()];
                }
                $imported++;
            }
            return ['imported' => $imported, 'duplicateCandidates' => $candidates] + $evaluation['counts'];
        });
        @unlink(ADMIN_DATA_DIR . "/imports/$token.json");
        return $result;
    },
]);

function load_upload(string $token): array
{
    if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
        throw new ApiError('VALIDATION_ERROR', 'Import session is invalid.', 422);
    }
    $path = import_dir() . "/$token.json";
    $data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
    if (!is_array($data)) {
        throw new ApiError('IMPORT_EXPIRED', 'This import expired. Upload the file again.', 410);
    }
    return $data;
}
