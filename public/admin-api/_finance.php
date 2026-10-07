<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_ops.php';

/* Project payments received from the client. Internal operational tracking, not accounting. */

const PAYMENT_METHODS = ['', 'bank_transfer', 'card', 'cash', 'paypal', 'other'];

/** Validated payment fields; the amount is cents and must be positive. */
function payment_input(array $state, array $project, array $in, array $current = []): array
{
    $now = now_iso();
    $amount = v_money($in['amount'] ?? null, 'Amount');
    if ($amount <= 0) {
        throw new ApiError('VALIDATION_ERROR', 'The amount must be greater than zero.', 422);
    }
    $invoiceId = $in['linkedInvoiceId'] ?? null;
    if ($invoiceId !== null && $invoiceId !== '') {
        $invoiceId = v_id($invoiceId, 'inv', 'Invoice');
        $invoice = ops_find($state, 'invoices', $invoiceId);
        if (!$invoice || ($invoice['projectId'] ?? null) !== $project['id']) {
            throw new ApiError('VALIDATION_ERROR', 'The linked invoice does not belong to this project.', 422);
        }
    } else {
        $invoiceId = null;
    }
    return array_replace([
        'id' => new_id('pay'), 'createdAt' => $now, 'recordedByUserId' => current_admin()['id'] ?? null,
    ], $current, [
        'amount' => $amount,
        'currency' => $project['currency'],
        'date' => v_date($in['date'] ?? null, 'Payment date') ?? throw new ApiError('VALIDATION_ERROR', 'Payment date is required.', 422),
        'method' => v_enum($in['method'] ?? '', 'Payment method', PAYMENT_METHODS),
        'reference' => v_string($in['reference'] ?? '', 'Reference', 120),
        'note' => v_string($in['note'] ?? '', 'Note', 500),
        'linkedInvoiceId' => $invoiceId,
        'updatedAt' => $now,
    ]);
}

/** Refuses an overpayment unless explicitly confirmed, so it is never hidden silently. */
function guard_overpayment(array $state, array $project, int $paidAfter, bool $confirmed): void
{
    $finance = project_finance($state, $project);
    if ($finance['contracted'] !== null && $paidAfter > $finance['contracted'] && !$confirmed) {
        throw new ApiError('OVERPAYMENT', 'This payment would exceed the contracted value of ' . money_label($finance['contracted'], $project['currency']) . '. Confirm to record it anyway.', 409, ['contracted' => $finance['contracted'], 'paidAfter' => $paidAfter]);
    }
}

function money_label(int $cents, string $currency): string
{
    $symbol = ['EUR' => '€', 'USD' => '$', 'GBP' => '£', 'CHF' => 'CHF '][$currency] ?? $currency . ' ';
    return $symbol . number_format($cents / 100, 2, ',', '.');
}

function payments_total(array $payments, ?string $exceptId = null): int
{
    return array_sum(array_map(fn ($p) => $p['id'] === $exceptId ? 0 : $p['amount'], $payments));
}

/**
 * Records a payment once per request id (double clicks and retries return the same result).
 * Shared by the Finance tab and "mark invoice paid".
 */
function record_project_payment(array &$state, int $pi, array $in, ?string $requestId, bool $confirmOverpayment): array
{
    $project = &$state['projects'][$pi];
    $project['payments'] ??= [];
    $project['paymentRequests'] ??= [];
    if ($requestId !== null && isset($project['paymentRequests'][$requestId])) {
        return ['duplicate' => true, 'paymentId' => $project['paymentRequests'][$requestId]];
    }
    $payment = payment_input($state, $project, $in);
    guard_overpayment($state, $project, payments_total($project['payments']) + $payment['amount'], $confirmOverpayment);
    $project['payments'][] = $payment;
    if ($requestId !== null) {
        $project['paymentRequests'][$requestId] = $payment['id'];
        $project['paymentRequests'] = array_slice($project['paymentRequests'], -50, null, true);
    }
    $project['updatedAt'] = now_iso();
    add_ops_activity($state, 'project', $project['id'], 'payment_recorded', 'Payment recorded: ' . money_label($payment['amount'], $payment['currency']), ['paymentId' => $payment['id'], 'amount' => $payment['amount']]);
    return ['duplicate' => false, 'paymentId' => $payment['id']];
}

function v_request_id(mixed $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value) || !preg_match('/^[A-Za-z0-9-]{8,64}$/', $value)) {
        throw new ApiError('VALIDATION_ERROR', 'Invalid request id.', 422);
    }
    return $value;
}
