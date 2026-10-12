#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SEALED=JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N
DAMM=cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG
CPI_OPENER=4SGjnSXNiXNMaoy3wUeW3N3qn8LkZ72XsxT3MenyoD5Z
DBC=dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN
MPL_METADATA=metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
RPC_PORT=${SEALED_RPC_PORT:-18899}
FAUCET_PORT=${SEALED_FAUCET_PORT:-19900}
GOSSIP_PORT=${SEALED_GOSSIP_PORT:-18100}
RPC=http://127.0.0.1:$RPC_PORT

[ -f target/deploy/sealed_call.so ] || { echo "missing target/deploy/sealed_call.so, run anchor build" >&2; exit 1; }
[ -f target/deploy/cpi_opener.so ] || { echo "missing target/deploy/cpi_opener.so, run anchor build" >&2; exit 1; }
[ -f fixtures/damm_v2.so ] || solana program dump -u devnet "$DAMM" fixtures/damm_v2.so
[ -f fixtures/dbc.so ] || solana program dump -u devnet "$DBC" fixtures/dbc.so
[ -f fixtures/mpl_token_metadata.so ] || solana program dump -u devnet "$MPL_METADATA" fixtures/mpl_token_metadata.so
ADMIN=$(solana address -k keys/test-admin.json)

healthy() {
  curl -s -m 2 -X POST -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC" | grep -q '"ok"'
}

if healthy; then
  echo "a validator already answers on $RPC, stop it first" >&2
  exit 1
fi

solana-test-validator --reset --quiet --ledger .test-ledger \
  --rpc-port "$RPC_PORT" --faucet-port "$FAUCET_PORT" --gossip-port "$GOSSIP_PORT" --dynamic-port-range "$GOSSIP_PORT-$((GOSSIP_PORT + 100))" \
  --upgradeable-program "$SEALED" target/deploy/sealed_call.so "$ADMIN" \
  --bpf-program "$DAMM" fixtures/damm_v2.so \
  --bpf-program "$DBC" fixtures/dbc.so \
  --bpf-program "$MPL_METADATA" fixtures/mpl_token_metadata.so \
  --bpf-program "$CPI_OPENER" target/deploy/cpi_opener.so >.test-validator.log 2>&1 &
VALIDATOR=$!
trap 'kill $VALIDATOR 2>/dev/null || true; wait $VALIDATOR 2>/dev/null || true' EXIT

READY=0
for _ in $(seq 1 90); do
  if healthy; then READY=1; break; fi
  kill -0 $VALIDATOR 2>/dev/null || { echo "validator exited:" >&2; tail -20 .test-validator.log >&2; exit 1; }
  sleep 1
done
[ "$READY" = 1 ] || { echo "validator not healthy after 90s" >&2; exit 1; }

RPC_URL="$RPC" npx mocha --import=tsx -t 300000 --exit 'tests/**/*.ts'
