import { binomial, randomInt } from '../utils';
import { MAX_STATES, type RuleMode } from './config';

function isSymmetricCanonical(digits: number[]): boolean {
  for (let i = 0; 2 * i < digits.length; i++) {
    const a = digits[i];
    const b = digits[digits.length - 1 - i]
    if (a < b) return true;
    if (a > b) return false;
  }
  return true;
}

export function canonicalParents(
  parents: number[],
  mode: RuleMode,
): number[] {
  switch (mode) {
    case 'asymmetric':
      return parents.slice();
    case 'symmetric':
      return isSymmetricCanonical(parents) ? parents.slice() : parents.slice().reverse();
    case 'unordered':
      return [...parents].sort((a, b) => a - b);
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
  if (numRules <= 0) return null

  let numStates = 1
  while (getRuleCountForStates(ruleMode, numParents, numStates) < numRules) {
    numStates++
    if (numStates > MAX_STATES) return null
  }

  const count = getRuleCountForStates(ruleMode, numParents, numStates)
  const prevCount = numStates > 1
    ? getRuleCountForStates(ruleMode, numParents, numStates - 1)
    : 0

  if (count < numRules || prevCount >= numRules) return null
  return numStates
}

function fillPatternsWithMax(
  patterns: number[][],
  numParents: number,
  maxState: number,
  ruleMode: RuleMode,
): void {
  const digits = new Array<number>(numParents)

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
  }

  recurse(0, false);
}

export function createRulePatterns(
  ruleMode: RuleMode,
  numParents: number,
  numStates: number,
): number[][] {
  const patterns: number[][] = [];
  for (let maxState = 0; maxState < numStates; maxState++) {
    fillPatternsWithMax(patterns, numParents, maxState, ruleMode);
  }
  return patterns;
}

export function createRuleResolver(
  ruleMode: RuleMode,
  numParents: number,
  numStates: number,
  rules: number[],
): (parents: number[]) => number {
  const patterns = createRulePatterns(ruleMode, numParents, numStates);
  const lookup = new Map<number, number>();

  function encodeParents(parents: number[]): number {
    let key = 0;
    for (const state of parents) {
      key = key * numStates + state;
    }
    return key;
  }

  for (let i = 0; i < patterns.length; i++) {
    lookup.set(encodeParents(patterns[i]), rules[i] ?? 0);
  }

  return (parents: number[]) => {
    const canonical = canonicalParents(parents, ruleMode)
    return lookup.get(encodeParents(canonical)) ?? randomInt(numStates);
  };
}

export function resizeRulesForParents(
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] {
  const newCount = getRuleCountForStates(mode, numParents, numStates);
  return Array.from({ length: newCount }, () => randomInt(numStates))
}

export function applyRuleMode(
  rules: number[],
  numParents: number,
  numStates: number,
  oldMode: RuleMode,
  newMode: RuleMode,
): number[] {
  if (oldMode === newMode) return rules.slice();

  const resolver = createRuleResolver(oldMode, numParents, numStates, rules);
  const patterns = createRulePatterns(newMode, numParents, numStates);
  return patterns.map(resolver);
}

export function normalizeRules(
  rules: number[],
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] {
  const newCount = getRuleCountForStates(mode, numParents, numStates);

  // Crop the rules to the new count
  const next = rules.slice(0, newCount);

  // Fill in the rest of the rules with random values
  while (next.length < newCount) {
    next.push(randomInt(numStates));
  }

  // Make sure the states are within the range of the new number of states
  for (let i = 0; i < next.length; i++) {
    if (next[i] >= numStates) {
      next[i] = randomInt(numStates);
    }
  }

  return next;
}
