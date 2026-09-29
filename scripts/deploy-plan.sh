#!/usr/bin/env bash
# Builds the lftp command list for a Nivello deploy without touching the server.
#
# Ownership model: the web root is shared with sibling apps (e.g. casco-bene/, demo/).
# A deploy may only create, update, or delete top-level entries that Nivello itself shipped:
#   - entries in the current build (out/) are uploaded; deletion happens only *inside* them
#   - entries listed in the previous deploy's manifest but absent now are removed
#   - anything never listed in a Nivello manifest is never touched
#
# Usage: scripts/deploy-plan.sh <out-dir> <previous-manifest-file> <remote-root>
set -euo pipefail

OUT_DIR=${1:?out dir}
PREV_MANIFEST=${2:?previous manifest (may be an empty file)}
REMOTE_ROOT=${3:?remote root}
MANIFEST_NAME=.nivello-manifest

# Sibling apps that must never be created, replaced, or removed by this site.
PROTECTED_RE='^(casco-bene|demo)$'
# Next.js encodes route-group segments with '!' (e.g. __next.!KGVuKQ).
SAFE_NAME_RE='^[A-Za-z0-9._!-]+$'

fail() { echo "deploy-plan: $*" >&2; exit 1; }

[ -d "$OUT_DIR" ] || fail "missing build output: $OUT_DIR"
[ -f "$OUT_DIR/index.html" ] || fail "build output has no index.html; refusing to deploy"
[ -f "$OUT_DIR/$MANIFEST_NAME" ] || fail "build output has no $MANIFEST_NAME"
[[ "$REMOTE_ROOT" == /* ]] || fail "remote root must be absolute"

validate() {
  local name=$1
  [[ "$name" =~ $SAFE_NAME_RE ]] || fail "unsafe entry name: '$name'"
  [[ "$name" != "." && "$name" != ".." ]] || fail "unsafe entry name: '$name'"
  [[ ! "$name" =~ $PROTECTED_RE ]] || fail "entry collides with a protected sibling app: '$name'"
}

mapfile -t current < "$OUT_DIR/$MANIFEST_NAME"
[ "${#current[@]}" -gt 0 ] || fail "empty manifest"

echo "set sftp:auto-confirm yes"
echo "set cmd:fail-exit yes"

for entry in "${current[@]}"; do
  validate "$entry"
  [ "$entry" = "$MANIFEST_NAME" ] && continue
  if [ -d "$OUT_DIR/$entry" ]; then
    # --delete is scoped to this Nivello-owned directory only.
    echo "mirror -R --delete --verbose \"$OUT_DIR/$entry\" \"$REMOTE_ROOT/$entry\""
  elif [ -f "$OUT_DIR/$entry" ]; then
    echo "put -O \"$REMOTE_ROOT\" \"$OUT_DIR/$entry\""
  else
    fail "manifest lists missing entry: '$entry'"
  fi
done

# Remove only what a previous Nivello deploy shipped and this build no longer contains.
while IFS= read -r old || [ -n "$old" ]; do
  [ -z "$old" ] && continue
  validate "$old"
  [ "$old" = "$MANIFEST_NAME" ] && continue
  if ! printf '%s\n' "${current[@]}" | grep -qxF -- "$old"; then
    echo "rm -r -f \"$REMOTE_ROOT/$old\""
  fi
done < "$PREV_MANIFEST"

# Written last so a failed upload keeps the previous manifest authoritative.
echo "put -O \"$REMOTE_ROOT\" \"$OUT_DIR/$MANIFEST_NAME\""
echo "bye"
