import { MAX_STATES, type AutomataConfig, type RuleMode } from './config'
import {
  getRuleCountForStates,
  getStateCountForRules,
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

function usesLetterEncoding(numStates: number): boolean {
  return numStates >= 10
}

export function encodeStateChar(state: number, numStates: number): string {
  if (state < 0 || state >= numStates || state >= MAX_STATES) {
    throw new Error(`State out of range: ${state}`)
  }
  if (usesLetterEncoding(numStates)) {
    return String.fromCharCode('a'.charCodeAt(0) + state)
  }
  return String(state + 1)
}

export function decodeStateChar(char: string, numStates?: number): number | null {
  if (char.length !== 1) return null

  if (char >= 'a' && char <= 'z') {
    const state = char.charCodeAt(0) - 'a'.charCodeAt(0)
    if (state >= MAX_STATES) return null
    return state
  }

  if (numStates !== undefined && usesLetterEncoding(numStates)) return null

  if (char >= '1' && char <= '9') {
    return char.charCodeAt(0) - '1'.charCodeAt(0)
  }

  return null
}

function isValidEncodedChar(char: string, numStates: number): boolean {
  const state = decodeStateChar(char, numStates)
  return state !== null && state < numStates
}

function validatesStateEncoding(value: string, numStates: number): boolean {
  if (value.length === 0) return true
  return [...value].every(char => isValidEncodedChar(char, numStates))
}

function decodeStateString(value: string, numStates?: number): number[] | null {
  const states: number[] = []
  for (const char of value) {
    const state = decodeStateChar(char, numStates)
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
  const { numStates } = config
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

  const encode = (state: number) => encodeStateChar(state, numStates)
  return `${config.padLeft.map(encode).join('')};${config.initial.map(encode).join('')};${config.padRight.map(encode).join('')}`
}

function parsePattern(
  pattern: string,
  numParents: number,
  numStates?: number,
): Pick<AutomataConfig, 'padLeft' | 'initial' | 'padRight'> | null {
  if (pattern === '') return defaultPattern(numParents)
  if (pattern === 'N') return nucleationPattern(numParents)

  const parts = pattern.split(';')
  if (parts.length !== 3) return null

  const padLeft = decodeStateString(parts[0], numStates)
  const initial = decodeStateString(parts[1], numStates)
  const padRight = decodeStateString(parts[2], numStates)
  if (padLeft === null || initial === null || padRight === null) return null

  return { padLeft, initial, padRight }
}

function serializeRules(config: AutomataConfig): string {
  return config.rules.map(state => encodeStateChar(state, config.numStates)).join('')
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

  const numStates = getStateCountForRules(ruleMode, numParents, rules.length)
  if (numStates === null) return null
  if (getRuleCountForStates(ruleMode, numParents, numStates) !== rules.length) return null
  if (!validatesStateEncoding(rulesText, numStates)) return null
  if (rules.some(state => state >= numStates)) return null

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

  const parsedRules = parseRules(match[4], numParents, ruleMode)
  if (!parsedRules) return null

  const pattern = parsePattern(match[3], numParents, parsedRules.numStates)
  if (!pattern) return null

  const patternText = match[3]
  if (patternText !== '' && patternText !== 'N' && !validatesStateEncoding(patternText.replace(/;/g, ''), parsedRules.numStates)) {
    return null
  }

  const patternStates = [...pattern.padLeft, ...pattern.initial, ...pattern.padRight]
  const numStates = Math.max(parsedRules.numStates, maxState(patternStates) + 1)
  if (numStates > MAX_STATES) return null

  if (getRuleCountForStates(ruleMode, numParents, numStates) !== parsedRules.rules.length) return null
  if (patternStates.some(state => state >= numStates)) return null
  if (!validatesStateEncoding(match[4], numStates)) return null

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
