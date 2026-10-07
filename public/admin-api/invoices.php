<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_invoices.php';
require __DIR__ . '/_finance.php';

function invoice_detail(array $state, string $id): array
{
    $invoice = $state['invoices'][ops_index($state, 'invoices', $id, 'Invoice')];
    return ['invoice' => invoice_view($state, $invoice), 'billingReady' => !billing_profile_missing(billing_profile($state)), 'activities' => ops_activities_for($state, 'invoice', $id)];
}

function invoice_activity(array &$state, array $invoice, string $type, string $message, array $meta = []): void
{
    add_ops_activity($state, 'invoice', $invoice['id'], $type, $message, $meta);
    if ($invoice['projectId']) {
        add_ops_activity($state, 'project', $invoice['projectId'], 'invoice_' . $type, 'Fattura ' . ($invoice['number'] ?? 'draft') . ': ' . lcfirst($message), ['invoiceId' => $invoice['id']] + $meta);
    }
}

api_run([
    'GET list' => function () {
        $state = Store::instance()->read();
        $status = (string) ($_GET['status'] ?? 'all');
        $q = mb_strtolower(trim((string) ($_GET['q'] ?? '')));
        $items = [];
        $counts = array_fill_keys(INVOICE_STATUSES, 0) + ['overdue' => 0];
        foreach ($state['invoices'] as $invoice) {
            $summary = invoice_summary($invoice);
            $counts[$summary['status']]++;
            $counts['overdue'] += $summary['due'] === 'overdue' ? 1 : 0;
            if ($status !== 'all' && $summary['status'] !== $status && !($status === 'overdue' && $summary['due'] === 'overdue')) {
                continue;
            }
            if ($q !== '' && !str_contains(mb_strtolower(($summary['number'] ?? '') . ' ' . $summary['clientName']), $q)) {
                continue;
            }
            $items[] = $summary;
        }
        usort($items, fn ($a, $b) => strcmp($b['updatedAt'], $a['updatedAt']));
        return ['invoices' => $items, 'counts' => $counts, 'billingReady' => !billing_profile_missing(billing_profile($state))];
    },
    'GET get' => fn () => invoice_detail(Store::instance()->read(), v_id($_GET['id'] ?? '', 'inv', 'Invoice')),
    'GET suggest-client' => function () {
        $state = Store::instance()->read();
        $project = isset($_GET['projectId']) ? ops_find($state, 'projects', v_id($_GET['projectId'], 'prj', 'Project')) : null;
        $proposal = isset($_GET['proposalId']) ? ops_find($state, 'proposals', v_id($_GET['proposalId'], 'prop', 'Proposal')) : null;
        $leadId = $proposal['leadId'] ?? $project['leadId'] ?? null;
        return ['client' => suggest_client_billing($state, $leadId, $project['id'] ?? $proposal['projectId'] ?? null, $proposal)];
    },
    'POST create' => function () {
        $body = json_body();
        $in = is_array($body['invoice'] ?? null) ? $body['invoice'] : [];
        $from = is_array($body['from'] ?? null) ? $body['from'] : [];
        return Store::instance()->mutate(function (array &$state) use ($in, $from) {
            if (count($state['invoices']) >= INVOICE_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Invoice limit reached.', 422);
            }
            $invoice = blank_invoice();
            $invoice['createdByUserId'] = current_admin()['id'] ?? null;
            $profile = billing_profile($state);
            $invoice['paymentTerms'] = $profile['defaultPaymentTerms'];
            $start = ['lines' => [['description' => 'Servizio', 'quantity' => 1, 'unitPrice' => 0.01, 'vatRate' => 22]]];
            if (!empty($from['proposalId'])) {
                $proposal = $state['proposals'][ops_index($state, 'proposals', v_id($from['proposalId'], 'prop', 'Proposal'), 'Proposal')];
                if ($proposal['status'] !== 'accepted') {
                    throw new ApiError('VALIDATION_ERROR', 'Create a Fattura from an accepted Preventivo.', 422);
                }
                $mode = v_enum($from['mode'] ?? 'items', 'Mode', ['items', 'percent']);
                $percent = $mode === 'percent' ? decimal_input($from['percent'] ?? 0, 'Percentage', 0.01, 100, 2) : 100.0;
                $start = [
                    'lines' => lines_from_proposal($proposal, $mode, $percent),
                    'proposalId' => $proposal['id'],
                    'projectId' => $proposal['projectId'],
                    'leadId' => $proposal['leadId'],
                    'currency' => $proposal['currency'],
                    'client' => suggest_client_billing($state, $proposal['leadId'], $proposal['projectId'], $proposal),
                ];
            } elseif (!empty($from['projectId'])) {
                $project = $state['projects'][ops_index($state, 'projects', v_id($from['projectId'], 'prj', 'Project'), 'Project')];
                $start = [
                    'lines' => [['description' => mb_substr($project['name'], 0, 1000), 'quantity' => 1, 'unitPrice' => 0.01, 'vatRate' => 22]],
                    'projectId' => $project['id'],
                    'leadId' => $project['leadId'],
                    'currency' => $project['currency'],
                    'client' => suggest_client_billing($state, $project['leadId'], $project['id'], null),
                ];
            }
            apply_invoice_fields($state, $invoice, array_replace($start, $in));
            $state['invoices'][] = $invoice;
            invoice_activity($state, $invoice, 'created', 'Created');
            return invoice_detail($state, $invoice['id']);
        });
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'inv', 'Invoice');
        $in = is_array($body['invoice'] ?? null) ? $body['invoice'] : [];
        return Store::instance()->mutate(function (array &$state) use ($id, $in) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            $invoice = array_replace_recursive(blank_invoice(), $state['invoices'][$i]);
            apply_invoice_fields($state, $invoice, $in);
            $state['invoices'][$i] = $invoice;
            return invoice_detail($state, $id);
        });
    },
    /** Draft → Ready: assigns the fiscal number and freezes the supplier and client snapshots. */
    'POST finalize' => function () {
        $id = v_id(json_body()['id'] ?? '', 'inv', 'Invoice');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            $invoice = array_replace_recursive(blank_invoice(), $state['invoices'][$i]);
            if ($invoice['status'] !== 'draft') {
                throw new ApiError('VALIDATION_ERROR', 'Only drafts can be finalized.', 409);
            }
            if ($invoice['client']['name'] === '' || $invoice['totals']['total'] <= 0) {
                throw new ApiError('VALIDATION_ERROR', 'Add the client name and at least one priced line before finalizing.', 422);
            }
            $profile = billing_profile($state);
            $missing = billing_profile_missing($profile);
            if ($missing) {
                throw new ApiError('BILLING_PROFILE_INCOMPLETE', 'Complete Settings → Billing first: ' . implode(', ', $missing) . '.', 422, ['missing' => $missing]);
            }
            assign_invoice_number($state, $invoice);
            $invoice['supplier'] = $profile;
            $invoice['status'] = 'ready';
            $invoice['updatedAt'] = now_iso();
            $invoice['updatedByUserId'] = current_admin()['id'] ?? null;
            $state['invoices'][$i] = $invoice;
            invoice_activity($state, $invoice, 'finalized', 'Finalized as number ' . $invoice['number']);
            return invoice_detail($state, $id);
        });
    },
    'POST set-status' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'inv', 'Invoice');
        $status = v_enum($body['status'] ?? '', 'Status', ['draft', 'issued', 'paid', 'cancelled']);
        $recordPayment = v_bool($body['recordPayment'] ?? false);
        $paymentDate = v_date($body['paymentDate'] ?? null, 'Payment date') ?? gmdate('Y-m-d');
        $reason = v_string($body['reason'] ?? '', 'Reason', 300);
        $confirmOverpayment = v_bool($body['confirmOverpayment'] ?? false);
        return Store::instance()->mutate(function (array &$state) use ($id, $status, $recordPayment, $paymentDate, $reason, $confirmOverpayment) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            $invoice = array_replace_recursive(blank_invoice(), $state['invoices'][$i]);
            $from = $invoice['status'];
            $allowed = [
                'draft' => [],
                'ready' => ['draft', 'issued', 'paid', 'cancelled'],
                'issued' => ['paid', 'cancelled'],
                'paid' => ['issued'],
                'cancelled' => [],
            ][$from];
            if (!in_array($status, $allowed, true)) {
                throw new ApiError('VALIDATION_ERROR', 'That status change is not allowed from "' . $from . '".', 409);
            }
            if ($status === 'draft' && $invoice['sdi']['transmissionStatus'] !== 'not_exported') {
                throw new ApiError('VALIDATION_ERROR', 'The XML was already generated; the invoice can no longer return to draft.', 409);
            }
            if ($status === 'cancelled' && $from === 'issued' && $reason === '') {
                throw new ApiError('VALIDATION_ERROR', 'An issued Fattura cannot simply be deleted: describe the credit note (nota di credito) issued for it.', 422);
            }
            $invoice['status'] = $status;
            $invoice['updatedAt'] = now_iso();
            $invoice['updatedByUserId'] = current_admin()['id'] ?? null;
            if ($status === 'paid') {
                $invoice['paidAt'] = $paymentDate;
            } elseif ($from === 'paid') {
                $invoice['paidAt'] = null;
            }
            if ($status === 'cancelled') {
                $invoice['cancelledAt'] = now_iso();
                $invoice['cancelReason'] = $reason;
            }
            $state['invoices'][$i] = $invoice;
            invoice_activity($state, $invoice, 'status', ['draft' => 'Returned to draft', 'issued' => 'Marked as issued externally', 'paid' => 'Marked as paid', 'cancelled' => 'Cancelled' . ($reason !== '' ? ': ' . $reason : '')][$status]);

            // Optionally mirror the payment into the project once (never twice for the same invoice).
            if ($status === 'paid' && $recordPayment && $invoice['projectId']) {
                $pi = ops_index($state, 'projects', $invoice['projectId'], 'Project');
                $already = array_filter($state['projects'][$pi]['payments'] ?? [], fn ($p) => ($p['linkedInvoiceId'] ?? null) === $id);
                if (!$already) {
                    record_project_payment($state, $pi, ['amount' => $invoice['totals']['total'] / 100, 'date' => $paymentDate, 'method' => $invoice['paymentMode'] === 'MP05' ? 'bank_transfer' : 'other', 'reference' => 'Fattura ' . $invoice['number'], 'linkedInvoiceId' => $id], 'invoice-' . substr($id, 4), $confirmOverpayment);
                }
            }
            return invoice_detail($state, $id);
        });
    },
    /** Records what happened after the user submitted the XML outside Nivello. */
    'POST record-sdi' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'inv', 'Invoice');
        $sdiStatus = v_enum($body['transmissionStatus'] ?? '', 'SdI status', ['to_send', 'sent', 'delivered', 'rejected', 'undeliverable']);
        $fields = [
            'transmittedAt' => v_date($body['transmittedAt'] ?? null, 'Sent date'),
            'sdiIdentifier' => v_string($body['sdiIdentifier'] ?? '', 'SdI identifier', 40),
            'receiptAt' => v_date($body['receiptAt'] ?? null, 'Receipt date'),
            'rejectionReason' => v_string($body['rejectionReason'] ?? '', 'Rejection reason', 500),
        ];
        return Store::instance()->mutate(function (array &$state) use ($id, $sdiStatus, $fields) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            $invoice = array_replace_recursive(blank_invoice(), $state['invoices'][$i]);
            if (in_array($invoice['status'], ['draft', 'cancelled'], true)) {
                throw new ApiError('VALIDATION_ERROR', 'Finalize the invoice before recording its SdI status.', 409);
            }
            if (in_array($sdiStatus, ['sent', 'delivered', 'rejected', 'undeliverable'], true) && $fields['transmittedAt'] === null && $invoice['sdi']['transmittedAt'] === null) {
                throw new ApiError('VALIDATION_ERROR', 'Enter the date the XML was sent.', 422);
            }
            if ($sdiStatus === 'rejected' && $fields['rejectionReason'] === '') {
                throw new ApiError('VALIDATION_ERROR', 'Describe the rejection reported by SdI (notifica di scarto).', 422);
            }
            $invoice['sdi'] = array_replace($invoice['sdi'], array_filter($fields, fn ($v) => $v !== null && $v !== ''), [
                'transmissionStatus' => $sdiStatus,
                'receiptType' => ['delivered' => 'RC', 'rejected' => 'NS', 'undeliverable' => 'MC'][$sdiStatus] ?? '',
            ]);
            // Delivery (RC) and impossible delivery (MC) both mean SdI accepted the file: the invoice is issued.
            if (in_array($sdiStatus, ['delivered', 'undeliverable'], true) && $invoice['status'] === 'ready') {
                $invoice['status'] = 'issued';
            }
            $invoice['updatedAt'] = now_iso();
            $state['invoices'][$i] = $invoice;
            invoice_activity($state, $invoice, 'sdi', 'SdI status recorded: ' . str_replace('_', ' ', $sdiStatus) . ($invoice['sdi']['sdiIdentifier'] !== '' ? ' (ID ' . $invoice['sdi']['sdiIdentifier'] . ')' : ''));
            return invoice_detail($state, $id);
        });
    },
    /** Downloads the FatturaPA XML. Never marks the invoice as sent. */
    'GET xml' => function () {
        $id = v_id($_GET['id'] ?? '', 'inv', 'Invoice');
        $file = Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            $invoice = array_replace_recursive(blank_invoice(), $state['invoices'][$i]);
            if (in_array($invoice['status'], ['draft', 'cancelled'], true)) {
                throw new ApiError('VALIDATION_ERROR', 'Finalize the invoice before exporting XML.', 409);
            }
            $progressive = invoice_file_progressive($state, $invoice);
            $file = invoice_fattura_xml($invoice, $invoice['supplier'] ?? billing_profile($state), $progressive);
            $invoice['sdi']['fileName'] = $file['fileName'];
            if ($invoice['sdi']['transmissionStatus'] === 'not_exported') {
                $invoice['sdi']['transmissionStatus'] = 'xml_generated';
                invoice_activity($state, $invoice, 'xml', 'XML generated (' . $file['fileName'] . '); not yet sent to SdI');
            }
            $state['invoices'][$i] = $invoice;
            return $file;
        });
        header('Content-Type: application/xml; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $file['fileName'] . '"');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        echo $file['xml'];
        exit;
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'inv', 'Invoice');
        return Store::instance()->mutate(function (array &$state) use ($id) {
            $i = ops_index($state, 'invoices', $id, 'Invoice');
            if ($state['invoices'][$i]['status'] !== 'draft' || $state['invoices'][$i]['number'] !== null) {
                throw new ApiError('VALIDATION_ERROR', 'Numbered invoices cannot be deleted; cancel them instead.', 409);
            }
            array_splice($state['invoices'], $i, 1);
            return ['deleted' => true];
        });
    },
    'GET billing' => function () {
        $profile = billing_profile(Store::instance()->read());
        return ['profile' => $profile, 'missing' => billing_profile_missing($profile), 'taxRegimes' => TAX_REGIMES, 'natures' => VAT_NATURES, 'paymentModes' => PAYMENT_MODES];
    },
    'POST billing' => function () {
        $in = json_body()['profile'] ?? null;
        $profile = v_billing_party(is_array($in) ? $in : [], true);
        return Store::instance()->mutate(function (array &$state) use ($profile) {
            $state['settings']['billingProfile'] = $profile;
            return ['profile' => $profile, 'missing' => billing_profile_missing($profile), 'taxRegimes' => TAX_REGIMES, 'natures' => VAT_NATURES, 'paymentModes' => PAYMENT_MODES];
        });
    },
]);
