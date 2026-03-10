#!/usr/bin/env bash
set -euo pipefail

fail=0

# No upstream hive tool prefix should reappear in plugin runtime tool names.
if rg -n "hive_(feature|plan|task|worktree|merge|context|status|skill)" packages/opencode-pantheon/src/index.ts; then
  echo "[guard] Found hive_* runtime tool prefix in pantheon plugin." >&2
  fail=1
fi

# .hive runtime paths should not replace .pantheon paths.
if rg -n "\\.hive(/|')" packages/opencode-pantheon/src packages/pantheon-core/src; then
  echo "[guard] Found .hive runtime path in Pantheon source." >&2
  fail=1
fi

# Pantheon agent IDs must remain present.
if ! rg -n "enlil-validator|enki-planner|marduk-orchestrator|kulla-coder|nanshe-reviewer" packages/pantheon-core/src/types.ts >/dev/null; then
  echo "[guard] Missing expected Pantheon agent IDs in types." >&2
  fail=1
fi

exit "$fail"
