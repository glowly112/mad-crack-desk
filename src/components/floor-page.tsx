import { DoNext } from "@/components/do-next";
import { HeroStrip } from "@/components/hero-strip";
import { FieldFloor } from "@/components/looks/field-floor";
import { LedgerFloor } from "@/components/looks/ledger-floor";
import { TapeFloor } from "@/components/looks/tape-floor";
import { useLook } from "@/components/look-provider";
import { PackList } from "@/components/pack-list";

export function FloorPage() {
  const look = useLook();
  if (look === "tape") return <TapeFloor />;
  if (look === "ledger") return <LedgerFloor />;
  if (look === "field") return <FieldFloor />;
  return (
    <div className="space-y-10">
      <HeroStrip />
      <DoNext />
      <PackList />
    </div>
  );
}
