/** Display clocks in Europe/London (BST/GMT). Oracle stamps stay Z in meta only. */

const UK = "Europe/London";

const COMPACT_Z = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/i;

/** Parse oracle compact or ISO timestamps as UTC instants. */
export function parseOracleInstant(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  const compact = COMPACT_Z.exec(s);
  if (compact) {
    const [, y, mo, d, h, mi, sec] = compact;
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec)));
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

type UkParts = { hh: string; mm: string; ss: string };

function ukParts(d: Date): UkParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { hh: get("hour"), mm: get("minute"), ss: get("second") };
}

function ukTzAbbr(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK,
    timeZoneName: "short",
  }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "UK";
}

function bareHm(raw: string): string | null {
  const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!hm) return null;
  const hh = hm[1].padStart(2, "0");
  return hm[3] ? `${hh}:${hm[2]}:${hm[3]}` : `${hh}:${hm[2]}:00`;
}

/** UK wall clock for trades, hops, and tickets. Bare HH:MM is treated as already local. */
export function ukClock(...raws: Array<string | null | undefined>): string {
  for (const raw of raws) {
    if (!raw || raw === "Empty") continue;
    const instant = parseOracleInstant(raw);
    if (instant) {
      const { hh, mm, ss } = ukParts(instant);
      return `${hh}:${mm}:${ss}`;
    }
    const bare = bareHm(raw);
    if (bare) return bare;
  }
  return "";
}

/** Floor / Trades stamp line — readable UK clock with quiet oracle Z in data-oracle-stamp. */
export function ukStampLine(generated: string, suffix?: string): string {
  const instant = parseOracleInstant(generated);
  if (!instant) return suffix ? `${generated} · ${suffix}` : generated;

  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK,
    day: "numeric",
    month: "short",
  }).format(instant);
  const { hh, mm, ss } = ukParts(instant);
  const tz = ukTzAbbr(instant);
  const line = `${dateFmt} ${hh}:${mm}:${ss} ${tz}`;
  return suffix ? `${line} · ${suffix}` : line;
}

/** UTC oracle stamp for data attributes / debugging — not shown as primary UI. */
export function oracleUtcMeta(raw: string): string | undefined {
  const instant = parseOracleInstant(raw);
  if (!instant) return raw || undefined;
  return instant.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Staff hop divider — HH:MM UK when the hop carries a Z stamp. */
export function ukHopAt(at: string): string {
  if (!at) return "";
  const instant = parseOracleInstant(at);
  if (!instant) return at;
  const { hh, mm } = ukParts(instant);
  return `${hh}:${mm}`;
}
