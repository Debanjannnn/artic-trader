"use client"

import { useEffect, useState } from "react"
import { Flag, X } from "lucide-react"

const MAX_REASON_LEN = 500

/**
 * Simple report modal. Renders as a fixed-position overlay while `open`.
 * Submit is disabled (hub auth wiring pending) but the form state is
 * shape-complete so it can wire to signedFetch POST /marketplace/{id}/report
 * in one edit.
 */
export function ReportDialog({
  open,
  strategyName,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}: {
  open: boolean
  strategyName: string
  onClose: () => void
  onSubmit?: (reason: string) => void | Promise<void>
  submitting?: boolean
  error?: string | null
}) {
  const [reason, setReason] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) {
      setReason("")
      setSubmitted(false)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const trimmed = reason.trim()
  const ok = trimmed.length >= 10 && trimmed.length <= MAX_REASON_LEN

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-title"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="report-title"
              className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
              <Flag size={16} className="text-[var(--color-red-light)]" />
              Report strategy
            </h2>
            <p className="mt-1 font-mono text-xs text-foreground/50">{strategyName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-foreground/40 transition hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        {submitted ? (
          <div className="py-8 text-center text-sm text-foreground/70">
            Thanks — submission will be reviewed by admins. 3+ reports within 7 days
            auto-hides a strategy.
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-foreground/60">
              Tell us what&apos;s wrong. Be specific — bad-faith reports may be revoked.
            </p>
            <textarea
              className="min-h-[120px] w-full resize-y rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-[var(--color-orange)]/50 focus:outline-none"
              placeholder="eg. Strategy imports os.environ despite the sandbox block, or sleeps inside the hot loop, or …"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LEN))}
              autoFocus
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-foreground/40">
              <span>min 10 chars</span>
              <span>
                {trimmed.length}/{MAX_REASON_LEN}
              </span>
            </div>
            {error && (
              <p className="mt-2 text-[11px] text-[var(--color-red-light)]">{error}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={!ok || submitting}
                title={!ok ? "Give at least 10 characters of context" : undefined}
                onClick={async () => {
                  if (!ok) return
                  try {
                    await onSubmit?.(trimmed)
                    setSubmitted(true)
                  } catch {
                    // surfaced via error prop
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-red)]/40 bg-[var(--color-red)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-red-light)] transition hover:bg-[var(--color-red)]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Flag size={14} /> {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
