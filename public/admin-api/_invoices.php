<?php
declare(strict_types=1);

if (!defined('NIVELLO_ADMIN')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/_ops.php';

/*
 * Fatture (invoices). In Italy the fiscal invoice is the FatturaPA XML delivered through the Sistema di
 * Interscambio (SdI); a PDF is only a courtesy copy. Nivello does not transmit to SdI: it prepares the
 * record, a courtesy PDF and, for the supported scenario, an XML file that the user sends through the
 * Agenzia delle Entrate portal, PEC or their accounting channel, then records the SdI outcome here.
 *
 * Supported XML scenario: ordinary domestic invoice (TD01) in EUR between Italian parties, standard VAT
 * rates or zero-rate lines with a Natura code + legal reference, optional virtual stamp duty.
 * Format: FatturaPA FPR12, schema Schema_VFPR12_v1.2.3 (format specification v1.4, valid from 2025-04-01).
 * Anything else (foreign parties, split payment, credit notes, non-EUR, withholding) blocks the export.
 */

const INVOICE_STATUSES = ['draft', 'ready', 'issued', 'paid', 'cancelled'];
const SDI_STATUSES = ['not_exported', 'xml_generated', 'to_send', 'sent', 'delivered', 'rejected', 'undeliverable'];
const INVOICE_LIMIT = 5000;
const STAMP_DUTY_CENTS = 200;
const FATTURAPA_NAMESPACE = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2';

/** VAT "Natura" codes from the FatturaPA specification (zero-rate lines must state one). */
const VAT_NATURES = [
    'N1' => 'Escluse ex art. 15 DPR 633/72',
    'N2.1' => 'Non soggette – artt. da 7 a 7-septies DPR 633/72',
    'N2.2' => 'Non soggette – altri casi',
    'N3.1' => 'Non imponibili – esportazioni',
    'N3.2' => 'Non imponibili – cessioni intracomunitarie',
    'N3.3' => 'Non imponibili – cessioni verso San Marino',
    'N3.4' => 'Non imponibili – operazioni assimilate alle cessioni all’esportazione',
    'N3.5' => 'Non imponibili – a seguito di dichiarazioni d’intento',
    'N3.6' => 'Non imponibili – altre operazioni',
    'N4' => 'Esenti',
    'N5' => 'Regime del margine / IVA non esposta in fattura',
    'N7' => 'IVA assolta in altro stato UE',
];

/** Regime fiscale codes (RF01–RF20) from the FatturaPA specification. */
const TAX_REGIMES = [
    'RF01' => 'Ordinario', 'RF02' => 'Contribuenti minimi', 'RF04' => 'Agricoltura e attività connesse e pesca',
    'RF05' => 'Vendita sali e tabacchi', 'RF06' => 'Commercio fiammiferi', 'RF07' => 'Editoria',
    'RF08' => 'Gestione servizi telefonia pubblica', 'RF09' => 'Rivendita documenti di trasporto pubblico e di sosta',
    'RF10' => 'Intrattenimenti, giochi e altre attività', 'RF11' => 'Agenzie viaggi e turismo',
    'RF12' => 'Agriturismo', 'RF13' => 'Vendite a domicilio', 'RF14' => 'Rivendita beni usati, oggetti d’arte, antiquariato',
    'RF15' => 'Agenzie di vendite all’asta', 'RF16' => 'IVA per cassa P.A.', 'RF17' => 'IVA per cassa',
    'RF18' => 'Altro', 'RF19' => 'Forfettario', 'RF20' => 'Franchigia IVA transfrontaliera',
];

/** Payment methods (ModalitaPagamento) offered in the editor. */
const PAYMENT_MODES = ['MP01' => 'Contanti', 'MP02' => 'Assegno', 'MP05' => 'Bonifico', 'MP08' => 'Carta di pagamento', 'MP12' => 'RIBA', 'MP19' => 'SEPA Direct Debit'];

const ITALIAN_PROVINCES = ['AG','AL','AN','AO','AP','AQ','AR','AT','AV','BA','BG','BI','BL','BN','BO','BR','BS','BT','BZ','CA','CB','CE','CH','CL','CN','CO','CR','CS','CT','CZ','EN','FC','FE','FG','FI','FM','FR','GE','GO','GR','IM','IS','KR','LC','LE','LI','LO','LT','LU','MB','MC','ME','MI','MN','MO','MS','MT','NA','NO','NU','OR','PA','PC','PD','PE','PG','PI','PN','PO','PR','PT','PU','PV','PZ','RA','RC','RE','RG','RI','RM','RN','RO','SA','SI','SO','SP','SR','SS','SU','SV','TA','TE','TN','TO','TP','TR','TS','TV','UD','VA','VB','VC','VE','VI','VR','VT','VV'];

// ── Validation helpers ──────────────────────────────────────────────────────

/** Italian Partita IVA: 11 digits with the Luhn-style check digit. */
function valid_partita_iva(string $value): bool
{
    if (!preg_match('/^\d{11}$/', $value)) {
        return false;
    }
    $sum = 0;
    for ($i = 0; $i < 10; $i++) {
        $digit = (int) $value[$i];
        if ($i % 2 === 1) {
            $digit *= 2;
            if ($digit > 9) {
                $digit -= 9;
            }
        }
        $sum += $digit;
    }
    return (10 - $sum % 10) % 10 === (int) $value[10];
}

/** Codice fiscale: 16-character personal code or an 11-digit company code. */
function valid_codice_fiscale(string $value): bool
{
    return preg_match('/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/', $value) === 1 || valid_partita_iva($value);
}

function v_text(array $in, string $key, string $label, int $max): string
{
    return v_string($in[$key] ?? '', $label, $max);
}

/** Address + fiscal identity shared by the supplier profile and the client snapshot. */
function v_billing_party(array $in, bool $supplier): array
{
    $party = [
        'name' => v_text($in, 'name', 'Legal name', 80),
        'vatNumber' => strtoupper(preg_replace('/\s+/', '', v_text($in, 'vatNumber', 'Partita IVA', 28)) ?? ''),
        'taxCode' => strtoupper(preg_replace('/\s+/', '', v_text($in, 'taxCode', 'Codice fiscale', 16)) ?? ''),
        'address' => v_text($in, 'address', 'Address', 60),
        'streetNumber' => v_text($in, 'streetNumber', 'Street number', 8),
        'postalCode' => v_text($in, 'postalCode', 'CAP', 5),
        'city' => v_text($in, 'city', 'Comune', 60),
        'province' => strtoupper(v_text($in, 'province', 'Provincia', 2)),
        'country' => strtoupper(v_text($in, 'country', 'Country', 2) ?: 'IT'),
        'pec' => v_email($in['pec'] ?? '', 'PEC'),
    ];
    if ($party['vatNumber'] !== '' && $party['country'] === 'IT' && !valid_partita_iva($party['vatNumber'])) {
        throw new ApiError('VALIDATION_ERROR', 'The Partita IVA is not valid (11 digits with a correct check digit).', 422);
    }
    if ($party['taxCode'] !== '' && $party['country'] === 'IT' && !valid_codice_fiscale($party['taxCode'])) {
        throw new ApiError('VALIDATION_ERROR', 'The codice fiscale is not valid.', 422);
    }
    if ($party['postalCode'] !== '' && $party['country'] === 'IT' && !preg_match('/^\d{5}$/', $party['postalCode'])) {
        throw new ApiError('VALIDATION_ERROR', 'CAP must be 5 digits.', 422);
    }
    if ($party['province'] !== '' && $party['country'] === 'IT' && !in_array($party['province'], ITALIAN_PROVINCES, true)) {
        throw new ApiError('VALIDATION_ERROR', 'Provincia must be a valid two-letter code (e.g. MI).', 422);
    }
    if (!preg_match('/^[A-Z]{2}$/', $party['country'])) {
        throw new ApiError('VALIDATION_ERROR', 'Country must be a two-letter ISO code (e.g. IT).', 422);
    }
    if ($supplier) {
        $party['taxRegime'] = ($in['taxRegime'] ?? '') === '' ? '' : v_enum($in['taxRegime'], 'Regime fiscale', array_keys(TAX_REGIMES));
        $party['email'] = v_email($in['email'] ?? '', 'Email');
        $party['phone'] = v_text($in, 'phone', 'Phone', 20);
        $party['iban'] = strtoupper(preg_replace('/\s+/', '', v_text($in, 'iban', 'IBAN', 34)) ?? '');
        $party['bankName'] = v_text($in, 'bankName', 'Bank', 80);
        $party['showBankDetails'] = v_bool($in['showBankDetails'] ?? false);
        $party['transmitterId'] = strtoupper(preg_replace('/\s+/', '', v_text($in, 'transmitterId', 'Transmitter tax ID', 28)) ?? '');
        $party['defaultPaymentTerms'] = v_text($in, 'defaultPaymentTerms', 'Default payment terms', 200);
        if ($party['iban'] !== '' && !preg_match('/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/', $party['iban'])) {
            throw new ApiError('VALIDATION_ERROR', 'The IBAN is not valid.', 422);
        }
    } else {
        $party['recipientCode'] = strtoupper(v_text($in, 'recipientCode', 'Codice destinatario', 7));
        if ($party['recipientCode'] !== '' && !preg_match('/^[A-Z0-9]{7}$/', $party['recipientCode'])) {
            throw new ApiError('VALIDATION_ERROR', 'Codice destinatario must be 7 letters or digits.', 422);
        }
    }
    return $party;
}

function blank_billing_party(bool $supplier): array
{
    return v_billing_party([], $supplier);
}

function billing_profile(array $state): array
{
    $stored = $state['settings']['billingProfile'] ?? null;
    return array_replace(blank_billing_party(true), is_array($stored) ? $stored : []);
}

/** Supplier fields the XML cannot be built without. */
function billing_profile_missing(array $profile): array
{
    $required = ['name' => 'Legal name', 'vatNumber' => 'Partita IVA', 'taxRegime' => 'Regime fiscale', 'address' => 'Address', 'postalCode' => 'CAP', 'city' => 'Comune'];
    $missing = [];
    foreach ($required as $field => $label) {
        if (($profile[$field] ?? '') === '') {
            $missing[] = $label;
        }
    }
    return $missing;
}

// ── Lines and totals (cents; the server is authoritative) ───────────────────

function decimal_input(mixed $value, string $label, float $min, float $max, int $decimals): float
{
    if (is_string($value)) {
        $value = str_replace(',', '.', trim($value));
    }
    if (!is_numeric($value)) {
        throw new ApiError('VALIDATION_ERROR', "$label must be a number.", 422);
    }
    $number = round((float) $value, $decimals);
    if ($number < $min || $number > $max) {
        throw new ApiError('VALIDATION_ERROR', "$label is out of range.", 422);
    }
    return $number;
}

function invoice_line_input(array $raw, int $n): array
{
    $label = 'Line ' . ($n + 1);
    $description = v_string($raw['description'] ?? '', "$label description", 1000, true);
    $quantity = decimal_input($raw['quantity'] ?? 1, "$label quantity", 0.01, 99999999, 2);
    $price = $raw['unitPrice'] ?? 0;
    $unitPrice = v_money(is_string($price) ? str_replace(',', '.', trim($price)) : $price, "$label price");
    $discount = decimal_input($raw['discountPercent'] ?? 0, "$label discount", 0, 100, 2);
    $vatRate = decimal_input($raw['vatRate'] ?? 22, "$label VAT rate", 0, 99.99, 2);
    $nature = (string) ($raw['vatNature'] ?? '');
    $reference = v_string($raw['vatReference'] ?? '', "$label legal reference", 100);
    if ($vatRate > 0) {
        $nature = '';
        $reference = '';
    } else {
        if (!array_key_exists($nature, VAT_NATURES)) {
            throw new ApiError('VALIDATION_ERROR', "$label has 0% VAT: choose the Natura code that explains why.", 422);
        }
        if ($reference === '') {
            throw new ApiError('VALIDATION_ERROR', "$label has 0% VAT: add the legal reference (e.g. the article of law).", 422);
        }
    }
    $total = (int) round($quantity * $unitPrice * (100 - $discount) / 100);
    return [
        'description' => $description,
        'quantity' => $quantity,
        'unit' => v_string($raw['unit'] ?? '', "$label unit", 10),
        'unitPrice' => $unitPrice,
        'discountPercent' => $discount,
        'vatRate' => $vatRate,
        'vatNature' => $nature,
        'vatReference' => $reference,
        'total' => $total,
    ];
}

/** VAT summary per rate/nature and document totals, rounded once per group as SdI expects. */
function invoice_compute(array $lines, bool $stampDuty): array
{
    $groups = [];
    foreach ($lines as $line) {
        $key = number_format($line['vatRate'], 2, '.', '') . '|' . $line['vatNature'];
        $groups[$key] ??= ['vatRate' => $line['vatRate'], 'vatNature' => $line['vatNature'], 'vatReference' => $line['vatReference'], 'taxable' => 0, 'vat' => 0];
        $groups[$key]['taxable'] += $line['total'];
    }
    $taxable = 0;
    $vat = 0;
    foreach ($groups as &$group) {
        $group['vat'] = (int) round($group['taxable'] * $group['vatRate'] / 100);
        $taxable += $group['taxable'];
        $vat += $group['vat'];
    }
    unset($group);
    $stamp = $stampDuty ? STAMP_DUTY_CENTS : 0;
    return ['vatSummary' => array_values($groups), 'totals' => ['taxable' => $taxable, 'vat' => $vat, 'stampDuty' => $stamp, 'total' => $taxable + $vat + $stamp]];
}

function blank_invoice(): array
{
    $now = now_iso();
    return [
        'id' => new_id('inv'),
        'number' => null,
        'year' => null,
        'sequence' => null,
        'type' => 'TD01',
        'status' => 'draft',
        'issueDate' => gmdate('Y-m-d'),
        'dueDate' => null,
        'projectId' => null,
        'proposalId' => null,
        'leadId' => null,
        'supplier' => null,
        'client' => blank_billing_party(false),
        'lines' => [],
        'currency' => 'EUR',
        'vatSummary' => [],
        'totals' => ['taxable' => 0, 'vat' => 0, 'stampDuty' => 0, 'total' => 0],
        'stampDuty' => false,
        'paymentMode' => 'MP05',
        'paymentTerms' => '',
        'notes' => '',
        'sdi' => ['transmissionStatus' => 'not_exported', 'fileName' => null, 'transmittedAt' => null, 'sdiIdentifier' => '', 'receiptType' => '', 'receiptAt' => null, 'rejectionReason' => ''],
        'paidAt' => null,
        'cancelledAt' => null,
        'cancelReason' => '',
        'createdAt' => $now,
        'updatedAt' => $now,
        'createdByUserId' => null,
        'updatedByUserId' => null,
    ];
}

/** Applies editable fields (drafts only) and recomputes totals. */
function apply_invoice_fields(array $state, array &$invoice, array $in): void
{
    if ($invoice['status'] !== 'draft') {
        throw new ApiError('INVOICE_LOCKED', 'Only draft invoices can be edited. Numbered invoices keep their content.', 409);
    }
    if (array_key_exists('issueDate', $in)) {
        $invoice['issueDate'] = v_date($in['issueDate'], 'Issue date') ?? gmdate('Y-m-d');
    }
    if (array_key_exists('dueDate', $in)) {
        $invoice['dueDate'] = v_date($in['dueDate'], 'Due date');
    }
    if (array_key_exists('currency', $in)) {
        $invoice['currency'] = v_enum($in['currency'], 'Currency', CURRENCIES);
    }
    if (array_key_exists('client', $in)) {
        $invoice['client'] = v_billing_party(is_array($in['client']) ? $in['client'] : [], false);
    }
    foreach (['projectId' => ['projects', 'prj', 'Project'], 'proposalId' => ['proposals', 'prop', 'Proposal'], 'leadId' => ['leads', 'lead', 'Lead']] as $field => [$collection, $prefix, $label]) {
        if (array_key_exists($field, $in)) {
            $invoice[$field] = v_ref($state, $in[$field], $collection, $prefix, $label);
        }
    }
    if (array_key_exists('paymentMode', $in)) {
        $invoice['paymentMode'] = v_enum($in['paymentMode'], 'Payment method', array_keys(PAYMENT_MODES));
    }
    if (array_key_exists('paymentTerms', $in)) {
        $invoice['paymentTerms'] = v_string($in['paymentTerms'], 'Payment terms', 200);
    }
    if (array_key_exists('notes', $in)) {
        $invoice['notes'] = v_string($in['notes'], 'Notes', 1000);
    }
    if (array_key_exists('stampDuty', $in)) {
        $invoice['stampDuty'] = v_bool($in['stampDuty']);
    }
    if (array_key_exists('lines', $in)) {
        $raw = $in['lines'];
        if (!is_array($raw) || count($raw) < 1 || count($raw) > 100) {
            throw new ApiError('VALIDATION_ERROR', 'Use between 1 and 100 lines.', 422);
        }
        $invoice['lines'] = array_map(fn ($line, $n) => invoice_line_input(is_array($line) ? $line : [], $n), array_values($raw), array_keys(array_values($raw)));
    }
    if ($invoice['dueDate'] !== null && $invoice['dueDate'] < $invoice['issueDate']) {
        throw new ApiError('VALIDATION_ERROR', 'The due date cannot be before the issue date.', 422);
    }
    $computed = invoice_compute($invoice['lines'], $invoice['stampDuty']);
    $invoice['vatSummary'] = $computed['vatSummary'];
    $invoice['totals'] = $computed['totals'];
    $invoice['updatedAt'] = now_iso();
    $invoice['updatedByUserId'] = current_admin()['id'] ?? null;
}

/** Final fiscal number at finalize time: "<seq>/<year>", never reused, never renumbered. */
function assign_invoice_number(array &$state, array &$invoice): void
{
    if ($invoice['number'] !== null) {
        return;
    }
    $year = (int) substr($invoice['issueDate'], 0, 4);
    $key = 'invoice-' . $year;
    $used = [];
    foreach ($state['invoices'] as $other) {
        if (($other['year'] ?? null) === $year && $other['sequence'] !== null) {
            $used[(int) $other['sequence']] = true;
        }
    }
    $n = (int) ($state['counters'][$key] ?? 0);
    do {
        $n++;
    } while (isset($used[$n]));
    $state['counters'][$key] = $n;
    $invoice['year'] = $year;
    $invoice['sequence'] = $n;
    $invoice['number'] = $n . '/' . $year;
}

function invoice_due_state(array $invoice, string $today): ?string
{
    return in_array($invoice['status'], ['ready', 'issued'], true) && $invoice['dueDate'] !== null && $invoice['dueDate'] < $today ? 'overdue' : null;
}

function invoice_view(array $state, array $invoice): array
{
    $invoice = array_replace_recursive(blank_invoice(), $invoice);
    $project = ops_find($state, 'projects', $invoice['projectId']);
    $proposal = ops_find($state, 'proposals', $invoice['proposalId']);
    $people = project_people_index();
    return $invoice + [
        'due' => invoice_due_state($invoice, gmdate('Y-m-d')),
        'project' => $project ? ['id' => $project['id'], 'name' => $project['name']] : null,
        'proposal' => $proposal ? ['id' => $proposal['id'], 'number' => $proposal['number'], 'status' => $proposal['status']] : null,
        'createdBy' => $people[$invoice['createdByUserId'] ?? ''] ?? null,
        'xmlProblems' => invoice_xml_problems($invoice, $invoice['supplier'] ?? billing_profile($state)),
    ];
}

function invoice_summary(array $invoice): array
{
    $invoice = array_replace_recursive(blank_invoice(), $invoice);
    return [
        'id' => $invoice['id'],
        'number' => $invoice['number'],
        'status' => $invoice['status'],
        'due' => invoice_due_state($invoice, gmdate('Y-m-d')),
        'issueDate' => $invoice['issueDate'],
        'dueDate' => $invoice['dueDate'],
        'clientName' => $invoice['client']['name'],
        'currency' => $invoice['currency'],
        'total' => $invoice['totals']['total'],
        'projectId' => $invoice['projectId'],
        'proposalId' => $invoice['proposalId'],
        'sdiStatus' => $invoice['sdi']['transmissionStatus'],
        'updatedAt' => $invoice['updatedAt'],
    ];
}

// ── Starting points ─────────────────────────────────────────────────────────

/** A client snapshot suggestion: the last invoice for the same lead/project, then the Preventivo/lead details. */
function suggest_client_billing(array $state, ?string $leadId, ?string $projectId, ?array $proposal): array
{
    $latest = null;
    foreach ($state['invoices'] as $invoice) {
        if (($leadId && ($invoice['leadId'] ?? null) === $leadId) || ($projectId && ($invoice['projectId'] ?? null) === $projectId)) {
            if (!$latest || strcmp($invoice['createdAt'], $latest['createdAt']) > 0) {
                $latest = $invoice;
            }
        }
    }
    if ($latest) {
        return array_replace(blank_billing_party(false), $latest['client']);
    }
    $client = blank_billing_party(false);
    if ($proposal) {
        $client['name'] = mb_substr($proposal['clientCompany'] ?: $proposal['clientName'], 0, 80);
        $client['address'] = mb_substr(strtok($proposal['clientAddress'], "\n,") ?: '', 0, 60);
    }
    $lead = ops_find($state, 'leads', $leadId);
    if ($lead) {
        $client['name'] = $client['name'] ?: mb_substr($lead['companyName'], 0, 80);
        $client['address'] = $client['address'] ?: mb_substr($lead['address'], 0, 60);
        $client['city'] = mb_substr($lead['city'], 0, 60);
        if (strcasecmp($lead['country'], 'Italy') === 0 || strcasecmp($lead['country'], 'Italia') === 0) {
            $client['country'] = 'IT';
        }
    }
    return $client;
}

/**
 * Lines from an accepted Preventivo: every non-optional item, or one line for a percentage of the total
 * (e.g. a deposit). The Preventivo's VAT rate is the starting point; everything stays editable as a draft.
 */
function lines_from_proposal(array $proposal, string $mode, float $percent): array
{
    $rate = (float) ($proposal['tax']['rate'] ?? 0) > 0 ? (float) $proposal['tax']['rate'] : 22.0;
    if ($mode === 'percent') {
        $amount = (int) round($proposal['totals']['total'] / (1 + $rate / 100) * $percent / 100);
        return [[
            'description' => 'Acconto ' . rtrim(rtrim(number_format($percent, 2, ',', ''), '0'), ',') . '% — Preventivo ' . $proposal['number'] . ' — ' . $proposal['title'],
            'quantity' => 1, 'unit' => '', 'unitPrice' => $amount / 100, 'discountPercent' => 0, 'vatRate' => $rate,
        ]];
    }
    $subtotal = (int) ($proposal['totals']['subtotal'] ?? 0);
    $discount = match ($proposal['discount']['type'] ?? 'none') {
        'percent' => (float) $proposal['discount']['value'],
        // A fixed discount becomes the equivalent percentage on every line.
        'amount' => $subtotal > 0 ? round(($proposal['totals']['discount'] ?? 0) * 100 / $subtotal, 2) : 0.0,
        default => 0.0,
    };
    $lines = [];
    foreach ($proposal['items'] as $item) {
        if (!empty($item['optional'])) {
            continue;
        }
        $lines[] = [
            'description' => mb_substr(($item['code'] ?? '') !== '' ? $item['code'] . ') ' . ($item['title'] ?? $item['description']) : ($item['title'] ?? $item['description']), 0, 1000),
            'quantity' => $item['quantity'],
            'unit' => $item['unit'] === 'fixed' ? '' : mb_substr($item['unit'], 0, 10),
            'unitPrice' => $item['unitPrice'] / 100,
            'discountPercent' => $discount,
            'vatRate' => $rate,
        ];
    }
    return $lines;
}

// ── FatturaPA XML (FPR12) ───────────────────────────────────────────────────

/** Reasons the XML cannot be generated for this invoice; empty = supported scenario. */
function invoice_xml_problems(array $invoice, ?array $supplier): array
{
    $problems = [];
    $supplier ??= blank_billing_party(true);
    foreach (billing_profile_missing($supplier) as $field) {
        $problems[] = "Billing profile: $field is missing (Settings → Billing).";
    }
    if (($supplier['country'] ?? 'IT') !== 'IT') {
        $problems[] = 'Only Italian suppliers are supported for XML export.';
    }
    if ($invoice['currency'] !== 'EUR') {
        $problems[] = 'XML export supports EUR invoices only.';
    }
    $client = $invoice['client'];
    if ($client['name'] === '') {
        $problems[] = 'Client: legal name is missing.';
    }
    if ($client['country'] !== 'IT') {
        $problems[] = 'Foreign clients are not supported for XML export in this version.';
    }
    if ($client['vatNumber'] === '' && $client['taxCode'] === '') {
        $problems[] = 'Client: Partita IVA or codice fiscale is required.';
    }
    if ($client['address'] === '' || $client['postalCode'] === '' || $client['city'] === '') {
        $problems[] = 'Client: address, CAP and Comune are required.';
    }
    if (!$invoice['lines']) {
        $problems[] = 'Add at least one line.';
    }
    foreach ($invoice['lines'] as $n => $line) {
        if ($line['vatRate'] == 0 && ($line['vatNature'] === '' || $line['vatReference'] === '')) {
            $problems[] = 'Line ' . ($n + 1) . ': a zero-rate line needs a Natura code and a legal reference.';
        }
    }
    if ($invoice['totals']['total'] <= 0) {
        $problems[] = 'The invoice total must be greater than zero.';
    }
    if ($invoice['number'] === null) {
        $problems[] = 'Finalize the invoice to assign its number before exporting XML.';
    }
    return $problems;
}

function xml_amount(int $cents): string
{
    return number_format($cents / 100, 2, '.', '');
}

function xml_decimal(float $value, int $decimals = 2): string
{
    return number_format($value, $decimals, '.', '');
}

/** Latin-1 printable text as FatturaPA String types expect; other characters are transliterated. */
function xml_text(string $value, int $max): string
{
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    $value = strtr($value, ['€' => 'EUR', '’' => "'", '‘' => "'", '“' => '"', '”' => '"', '–' => '-', '—' => '-', '…' => '...']);
    $latin = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $value);
    $value = $latin === false ? $value : (string) iconv('ISO-8859-1', 'UTF-8', $latin);
    return mb_substr($value, 0, $max);
}

/** Five-character progressive for the SdI file name (IT<id>_<progressive>.xml), stable per invoice. */
function invoice_file_progressive(array &$state, array &$invoice): string
{
    if (!empty($invoice['sdi']['fileName'])) {
        return substr((string) $invoice['sdi']['fileName'], -9, 5);
    }
    $n = (int) ($state['counters']['sdi-file'] ?? 0) + 1;
    $state['counters']['sdi-file'] = $n;
    return str_pad(strtoupper(base_convert((string) $n, 10, 36)), 5, '0', STR_PAD_LEFT);
}

/**
 * Builds the FPR12 XML. Throws when the invoice is outside the supported scenario instead of
 * producing a malformed or guessed file.
 *
 * @return array{xml: string, fileName: string}
 */
function invoice_fattura_xml(array $invoice, array $supplier, string $progressive): array
{
    $problems = invoice_xml_problems($invoice, $supplier);
    if ($problems) {
        throw new ApiError('XML_NOT_SUPPORTED', 'The XML cannot be generated yet: ' . implode(' ', $problems), 422, ['problems' => $problems]);
    }
    $transmitter = $supplier['transmitterId'] !== '' ? $supplier['transmitterId'] : $supplier['vatNumber'];
    $doc = new DOMDocument('1.0', 'UTF-8');
    $doc->formatOutput = true;
    $root = $doc->createElementNS(FATTURAPA_NAMESPACE, 'p:FatturaElettronica');
    $root->setAttribute('versione', 'FPR12');
    $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:ds', 'http://www.w3.org/2000/09/xmldsig#');
    $doc->appendChild($root);

    $add = function (DOMElement $parent, string $name, ?string $value = null) use ($doc): DOMElement {
        $el = $doc->createElement($name);
        if ($value !== null) {
            $el->appendChild($doc->createTextNode($value));
        }
        $parent->appendChild($el);
        return $el;
    };
    $sede = function (DOMElement $parent, array $party) use ($add) {
        $s = $add($parent, 'Sede');
        $add($s, 'Indirizzo', xml_text($party['address'], 60));
        if ($party['streetNumber'] !== '') {
            $add($s, 'NumeroCivico', xml_text($party['streetNumber'], 8));
        }
        $add($s, 'CAP', $party['postalCode']);
        $add($s, 'Comune', xml_text($party['city'], 60));
        if ($party['province'] !== '') {
            $add($s, 'Provincia', $party['province']);
        }
        $add($s, 'Nazione', $party['country']);
    };

    $header = $add($root, 'FatturaElettronicaHeader');
    $trasmissione = $add($header, 'DatiTrasmissione');
    $idT = $add($trasmissione, 'IdTrasmittente');
    $add($idT, 'IdPaese', 'IT');
    $add($idT, 'IdCodice', $transmitter);
    $add($trasmissione, 'ProgressivoInvio', $progressive);
    $add($trasmissione, 'FormatoTrasmissione', 'FPR12');
    $client = $invoice['client'];
    $add($trasmissione, 'CodiceDestinatario', $client['recipientCode'] !== '' ? $client['recipientCode'] : '0000000');
    if ($client['recipientCode'] === '' && $client['pec'] !== '') {
        $add($trasmissione, 'PECDestinatario', $client['pec']);
    }

    $cedente = $add($header, 'CedentePrestatore');
    $anag = $add($cedente, 'DatiAnagrafici');
    $iva = $add($anag, 'IdFiscaleIVA');
    $add($iva, 'IdPaese', 'IT');
    $add($iva, 'IdCodice', $supplier['vatNumber']);
    if ($supplier['taxCode'] !== '') {
        $add($anag, 'CodiceFiscale', $supplier['taxCode']);
    }
    $add($add($anag, 'Anagrafica'), 'Denominazione', xml_text($supplier['name'], 80));
    $add($anag, 'RegimeFiscale', $supplier['taxRegime']);
    $sede($cedente, $supplier);
    if ($supplier['email'] !== '' || $supplier['phone'] !== '') {
        $contatti = $add($cedente, 'Contatti');
        if ($supplier['phone'] !== '') {
            $add($contatti, 'Telefono', xml_text($supplier['phone'], 12));
        }
        if ($supplier['email'] !== '') {
            $add($contatti, 'Email', $supplier['email']);
        }
    }

    $cessionario = $add($header, 'CessionarioCommittente');
    $anagC = $add($cessionario, 'DatiAnagrafici');
    if ($client['vatNumber'] !== '') {
        $ivaC = $add($anagC, 'IdFiscaleIVA');
        $add($ivaC, 'IdPaese', 'IT');
        $add($ivaC, 'IdCodice', $client['vatNumber']);
    }
    if ($client['taxCode'] !== '') {
        $add($anagC, 'CodiceFiscale', $client['taxCode']);
    }
    $add($add($anagC, 'Anagrafica'), 'Denominazione', xml_text($client['name'], 80));
    $sede($cessionario, $client);

    $body = $add($root, 'FatturaElettronicaBody');
    $generali = $add($add($body, 'DatiGenerali'), 'DatiGeneraliDocumento');
    $add($generali, 'TipoDocumento', 'TD01');
    $add($generali, 'Divisa', 'EUR');
    $add($generali, 'Data', $invoice['issueDate']);
    $add($generali, 'Numero', $invoice['number']);
    if ($invoice['stampDuty']) {
        $bollo = $add($generali, 'DatiBollo');
        $add($bollo, 'BolloVirtuale', 'SI');
        $add($bollo, 'ImportoBollo', xml_amount(STAMP_DUTY_CENTS));
    }
    $add($generali, 'ImportoTotaleDocumento', xml_amount($invoice['totals']['total']));
    if ($invoice['notes'] !== '') {
        foreach (str_split(xml_text($invoice['notes'], 1000), 200) as $chunk) {
            $add($generali, 'Causale', $chunk);
        }
    }

    $beni = $add($body, 'DatiBeniServizi');
    foreach ($invoice['lines'] as $n => $line) {
        $row = $add($beni, 'DettaglioLinee');
        $add($row, 'NumeroLinea', (string) ($n + 1));
        $add($row, 'Descrizione', xml_text($line['description'], 1000));
        $add($row, 'Quantita', xml_decimal($line['quantity']));
        if ($line['unit'] !== '') {
            $add($row, 'UnitaMisura', xml_text($line['unit'], 10));
        }
        $add($row, 'PrezzoUnitario', xml_amount($line['unitPrice']));
        if ($line['discountPercent'] > 0) {
            $sconto = $add($row, 'ScontoMaggiorazione');
            $add($sconto, 'Tipo', 'SC');
            $add($sconto, 'Percentuale', xml_decimal($line['discountPercent']));
        }
        $add($row, 'PrezzoTotale', xml_amount($line['total']));
        $add($row, 'AliquotaIVA', xml_decimal($line['vatRate']));
        if ($line['vatNature'] !== '') {
            $add($row, 'Natura', $line['vatNature']);
        }
    }
    foreach ($invoice['vatSummary'] as $group) {
        $riepilogo = $add($beni, 'DatiRiepilogo');
        $add($riepilogo, 'AliquotaIVA', xml_decimal($group['vatRate']));
        if ($group['vatNature'] !== '') {
            $add($riepilogo, 'Natura', $group['vatNature']);
        }
        $add($riepilogo, 'ImponibileImporto', xml_amount($group['taxable']));
        $add($riepilogo, 'Imposta', xml_amount($group['vat']));
        if ($group['vatNature'] === '') {
            $add($riepilogo, 'EsigibilitaIVA', 'I');
        } else {
            $add($riepilogo, 'RiferimentoNormativo', xml_text($group['vatReference'], 100));
        }
    }

    $pagamento = $add($body, 'DatiPagamento');
    $add($pagamento, 'CondizioniPagamento', 'TP02');
    $dettaglio = $add($pagamento, 'DettaglioPagamento');
    $add($dettaglio, 'ModalitaPagamento', $invoice['paymentMode']);
    if ($invoice['dueDate'] !== null) {
        $add($dettaglio, 'DataScadenzaPagamento', $invoice['dueDate']);
    }
    $add($dettaglio, 'ImportoPagamento', xml_amount($invoice['totals']['total']));
    if ($invoice['paymentMode'] === 'MP05' && $supplier['iban'] !== '') {
        if ($supplier['bankName'] !== '') {
            $add($dettaglio, 'IstitutoFinanziario', xml_text($supplier['bankName'], 80));
        }
        $add($dettaglio, 'IBAN', $supplier['iban']);
    }

    return ['xml' => $doc->saveXML(), 'fileName' => 'IT' . $transmitter . '_' . $progressive . '.xml'];
}
