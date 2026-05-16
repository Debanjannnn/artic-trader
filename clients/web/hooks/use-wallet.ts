"use client"

import { useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { injected } from "wagmi/connectors"

const WAGMI_LS_KEYS = [
  "wagmi.store",
  "wagmi.connections",
  "wagmi.recentConnectorId",
  "wagmi.cache",
  "wagmi.wallet",
]

function clearWagmiStorage() {
  if (typeof window === "undefined") return
  try {
    for (const k of WAGMI_LS_KEYS) localStorage.removeItem(k)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith("wagmi")) localStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDefaultInjected(): any | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).ethereum ?? null
}

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [revokeSupported, setRevokeSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const eth = getDefaultInjected()
    if (!eth?.on) return
    const log = (label: string) => (...args: unknown[]) =>
      console.log(`[wallet] ${label}:`, ...args)
    eth.on("accountsChanged", log("accountsChanged"))
    eth.on("chainChanged", log("chainChanged"))
    return () => {
      eth.removeListener?.("accountsChanged", log("accountsChanged"))
      eth.removeListener?.("chainChanged", log("chainChanged"))
    }
  }, [])

  /**
   * Connect to a specific injected provider (EIP-6963). When `provider` is
   * omitted, falls back to `window.ethereum` (whatever monopolised it).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openConnect = async (provider?: any) => {
    const eth = provider ?? getDefaultInjected()
    if (!eth?.request) {
      console.error("[wallet] no injected provider available")
      return
    }
    try {
      try {
        await disconnectAsync()
      } catch {
        /* ignore */
      }
      clearWagmiStorage()

      let revokedOk = false
      try {
        await eth.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
        revokedOk = true
        setRevokeSupported(true)
      } catch (e) {
        setRevokeSupported(false)
        console.warn("[wallet] revoke not supported on this provider:", e)
      }

      try {
        await eth.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        })
      } catch (e) {
        console.error("[wallet] permission denied:", e)
        return
      }

      // Bind wagmi to this specific provider via injected target override.
      const result = await connectAsync({
        connector: injected({
          target: () => ({
            id: "windowProvider",
            name: "Injected",
            provider: eth,
          }),
        }),
      })
      const picked = result.accounts?.[0]
      console.log("[wallet] connected:", picked)

      if (!revokedOk && picked && address && picked.toLowerCase() === address.toLowerCase()) {
        alert(
          "Same account returned. Open your wallet extension and switch account there, " +
            "then the page will auto-update. (Or install MetaMask for one-click switching.)",
        )
      }
    } catch (e) {
      console.error("[wallet] openConnect failed:", e)
    }
  }

  const disconnect = async () => {
    const eth = getDefaultInjected()
    if (eth?.request) {
      try {
        await eth.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
      } catch {
        /* unsupported */
      }
    }
    try {
      await disconnectAsync()
    } catch {
      /* already disconnected */
    }
    clearWagmiStorage()
  }

  return {
    address: address ?? null,
    username: null as string | null,
    isConnected,
    openConnect,
    openWallet: () => {},
    disconnect,
    revokeSupported,
    autoSign: null as null,
    requestTxBlock: undefined,
    submitTxBlock: undefined,
    estimateGas: undefined,
  }
}
