import { createFileRoute } from "@tanstack/react-router";
import { usePrefs } from "@/components/prefs-provider";
import { FONTS, SIZES, THEMES, type Font, type Size, type Theme } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: Settings });

const THEME_LABEL: Record<Theme, string> = {
  charcoal: "Charcoal",
  paper: "Paper",
  night: "Night",
  lab: "Lab",
};

const FONT_LABEL: Record<Font, string> = {
  satoshi: "Satoshi",
  ledger: "Ledger",
  tape: "Tape",
};

const SIZE_LABEL: Record<Size, string> = {
  s: "S",
  m: "M",
  l: "L",
};

export function Settings() {
  const { prefs, setPrefs } = usePrefs();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">This device only. Floor restyles as you tap.</p>
      </header>

      <section className="divide-y divide-border border-y border-border">
        <Row label="Theme" hint="Desk color">
          <Seg
            options={THEMES}
            labels={THEME_LABEL}
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
          />
        </Row>
        <Row label="Type" hint="Face for copy">
          <Seg
            options={FONTS}
            labels={FONT_LABEL}
            value={prefs.font}
            onChange={(font) => setPrefs({ font })}
          />
        </Row>
        <Row label="Size" hint="Whole desk">
          <Seg
            options={SIZES}
            labels={SIZE_LABEL}
            value={prefs.size}
            onChange={(size) => setPrefs({ size })}
          />
        </Row>
      </section>

      <p className="text-sm text-muted">
        Sample · {THEME_LABEL[prefs.theme]} · {FONT_LABEL[prefs.font]} · {SIZE_LABEL[prefs.size]}
      </p>
      <p className="text-sm text-subtle">
        Tape / Ledger / Field on the shell are a proto gallery. They restyle the whole desk and
        override this device theme while a look is on.
      </p>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-subtle">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "min-h-11 min-w-11 rounded-sm px-3 text-sm transition-colors duration-150",
            value === opt ? "bg-elev text-fg" : "text-muted hover:text-fg",
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
