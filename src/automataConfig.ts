import {
  canonicalUnorderedIndex,
  collapseToDisplayRules,
  displayRuleIndices,
  encodeNeighborhood,
  expandDisplayRules,
  isSymmetricDisplay,
  mirrorIndex,
  type RuleMode,
} from './rules'

export type { RuleMode }

export type AutomataConfig = {
  numParents: number
  numStates: number
  ruleMode: RuleMode
  rules: number[]
  initial: number[]
  padLeft: number[]
  padRight: number[]
}

export function getChild(config: AutomataConfig, parents: number[], index: number): number {
  const neighborhood = parents.slice(index, index + config.numParents)
  let ruleIndex = encodeNeighborhood(neighborhood, config.numStates)

  switch (config.ruleMode) {
    case 'asymmetric':
      break
    case 'symmetric':
      if (!isSymmetricDisplay(ruleIndex, config.numParents, config.numStates)) {
        ruleIndex = mirrorIndex(ruleIndex, config.numParents, config.numStates)
      }
      break
    case 'unordered':
      ruleIndex = canonicalUnorderedIndex(ruleIndex, config.numParents, config.numStates)
      break
  }

  const displayIndices = displayRuleIndices(config.numParents, config.numStates, config.ruleMode)
  const displayPos = displayIndices.indexOf(ruleIndex)
  return config.rules[displayPos] ?? 0
}

export function automataStep(config: AutomataConfig, world: number[]): number[] {
  const result: number[] = []
  for (let i = 0; i < world.length; i++) {
    if (i >= config.numParents - 1) {
      result.push(getChild(config, world, i - config.numParents + 1))
    }
  }
  return [...config.padLeft, ...result, ...config.padRight]
}

export function normalizeRules(
  rules: number[],
  numParents: number,
  numStates: number,
  ruleMode: RuleMode,
): number[] {
  return collapseToDisplayRules(
    expandDisplayRules(rules, numParents, numStates, ruleMode),
    numParents,
    numStates,
    ruleMode,
  )
}
