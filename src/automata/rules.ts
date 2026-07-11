import { binomial, randomInt } from '../utils';
import { MAX_STATES, type RuleMode } from './config';

function neighborhoodsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function neighborhoodKey(neighborhood: number[]): string {
  return neighborhood.join(',')
}

export function compareNeighborhoods(a: number[], b: number[]): number {
  const maxA = Math.max(...a);
  const maxB = Math.max(...b);
  if (maxA !== maxB) return maxA - maxB;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function isSymmetricCanonical(digits: number[]): boolean {
  for (let i = 0; 2 * i < digits.length; i++) {
    const a = digits[i];
    const b = digits[digits.length - 1 - i]
    if (a < b) return true;
    if (a > b) return false;
  }
  return true;
}

function matchesMode(digits: number[], mode: RuleMode): boolean {
  switch (mode) {
    case 'asymmetric':
      return true;
    case 'symmetric':
      return isSymmetricCanonical(digits);
    case 'unordered':
      for (let i = 1; i < digits.length; i++) {
        if (digits[i] < digits[i - 1]) return false;
      }
      return true;
  }
}

function neighborhoodsWithMax(
  numParents: number,
  maxState: number,
  mode: RuleMode,
): number[][] {
  const results: number[][] = []
  const digits: number[] = []

  function recurse(position: number, hasMax: boolean) {
    if (position === numParents) {
      if (hasMax) results.push([...digits])
      return
    }
    for (let digit = 0; digit <= maxState; digit++) {
      digits.push(digit)
      recurse(position + 1, hasMax || digit === maxState)
      digits.pop()
    }
  }

  recurse(0, false)
  return results.filter(neighborhood => matchesMode(neighborhood, mode))
}

export function orderedDisplayNeighborhoods(
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[][] {
  const result: number[][] = [];
  for (let maxState = 0; maxState < numStates; maxState++) {
    result.push(...neighborhoodsWithMax(numParents, maxState, mode));
  }
  return result;
}

export function getNeighborhoodAtIndex(
  index: number,
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] | undefined {
  return orderedDisplayNeighborhoods(numParents, numStates, mode)[index]
}

export function getRuleIndex(
  neighborhood: number[],
  numParents: number,
  mode: RuleMode,
): number {
  // switch (mode) {
  //   case 'asymmetric':
  //     let result = 0;
  //   case 'symmetric':
  //     return isSymmetricCanonical(neighborhood.slice(0, numParents)) ? neighborhood.slice(0, numParents).join(',') : neighborhood.slice(0, numParents).reverse().join(',');
  //   case 'unordered':
  //     return neighborhood.slice(0, numParents).sort((a, b) => a - b).join(',');
  // }
  const target = neighborhood.slice(0, numParents)
  let index = 0
  const targetMax = Math.max(...target);

  for (let maxState = 0; maxState <= targetMax; maxState++) {
    for (const candidate of neighborhoodsWithMax(numParents, maxState, mode)) {
      if (neighborhoodsEqual(candidate, target)) return index
      index++
    }
  }

  return -1
}

export function canonicalNeighborhood(
  neighborhood: number[],
  mode: RuleMode,
): number[] {
  switch (mode) {
    case 'asymmetric':
      return neighborhood.slice();
    case 'symmetric':
      return isSymmetricCanonical(neighborhood) ? neighborhood.slice() : neighborhood.slice().reverse();
    case 'unordered':
      return [...neighborhood].sort((a, b) => a - b);
  }
}

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr]
  const result: number[][] = []
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm])
    }
  }
  return result
}

function uniqueNeighborhoods(neighborhoods: number[][]): number[][] {
  const seen = new Set<string>()
  const result: number[][] = []
  for (const neighborhood of neighborhoods) {
    const key = neighborhoodKey(neighborhood)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(neighborhood)
  }
  return result
}

function equivalentNeighborhoods(
  neighborhood: number[],
  mode: RuleMode,
): number[][] {
  switch (mode) {
    case 'asymmetric':
      return [neighborhood.slice()]
    case 'symmetric': {
      const reversed = [...neighborhood].reverse()
      return neighborhoodsEqual(neighborhood, reversed)
        ? [neighborhood.slice()]
        : [neighborhood.slice(), reversed]
    }
    case 'unordered':
      return uniqueNeighborhoods(permutations(neighborhood))
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

export function fullRuleCount(numParents: number, numStates: number): number {
  return numStates ** numParents
}

function buildRuntimeLookup(
  rules: number[],
  numParents: number,
  numStates: number,
  mode: RuleMode,
): Map<string, number> {
  const lookup = new Map<string, number>()
  const neighborhoods = orderedDisplayNeighborhoods(numParents, numStates, mode)

  for (let i = 0; i < neighborhoods.length; i++) {
    const value = rules[i] ?? 0
    for (const equivalent of equivalentNeighborhoods(neighborhoods[i], mode)) {
      lookup.set(neighborhoodKey(equivalent), value)
    }
  }

  return lookup
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
  if (oldMode === newMode) return rules.slice()

  const oldCount = getRuleCountForStates(oldMode, numParents, numStates)
  const newCount = getRuleCountForStates(newMode, numParents, numStates)
  const oldNeighborhoods = orderedDisplayNeighborhoods(numParents, numStates, oldMode)
  const newNeighborhoods = orderedDisplayNeighborhoods(numParents, numStates, newMode)

  const oldValues = new Map<string, number>()
  for (let i = 0; i < oldNeighborhoods.length; i++) {
    oldValues.set(neighborhoodKey(oldNeighborhoods[i]), rules[i] ?? 0)
  }

  if (newCount < oldCount) {
    return newNeighborhoods.map(neighborhood => {
      const members = equivalentNeighborhoods(neighborhood, newMode)
        .slice()
        .sort(compareNeighborhoods)
      for (const member of members) {
        const value = oldValues.get(neighborhoodKey(member))
        if (value !== undefined) return value
      }
      return 0
    })
  }

  const lookup = buildRuntimeLookup(rules, numParents, numStates, oldMode)
  return newNeighborhoods.map(neighborhood => {
    const canonical = canonicalNeighborhood(neighborhood, oldMode)
    return lookup.get(neighborhoodKey(canonical))
      ?? lookup.get(neighborhoodKey(neighborhood))
      ?? 0
  })
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
