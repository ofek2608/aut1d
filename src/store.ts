import { createStore, produce } from 'solid-js/store'
import { automataStep, type AutomataConfig } from './automata'
import {
  applyRuleMode,
  displayRuleCount,
  displayRuleIndices,
  equivalentRuleIndices,
  fullRuleCount,
  resizeRules,
  type RuleMode,
} from './rules'

export type Alignment = 'left' | 'center' | 'right'
export type { RuleMode }

export const PALETTES: Record<string, string[]> = {
  classic:  ['#da1776', '#a2fc25', '#2cabe6', '#da9617', '#f4a261', '#264653', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a', '#ffd6a5', '#caffbf', '#a8dadc'],
  pastel:   ['#fdf4ff', '#ffd6ff', '#c8b6ff', '#b8c0ff', '#bbd0ff', '#a0c4ff', '#9bf6ff', '#caffbf', '#fdffb6', '#ffadad', '#ffc6ff', '#bde0fe', '#a2d2ff', '#cdb4db', '#ffc8dd', '#ffafcc'],
  retro:    ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#aa5500'],
  ocean:    ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#caf0f8', '#e0fbfc', '#98c1d9', '#3d5a80', '#293241', '#1b4332', '#2d6a4f', '#40916c', '#52b788'],
  fire:     ['#03071e', '#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08', '#ffe169', '#fdf4b2', '#fcf6bd', '#f19c79', '#c77dff', '#a44a3f'],
  mono:     ['#000000', '#111111', '#222222', '#333333', '#555555', '#777777', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee', '#ffffff', '#e8d5b7', '#c9b99a', '#a89070'],
}

const DEFAULT_BATCH = 500

const DEFAULT_CONFIG: AutomataConfig = {
  numParents: 2,
  numStates: 3,
  rules: [1, 2, 0, 2, 0, 1, 0, 1, 2],
  initial: [0],
  padLeft: [0],
  padRight: [0],
}

interface State {
  config: AutomataConfig;
  alignment: Alignment;
  palette: string;
  rows: number[][];
  selectedState: number;
  ruleMode: RuleMode;
}

const [store, setStore] = createStore<State>({
  config: DEFAULT_CONFIG,
  alignment: 'center',
  palette: 'classic',
  rows: [],
  selectedState: 0,
  ruleMode: 'symmetric',
})

export function regenerateRows(targetCount = DEFAULT_BATCH) {
  const config = { ...store.config }
  const rows: number[][] = [config.initial.slice()]
  let prev = config.initial
  for (let i = 1; i < targetCount; i++) {
    const next = automataStep(config, prev)
    rows.push(next)
    prev = next
  }
  setStore('rows', rows)
}

export function extendRows(targetCount: number) {
  if (store.rows.length >= targetCount) return
  const config = { ...store.config }
  setStore(produce(s => {
    let prev = s.rows[s.rows.length - 1]
    while (s.rows.length < targetCount) {
      const next = automataStep(config, prev)
      s.rows.push(next)
      prev = next
    }
  }))
}

function clampRuleMode(mode: RuleMode, numParents: number): RuleMode {
  if (numParents < 2) return 'asymmetric'
  if (numParents < 3 && mode === 'unordered') return 'asymmetric'
  return mode
}

export function setNumParents(n: number) {
  const half = Math.floor((n - 1) / 2)
  setStore(produce(s => {
    s.config.numParents = n
    s.ruleMode = clampRuleMode(s.ruleMode, n)
    s.config.rules = resizeRules(s.config.rules, n, s.config.numStates, s.ruleMode)
    s.config.padLeft = new Array(half).fill(0)
    s.config.padRight = new Array(n - 1 - half).fill(0)
  }))
}

export function setNumStates(n: number) {
  setStore(produce(s => {
    s.config.numStates = n
    s.config.rules = resizeRules(s.config.rules, s.config.numParents, n, s.ruleMode)
  }))
}

export function setRule(index: number, value: number) {
  const { numParents, numStates } = store.config
  const indices = equivalentRuleIndices(index, numParents, numStates, store.ruleMode)
  setStore(produce(s => {
    for (const i of indices) {
      s.config.rules[i] = value
    }
  }))
}

export function setRuleMode(mode: RuleMode) {
  setStore(produce(s => {
    s.ruleMode = mode
    s.config.rules = applyRuleMode(s.config.rules, s.config.numParents, s.config.numStates, mode)
  }))
}

export function randomizeRules() {
  const { numParents, numStates } = store.config
  const mode = store.ruleMode
  setStore(produce(s => {
    const count = fullRuleCount(numParents, numStates)
    s.config.rules = new Array(count).fill(0)
    for (const index of displayRuleIndices(numParents, numStates, mode)) {
      const value = Math.floor(Math.random() * numStates)
      for (const i of equivalentRuleIndices(index, numParents, numStates, mode)) {
        s.config.rules[i] = value
      }
    }
  }))
}

export function computedRuleCount(): number {
  return displayRuleCount(store.config.numParents, store.config.numStates, store.ruleMode)
}

export function expectedFullRuleCount(): number {
  return fullRuleCount(store.config.numParents, store.config.numStates)
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
  if (name in PALETTES) setStore('palette', name)
}

export function setSelectedState(state: number) {
  setStore('selectedState', state)
}

export { store }
