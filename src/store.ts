import { createStore, produce } from 'solid-js/store'
import { MAX_STATES, type AutomataConfig, type RuleMode } from './automata/config'
import { automataStepBatch } from './automata/step'
import {
  applyRuleMode,
  normalizeRules,
  resizeRulesForParents,
  getRuleCountForStates,
} from './automata/rules'
import { randomInt } from './utils'
import { parseConfigIdentifier } from './automata/identifier'

export type Alignment = 'left' | 'center' | 'right'

export const CUSTOM_PALETTE = 'custom'

export const PALETTES: Record<string, string[]> = {
  classic:  ['#da1776', '#a2fc25', '#2cabe6', '#da9617', '#f4a261', '#264653', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a', '#ffd6a5', '#caffbf', '#a8dadc'],
  pastel:   ['#6eb5ff', '#e8789a', '#7bc96f', '#f7b267', '#b088f9', '#ffe066', '#4ecdc4', '#ff6b8a', '#95d5b2', '#cdb4db', '#ffa07a', '#87ceeb', '#dda0dd', '#98d8c8', '#f0a0a0', '#a0c4e8'],
  retro:    ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#aa5500'],
  ocean:    ['#ff6b6b', '#0077b6', '#06d6a0', '#ffd166', '#03045e', '#00b4d8', '#fb5607', '#8338ec', '#2a9d8f', '#ef476f', '#118ab2', '#e9d8a6', '#48cae4', '#264653', '#073b4c', '#caf0f8'],
  fire:     ['#cc0000', '#ffd700', '#4169e1', '#228b22', '#1a1a1a', '#ff4500', '#9400d3', '#ffffcc', '#4a0000', '#ff8c00', '#00ced1', '#ff1493', '#2f4f4f', '#ffa500', '#8b0000', '#ff6347'],
  mono:     ['#000000', '#ffffff', '#808080', '#404040', '#c0c0c0', '#1f2420', '#e8e8e8', '#595959', '#2d3330', '#b3b3b3', '#524a4a', '#4a524a', '#999999', '#262626', '#d6d6d6', '#737373'],
}

const DEFAULT_BATCH = 500;

const DEFAULT_CONFIG: AutomataConfig = parseConfigIdentifier('S2#231123')!;

interface State {
  config: AutomataConfig;
  alignment: Alignment;
  palette: string;
  customColors: string[];
  selectedCustomColor: number;
  rows: number[][];
  selectedState: number;
}

function defaultCustomColors(numStates: number): string[] {
  return Array.from({ length: numStates }, (_, i) => PALETTES.classic[i] ?? '#888888')
}

const [store, setStore] = createStore<State>({
  config: DEFAULT_CONFIG,
  alignment: 'center',
  palette: 'classic',
  customColors: defaultCustomColors(DEFAULT_CONFIG.numStates),
  selectedCustomColor: 0,
  rows: [],
  selectedState: -1,
})

export function regenerateRows(targetCount = DEFAULT_BATCH) {
  const config = { ...store.config };
  const initial = config.initial.slice();
  setStore('rows', [
    initial,
    ...automataStepBatch(config, initial, targetCount)
  ]);
}

export function extendRows(targetCount: number) {
  if (store.rows.length >= targetCount) return;
  const config = { ...store.config };
  setStore(produce(s => {
    const rows = automataStepBatch(config, s.rows[s.rows.length - 1], targetCount - s.rows.length);
    s.rows.push(...rows);
  }))
}

export function applyConfig(config: AutomataConfig) {
  setStore(produce(s => {
    s.config = {
      ...config,
      rules: normalizeRules(config.rules, config.numParents, config.numStates, config.ruleMode),
      initial: config.initial.slice(),
      padLeft: config.padLeft.slice(),
      padRight: config.padRight.slice(),
    }
    s.customColors = defaultCustomColors(config.numStates).map((color, i) => s.customColors[i] ?? color)
    if (s.selectedCustomColor >= config.numStates) s.selectedCustomColor = Math.max(0, config.numStates - 1)
  }))
}

export function setNumParents(n: number) {
  setStore(produce(s => {
    const { numStates, ruleMode } = s.config
    s.config.numParents = n
    s.config.rules = resizeRulesForParents(n, numStates, ruleMode)
    s.config.initial = new Array(2 * n - 1).fill(0)
    if (n > 2) {
      s.config.initial[n - 1] = 1
    }
    s.config.padLeft = new Array(n - 1).fill(0)
    s.config.padRight = new Array(n - 1).fill(0)
  }))
}

export function setNumStates(n: number) {
  const clamped = Math.max(1, Math.min(MAX_STATES, n))
  setStore(produce(s => {
    const { numParents, numStates, ruleMode, rules } = s.config
    if (clamped === numStates) return
    s.config.numStates = clamped
    s.config.rules = normalizeRules(rules, numParents, clamped, ruleMode)
    s.customColors = defaultCustomColors(clamped).map((color, i) => s.customColors[i] ?? color)
    if (s.selectedCustomColor >= clamped) s.selectedCustomColor = Math.max(0, clamped - 1)
  }))
}

export function setRule(displayPos: number, value: number) {
  if (displayPos < 0 || displayPos >= store.config.rules.length) return
  setStore('config', 'rules', displayPos, value)
}

export function setRuleMode(mode: RuleMode) {
  setStore(produce(s => {
    const { numParents, numStates, ruleMode, rules } = s.config
    s.config.ruleMode = mode
    s.config.rules = applyRuleMode(rules, numParents, numStates, ruleMode, mode)
  }))
}

export function randomizeRules() {
  const { numParents, numStates, ruleMode } = store.config
  setStore(produce(s => {
    const count = getRuleCountForStates(ruleMode, numParents, numStates)
    s.config.rules = Array.from({ length: count }, () => randomInt(numStates))
  }))
}

export function computedRuleCount(): number {
  return getRuleCountForStates(store.config.ruleMode, store.config.numParents, store.config.numStates)
}

export function setInitial(cells: number[]) {
  setStore('config', 'initial', cells)
}

export function setPadLeft(cells: number[]) {
  setStore('config', 'padLeft', cells)
}

export function setPadRight(cells: number[]) {
  setStore('config', 'padRight', cells)
}

export function setAlignment(a: Alignment) {
  setStore('alignment', a)
}

export function setPalette(name: string) {
  if (name === CUSTOM_PALETTE || name in PALETTES) setStore('palette', name)
}

export function activePalette(): string[] {
  if (store.palette === CUSTOM_PALETTE) return store.customColors
  return PALETTES[store.palette] ?? PALETTES.classic
}

export function setCustomColor(index: number, color: string) {
  setStore('customColors', index, color)
}

export function setSelectedCustomColor(index: number) {
  setStore('selectedCustomColor', index)
}

export function setSelectedState(state: number) {
  setStore('selectedState', state)
}

export { store }
