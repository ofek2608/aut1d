import type { AutomataConfig } from './automataConfig'
import {
  decodeNeighborhood,
  displayRuleCount,
  displayRuleIndices,
  type RuleMode,
} from './rules'

const RULE_MODE_FROM_CHAR: Record<string, RuleMode> = {
  A: 'asymmetric',
  S: 'symmetric',
  U: 'unordered',
}

const RULE_MODE_TO_CHAR: Record<RuleMode, string> = {
  asymmetric: 'A',
  symmetric: 'S',
  unordered: 'U',
}

export function encodeStateChar(state: number): string {
  if (state >= 0 && state <= 8) return String(state + 1)
  if (state >= 9 && state <= 35) return String.fromCharCode('a'.charCodeAt(0) + state)
  throw new Error(`State out of range: ${state}`)
}

export function decodeStateChar(char: string): number | null {
  if (char.length !== 1) return null
  if (char >= '1' && char <= '9') return char.charCodeAt(0) - '1'.charCodeAt(0)
  if (char >= 'a' && char <= 'z') return char.charCodeAt(0) - 'a'.charCodeAt(0)
  return null
}

function decodeStateString(value: string): number[] | null {
  const states: number[] = []
  for (const char of value) {
    const state = decodeStateChar(char)
    if (state === null) return null
    states.push(state)
  }
  return states
}

function maxState(states: number[]): number {
  return states.reduce((max, state) => Math.max(max, state), 0)
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function defaultPattern(numParents: number) {
  return {
    padLeft: new Array(Math.max(0, numParents - 1)).fill(0),
    padRight: new Array(Math.max(0, numParents - 1)).fill(0),
    initial: new Array(Math.max(1, 2 * numParents - 1)).fill(0),
  }
}

function nucleationPattern(numParents: number) {
  const pattern = defaultPattern(numParents)
  if (pattern.initial.length > 0) {
    pattern.initial[Math.min(numParents - 1, pattern.initial.length - 1)] = 1
  }
  return pattern
}

function serializePattern(config: AutomataConfig): string {
  const numParents = config.numParents
  const defaults = defaultPattern(numParents)
  const nucleation = nucleationPattern(numParents)

  if (
    arraysEqual(config.padLeft, defaults.padLeft)
    && arraysEqual(config.padRight, defaults.padRight)
    && arraysEqual(config.initial, defaults.initial)
  ) {
    return ''
  }

  if (
    arraysEqual(config.padLeft, defaults.padLeft)
    && arraysEqual(config.padRight, defaults.padRight)
    && arraysEqual(config.initial, nucleation.initial)
  ) {
    return 'N'
  }

  return `${config.padLeft.map(encodeStateChar).join('')};${config.initial.map(encodeStateChar).join('')};${config.padRight.map(encodeStateChar).join('')}`
}

function parsePattern(
  pattern: string,
  numParents: number,
): Pick<AutomataConfig, 'padLeft' | 'initial' | 'padRight'> | null {
  if (pattern === '') return defaultPattern(numParents)
  if (pattern === 'N') return nucleationPattern(numParents)

  const parts = pattern.split(';')
  if (parts.length !== 3) return null

  const padLeft = decodeStateString(parts[0])
  const initial = decodeStateString(parts[1])
  const padRight = decodeStateString(parts[2])
  if (padLeft === null || initial === null || padRight === null) return null

  return { padLeft, initial, padRight }
}

function serializeRules(config: AutomataConfig): string {
  return config.rules.map(encodeStateChar).join('')
}

function parseRules(
  rulesText: string,
  numParents: number,
  ruleMode: RuleMode,
): { rules: number[]; numStates: number } | null {
  if (rulesText.length === 0) return null

  const rules: number[] = []
  for (const char of rulesText) {
    const state = decodeStateChar(char)
    if (state === null) return null
    rules.push(state)
  }

  const numStates = maxState(rules) + 1
  const expectedCount = displayRuleCount(numParents, numStates, ruleMode)
  if (rules.length !== expectedCount) return null

  const displayIndices = displayRuleIndices(numParents, numStates, ruleMode)
  for (let i = 0; i < rules.length; i++) {
    const neighborhood = decodeNeighborhood(displayIndices[i], numParents, numStates)
    if (neighborhood.some(state => state >= numStates)) return null
  }

  return { rules, numStates }
}

export function serializeConfigIdentifier(config: AutomataConfig): string {
  return `${RULE_MODE_TO_CHAR[config.ruleMode]}${config.numParents}${serializePattern(config)}#${serializeRules(config)}`
}

export function parseConfigIdentifier(value: string): AutomataConfig | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^([ASU])([1-9])(.*?)[.#](.+)$/)
  if (!match) return null

  const ruleMode = RULE_MODE_FROM_CHAR[match[1]]
  const numParents = Number(match[2])
  const pattern = parsePattern(match[3], numParents)
  if (!pattern) return null

  const parsedRules = parseRules(match[4], numParents, ruleMode)
  if (!parsedRules) return null

  const patternStates = [...pattern.padLeft, ...pattern.initial, ...pattern.padRight]
  const numStates = Math.max(parsedRules.numStates, maxState(patternStates) + 1)

  const expectedCount = displayRuleCount(numParents, numStates, ruleMode)
  if (parsedRules.rules.length !== expectedCount) return null

  if (patternStates.some(state => state >= numStates)) return null

  const config: AutomataConfig = {
    numParents,
    numStates,
    ruleMode,
    rules: parsedRules.rules,
    ...pattern,
  }

  if (config.rules.some(ruleValue => ruleValue >= numStates)) return null

  return config
}
