import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStamp } from "@/components/plant-context";

type DayScope = {
  day: string;
  today: string;
  setDay: (day: string) => void;
  lookingBack: boolean;
};

const DayScopeCtx = createContext<DayScope | null>(null);

export function DayScopeProvider({ children }: { children: ReactNode }) {
  const stamp = useStamp();
  const today = stamp.day;
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [today]);

  const day = picked ?? today;
  return (
    <DayScopeCtx.Provider value={{ day, today, setDay: setPicked, lookingBack: day !== today }}>
      {children}
    </DayScopeCtx.Provider>
  );
}

export function useDayScope(): DayScope {
  const ctx = useContext(DayScopeCtx);
  const stamp = useStamp();
  if (!ctx) {
    return {
      day: stamp.day,
      today: stamp.day,
      setDay: () => {},
      lookingBack: false,
    };
  }
  return ctx;
}
