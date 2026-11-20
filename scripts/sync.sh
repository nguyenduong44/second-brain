#!/usr/bin/env bash
# Auto-sync second-brain lên private GitHub repo.
# An toàn: chỉ chạy trong repo, từ chối khi chưa có remote, từ chối push secret.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Phải là git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Không phải git repo: $REPO_ROOT" >&2
  exit 1
fi

# Phải có remote
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Chưa có remote origin, từ chối push." >&2
  exit 1
fi

# Từ chối nếu .env hoặc secret bị track (không bao giờ push secret)
if git ls-files --error-unmatch .env apps/server/.env 2>/dev/null; then
  echo "Phát hiện .env đã track, từ chối push. Chạy: git rm --cached <file>" >&2
  exit 1
fi
if git status --porcelain | grep -Eq '^\?\? .*\.env($|/)'; then
  echo "Có file .env chưa track, kiểm tra lại trước khi push." >&2
  exit 1
fi

git add .
if git diff --cached --quiet; then
  echo "Không có thay đổi, không commit."
  exit 0
fi

STAMP="$(date '+%Y-%m-%d %H:%M')"
git commit -m "brain: auto-sync $STAMP"
git push origin "$(git rev-parse --abbrev-ref HEAD)"
echo "Đã sync: $STAMP"
