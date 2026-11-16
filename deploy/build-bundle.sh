#!/usr/bin/env bash
# Builds the standalone bundle for the cPanel host (served at https://www.alakkareya.com/aqar).
# Usage: deploy/build-bundle.sh <output-dir> <dir-with-linux-sharp-packages>
#   <dir-with-linux-sharp-packages> must contain sharp-linux-x64/ and sharp-libvips-linux-x64/
#   (copy them once from the host: ~/aqar-app/node_modules/@img/).
# Requires node_modules installed with node-linker=hoisted (see .npmrc).
set -euo pipefail
OUT="${1:?output dir}"
SHARP_LINUX="${2:?dir with linux sharp packages}"
cd "$(dirname "$0")/.."

# .env.local holds development values; keep it out of the production build
STASH=""
if [ -f .env.local ]; then STASH="$(mktemp)"; mv .env.local "$STASH"; fi
restore() { if [ -n "$STASH" ]; then mv "$STASH" .env.local; fi; }
trap restore EXIT

rm -rf .next
NEXT_PUBLIC_BASE_PATH=/aqar \
NEXT_PUBLIC_SITE_URL=https://www.alakkareya.com/aqar \
NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX=/aqar/uploads \
NEXT_TELEMETRY_DISABLED=1 \
npx -y pnpm@10.12.1 build

rm -rf "$OUT" && mkdir -p "$OUT"
cp -R .next/standalone/. "$OUT/"
mkdir -p "$OUT/.next" "$OUT/node_modules/@img" "$OUT/tmp"
cp -R .next/static "$OUT/.next/static"
cp -R public "$OUT/public"
cp -R "$SHARP_LINUX/sharp-linux-x64" "$SHARP_LINUX/sharp-libvips-linux-x64" "$OUT/node_modules/@img/"
rm -rf "$OUT/.uploads" "$OUT/node_modules/@img/"*darwin*
find "$OUT" \( -name ".DS_Store" -o -name "._*" \) -delete
find "$OUT" -maxdepth 1 -name ".env*" -delete
echo "Bundle ready: $OUT ($(du -sh "$OUT" | cut -f1), $(find "$OUT" -type f | wc -l | tr -d ' ') files)"
