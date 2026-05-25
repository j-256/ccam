#!/usr/bin/env bash
set -euo pipefail

version="v$(node -p 'require("./package.json").version')"

if [ "${CCAM_DRY_RUN:-0}" = "1" ]; then
  echo "==> CCAM_DRY_RUN=1, skipping push"
  echo
  echo "Local commit and tag $version created."
  echo "  Inspect: git show HEAD; git show $version"
  echo "  Undo:    git tag -d $version && git reset --hard HEAD~1"
  echo "  Push:    git push origin main $version"
  exit 0
fi

echo "==> Pushing main and $version"
git push origin main
git push origin "$version"
