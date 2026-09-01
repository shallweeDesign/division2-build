#!/usr/bin/env bash
#
# 部署到 GitHub Pages / Sync a fresh build into the Pages site.
#
# The target is a folder inside another repo (shallweeDesign.github.io), served
# at https://shallweedesign.github.io/lab/division2_builder/.
#
# Why this exists rather than a plain `cp`: Vite names assets by content hash,
# so every rebuild writes new filenames beside the old ones. Copying over the
# top leaves the previous bundles behind for good — they are unreferenced but
# still shipped, and after a few deploys nobody can tell which are live. The
# target is therefore wiped and rewritten each time.
#
# It stops after syncing. Committing and pushing is a public act and stays a
# deliberate one, so the commands are printed rather than run.
set -euo pipefail

TARGET="${DEPLOY_TARGET:-/Volumes/j256g/jGitHub/shallweeDesign/shallweeDesign.github.io/lab/division2_builder}"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGES_REPO="$(cd "$(dirname "$TARGET")/.." && pwd 2>/dev/null || true)"

die() { printf '\n✗ %s\n' "$1" >&2; exit 1; }

# The Pages repo lives on an external drive, so the usual failure is that it
# simply is not mounted — say that, rather than creating a stray directory.
[ -d "$(dirname "$TARGET")" ] || die "找不到 $(dirname "$TARGET")
  外接碟掛載了嗎？ / Is the drive mounted?
  或用 DEPLOY_TARGET=<路徑> 指定別的位置。"

echo "▸ 建置 / Building…"
cd "$PROJECT"
npm run build >/dev/null || die "建置失敗，未部署 / Build failed; nothing was copied."

echo "▸ 同步到 / Syncing into  $TARGET"
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$PROJECT/dist/." "$TARGET/"

echo
echo "已部署的檔案 / Files deployed:"
(cd "$TARGET" && find . -type f | sed 's|^\./|  |' | sort)

# Guard against the one mistake this script cannot fix: a build made for the
# wrong base path 404s every asset the moment it leaves the dev server.
if ! grep -q '/lab/division2_builder/assets/' "$TARGET/index.html"; then
  die "index.html 的資源路徑不是 /lab/division2_builder/ — 檢查 vite.config.ts 的 base
  Asset paths are wrong for this sub-path; check \`base\` in vite.config.ts."
fi
echo
echo "✓ 資源路徑正確 / Asset paths verified"

if [ -n "$PAGES_REPO" ] && [ -d "$PAGES_REPO/.git" ]; then
  echo
  echo "Pages repo 變更 / Changes in the Pages repo:"
  git -C "$PAGES_REPO" status --short -- lab/division2_builder | sed 's/^/  /' || true
  if [ -z "$(git -C "$PAGES_REPO" status --porcelain -- lab/division2_builder)" ]; then
    echo "  (無變更 — 線上已是這個版本 / none; the live site already has this build)"
  else
    cat <<EOF

接著執行 / Then run:
  git -C "$PAGES_REPO" add lab/division2_builder
  git -C "$PAGES_REPO" commit -m "lab: update the Division 2 build planner"
  git -C "$PAGES_REPO" push origin main
EOF
  fi
fi
