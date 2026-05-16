# 0G Storage Sidecar

Thin Node wrapper around `@0glabs/0g-ts-sdk`, invoked by
`app/storage/og_storage.py` via subprocess. Required because 0G has no
Python SDK; uploads need a Flow contract `submit()` tx plus segment upload.

## Install

```
cd app/storage/sidecar
npm install
```

## Env

- `ZERO_G_INDEXER_URL` (default `https://indexer-storage-testnet-turbo.0g.ai`)
- `ZERO_G_RPC_URL` (default `https://evmrpc-testnet.0g.ai`)
- `ZERO_G_PRIVATE_KEY` (required; falls back to `CHAIN_PRIVATE_KEY` in Python)

## Manual smoke test

```
echo '{"hello":"0g"}' | ZERO_G_PRIVATE_KEY=0x... node index.js upload
echo '<rootHash>' | node index.js download
```

Output: single JSON line `{ok:true, rootHash, txHash}` or `{ok:false, error}`.
