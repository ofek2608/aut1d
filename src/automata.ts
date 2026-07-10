export type AutomataConfig = {
  numParents: number;
  numStates: number;
  rules: number[]; // rules.length == numStates ** numParents

  initial: number[];
  padLeft: number[];
  padRight: number[];
}

export function automataStep(config: AutomataConfig, world: number[]): number[] {
  let ruleIndex = 0;
  const result = [];
  for (let i = 0; i < world.length; i++) {
    ruleIndex = (config.numStates * ruleIndex + world[i]) % config.rules.length;
    if (i >= config.numParents - 1) {
      result.push(config.rules[ruleIndex]);
    }
  }
  return [...config.padLeft, ...result, ...config.padRight];
}