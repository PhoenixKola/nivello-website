#!/usr/bin/env bash
# Records the top-level entries this build owns, for scripts/deploy-plan.sh.
set -euo pipefail
OUT_DIR=${1:-out}
find "$OUT_DIR" -mindepth 1 -maxdepth 1 ! -name .nivello-manifest -printf '%f\n' | sort > "$OUT_DIR/.nivello-manifest"
echo "Wrote $(wc -l < "$OUT_DIR/.nivello-manifest") entries to $OUT_DIR/.nivello-manifest"
