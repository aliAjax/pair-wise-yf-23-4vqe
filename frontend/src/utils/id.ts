/** 本地自增 ID 工具，基于集合内最大 id */
export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
