/**
 * 0G Storage sidecar — invoked by app/storage/og_storage.py via subprocess.
 *
 * Protocol:
 *   stdin:  raw JSON string (upload) or root hash string (download)
 *   stdout: last line is a single JSON object: {ok: bool, rootHash?, txHash?, data?, error?}
 *   argv:   [node, index.js, "upload"|"download"]
 *
 * Env: ZERO_G_INDEXER_URL, ZERO_G_RPC_URL, ZERO_G_PRIVATE_KEY
 */
const { ethers } = require("ethers");
const { Indexer, MemData } = require("@0glabs/0g-ts-sdk");

const INDEXER_URL = process.env.ZERO_G_INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";
const RPC_URL = process.env.ZERO_G_RPC_URL || "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.ZERO_G_PRIVATE_KEY || "";

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function readStdin() {
  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => resolve(buf));
  });
}

async function doUpload(jsonStr) {
  if (!PRIVATE_KEY) throw new Error("ZERO_G_PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const indexer = new Indexer(INDEXER_URL);

  const bytes = new TextEncoder().encode(jsonStr);
  const memData = new MemData(bytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`merkleTree: ${treeErr}`);
  const rootHash = tree.rootHash();

  const [tx, upErr] = await indexer.upload(memData, RPC_URL, signer);
  if (upErr) throw new Error(`upload: ${upErr}`);

  // tx shape across versions: prefer explicit txHash else hash field
  const txHash = (tx && (tx.txHash || tx.hash)) || null;
  emit({ ok: true, rootHash, txHash });
}

async function doDownload(rootHash) {
  const indexer = new Indexer(INDEXER_URL);
  const [blob, dlErr] = await indexer.downloadToBlob(rootHash, { proof: true });
  if (dlErr) throw new Error(`download: ${dlErr}`);
  const text = await blob.text();
  emit({ ok: true, data: text });
}

(async () => {
  try {
    const op = process.argv[2];
    const arg = await readStdin();
    if (op === "upload") return await doUpload(arg);
    if (op === "download") return await doDownload(arg.trim());
    throw new Error(`unknown op: ${op}`);
  } catch (e) {
    emit({ ok: false, error: String((e && e.message) || e) });
    process.exit(1);
  }
})();
