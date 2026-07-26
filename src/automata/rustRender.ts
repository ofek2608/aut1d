import { createSignal } from 'solid-js';
import type { Alignment } from '../localStore';

type WasmMod = typeof import('../wasm/rust_lib');
let wasmMod: WasmMod | null = null;

const [rustReady, setRustReady] = createSignal(false);
export { rustReady as rustRendererReady };

export async function initRustRenderer(): Promise<void> {
  const mod = await import('../wasm/rust_lib');
  await mod.default();
  wasmMod = mod;
  setRustReady(true);
}

export function setAutomataRust(identifier: string): boolean {
  if (!wasmMod) return false;
  return wasmMod.set_automata(identifier);
}

export function ensureRowsRust(count: number): void {
  wasmMod?.ensure_rows(count);
}

export function renderRowsRust(
  width: number,
  height: number,
  panX: number,
  panY: number,
  zoom: number,
  alignment: Alignment,
  minPixelSize: number,
  palette: string[],
): Uint8Array | null {
  if (!wasmMod) return null;
  return wasmMod.render_rows(
    width, height, panX, panY, zoom, alignment, minPixelSize,
    JSON.stringify(palette),
  ) ?? null;
}

export function clearRowsRust(): void {
  wasmMod?.clear_rows();
}

export function getRowLenRust(row: number): number {
  return wasmMod?.get_row_len(row) ?? -1;
}

export function getCellRust(row: number, col: number): number {
  return wasmMod?.get_cell(row, col) ?? -1;
}
