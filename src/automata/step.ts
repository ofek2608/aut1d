import { canonicalNeighborhood, getRuleIndex } from "./rules"
import type { AutomataConfig } from "./config"

function getChild(config: AutomataConfig, parents: number[], index: number): number {
  const neighborhood = parents.slice(index, index + config.numParents)
  const canonical = canonicalNeighborhood(neighborhood, config.ruleMode)
  const ruleIndex = getRuleIndex(canonical, config.numParents, config.ruleMode)
  if (ruleIndex < 0 || ruleIndex >= config.rules.length) return 0
  return config.rules[ruleIndex]
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