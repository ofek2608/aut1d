export type RuleMode = 'asymmetric' | 'symmetric' | 'unordered';

export const MAX_STATES = 26;

export type StateArray = Uint8Array;

export type AutomataConfig = {
  numParents: number;
  numStates: number;
  ruleMode: RuleMode;
  rules: StateArray;
  initial: StateArray;
  padLeft: StateArray;
  padRight: StateArray;
};
