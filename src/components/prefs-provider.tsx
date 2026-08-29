import { createContext, useContext, useMemo, useState } from "react";
import {
  applyPrefs,
  DEFAULT_PREFS,
  type Prefs,
  readStoredPrefs,
  writeStoredPrefs,
} from "@/lib/prefs";

const NEWSREADER =
  "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap";

const PrefsCtx = createContext<{
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
}>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
});

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setState] = useState<Prefs>(() => {
    if (typeof document === "undefined") return DEFAULT_PREFS;
    const next = readStoredPrefs();
    applyPrefs(next);
    return next;
  });

  const value = useMemo(
    () => ({
      prefs,
      setPrefs: (patch: Partial<Prefs>) => {
        const next = { ...prefs, ...patch };
        writeStoredPrefs(next);
        applyPrefs(next);
        setState(next);
      },
    }),
    [prefs],
  );

  return (
    <PrefsCtx.Provider value={value}>
      {prefs.font === "ledger" ? <link rel="stylesheet" href={NEWSREADER} /> : null}
      {children}
    </PrefsCtx.Provider>
  );
}

export function usePrefs() {
  return useContext(PrefsCtx);
}
