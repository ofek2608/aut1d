import type { AutomataConfig, StateArray } from './config';
import { automataStepBatch } from './step';
import { applyModsToRow } from './mods';

const DEFAULT_BATCH = 500;

let rows: StateArray[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getRows(): readonly StateArray[] {
  return rows;
}

export function onRowsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function regenerateRows(config: AutomataConfig, targetCount = DEFAULT_BATCH) {
  const initial = config.initial.slice();
  applyModsToRow(initial, 0, config.mods);
  rows = [initial, ...automataStepBatch(config, initial, targetCount, 1)];
  notify();
}

export function extendRows(config: AutomataConfig, targetCount: number) {
  if (rows.length >= targetCount) return;
  const more = automataStepBatch(
    config,
    rows[rows.length - 1],
    targetCount - rows.length,
    rows.length,
  );
  rows.push(...more);
  notify();
}
