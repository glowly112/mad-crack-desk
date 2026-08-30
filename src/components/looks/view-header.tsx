import { useLook } from "@/components/look-provider";

export function ViewHeader({ title, lede }: { title: string; lede?: string }) {
  const look = useLook();
  return (
    <header className={`view-head look-${look}`}>
      <h1>{title}</h1>
      {lede ? <p className="view-lede">{lede}</p> : null}
    </header>
  );
}
