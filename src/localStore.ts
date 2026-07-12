import { createEffect, createRoot } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

export type Alignment = 'left' | 'center' | 'right';

export const CUSTOM_PALETTE = 'custom';

export const PALETTES: Record<string, string[]> = {
  classic:  ['#da1776', '#a2fc25', '#2cabe6', '#da9617', '#f4a261', '#264653', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a', '#ffd6a5', '#caffbf', '#a8dadc'],
  pastel:   ['#6eb5ff', '#e8789a', '#7bc96f', '#f7b267', '#b088f9', '#ffe066', '#4ecdc4', '#ff6b8a', '#95d5b2', '#cdb4db', '#ffa07a', '#87ceeb', '#dda0dd', '#98d8c8', '#f0a0a0', '#a0c4e8'],
  retro:    ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#aa5500'],
  ocean:    ['#ff6b6b', '#0077b6', '#06d6a0', '#ffd166', '#03045e', '#00b4d8', '#fb5607', '#8338ec', '#2a9d8f', '#ef476f', '#118ab2', '#e9d8a6', '#48cae4', '#264653', '#073b4c', '#caf0f8'],
  fire:     ['#cc0000', '#ffd700', '#4169e1', '#228b22', '#1a1a1a', '#ff4500', '#9400d3', '#ffffcc', '#4a0000', '#ff8c00', '#00ced1', '#ff1493', '#2f4f4f', '#ffa500', '#8b0000', '#ff6347'],
  mono:     ['#000000', '#ffffff', '#808080', '#404040', '#c0c0c0', '#1f2420', '#e8e8e8', '#595959', '#2d3330', '#b3b3b3', '#524a4a', '#4a524a', '#999999', '#262626', '#d6d6d6', '#737373'],
};

const STORAGE_KEY = 'aut1d-view';

interface LocalState {
  alignment: Alignment;
  palette: string;
  customColors: string[];
}

function defaultCustomColors(length: number): string[] {
  return Array.from({ length }, (_, i) => PALETTES.classic[i] ?? '#888888');
}

const DEFAULT_LOCAL: LocalState = {
  alignment: 'center',
  palette: 'classic',
  customColors: defaultCustomColors(2),
};

function isAlignment(value: unknown): value is Alignment {
  return value === 'left' || value === 'center' || value === 'right';
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function loadLocalState(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LOCAL, customColors: defaultCustomColors(2) };

    const parsed = JSON.parse(raw) as Partial<LocalState>;
    const alignment = isAlignment(parsed.alignment) ? parsed.alignment : DEFAULT_LOCAL.alignment;
    const palette = typeof parsed.palette === 'string'
      && (parsed.palette === CUSTOM_PALETTE || parsed.palette in PALETTES)
      ? parsed.palette
      : DEFAULT_LOCAL.palette;
    const customColors = Array.isArray(parsed.customColors)
      && parsed.customColors.length > 0
      && parsed.customColors.every(isColor)
      ? parsed.customColors
      : defaultCustomColors(2);

    return { alignment, palette, customColors };
  } catch {
    return { ...DEFAULT_LOCAL, customColors: defaultCustomColors(2) };
  }
}

const [localStore, setLocalStore] = createStore<LocalState>(loadLocalState());

createRoot(() => {
  createEffect(() => {
    const snapshot: LocalState = {
      alignment: localStore.alignment,
      palette: localStore.palette,
      customColors: [...localStore.customColors],
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore quota / private-mode errors
    }
  })
})

export function setAlignment(a: Alignment) {
  setLocalStore('alignment', a);
}

export function setPalette(name: string) {
  if (name === CUSTOM_PALETTE || name in PALETTES) setLocalStore('palette', name);
}

export function setCustomColor(index: number, color: string) {
  if (index < 0 || index >= localStore.customColors.length) return;
  if (!isColor(color)) return;
  setLocalStore('customColors', index, color);
}

export function ensureCustomColorsLength(numStates: number) {
  setLocalStore(produce(s => {
    if (s.customColors.length === numStates) return;
    s.customColors = defaultCustomColors(numStates).map((color, i) => s.customColors[i] ?? color);
  }));
}

export function activePalette(): string[] {
  if (localStore.palette === CUSTOM_PALETTE) return localStore.customColors;
  return PALETTES[localStore.palette] ?? PALETTES.classic;
}

export { localStore };
