// 0G Mainnet (chain 16661).
export const CHAIN_ID = "0g-mainnet"
export const RPC_URL =
  (process.env.NEXT_PUBLIC_ZERO_G_RPC_URL as string | undefined) ||
  "https://evmrpc.0g.ai"
export const EVM_CHAIN_ID = Number(
  (process.env.NEXT_PUBLIC_ZERO_G_CHAIN_ID as string | undefined) || "16661",
)
export const AUTH_CHAIN_NAME = "0g-mainnet"

const EXPLORER_BASE =
  (process.env.NEXT_PUBLIC_ZERO_G_EXPLORER_BASE as string | undefined) ||
  "https://chainscan.0g.ai"

export function explorerTxUrl(txHash: string | null | undefined): string | null {
  if (!txHash) return null
  const h = txHash.startsWith("0x") ? txHash : `0x${txHash}`
  return `${EXPLORER_BASE.replace(/\/+$/, "")}/tx/${h}`
}

export function explorerAddressUrl(address: string | null | undefined): string | null {
  if (!address) return null
  return `${EXPLORER_BASE.replace(/\/+$/, "")}/address/${address}`
}

/** Deployed 0G mainnet contract addresses. */
export const CONTRACTS = {
  decisionLogger:
    (process.env.NEXT_PUBLIC_DECISION_LOGGER_ADDRESS as string | undefined) ||
    "0x70a15Db526104abC2f021b7c690cd89a07EDE49C",
  tradeLogger:
    (process.env.NEXT_PUBLIC_TRADE_LOGGER_ADDRESS as string | undefined) ||
    "0xeeb56334152D6bDB62aacF56f8DbCceA5210b78D",
  strategyINFT:
    (process.env.NEXT_PUBLIC_STRATEGY_INFT_ADDRESS as string | undefined) ||
    "0x2A9caFEDFc91d55E00B6d1514E39BeB940832b5D",
} as const

export function shortHash(txHash: string | null | undefined): string {
  if (!txHash) return ""
  const h = txHash.startsWith("0x") ? txHash : `0x${txHash}`
  if (h.length <= 12) return h
  return `${h.slice(0, 6)}…${h.slice(-4)}`
}
