"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Library, Plus, Trash2, Upload, Code } from "lucide-react"
import { PageHeader } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import {
  useDeleteStrategy,
  usePublishStrategy,
  useStrategies,
  useStrategyStats,
} from "@/hooks/use-queries"
import type { Strategy, StrategySourceT } from "@/lib/schemas"
import type { BackendStrategy } from "@/lib/api"

type Tab = "installed" | "authored"

const SOURCE_TONE: Record<StrategySourceT, string> = {
  builtin: "bg-white/[0.05] text-foreground/75",
  marketplace:
    "bg-[var(--color-blue-accent)]/12 text-[var(--color-blue-light)]",
  authored:
    "bg-[var(--color-accent-warm-soft)] text-[var(--color-accent-warm)]",
}

export default function StrategiesPage() {
  const [tab, setTab] = useState<Tab>("installed")
  const { data, isLoading, error } = useStrategies()
  const installed = data?.installed ?? []
  const authored = data?.authored ?? []
  const raw = data?.raw ?? []
  const list = tab === "installed" ? installed : authored

  return (
    <div className="space-y-10">
      <PageHeader
        title="Strategies"
        subtitle="Built-in, marketplace-installed, and your authored strategies."
        action={
          <Link
            href="/app/strategies/new"
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-[var(--color-accent-warm)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)] shadow-[0_8px_24px_-12px_rgba(232,162,122,0.7)] transition hover:bg-[var(--color-accent-warm-hover)]"
          >
            <Plus size={14} /> New strategy
          </Link>
        }
      />

      {error && (
        <div className="rounded-md border border-[var(--color-red)]/30 bg-[var(--color-red)]/10 p-3 text-xs text-[var(--color-red-light)]">
          {(error as Error).message}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-foreground/55">
        <span>
          {installed.length} installed · {authored.length} authored
        </span>
      </div>

      <div className="flex items-center gap-1 border-b border-[rgba(194,203,212,0.08)]">
        <TabBtn
          label={`Installed (${installed.length})`}
          active={tab === "installed"}
          onClick={() => setTab("installed")}
        />
        <TabBtn
          label={`Authored (${authored.length})`}
          active={tab === "authored"}
          onClick={() => setTab("authored")}
        />
      </div>

      {isLoading ? (
        <Skeleton height={200} />
      ) : tab === "installed" && list.length > 0 ? (
        <StrategyCardGrid list={list} raw={raw} />
      ) : list.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-warm-soft)] text-[var(--color-accent-warm)]">
            {tab === "installed" ? (
              <Library size={20} />
            ) : (
              <Upload size={20} />
            )}
          </div>
          <p className="mt-5 text-sm text-foreground/65">
            {tab === "installed"
              ? "No strategies installed."
              : "No authored strategies."}
          </p>
          <div className="mt-5">
            <Link
              href={
                tab === "installed" ? "/app/marketplace" : "/app/strategies/new"
              }
              className="focus-ring inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent-warm)] px-4 py-2 text-xs font-semibold text-[var(--color-surface)] hover:bg-[var(--color-accent-warm-hover)]"
            >
              {tab === "installed" ? "Browse marketplace" : "Author one"}
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="surface divide-y divide-[rgba(194,203,212,0.05)] overflow-hidden">
          {list.map((s) => (
            <StrategyRow key={s.id} s={s} raw={raw} tab={tab} />
          ))}
        </ul>
      )}

      {tab === "installed" && list.length > 0 && (
        <div className="flex justify-end">
          <Link
            href="/app/marketplace"
            className="focus-ring inline-flex items-center gap-1.5 rounded text-xs text-foreground/55 transition hover:text-foreground"
          >
            Browse marketplace
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  )
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring relative -mb-px px-4 py-2.5 text-sm transition-colors ${
        active
          ? "text-foreground"
          : "text-foreground/55 hover:text-foreground/85"
      }`}
    >
      {label}
      {active && (
        <span className="pointer-events-none absolute inset-x-4 -bottom-px h-[2px] rounded-full bg-[var(--color-accent-warm)]" />
      )}
    </button>
  )
}

function StrategyRow({
  s,
  raw,
  tab,
}: {
  s: Strategy
  raw: BackendStrategy[]
  tab: Tab
}) {
  const del = useDeleteStrategy()
  const pub = usePublishStrategy()
  const onDelete = () => {
    if (!confirm(`Remove "${s.name}"?`)) return
    del.mutate(s.id)
  }
  const onPublish = () => {
    if (!confirm(`Publish "${s.name}" to the marketplace?`)) return
    pub.mutate(s.id)
  }
  const backend = raw.find((r) => r.id === s.id)
  return (
    <li className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.015] md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-sm font-semibold tracking-tight text-foreground">
            {s.name}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SOURCE_TONE[s.source]}`}
          >
            {s.source}
          </span>
          {backend?.code_hash && (
            <span className="font-mono text-[11px] text-foreground/40">
              {backend.code_hash.slice(0, 8)}
            </span>
          )}
        </div>
        {s.updated_at && (
          <p className="mt-1.5 font-mono text-[11px] text-foreground/45">
            created {s.updated_at.slice(0, 10)}
          </p>
        )}
        {(del.error || pub.error) && (
          <p className="mt-2 text-[11px] text-[var(--color-red-light)]">
            {((del.error || pub.error) as Error).message}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {tab === "authored" && (
          <Link
            href={`/app/strategies/${s.id}/edit`}
            className="focus-ring inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <Code size={12} /> Edit
          </Link>
        )}
        {s.source === "authored" && (
          <button
            onClick={onPublish}
            disabled={pub.isPending}
            className="focus-ring inline-flex items-center gap-1 rounded-md bg-[var(--color-accent-warm-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-accent-warm)] transition hover:bg-[var(--color-accent-warm)]/18 disabled:opacity-50"
          >
            <Upload size={12} /> {pub.isPending ? "Publishing…" : "Publish"}
          </button>
        )}
        {s.source !== "builtin" && (
          <button
            onClick={onDelete}
            disabled={del.isPending}
            className="focus-ring inline-flex items-center gap-1 rounded-md bg-[var(--color-red)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--color-red-light)] transition hover:bg-[var(--color-red)]/15 disabled:opacity-50"
          >
            <Trash2 size={12} /> {del.isPending ? "…" : "Remove"}
          </button>
        )}
      </div>
    </li>
  )
}

function StrategyCardGrid({
  list,
  raw,
}: {
  list: Strategy[]
  raw: BackendStrategy[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => (
        <StrategyCard key={s.id} s={s} raw={raw} />
      ))}
    </div>
  )
}

function StrategyCard({ s, raw }: { s: Strategy; raw: BackendStrategy[] }) {
  const backend = raw.find((r) => r.id === s.id)
  const hash = backend?.code_hash ?? null
  const { data: stats } = useStrategyStats(hash)
  const del = useDeleteStrategy()
  const onDelete = () => {
    if (!confirm(`Remove "${s.name}"?`)) return
    del.mutate(s.id)
  }
  const trades = stats?.n_trades ?? 0
  const win = stats?.win_rate ?? 0
  const successPct = Math.round(win * 100)
  const successTone =
    win >= 0.6
      ? "text-[var(--color-teal-light)]"
      : win >= 0.45
        ? "text-foreground/80"
        : "text-[var(--color-red-light)]"
  return (
    <div className="surface group flex flex-col gap-4 p-5 transition hover:bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-semibold tracking-tight text-foreground">
            {s.name}
          </p>
          {hash && (
            <p className="mt-1 font-mono text-[11px] text-foreground/40">
              {hash.slice(0, 12)}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SOURCE_TONE[s.source]}`}
        >
          {s.source}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[rgba(194,203,212,0.08)] pt-4">
        <Stat label="Trades" value={String(trades)} />
        <Stat
          label="Win rate"
          value={trades > 0 ? `${successPct}%` : "—"}
          tone={trades > 0 ? successTone : undefined}
        />
      </div>

      {s.source !== "builtin" && (
        <div className="flex items-center justify-end gap-2 border-t border-[rgba(194,203,212,0.08)] pt-3">
          <button
            onClick={onDelete}
            disabled={del.isPending}
            className="focus-ring inline-flex items-center gap-1 rounded-md bg-[var(--color-red)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--color-red-light)] transition hover:bg-[var(--color-red)]/15 disabled:opacity-50"
          >
            <Trash2 size={12} /> {del.isPending ? "…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-foreground/40">{label}</p>
      <p className={`num-tabular mt-1 text-lg font-semibold ${tone ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
