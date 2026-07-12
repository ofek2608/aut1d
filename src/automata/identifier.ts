import { MAX_STATES, type AutomataConfig, type RuleMode } from './config';
import {
  getRuleCountForStates,
  getStateCountForRules,
} from './rules';

export type IdentifierKeyInfo = {
  key: string;
  description: string;
};

export const IDENTIFIER_KEYS: IdentifierKeyInfo[] = [
  { key: 'S', description: 'Symmetric parents' },
  { key: 'A', description: 'Asymmetric parents' },
  { key: 'U', description: 'Unordered parents' },
  { key: 'I', description: 'Initial row' },
  { key: 'PS', description: 'Symmetric padding' },
  { key: 'PL', description: 'Left padding' },
  { key: 'PR', description: 'Right padding' },
  { key: '#', description: 'Rule table' },
  { key: 'R', description: 'Alias for #' },
];

const RULE_MODE_FROM_KEY: Record<string, RuleMode> = {
  A: 'asymmetric',
  S: 'symmetric',
  U: 'unordered',
};

const RULE_MODE_TO_KEY: Record<RuleMode, string> = {
  asymmetric: 'A',
  symmetric: 'S',
  unordered: 'U',
};

const CONFLICTING_KEYS : string[][] = [
  ['PS', 'PL'],
  ['PS', 'PR'],
  ['A', 'S', 'U'],
  ['R', '#'],
];

const TOKEN_PATTERN = /([A-Z]+|#)([0-9a-z._]+[;-]?|[;-])/g;
const GLOBAL_PATTERN = /^(([A-Z]+|#)([0-9a-z._]+[;-]?|[;-]))*$/;

function identifierToMap(identifier: string): Map<string, string> {
  if (!GLOBAL_PATTERN.test(identifier)) return new Map();

  const result = new Map<string, string>();

  for (const [, key, value] of identifier.matchAll(TOKEN_PATTERN)) {
    result.set(key, value.replace(/[;-]$/, ''));
  }

  return result;
}

function mapToIdentifier(map: Map<string, string>): string {
  let result = '';
  for (const { key } of IDENTIFIER_KEYS) {
    const value = map.get(key);
    if (value === undefined) continue;
    result += `${key}${value === '' ? '-' : value}`;
  }
  return result;
}

function encodeStateChar(state: number, numStates: number): string {
  if (state < 0 || state >= numStates || state >= MAX_STATES) {
    throw new Error(`State out of range: ${state}`);
  }
  if (numStates >= 10) {
    return String.fromCharCode('a'.charCodeAt(0) + state);
  }
  return String(state + 1);
}

function decodeStateChar(char: string): number | null {
  if (char.length !== 1) return null;

  if ('a' <= char && char <= 'z') {
    return char.charCodeAt(0) - 'a'.charCodeAt(0);
  }

  if ('1' <= char && char <= '9') {
    return char.charCodeAt(0) - '1'.charCodeAt(0);
  }

  return null;
}

function decodeStateString(value: string, numStates: number): number[] | null {
  const states: number[] = [];
  for (const char of value) {
    const state = decodeStateChar(char);
    if (state === null || state >= numStates) return null;
    states.push(state);
  }
  return states;
}

function encodeStateString(states: number[], numStates: number): string {
  return states.map(state => encodeStateChar(state, numStates)).join('');
}

function lookupValueMultipleKeys(map: Map<string, string>, ...keys: string[]): [string, string] | [null, null] {
  for (const key of keys) {
    if (map.has(key)) {
      return [key, map.get(key)!];
    }
  }
  return [null, null];
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function defaultPattern(numParents: number) {
  return {
    padLeft: new Array(Math.max(0, numParents - 1)).fill(0),
    padRight: new Array(Math.max(0, numParents - 1)).fill(0),
    initial: new Array(Math.max(1, 2 * numParents - 3)).fill(0),
  };
}

function configToIdentifierMap(config: AutomataConfig): Map<string, string> {
  const map = new Map<string, string>();
  map.set(RULE_MODE_TO_KEY[config.ruleMode], String(config.numParents));

  const defaults = defaultPattern(config.numParents);

  if (!arraysEqual(config.initial, defaults.initial)) {
    map.set('I', encodeStateString(config.initial, config.numStates));
  }

  const hasSymmetricPadding = arraysEqual(config.padRight, config.padLeft.slice().reverse());
  const padLeftIsDefault = arraysEqual(config.padLeft, defaults.padLeft);
  const padRightIsDefault = arraysEqual(config.padRight, defaults.padRight);

  if (hasSymmetricPadding && !padLeftIsDefault) {
    map.set('PS', encodeStateString(config.padLeft, config.numStates));
  } else {
    if (!padLeftIsDefault) {
      map.set('PL', encodeStateString(config.padLeft, config.numStates));
    }
    if (!padRightIsDefault) {
      map.set('PR', encodeStateString(config.padRight, config.numStates));
    }
  }

  map.set('#', encodeStateString(config.rules, config.numStates));
  return map;
}

function parsePatternFromMap(
  map: Map<string, string>,
  numParents: number,
  numStates: number,
): Pick<AutomataConfig, 'padLeft' | 'initial' | 'padRight'> | null {
  const pattern = defaultPattern(numParents);

  if (map.has('PS')) {
    const padLeft = decodeStateString(map.get('PS')!, numStates);
    if (padLeft === null) return null;
    pattern.padLeft = padLeft;
    pattern.padRight = padLeft.slice().reverse();
  }

  if (map.has('PL')) {
    const padLeft = decodeStateString(map.get('PL')!, numStates);
    if (padLeft === null) return null;
    pattern.padLeft = padLeft;
  }

  if (map.has('PR')) {
    const padRight = decodeStateString(map.get('PR')!, numStates);
    if (padRight === null) return null;
    pattern.padRight = padRight;
  }

  if (map.has('I')) {
    const initial = decodeStateString(map.get('I')!, numStates);
    if (initial === null || initial.length === 0) return null;
    pattern.initial = initial;
  }

  return pattern;
}

export function serializeConfigIdentifier(config: AutomataConfig, forUrl: boolean = false): string {
  const map = configToIdentifierMap(config);
  const identifier = mapToIdentifier(map);
  return forUrl ? identifier.replaceAll('#', 'R') : identifier;
}

export function parseConfigIdentifier(identifier: string): AutomataConfig | null {
  const trimmed = identifier.trim();
  if (trimmed.length === 0) return null;

  const map = identifierToMap(trimmed);
  
  // check conflicting

  for (const keys of CONFLICTING_KEYS) {
    if (keys.filter(key => map.has(key)).length > 1) {
      return null;
    }
  }

  // mode

  const [modeKey, modeValue] = lookupValueMultipleKeys(map, ...Object.keys(RULE_MODE_FROM_KEY));
  if (!modeKey) return null;

  const ruleMode = RULE_MODE_FROM_KEY[modeKey];
  const numParents = Number(modeValue);
  if (!Number.isInteger(numParents) || numParents < 1 || numParents > 9) return null;

  // rules

  const [, rulesText] = lookupValueMultipleKeys(map, '#', 'R');
  if (!rulesText) return null;
  const numStates = getStateCountForRules(ruleMode, numParents, rulesText.length);
  if (numStates === null) return null;
  if (getRuleCountForStates(ruleMode, numParents, numStates) !== rulesText.length) return null;
  const rules = decodeStateString(rulesText, numStates);
  if (rules === null) return null;

  // pattern

  const pattern = parsePatternFromMap(map, numParents, numStates);
  if (!pattern) return null;

  // combine all

  return {
    numParents,
    numStates,
    ruleMode,
    rules,
    ...pattern,
  };
}
