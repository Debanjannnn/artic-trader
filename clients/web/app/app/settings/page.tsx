"use client"

import { Copy, KeyRound, LogOut, Trash2 } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { useWallet } from "@/hooks/use-wallet"
import { useApiKeyHint, useSessions } from "@/hooks/use-queries"
import { displayName, shortenAddr } from "@/lib/identity"
import { CHAIN_ID, EVM_CHAIN_ID } from "@/lib/chain"

export default function SettingsPage() {
  const { address, username, disconnect } = useWallet()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const { data: apiKeyHint, isLoading: apiKeyLoading } = useApiKeyHint()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Your identity, sessions, and API keys." />

      <Section title="Identity">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{displayName(address, username)}</p>
            <p className="mt-0.5 font-mono text-xs text-foreground/50">{shortenAddr(address)}</p>
            <p className="mt-2 font-mono text-[11px] text-foreground/40">
              Chain: <span className="text-foreground/60">{CHAIN_ID}</span>
              <span className="mx-1.5 text-foreground/20">·</span>
              EVM: <span className="text-foreground/60">{EVM_CHAIN_ID}</span>
            </p>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/70 hover:text-foreground"
          >
            <Copy size={12} />
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </Section>

      <Section title="Hub sessions">
        {sessionsLoading ? (
          <Skeleton className="mt-3" height={120} />
        ) : (
        <ul className="mt-3 divide-y divide-white/5 rounded-md border border-white/10 bg-white/[0.02]">
          {sessions.map((s, i) => (
            <li key={s.session_id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {s.session_id}
                  </p>
                  {i === 0 && (
                    <span className="rounded bg-[var(--color-teal)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-teal)]">
                      this tab
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-foreground/50">{s.ua_hint}</p>
                <p className="mt-0.5 font-mono text-[11px] text-foreground/40">
                  scope={s.scope} · expires {s.expires_at.slice(0, 16).replace("T", " ")}
                </p>
              </div>
              <button
                disabled
                title="Hub auth wiring pending"
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-[var(--color-red)]/30 bg-white/[0.02] px-2.5 py-1.5 text-xs text-[var(--color-red-light)] opacity-60"
              >
                <Trash2 size={12} />
                Revoke
              </button>
            </li>
          ))}
        </ul>
        )}
      </Section>

      <Section title="API keys">
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground/60">
              API keys let non-browser clients (scripts, CI) reach the hub. One key per user.
            </p>
            <p className="mt-1.5 font-mono text-xs text-foreground/50">
              current:{" "}
              {apiKeyLoading ? (
                <span className="text-foreground/30">loading…</span>
              ) : (
                <span className="rounded bg-white/[0.04] px-2 py-0.5">{apiKeyHint ?? "none"}</span>
              )}
            </p>
          </div>
          <button
            disabled
            title="Hub auth wiring pending"
            className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/40"
          >
            <KeyRound size={12} /> Rotate
          </button>
        </div>
      </Section>

      <Section title="Session">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground/60">
            Disconnect clears the wallet session in this tab and sends you to{" "}
            <code className="font-mono text-xs">/connect</code>.
          </p>
          <button
            onClick={() => {
              disconnect()
              if (typeof window !== "undefined") window.location.href = "/connect"
            }}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-red)]/30 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-[var(--color-red-light)] hover:bg-[var(--color-red)]/10"
          >
            <LogOut size={12} /> Disconnect
          </button>
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

