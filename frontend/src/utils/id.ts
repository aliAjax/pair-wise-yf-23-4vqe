let sequence = 0;

/** 生成形如 fx-7f3a-0001 的本地 ID */
export function createId(prefix: string): string {
  sequence += 1;
  const rand = Math.random().toString(16).slice(2, 6);
  return `${prefix}-${Date.now().toString(36).slice(-5)}${rand}${String(sequence).padStart(3, "0")}`;
}

export function nextNumericId(rows: { id: string | number }[]): number {
  return rows.reduce((max, row) => {
    const n = typeof row.id === "number" ? row.id : Number(String(row.id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0) + 1;
}
