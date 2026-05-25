#!/usr/bin/env bash
set -euo pipefail

branch="$(git branch --show-current)"
if [ "$branch" != "main" ]; then
  echo "Error: npm version must be run on main (currently on '$branch')" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree not clean. Commit or stash first." >&2
  git status --short >&2
  exit 1
fi

echo "==> Building"
npm run build

echo "==> Testing"
npm test
