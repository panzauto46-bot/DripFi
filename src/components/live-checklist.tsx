import { prdSyncStatus } from "@/lib/dripfi-config";

export function LiveChecklist() {
  return (
    <section className="panel rounded-[2rem] p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            PRD Sync Snapshot
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-[-0.04em] text-[var(--ink)]">
            April 5, 2026 implementation status
          </h2>
        </div>
        <p className="max-w-lg text-sm leading-7 text-[var(--muted)]">
          This section is the repo-level answer to the PRD sync request: what is already live or
          integration-ready now, and what still needs live chain verification.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {prdSyncStatus.map((item) => (
          <article key={item.label} className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-display text-2xl tracking-[-0.04em] text-[var(--ink)]">
                {item.label}
              </p>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--gold)]">
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
