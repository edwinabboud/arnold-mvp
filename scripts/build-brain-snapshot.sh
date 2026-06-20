#!/usr/bin/env bash
# build-brain-snapshot.sh — concatenate the LIVE Arnold brain into one
# paste-able file at arnold-system/BRAIN-SNAPSHOT.md.
#
# The repo is the source of truth; this is a convenience snapshot for hydrating
# Claude.ai chats. Regenerate whenever any brain file changes and commit it in
# the SAME commit (see "Snapshot maintenance" in arnold-system/INDEX.md).
#
# Excludes: strategy/private/** (gitignored, sensitive), superseded amendments
# (per INDEX), and non-.md files (e.g. bibles/*.docx).
set -euo pipefail
shopt -s nullglob

# Run from repo root regardless of where the script is invoked from.
cd "$(dirname "$0")/.."

ROOT="arnold-system"
OUT="$ROOT/BRAIN-SNAPSHOT.md"
INDEX="$ROOT/INDEX.md"

# Handoffs to include (both the build and migration records). Add new ones here.
HANDOFFS=(
  "$ROOT/handoffs/build-2026-06.md"
  "$ROOT/handoffs/migration-2026-06.md"
)

SHA="$(git rev-parse --short HEAD)"
DATE="$(date +%Y-%m-%d)"

# Pull the LIVE-amendment line and the Superseded section out of INDEX so the
# skip logic tracks INDEX rather than a hardcoded list.
live_line="$(grep -i 'Amendments LIVE on main' "$INDEX" || true)"
superseded_block="$(awk '/^## Superseded/{f=1; next} /^## /{f=0} f' "$INDEX")"

# An amendment is skipped only if its version is named in the Superseded section
# AND NOT in the LIVE line. (Guards the v2.4.8 case: its draft "(2)" is listed
# superseded, but the approved v2.4.8 is LIVE — so it must NOT be skipped.)
is_superseded() {
  local n="$1"
  local pat="v2\\.4\\.${n}([^0-9]|\$)"   # boundary so 2.4.1 doesn't match 2.4.12
  if grep -Eq "$pat" <<<"$superseded_block" && ! grep -Eq "$pat" <<<"$live_line"; then
    return 0
  fi
  return 1
}

emit() {
  local f="$1"
  [ -f "$f" ] || { echo "  WARN: missing $f (skipped)" >&2; return; }
  printf '\n===== %s =====\n\n' "$f" >> "$OUT"
  cat "$f" >> "$OUT"
}

# Header (truncate/create the file).
printf 'Generated %s from main %s. This is a snapshot for pasting into Claude.ai chats — the repo is the source of truth.\n' "$DATE" "$SHA" > "$OUT"

# 1. INDEX + PROTOCOL (top-level governance files)
emit "$INDEX"
emit "$ROOT/PROTOCOL.md"

# 2. spec
for f in "$ROOT"/spec/*.md; do emit "$f"; done

# 3. amendments (skip superseded per INDEX)
for f in "$ROOT"/amendments/*.md; do
  base="$(basename "$f")"
  n="$(sed -E 's/.*v2_4_([0-9]+)-amendment\.md/\1/' <<<"$base")"
  if [[ "$n" =~ ^[0-9]+$ ]] && is_superseded "$n"; then
    echo "  skip (superseded per INDEX): $base" >&2
    continue
  fi
  emit "$f"
done

# 4-5. strategy (named files only — never strategy/private/**)
emit "$ROOT/strategy/arnold-ai-brain-strategy-v1_0.md"
emit "$ROOT/strategy/arnold-mvp-builder-instructions-v2_2.md"

# 6. bibles (*.md only — excludes .docx)
for f in "$ROOT"/bibles/*.md; do emit "$f"; done

# 7. handoffs (build + migration)
for f in "${HANDOFFS[@]}"; do emit "$f"; done

echo "Wrote $OUT — $(wc -c < "$OUT" | tr -d ' ') bytes" >&2
