export type RuleMode = 'asymmetric' | 'symmetric' | 'unordered';

export const MAX_STATES = 26;

export type AutomataConfig = {
  numParents: number
  numStates: number
  ruleMode: RuleMode
  rules: number[]
  initial: number[]
  padLeft: number[]
  padRight: number[]
}

