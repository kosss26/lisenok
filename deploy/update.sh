#!/bin/bash
# Build locally and publish dist/ to the VPS as a new release (static files served by nginx).
# Needs SSH to root@151.243.212.26. Usage: deploy/update.sh
set -euo pipefail
SERVER="${LISENOK_SERVER:-root@151.243.212.26}"
TAG="$(date -u +%Y%m%dT%H%M%SZ)"
cd "$(dirname "$0")/.."
npm run build
ssh "$SERVER" "mkdir -p /var/www/lisenok/releases/$TAG"
tar -C dist -czf - . | ssh "$SERVER" "tar -C /var/www/lisenok/releases/$TAG -xzf -"
ssh "$SERVER" "ln -sfn /var/www/lisenok/releases/$TAG /var/www/lisenok/current && ls -1dt /var/www/lisenok/releases/* | tail -n +6 | xargs -r rm -rf"
echo "published $TAG → https://lisenok.151.243.212.26.nip.io/"
