import type { AutomataConfig } from "./config"
import { createRuleResolver } from "./rules";

function automataStep0(config: AutomataConfig, resolver: (parents: number[]) => number, world: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i <= world.length - config.numParents; i++) {
    result.push(resolver(world.slice(i, i + config.numParents)));
  }
  return [...config.padLeft, ...result, ...config.padRight];
}

export function automataStep(config: AutomataConfig, world: number[]): number[] {
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  return automataStep0(config, resolver, world);
}

export function automataStepBatch(config: AutomataConfig, initial: number[], stepCount: number): number[][] {
  const result: number[][] = [];
  let current = initial;
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  while (result.length < stepCount) {
    current = automataStep0(config, resolver, current);
    result.push(current);
  }
  return result;
}