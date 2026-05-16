"use client"

/**
 * Hub auth via EIP-4361 (SIWE) on 0G mainnet.
 *
 * Flow:
 *   1. user connects an injected EVM wallet (MetaMask etc.) via useWallet()
 *   2. fetch nonce from hub keyed on the wallet address
 *   3. personal_sign the hub's canonical sign-in message
 *   4. POST signature to /auth/verify → JWT
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  buildSigninMessage,
  clearJwt,
  fetchNonce,
  hex,
  jwtExpMs,
  loadJwt,
  newSessionKeypair,
  saveJwt,
  verifySignature,
  type StoredJwt,
} from "@/lib/hub-auth"
import { useWallet } from "@/hooks/use-wallet"

const HUB_URL =
  (process.env.NEXT_PUBLIC_HUB_URL as string | undefined) || "http://localhost:9000"
const CHAIN =
  (process.env.NEXT_PUBLIC_HUB_AUTH_EVM_CHAIN as string | undefined) || "0g-mainnet"
const SESSION_SCOPE = "authenticated-actions"
const SESSION_TTL_SECONDS = 8 * 60 * 60

type Status = "idle" | "running" | "ok" | "error"

interface Eip1193 {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getInjected(): Eip1193 | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return (w.ethereum as Eip1193 | undefined) ?? null
}

export function useHubAuth() {
  const { address: walletAddress, isConnected, openConnect } = useWallet()
  const [token, setToken] = useState<StoredJwt | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    const cached = loadJwt()
    if (cached && cached.exp > Date.now()) {
      setToken(cached)
      setStatus("ok")
    }
    setHydrated(true)
  }, [])

  const run = useCallback(async () => {
    if (inFlight.current) return
    const eth = getInjected()
    if (!eth || !walletAddress) {
      setError("connect a wallet first")
      setStatus("error")
      return
    }
    inFlight.current = true
    setStatus("running")
    setError(null)
    try {
      // Re-request accounts: MetaMask invalidates dapp permission across
      // network switches / page reloads. Without this, personal_sign throws
      // "method and/or account has not been authorized by the user".
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[]
      if (!accounts?.length) {
        throw new Error("no wallet account available")
      }
      const address = accounts[0]
      const nonce = await fetchNonce(HUB_URL, address, CHAIN)
      const session = newSessionKeypair()
      const session_expires_at_iso = new Date(
        Date.now() + SESSION_TTL_SECONDS * 1000,
      ).toISOString()

      const message = buildSigninMessage({
        chain: CHAIN,
        address,
        nonce: nonce.nonce,
        session_pub: session.pub_b64,
        session_scope: SESSION_SCOPE,
        issued_at_iso: nonce.issued_at,
        session_expires_at_iso,
      })

      const msgHex =
        "0x" +
        Array.from(new TextEncoder().encode(message))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      const sig = (await eth.request({
        method: "personal_sign",
        params: [msgHex, address],
      })) as string

      const verify = await verifySignature({
        hubUrl: HUB_URL,
        address,
        chain: CHAIN,
        nonce: nonce.nonce,
        pubkey_b64: "",
        signature_b64: sig,
        session_pub_b64: session.pub_b64,
        session_scope: SESSION_SCOPE,
        session_expires_at_iso,
      })

      const stored: StoredJwt = {
        access_token: verify.access_token,
        session_id: verify.session_id,
        session_priv_hex: hex(session.priv),
        address,
        init_username: verify.init_username,
        exp: jwtExpMs(verify.access_token) || Date.now() + 15 * 60 * 1000,
      }
      saveJwt(stored)
      setToken(stored)
      setStatus("ok")
    } catch (e: unknown) {
      setStatus("error")
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      inFlight.current = false
    }
  }, [walletAddress])

  const signOut = useCallback(() => {
    clearJwt()
    setToken(null)
    setStatus("idle")
  }, [])

  return {
    token,
    status,
    error,
    hydrated,
    run,
    signOut,
    openConnect,
    address: walletAddress,
    isWalletConnected: isConnected,
    initUsername: token?.init_username ?? null,
  }
}
