export type RuleMode = 'asymmetric' | 'symmetric' | 'unordered';

export const MAX_STATES = 26;

export type StateArray = Uint8Array;

export type StateSequence = StateArray[];

/** Painted cell overrides; keys are `"x,y"` (col, row). */
export type CellMods = Record<`${number},${number}`, number>;

export type AutomataConfig = {
  numParents: number;
  numStates: number;
  ruleMode: RuleMode;
  rules: StateArray;
  initial: StateArray;
  /** Cycled left/right padding frames; each generation picks `(row - 1) % length`. */
  padLeft: StateSequence;
  padRight: StateSequence;
  mods: CellMods;
};
