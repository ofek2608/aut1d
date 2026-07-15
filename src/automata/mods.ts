import type { CellMods, StateArray } from './config';

export function applyModsToRow(row: StateArray, y: number, mods: CellMods): StateArray {
  for (const [key, state] of Object.entries(mods)) {
    const comma = key.indexOf(',');
    if (comma < 0) continue;
    if (Number(key.slice(comma + 1)) !== y) continue;
    const x = Number(key.slice(0, comma));
    if (x >= 0 && x < row.length) row[x] = state;
  }
  return row;
}
