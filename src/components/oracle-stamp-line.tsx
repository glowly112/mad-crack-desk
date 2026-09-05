import { LiveDot } from "@/components/live-dot";
import { oracleUtcMeta, ukStampLine } from "@/lib/lab/uk-time";

export function OracleStampLine({
  generated,
  live,
  detail,
  tone,
}: {
  generated: string;
  live: boolean;
  detail: string;
  tone: "ok" | "warn";
}) {
  const label = live ? ukStampLine(generated, "live oracle") : detail;
  const meta = oracleUtcMeta(generated);

  return (
    <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
      <LiveDot tone={tone} tick={generated} />
      <span key={generated} className="stamp-tick" data-oracle-stamp={meta}>
        {label}
      </span>
    </p>
  );
}
