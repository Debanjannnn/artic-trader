#!/usr/bin/env bash
# Probe Morph API + snapshot accessibility for each key/snapshot pair.
# Usage: ./morph_probe.sh
set -uo pipefail

PAIRS=(
  "morph_JBhXsH4cGOIeKyTiJhPTUp|snapshot_ficv8isg"
  "morph_JBhXsH4cGOIeKyTiJhPTUp|snapshot_k4u6uox0"
  "morph_ly3PutPVLZKvZuxFj3lafk|snapshot_ficv8isg"
  "morph_ly3PutPVLZKvZuxFj3lafk|snapshot_k4u6uox0"
)

for pair in "${PAIRS[@]}"; do
  KEY="${pair%%|*}"
  SNAP="${pair##*|}"
  echo "=== KEY ${KEY:0:20}... SNAP $SNAP ==="

  echo -n "  /instances: "
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $KEY" https://cloud.morph.so/api/instances

  echo -n "  /snapshots/$SNAP: "
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $KEY" "https://cloud.morph.so/api/snapshots/$SNAP"

  echo
done

echo "Pair returning 200/200 = use that key + snapshot on Render."
