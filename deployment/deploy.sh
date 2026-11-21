#!/usr/bin/env bash
set -Eeuo pipefail
umask 027
ROOT=/var/www/stantonysneyveli.in
exec 9>"$ROOT/deploy.lock"
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
SOURCE=$(realpath -e -- "${1:?Supply the uploaded incoming release directory}")
[[ "$SOURCE" == "$ROOT/incoming/"* && -f "$SOURCE/package-lock.json" ]] || { echo 'Invalid incoming release directory.' >&2; exit 1; }
[[ ! -e "$ROOT/live" || -L "$ROOT/live" ]] || { echo 'First deployment: migrate the existing live directory to a release and create the live symlink. See PRODUCTION.md.' >&2; exit 1; }
[[ -f "$ROOT/shared/server.env" && -f "$ROOT/shared/backup-confirmed" ]] || { echo 'Configure shared/server.env and record a verified backup in shared/backup-confirmed first.' >&2; exit 1; }
# A fresh operator confirmation is required for this deployment's database migrations.
[[ $(find "$ROOT/shared/backup-confirmed" -mmin -60 -print) ]] || { echo 'Verify a fresh backup and renew shared/backup-confirmed before deploying.' >&2; exit 1; }
RELEASE="$ROOT/releases/$(date -u +%Y%m%dT%H%M%SZ)-$(basename "$SOURCE")"
mkdir -p "$RELEASE"
cp -a "$SOURCE/." "$RELEASE/"
ln -s "$ROOT/shared/server.env" "$RELEASE/server/.env"
cd "$RELEASE"
npm ci --include=dev --no-audit --no-fund
npm run build
npm run db:migrate
npm run production:check
test -s client/dist/index.html
PREVIOUS=''
if [[ -L "$ROOT/live" ]]; then
  PREVIOUS=$(realpath -e "$ROOT/live")
  [[ -d "$PREVIOUS" && "$PREVIOUS" == "$ROOT/releases/"* ]] || { echo 'The previous release must be an existing directory inside releases.' >&2; exit 1; }
fi
ACTIVATED=false
rollback() {
  if [[ "$ACTIVATED" == true && -n "$PREVIOUS" ]]; then
    ln -s "$PREVIOUS" "$ROOT/live.rollback"
    mv -Tf "$ROOT/live.rollback" "$ROOT/live"
    sudo -n systemctl restart school-api
    echo 'Previous application release restored. Database migrations were not reversed.' >&2
  fi
}
trap rollback ERR
ln -s "$RELEASE" "$ROOT/live.next"
mv -Tf "$ROOT/live.next" "$ROOT/live"
ACTIVATED=true
sudo -n systemctl restart school-api
for attempt in {1..20}; do
  if curl --connect-timeout 2 --max-time 5 --fail --silent http://127.0.0.1:4000/api/health | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{try{process.exit(JSON.parse(s).status==="ok"?0:1)}catch{process.exit(1)}})'; then
    echo "Activated $RELEASE. Verify external HTTPS and staff login before school handover."
    exit 0
  fi
  sleep 2
done
echo 'API health check failed.' >&2
false # Trigger ERR rollback and preserve the failing exit status.
