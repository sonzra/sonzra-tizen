#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TV_IP="192.168.31.189"
TV_PORT="26101"
TARGET_NAME="TQ65QN80FAUXXC"
DIST_DIR="$SCRIPT_DIR/dist"
CERTS_DIR="/root/SamsungCertificate/Sonzra Tizen"

echo "=== [1/5] Building Web Assets (Vite + TypeScript) ==="
cd "$SCRIPT_DIR"
npm run build

echo "=== [2/5] Packaging & Signing Sonzra.wgt with Samsung Profile ==="
docker run --rm \
  -v "$CERTS_DIR:/certs" \
  -v "$DIST_DIR:/app" \
  --entrypoint /bin/bash georift/install-jellyfin-tizen -c "
cat << 'EOF' > /home/developer/tizen-studio-data/profile/profiles.xml
<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
<profiles active=\"Sonzra\" version=\"3.1\">
  <profile name=\"Sonzra\">
    <profileitem ca=\"\" distributor=\"0\" key=\"/certs/author.p12\" password=\"TuYU06wdrvekG3rK9WC8IQ==\" rootca=\"\"/>
    <profileitem ca=\"\" distributor=\"1\" key=\"/certs/distributor.p12\" password=\"TuYU06wdrvekG3rK9WC8IQ==\" rootca=\"\"/>
    <profileitem ca=\"\" distributor=\"2\" key=\"\" password=\"\" rootca=\"\"/>
  </profile>
</profiles>
EOF
rm -f /app/*.wgt
tizen package -t wgt -s Sonzra -- /app
"

echo "=== [3/5] Checking TV Accessibility & SDB Connection ==="
if ! nc -z -w 2 "$TV_IP" "$TV_PORT"; then
  echo "Error: Cannot reach $TV_IP:$TV_PORT. Ensure TV is turned ON and in Developer Mode."
  exit 1
fi
echo "✓ TV port $TV_PORT is OPEN."
/root/tizentv-tools/sdb/sdb connect "$TV_IP:$TV_PORT"
/root/tizentv-tools/sdb/sdb devices

echo "=== [4/5] Installing Sonzra.wgt onto $TARGET_NAME ==="
docker run --rm --net=host \
  -v "$DIST_DIR:/app" \
  --entrypoint /bin/bash georift/install-jellyfin-tizen -c \
  "tizen install -n '/app/Sonzra.wgt' -t $TARGET_NAME"

echo "=== [5/5] Launching Sonzra on Samsung TV Screen ==="
docker run --rm --net=host \
  --entrypoint /bin/bash georift/install-jellyfin-tizen -c \
  "tizen run -p Sonzra0001.SonzraTV -t $TARGET_NAME"

echo "🎉 Sonzra TV app deployed and launched successfully!"
