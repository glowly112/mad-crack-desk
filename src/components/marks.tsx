type MarkProps = { className?: string };

function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function LabMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 3h6M10.2 3v4.2L6.4 14.2A5.8 5.8 0 0 0 12 21.5a5.8 5.8 0 0 0 5.6-7.3l-3.8-7V3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.2 13.2 11 12l2.4 1.6 2.2-1.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 18.4h4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function MarkFloor({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.4" />
      <path d="M3.5 10h17M9.5 10v9.5M14.5 10v9.5" />
    </Svg>
  );
}

export function MarkTrends({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 16.5 8 11l3.5 3.2L20.5 6" />
      <path d="M15.5 6H20.5v5" />
    </Svg>
  );
}

export function MarkMoves({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M4 12h7" />
      <path d="M11 12 7.5 7.5M11 12 7.5 16.5" />
      <path d="M14.5 7.5 20 12l-5.5 4.5" />
    </Svg>
  );
}

export function MarkOffice({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h5l3 5 3-5h5" />
      <path d="M12 12v8" />
      <path d="M8 20h8" />
    </Svg>
  );
}

export function MarkStaff({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c.8-3.4 3.2-5 6.5-5s5.7 1.6 6.5 5" />
    </Svg>
  );
}

export function MarkFuse({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M4 12h5.2M14.8 12H20" />
      <path d="M9.2 12 11 8.5 13 15.5 14.8 12" />
    </Svg>
  );
}

export function MarkSolid({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="M8 12.2 10.6 15l5.4-6.5" />
    </Svg>
  );
}

export function MarkKeep({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M8 4h8v4l3 8a5 5 0 0 1-14 0l3-8V4z" />
      <path d="M9 14h6" />
    </Svg>
  );
}

export function MarkMeasure({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M6 18 18 6" />
      <path d="M7.5 16.5 9 15M10.2 13.8 11.5 12.5M13 11 14.3 9.7M15.6 8.4 17 7" />
    </Svg>
  );
}

export function MarkInvent({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <path d="M14.5 16.5h4M16.5 14.5v4" />
    </Svg>
  );
}

export function MarkLive({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M13.2 3.5 6.5 13.5h5.2L10.8 20.5 17.5 10.5h-5.2z" />
    </Svg>
  );
}

export function MarkCard({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="M4 10h16" />
    </Svg>
  );
}

export function MarkSteam({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M7 19c2.2 0 2.2-3 4.4-3s2.2 3 4.4 3 2.2-3 4.2-3" />
      <path d="M5 14c2 0 2-2.6 4-2.6s2 2.6 4 2.6 2-2.6 4-2.6" />
      <path d="M8 9c1.6 0 1.6-2.2 3.3-2.2S13 9 14.6 9" />
    </Svg>
  );
}

export function MarkResidual({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="12" r="3.2" />
      <path d="M14.2 8.2a5.8 5.8 0 0 1 0 7.6M17.2 6a8.6 8.6 0 0 1 0 12" />
    </Svg>
  );
}

export function MarkGeo({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5c-2 2.4-3.1 4.8-3.1 7.5S10 17.1 12 19.5M12 4.5c2 2.4 3.1 4.8 3.1 7.5S14 17.1 12 19.5" />
      <path d="M4.8 12h14.4" />
    </Svg>
  );
}

export function MarkDoc({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="8.5" cy="8.5" r="2.4" />
      <circle cx="16" cy="16" r="2.4" />
      <path d="M10.4 10.2 14.2 14" />
    </Svg>
  );
}

export function MarkLens({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5 20 20" />
    </Svg>
  );
}

export function MarkPipe({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M5 5h14l-3 4.5H8z" />
      <path d="M8 9.5h8L14 14H10z" />
      <path d="M10 14h4v5h-4z" />
    </Svg>
  );
}

export function MarkHealth({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 12h4l2-5 3 10 2-5h6" />
    </Svg>
  );
}

export function MarkIssues({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8v4.5" />
      <path d="M12 16.2h.01" />
    </Svg>
  );
}

export function MarkSettings({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.4 6.4l1.1 1.1M16.5 16.5l1.1 1.1M17.6 6.4l-1.1 1.1M7.5 16.5l-1.1 1.1" />
    </Svg>
  );
}
export const NAV_MARKS = {
  "/": MarkFloor,
  "/trends": MarkTrends,
  "/moves": MarkMoves,
  "/office": MarkOffice,
  "/pipe": MarkPipe,
  "/health": MarkHealth,
  "/issues": MarkIssues,
  "/staff": MarkStaff,
  "/settings": MarkSettings,
} as const;

export const PLANT_MARKS = {
  solid: MarkSolid,
  research: MarkKeep,
  measuring: MarkMeasure,
  invent: MarkInvent,
  live: MarkLive,
} as const;

export const HUNTER_MARKS = {
  card: MarkCard,
  steam: MarkSteam,
  residual: MarkResidual,
  geo: MarkGeo,
  docbrown: MarkDoc,
  lens: MarkLens,
} as const;
