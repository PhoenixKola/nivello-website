<?php
declare(strict_types=1);

// Public, write-only capture of contact-form inquiries into the private Nivello Inbox.
// The form still delivers through Formspree; this is the second write. The same submissionId
// never creates a second record (retries only upgrade the delivery status). Never returns inbox data.

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ratelimit.php';
require __DIR__ . '/_ops.php';

const CAPTURE_MAX_BYTES = 16384;

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        public_reject(405, 'METHOD_NOT_ALLOWED');
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > CAPTURE_MAX_BYTES) {
        public_reject(413, 'PAYLOAD_TOO_LARGE');
    }
    if (!same_origin_request()) {
        public_reject(403, 'FORBIDDEN');
    }
    if (!RateLimiter::hit('inbox', 20, 3600)) {
        public_reject(429, 'RATE_LIMITED');
    }
    $raw = (string) file_get_contents('php://input', false, null, 0, CAPTURE_MAX_BYTES + 1);
    if (strlen($raw) > CAPTURE_MAX_BYTES) {
        public_reject(413, 'PAYLOAD_TOO_LARGE');
    }
    $body = json_decode($raw, true, 4);
    if (!is_array($body)) {
        public_reject(400, 'INVALID');
    }
    $submissionId = $body['submissionId'] ?? null;
    if (!is_string($submissionId) || !preg_match('/^[a-f0-9]{32}$/', $submissionId)) {
        public_reject(422, 'INVALID');
    }
    // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
    if (!empty($body['website'])) {
        http_response_code(204);
        exit;
    }
    $delivery = ($body['delivery'] ?? '') === 'delivered' ? 'delivered' : 'failed';
    $fields = inbox_capture_fields($body);

    Store::instance()->mutate(function (array &$state, bool &$dirty) use ($fields, $submissionId, $delivery) {
        foreach ($state['inbox'] as &$item) {
            if ($item['submissionId'] === $submissionId) {
                $changed = false;
                // A retry may carry an edited message; keep the latest wording while nobody has handled it yet.
                if ($item['status'] === 'new' && array_intersect_key($item, $fields) != $fields) {
                    $item = array_merge($item, $fields);
                    $changed = true;
                }
                if ($item['delivery'] !== 'delivered' && $delivery === 'delivered') {
                    $item['delivery'] = 'delivered';
                    add_ops_activity($state, 'inbox', $item['id'], 'delivered', 'Email delivery succeeded on retry');
                    $changed = true;
                }
                if ($changed) {
                    $item['updatedAt'] = now_iso();
                }
                $dirty = $changed;
                return;
            }
        }
        unset($item);
        if (count($state['inbox']) >= INBOX_LIMIT) {
            throw new ApiError('INBOX_FULL', 'Inbox limit reached.', 507);
        }
        $item = new_inbox_item($fields, $submissionId, $delivery);
        $state['inbox'][] = $item;
        add_ops_activity($state, 'inbox', $item['id'], 'received', $delivery === 'delivered' ? 'Inquiry received from the website' : 'Inquiry received; the email delivery failed', ['source' => $fields['source']]);
    });
    http_response_code(204);
    header('Cache-Control: no-store');
    exit;
} catch (ApiError $e) {
    public_reject($e->status >= 500 ? 503 : 422, $e->status >= 500 ? 'UNAVAILABLE' : 'INVALID');
} catch (Throwable $e) {
    error_log('[nivello-admin] inbox capture failed: ' . get_class($e));
    public_reject(503, 'UNAVAILABLE');
}
