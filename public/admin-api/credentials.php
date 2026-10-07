<?php
declare(strict_types=1);

define('NIVELLO_ADMIN', true);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ops.php';
require __DIR__ . '/_vault.php';

/** Adds a project activity entry (never containing the secret) in the main store. */
function credential_activity(string $projectId, string $type, string $message, string $credentialId): void
{
    Store::instance()->mutate(function (array &$state) use ($projectId, $type, $message, $credentialId) {
        ops_index($state, 'projects', $projectId, 'Project');
        add_ops_activity($state, 'project', $projectId, $type, $message, ['credentialId' => $credentialId]);
    });
}

function credential_project_exists(string $projectId): void
{
    ops_index(Store::instance()->read(), 'projects', $projectId, 'Project');
}

function credential_list(string $projectId): array
{
    $items = array_values(array_filter(vault_items(), fn ($i) => $i['projectId'] === $projectId));
    usort($items, fn ($a, $b) => [$a['type'], mb_strtolower($a['label'])] <=> [$b['type'], mb_strtolower($b['label'])]);
    return ['credentials' => array_map('credential_public', $items), 'problem' => vault_problem()];
}

api_run([
    'GET list' => function () {
        $projectId = v_id($_GET['projectId'] ?? '', 'prj', 'Project');
        credential_project_exists($projectId);
        return credential_list($projectId);
    },
    'POST create' => function () {
        $body = json_body();
        $projectId = v_id($body['projectId'] ?? '', 'prj', 'Project');
        $in = is_array($body['credential'] ?? null) ? $body['credential'] : [];
        credential_project_exists($projectId);
        $fields = credential_fields($in);
        $secret = v_string($in['secret'] ?? '', 'Secret', 4000);
        $notes = v_string($in['notes'] ?? '', 'Notes', 4000);
        vault_require();
        $actor = current_admin()['id'];
        $now = now_iso();
        $item = vault_store()->mutate(function (array &$state) use ($projectId, $fields, $secret, $notes, $actor, $now) {
            if (count($state['items']) >= CREDENTIAL_LIMIT) {
                throw new ApiError('VALIDATION_ERROR', 'Credential limit reached.', 422);
            }
            $id = new_id('cred');
            $item = ['id' => $id, 'projectId' => $projectId] + $fields + [
                'hasSecret' => $secret !== '',
                'hasNotes' => $notes !== '',
                'envelope' => vault_encrypt(['secret' => $secret, 'notes' => $notes], $id),
                'createdAt' => $now,
                'updatedAt' => $now,
                'createdByUserId' => $actor,
                'updatedByUserId' => $actor,
            ];
            $state['items'][] = $item;
            return $item;
        });
        vault_protect_file();
        credential_activity($projectId, 'credential_created', 'Credential added: ' . $item['label'], $item['id']);
        return credential_list($projectId);
    },
    'POST update' => function () {
        $body = json_body();
        $id = v_id($body['id'] ?? '', 'cred', 'Credential');
        $in = is_array($body['credential'] ?? null) ? $body['credential'] : [];
        $fields = credential_fields($in);
        // A secret/notes key that is absent keeps the stored value; the browser never had it.
        $secret = array_key_exists('secret', $in) ? v_string($in['secret'], 'Secret', 4000) : null;
        $notes = array_key_exists('notes', $in) ? v_string($in['notes'], 'Notes', 4000) : null;
        $actor = current_admin()['id'];
        $item = vault_store()->mutate(function (array &$state) use ($id, $fields, $secret, $notes, $actor) {
            foreach ($state['items'] as $i => $item) {
                if ($item['id'] !== $id) {
                    continue;
                }
                if ($secret !== null || $notes !== null) {
                    vault_require();
                    $current = vault_decrypt($item['envelope'], $id);
                    $payload = ['secret' => $secret ?? (string) $current['secret'], 'notes' => $notes ?? (string) $current['notes']];
                    $item['envelope'] = vault_encrypt($payload, $id);
                    $item['hasSecret'] = $payload['secret'] !== '';
                    $item['hasNotes'] = $payload['notes'] !== '';
                }
                $item = array_replace($item, $fields, ['updatedAt' => now_iso(), 'updatedByUserId' => $actor]);
                $state['items'][$i] = $item;
                return $item;
            }
            throw new ApiError('NOT_FOUND', 'Credential not found.', 404);
        });
        vault_protect_file();
        credential_activity($item['projectId'], 'credential_updated', 'Credential updated: ' . $item['label'], $id);
        return credential_list($item['projectId']);
    },
    /** Explicit, audited reveal of one credential. */
    'POST reveal' => function () {
        $id = v_id(json_body()['id'] ?? '', 'cred', 'Credential');
        foreach (vault_items() as $item) {
            if ($item['id'] === $id) {
                $payload = vault_decrypt($item['envelope'], $id);
                credential_activity($item['projectId'], 'credential_revealed', 'Credential revealed: ' . $item['label'], $id);
                return ['id' => $id, 'secret' => (string) $payload['secret'], 'notes' => (string) $payload['notes']];
            }
        }
        throw new ApiError('NOT_FOUND', 'Credential not found.', 404);
    },
    'POST delete' => function () {
        $id = v_id(json_body()['id'] ?? '', 'cred', 'Credential');
        $removed = vault_store()->mutate(function (array &$state) use ($id) {
            foreach ($state['items'] as $i => $item) {
                if ($item['id'] === $id) {
                    array_splice($state['items'], $i, 1);
                    return $item;
                }
            }
            throw new ApiError('NOT_FOUND', 'Credential not found.', 404);
        });
        credential_activity($removed['projectId'], 'credential_deleted', 'Credential deleted: ' . $removed['label'], $id);
        return credential_list($removed['projectId']);
    },
]);
