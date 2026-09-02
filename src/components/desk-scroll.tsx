import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Charcoal track + thumb. Hides the OS overlay bar. Thumb fades after scroll. */
export function DeskScroll({
  axis = "x",
  className,
  children,
}: {
  axis?: "x" | "y";
  className?: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ size: 0, offset: 0, needed: false });
  const [lit, setLit] = useState(false);
  const fade = useRef<number>(0);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (axis === "x") {
      const needed = el.scrollWidth > el.clientWidth + 2;
      const size = needed ? Math.max(28, (el.clientWidth / el.scrollWidth) * el.clientWidth) : 0;
      const max = el.scrollWidth - el.clientWidth;
      const travel = el.clientWidth - size;
      const offset = max > 0 ? (el.scrollLeft / max) * travel : 0;
      setThumb({ size, offset, needed });
    } else {
      const needed = el.scrollHeight > el.clientHeight + 2;
      const size = needed ? Math.max(28, (el.clientHeight / el.scrollHeight) * el.clientHeight) : 0;
      const max = el.scrollHeight - el.clientHeight;
      const travel = el.clientHeight - size;
      const offset = max > 0 ? (el.scrollTop / max) * travel : 0;
      setThumb({ size, offset, needed });
    }
  }, [axis]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    const frame = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    const onScroll = () => {
      measure();
      setLit(true);
      window.clearTimeout(fade.current);
      fade.current = window.setTimeout(() => setLit(false), 700);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(fade.current);
    };
  }, [measure]);

  return (
    <div
      className={cn("desk-scroll-wrap", axis === "y" && "desk-scroll-wrap-y", className)}
      data-lit={lit ? "" : undefined}
    >
      <div ref={scroller} className={cn("desk-scroll", axis === "x" ? "desk-scroll-x" : "desk-scroll-y")}>
        {children}
      </div>
      {thumb.needed ? (
        <div className="desk-track" aria-hidden>
          <div
            className="desk-thumb"
            style={
              axis === "x"
                ? { width: thumb.size, transform: `translate3d(${thumb.offset}px,0,0)` }
                : { height: thumb.size, transform: `translate3d(0,${thumb.offset}px,0)` }
            }
          />
        </div>
      ) : null}
    </div>
  );
}
