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
import { ensureCustomColorsLength } from './localStore'

const DEFAULT_BATCH = 500

const DEFAULT_CONFIG: AutomataConfig = parseConfigIdentifier('S2#231123')!

interface State {
  config: AutomataConfig
  rows: number[][]
  selectedState: number
}

const [store, setStore] = createStore<State>({
  config: DEFAULT_CONFIG,
  rows: [],
  selectedState: -1,
})

ensureCustomColorsLength(DEFAULT_CONFIG.numStates)

export function regenerateRows(targetCount = DEFAULT_BATCH) {
  const config = { ...store.config }
  const initial = config.initial.slice()
  setStore('rows', [
    initial,
    ...automataStepBatch(config, initial, targetCount),
  ])
}

export function extendRows(targetCount: number) {
  if (store.rows.length >= targetCount) return
  const config = { ...store.config }
  setStore(produce(s => {
    const rows = automataStepBatch(config, s.rows[s.rows.length - 1], targetCount - s.rows.length)
    s.rows.push(...rows)
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
  }))
  ensureCustomColorsLength(config.numStates)
}

export function setNumParents(n: number) {
  setStore(produce(s => {
    const { numStates, ruleMode } = s.config
    s.config.numParents = n
    s.config.rules = resizeRulesForParents(n, numStates, ruleMode)
    s.config.initial = new Array(2 * n - 3).fill(0)
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
  }))
  ensureCustomColorsLength(clamped)
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

export function setSelectedState(state: number) {
  setStore('selectedState', state)
}

export { store }
