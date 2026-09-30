<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ops.php';

api_run([
    'GET logo' => function () {
        $id = v_id($_GET['id'] ?? '', 'prop', 'Proposal id');
        $state = Store::instance()->read();
        $proposal = $state['proposals'][ops_index($state, 'proposals', $id, 'Proposal')];
        $logo = $proposal['clientLogo'] ?? null;
        if (!$logo || !preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/', $logo['file'] ?? '')) throw new ApiError('NOT_FOUND', 'Logo not found.', 404);
        $path = ADMIN_DATA_DIR . '/proposals/logos/' . $id . '/' . $logo['file'];
        if (!is_file($path)) throw new ApiError('NOT_FOUND', 'Logo not found.', 404);
        header('Content-Type: ' . $logo['mime']);
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: private, no-store');
        readfile($path);
        exit;
    },
    'GET file' => function () {
        $id = v_id($_GET['id'] ?? '', 'prop', 'Proposal id');
        $revision = filter_var($_GET['revision'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 999]]);
        $format = v_enum($_GET['format'] ?? '', 'Format', ['docx', 'pdf']);
        if (!$revision) throw new ApiError('VALIDATION_ERROR', 'Invalid revision.', 422);
        $state = Store::instance()->read();
        $proposal = $state['proposals'][ops_index($state, 'proposals', $id, 'Proposal')];
        $version = null;
        foreach ($proposal['versions'] ?? [] as $candidate) if (($candidate['revision'] ?? 0) === $revision) $version = $candidate;
        if (!$version || !($version['files'][$format] ?? false)) throw new ApiError('NOT_FOUND', 'Archived document not found.', 404);
        $name = preg_replace('/[^A-Z0-9._-]/i', '-', $proposal['number']) . '.' . $format;
        $path = ADMIN_DATA_DIR . '/proposals/files/' . $id . '/v' . $revision . '/' . $name;
        if (!is_file($path)) throw new ApiError('NOT_FOUND', 'Archived document not found.', 404);
        header('Content-Type: ' . ($format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: private, no-store');
        readfile($path);
        exit;
    },
]);
