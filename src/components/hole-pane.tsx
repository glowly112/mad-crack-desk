import { EMPTY } from "@/lib/lab/desk";
import type { EmptyHolePane } from "@/lib/lab/hole-pane";

export function HolePaneCard({ pane, onClose }: { pane: EmptyHolePane; onClose: () => void }) {
  return (
    <aside
      className="mt-3 border border-border bg-elev px-3 py-3"
      aria-label={`Hole · ${pane.title}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-fg">{pane.title}</h3>
          <p className="mt-0.5 font-mono text-[10px] text-subtle">{pane.market}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-sm px-2 py-1 text-xs text-muted"
        >
          Close
        </button>
      </header>
      <dl className="mt-3 grid gap-2 text-sm">
        <Row label="State" value={pane.state} />
        <Row label="Invent" value={capInvent(pane.invent)} />
        <Row label="Skin" value={pane.skin} mono />
        <Row label="Prefer" value={pane.prefer} />
        <Row label="Distrust" value={pane.distrust} />
      </dl>
    </aside>
  );
}

function capInvent(v: EmptyHolePane["invent"]): string {
  if (v === "waiting") return "Waiting";
  if (v === "hunting") return "Hunting";
  if (v === "parked") return "Parked";
  return EMPTY;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const shown = value && value !== EMPTY ? value : EMPTY;
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-0.5">
      <dt className="text-subtle">{label}</dt>
      <dd className={mono && shown !== EMPTY ? "font-mono text-xs text-muted" : "text-muted"}>
        {shown}
      </dd>
    </div>
  );
}
