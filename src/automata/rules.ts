import { binomial, randomInt } from '../utils';
import { MAX_STATES, type RuleMode, type StateArray } from './config';

function isSymmetricCanonical(digits: ArrayLike<number>): boolean {
  for (let i = 0; 2 * i < digits.length; i++) {
    const a = digits[i];
    const b = digits[digits.length - 1 - i];
    if (a < b) return true;
    if (a > b) return false;
  }
  return true;
}

export function canonicalParents(
  parents: ArrayLike<number>,
  mode: RuleMode,
): StateArray {
  const copy = Uint8Array.from(parents);
  switch (mode) {
    case 'asymmetric':
      return copy;
    case 'symmetric':
      return isSymmetricCanonical(copy) ? copy : copy.reverse();
    case 'unordered':
      return copy.sort((a, b) => a - b);
  }
}

export function getRuleCountForStates(
  ruleMode: RuleMode,
  numParents: number,
  numStates: number,
): number {
  switch (ruleMode) {
    case 'asymmetric':
      return numStates ** numParents;
    case 'symmetric':
      return (numStates ** numParents + numStates ** Math.ceil(numParents / 2)) / 2;
    case 'unordered':
      return binomial(numStates + numParents - 1, numParents);
  }
}

export function getStateCountForRules(
  ruleMode: RuleMode,
  numParents: number,
  numRules: number,
): number | null {
  //TODO implement an O(1) calculation
  if (numRules <= 0) return null;

  let numStates = 1;
  while (getRuleCountForStates(ruleMode, numParents, numStates) < numRules) {
    numStates++;
    if (numStates > MAX_STATES) return null;
  }

  const count = getRuleCountForStates(ruleMode, numParents, numStates);
  const prevCount = numStates > 1
    ? getRuleCountForStates(ruleMode, numParents, numStates - 1)
    : 0;

  if (count < numRules || prevCount >= numRules) return null;
  return numStates;
}

function fillPatternsWithMax(
  patterns: StateArray[],
  numParents: number,
  maxState: number,
  ruleMode: RuleMode,
): void {
  const digits = new Uint8Array(numParents);

  const recurse = (position: number, hasMax: boolean): void => {
    if (position === numParents) {
      patterns.push(digits.slice());
      return;
    }
    let minDigit: number;
    switch (ruleMode) {
      case 'asymmetric':
        minDigit = 0;
        break;
      case 'symmetric':
        const other = numParents - 1 - position;
        minDigit = other < position ? digits[other] : 0;
        break;
      case 'unordered':
        minDigit = position === 0 ? 0 : digits[position - 1];
        break;
    }
    if (position === numParents - 1 && !hasMax) {
      minDigit = maxState;
    }
    for (let digit = minDigit; digit <= maxState; digit++) {
      digits[position] = digit;
      recurse(position + 1, hasMax || digit === maxState);
    }
  };

  recurse(0, false);
}

export function createRulePatterns(
  ruleMode: RuleMode,
  numParents: number,
  numStates: number,
): StateArray[] {
  const patterns: StateArray[] = [];
  for (let maxState = 0; maxState < numStates; maxState++) {
    fillPatternsWithMax(patterns, numParents, maxState, ruleMode);
  }
  return patterns;
}

export function createRuleResolver(
  ruleMode: RuleMode,
  numParents: number,
  numStates: number,
  rules: StateArray,
): (parents: ArrayLike<number>) => number {
  const patterns = createRulePatterns(ruleMode, numParents, numStates);
  const lookup = new Map<number, number>();

  function encodeParents(parents: ArrayLike<number>): number {
    let key = 0;
    for (let i = 0; i < parents.length; i++) {
      key = key * numStates + parents[i];
    }
    return key;
  }

  for (let i = 0; i < patterns.length; i++) {
    lookup.set(encodeParents(patterns[i]), rules[i] ?? 0);
  }

  return (parents: ArrayLike<number>) => {
    const canonical = canonicalParents(parents, ruleMode);
    return lookup.get(encodeParents(canonical)) ?? randomInt(numStates);
  };
}

export function resizeRulesForParents(
  numParents: number,
  numStates: number,
  mode: RuleMode,
): StateArray {
  const newCount = getRuleCountForStates(mode, numParents, numStates);
  return Uint8Array.from({ length: newCount }, () => randomInt(numStates));
}

export function applyRuleMode(
  rules: StateArray,
  numParents: number,
  numStates: number,
  oldMode: RuleMode,
  newMode: RuleMode,
): StateArray {
  if (oldMode === newMode) return rules.slice();

  const resolver = createRuleResolver(oldMode, numParents, numStates, rules);
  const patterns = createRulePatterns(newMode, numParents, numStates);
  return Uint8Array.from(patterns, pattern => resolver(pattern));
}

export function normalizeRules(
  rules: StateArray,
  numParents: number,
  numStates: number,
  mode: RuleMode,
): StateArray {
  const newCount = getRuleCountForStates(mode, numParents, numStates);
  const next = new Uint8Array(newCount);
  const copyLen = Math.min(rules.length, newCount);
  next.set(rules.subarray(0, copyLen));

  for (let i = copyLen; i < newCount; i++) {
    next[i] = randomInt(numStates);
  }

  for (let i = 0; i < copyLen; i++) {
    if (next[i] >= numStates) {
      next[i] = randomInt(numStates);
    }
  }

  return next;
}
