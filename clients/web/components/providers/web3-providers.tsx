"use client"

import { PropsWithChildren, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, createStorage, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { defineChain } from "viem"
import { EVM_CHAIN_ID, RPC_URL } from "@/lib/chain"

const zeroG = defineChain({
  id: EVM_CHAIN_ID,
  name: "0G Mainnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: { name: "0G Chainscan", url: "https://chainscan.0g.ai" },
  },
})

// In-memory storage — wagmi will not persist connection across page reloads.
// User must explicitly click "Connect" each visit, eliminating the silent
// auto-reconnect that pinned the page to a previously-bound account.
const memoryStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
}

const wagmiConfig = createConfig({
  chains: [zeroG],
  connectors: [injected()],
  transports: { [zeroG.id]: http(RPC_URL) },
  storage: createStorage({ storage: memoryStorage }),
})

export function Web3Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 3000, retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  )
}
