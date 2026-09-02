import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { EMPTY } from "@/lib/lab/desk";
import { seatBubbles, seatPreview } from "@/lib/lab/staff-voice";
import { isSeatRead, markSeatRead } from "@/lib/staff-read";
import type { Seat } from "@/lib/lab/stamp";
import { cn } from "@/lib/utils";

function useDesktop() {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const go = () => setDesk(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return desk;
}

export function StaffDesk({ selectedId }: { selectedId?: string }) {
  const stamp = useStamp();
  const desktop = useDesktop();
  const [tick, setTick] = useState(0);
  const openId = selectedId || (desktop ? "clerk" : undefined);
  const seat = stamp.seats.find((s) => s.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    markSeatRead(openId);
    setTick((n) => n + 1);
  }, [openId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden md:h-full">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-border md:w-72 md:border-r",
          openId && "hidden md:flex",
        )}
      >
        <header className="border-b border-border px-4 py-4">
          <h1 className="text-2xl">Staff</h1>
          <p className="mt-1 text-sm text-muted">Who is watching the same bets.</p>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {stamp.seats.map((s) => (
            <SeatRow key={`${s.id}:${tick}`} seat={s} selected={s.id === openId} />
          ))}
        </ul>
      </aside>
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          !openId && "hidden md:flex",
        )}
      >
        {seat ? <Thread seat={seat} showBack={!desktop} /> : <p className="p-6 text-sm text-subtle">{EMPTY}</p>}
      </section>
    </div>
  );
}

function SeatRow({ seat, selected }: { seat: Seat; selected: boolean }) {
  const stamp = useStamp();
  const bubbles = seatBubbles(seat, stamp);
  const unread = bubbles.length > 0 && !isSeatRead(seat.id) && !selected;
  const preview = seatPreview(seat, stamp);
  const lastAt = [...bubbles].reverse().find((b) => b.at)?.at;

  return (
    <li>
      <Link
        to="/staff/$id"
        params={{ id: seat.id }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors duration-150",
          selected ? "bg-elev" : "hover:bg-elev/50",
        )}
      >
        <span className="relative shrink-0">
          <Portrait id={seat.id} name={seat.name} size="md" />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warn" aria-label="Unread" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn("truncate", unread ? "font-medium" : "")}>{seat.name}</p>
            {lastAt ? <p className="font-mono text-[10px] text-subtle">{lastAt}</p> : null}
          </div>
          <p className="truncate text-sm text-subtle">{preview === EMPTY ? EMPTY : preview}</p>
        </div>
      </Link>
    </li>
  );
}

function Thread({ seat, showBack }: { seat: Seat; showBack: boolean }) {
  const stamp = useStamp();
  const bubbles = useMemo(() => seatBubbles(seat, stamp), [seat, stamp]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        {showBack ? (
          <Link to="/staff" className="text-sm text-muted">
            ← Staff
          </Link>
        ) : null}
        <Portrait id={seat.id} name={seat.name} size="sm" />
        <div className="min-w-0">
          <p className="font-medium">{seat.name}</p>
          <p className="font-mono text-[10px] text-subtle">{seat.cadence}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {bubbles.length === 0 ? (
          <p className="text-sm text-subtle">{EMPTY}</p>
        ) : (
          <ol className="space-y-4">
            {bubbles.map((b, i) => {
              const showDay = b.older && (i === 0 || bubbles[i - 1]?.at !== b.at);
              return (
                <li key={`${seat.id}:${i}:${b.text}`} className="log-in">
                  {showDay && b.at ? (
                    <p className="mb-3 text-center font-mono text-[10px] text-subtle">{b.at}</p>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <Portrait id={seat.id} name={seat.name} size="sm" />
                    <div
                      className={cn(
                        "max-w-[36rem] rounded-lg px-3 py-2 text-sm leading-relaxed",
                        b.older ? "bg-surface text-muted" : "bg-elev text-fg",
                      )}
                    >
                      {b.text}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
