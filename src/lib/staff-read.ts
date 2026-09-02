const KEY = "mcl.staff.read";

function load(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

function save(ids: Set<string>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify([...ids]));
}

export function isSeatRead(id: string): boolean {
  return load().has(id);
}

export function markSeatRead(id: string) {
  const next = load();
  if (next.has(id)) return;
  next.add(id);
  save(next);
}

export function readSeatIds(): Set<string> {
  return load();
}
