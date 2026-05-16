"use client"

import { useEffect, useState } from "react"

export interface Eip6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any
}

/**
 * Discover all injected wallets via EIP-6963. Each wallet (MetaMask, Bitget,
 * OKX, Coinbase, Rabby, etc.) announces itself with name + icon + rdns so the
 * dapp can show a picker instead of grabbing whichever wallet happened to
 * monopolise `window.ethereum`.
 */
export function useInjectedProviders(): Eip6963ProviderDetail[] {
  const [providers, setProviders] = useState<Eip6963ProviderDetail[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail
      if (!detail?.info) return
      setProviders((prev) => {
        if (prev.find((p) => p.info.uuid === detail.info.uuid)) return prev
        return [...prev, detail]
      })
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener)
    window.dispatchEvent(new Event("eip6963:requestProvider"))
    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        onAnnounce as EventListener,
      )
    }
  }, [])

  return providers
}
