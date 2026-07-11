export type RuleMode = 'asymmetric' | 'symmetric' | 'unordered'

export function decodeNeighborhood(index: number, numParents: number, numStates: number): number[] {
  const digits: number[] = []
  let n = index
  for (let i = 0; i < numParents; i++) {
    digits.unshift(n % numStates)
    n = Math.floor(n / numStates)
  }
  return digits
}

export function encodeNeighborhood(digits: number[], numStates: number): number {
  let index = 0
  for (const d of digits) {
    index = index * numStates + d
  }
  return index
}

export function fullRuleCount(numParents: number, numStates: number): number {
  return numStates ** numParents
}

export function mirrorIndex(index: number, numParents: number, numStates: number): number {
  const digits = decodeNeighborhood(index, numParents, numStates)
  return encodeNeighborhood([...digits].reverse(), numStates)
}

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr]
  const result: number[][] = []
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const p of permutations(rest)) {
      result.push([arr[i], ...p])
    }
  }
  return result
}

function permutationIndices(index: number, numParents: number, numStates: number): number[] {
  const digits = decodeNeighborhood(index, numParents, numStates)
  const seen = new Set<number>()
  for (const perm of permutations(digits)) {
    seen.add(encodeNeighborhood(perm, numStates))
  }
  return [...seen].sort((a, b) => a - b)
}

export function canonicalUnorderedIndex(index: number, numParents: number, numStates: number): number {
  const digits = decodeNeighborhood(index, numParents, numStates)
  const sorted = [...digits].sort((a, b) => a - b)
  return encodeNeighborhood(sorted, numStates)
}

export function isSymmetricDisplay(index: number, numParents: number, numStates: number): boolean {
  if (numParents <= 1) return true
  const digits = decodeNeighborhood(index, numParents, numStates)
  const left = digits[0]
  const right = digits[digits.length - 1]
  return left > right || left === right
}

export function isUnorderedDisplay(index: number, numParents: number, numStates: number): boolean {
  return index === canonicalUnorderedIndex(index, numParents, numStates)
}

export function shouldDisplayRule(
  index: number,
  numParents: number,
  numStates: number,
  mode: RuleMode,
): boolean {
  switch (mode) {
    case 'asymmetric':
      return true
    case 'symmetric':
      return isSymmetricDisplay(index, numParents, numStates)
    case 'unordered':
      return isUnorderedDisplay(index, numParents, numStates)
  }
}

export function displayRuleIndices(
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] {
  const total = fullRuleCount(numParents, numStates)
  const indices: number[] = []
  for (let i = 0; i < total; i++) {
    if (shouldDisplayRule(i, numParents, numStates, mode)) {
      indices.push(i)
    }
  }
  return indices
}

export function displayRuleCount(numParents: number, numStates: number, mode: RuleMode): number {
  return displayRuleIndices(numParents, numStates, mode).length
}

export function equivalentRuleIndices(
  index: number,
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] {
  switch (mode) {
    case 'asymmetric':
      return [index]
    case 'symmetric': {
      const mirror = mirrorIndex(index, numParents, numStates)
      return index === mirror ? [index] : [index, mirror]
    }
    case 'unordered':
      return permutationIndices(index, numParents, numStates)
  }
}

export function applyRuleMode(rules: number[], numParents: number, numStates: number, mode: RuleMode): number[] {
  if (mode === 'asymmetric') return rules.slice()
  const result = rules.slice()
  for (let i = 0; i < result.length; i++) {
    const value = result[i]
    for (const j of equivalentRuleIndices(i, numParents, numStates, mode)) {
      result[j] = value
    }
  }
  return result
}

export function resizeRules(
  rules: number[],
  numParents: number,
  numStates: number,
  mode: RuleMode,
): number[] {
  const count = fullRuleCount(numParents, numStates)
  const next = new Array(count).fill(0)
  for (let i = 0; i < Math.min(rules.length, count); i++) {
    next[i] = rules[i]
  }
  return applyRuleMode(next, numParents, numStates, mode)
}
