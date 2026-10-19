#!/usr/bin/env bash
# Deploy MMO Maths on a Debian/Ubuntu VM and print a server status report.
# Usage (on the VM):  bash deploy-gce.sh            # installs/updates and starts the service
#                     bash deploy-gce.sh --status   # only print the status report
set -euo pipefail

REPO="${REPO:-https://github.com/chenletian-byte/MMO-Niulai.git}"
BRANCH="${BRANCH:-claude/o-level-math-practice-i4ljvs}"
APP_DIR="${APP_DIR:-/opt/mmo-maths}"
DATA_DIR="${DATA_DIR:-/var/lib/mmo-maths}"
PORT="${PORT:-}"

status() {
  echo "================ SERVER STATUS ================"
  echo "--- Host"; hostnamectl 2>/dev/null | sed -n '1,8p' || uname -a
  echo "--- Memory (RAM)"; free -h
  echo "--- Disk"; df -h -x tmpfs -x devtmpfs -x squashfs
  echo "--- Load / uptime"; uptime
  echo "--- Listening ports (what is serving)"; sudo ss -ltnp 2>/dev/null | sed 's/users:/\n      users:/' || true
  echo "--- Running services (non-system)"
  systemctl list-units --type=service --state=running --no-legend 2>/dev/null \
    | grep -Ev 'systemd-|dbus|cron|ssh|getty|polkit|rsyslog|google-|chrony|unattended|serial|networkd|resolved|udev|accounts-daemon|qemu-guest|snapd|multipathd|user@|haveged|packagekit' || true
  if command -v docker >/dev/null 2>&1; then echo "--- Docker containers"; sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' || true; fi
  if command -v pm2 >/dev/null 2>&1; then echo "--- pm2"; pm2 ls || true; fi
  echo "--- Top processes by memory"; ps -eo pid,user,%mem,%cpu,etime,cmd --sort=-%mem | head -15
  echo "================================================"
}

if [[ "${1:-}" == "--status" ]]; then status; exit 0; fi

echo ">> Status before deploying"; status

# Node.js >= 22.5 (needed for node:sqlite)
need_node=1
if command -v node >/dev/null 2>&1; then
  v=$(node -p 'process.versions.node.split(".").map(Number).reduce((a,b,i)=>a+b*[1e6,1e3,1][i],0)')
  [[ "$v" -ge 22005000 ]] && need_node=0
fi
if [[ $need_node == 1 ]]; then
  echo ">> Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v git >/dev/null || sudo apt-get install -y git

# Pick a free port (prefer 3000)
if [[ -z "$PORT" ]]; then
  for p in 3000 3100 3200 3300 8088; do
    if ! sudo ss -ltn | awk '{print $4}' | grep -qE "[:.]$p$"; then PORT=$p; break; fi
  done
fi
echo ">> Using port $PORT"

sudo mkdir -p "$APP_DIR" "$DATA_DIR"
sudo chown -R "$USER" "$APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR" && npm ci --omit=dev

sudo useradd --system --no-create-home --shell /usr/sbin/nologin mmo 2>/dev/null || true
sudo chown -R mmo "$DATA_DIR"
ENV_FILE=/etc/mmo-maths.env
if [[ ! -f $ENV_FILE ]]; then
  echo "PORT=$PORT
DATA_DIR=$DATA_DIR
# DEEPSEEK_API_KEY=
# SECURE_COOKIE=1   (set once you serve it over HTTPS)" | sudo tee $ENV_FILE >/dev/null
fi
sudo tee /etc/systemd/system/mmo-maths.service >/dev/null <<UNIT
[Unit]
Description=MMO Maths (O-Level practice)
After=network.target

[Service]
User=mmo
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v node) --no-warnings server/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now mmo-maths
sudo systemctl restart mmo-maths
sleep 2
PORT=$(sudo grep -E '^PORT=' $ENV_FILE | cut -d= -f2)
if curl -fsS "http://127.0.0.1:$PORT/api/meta" >/dev/null; then
  IP=$(curl -fsS -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo '<external-ip>')
  echo ">> MMO Maths is running: http://$IP:$PORT"
  echo ">> If it does not open from your browser, allow the port once (run in Cloud Shell):"
  echo "   gcloud compute firewall-rules create allow-mmo-$PORT --allow tcp:$PORT --source-ranges 0.0.0.0/0"
else
  echo "!! Service did not answer; logs:"; sudo journalctl -u mmo-maths -n 40 --no-pager
fi
echo ">> Status after deploying"; status
