import type { AutomataConfig, StateArray } from "./config";
import { createRuleResolver } from "./rules";

function automataStep0(
  config: AutomataConfig,
  resolver: (parents: ArrayLike<number>) => number,
  world: StateArray,
): StateArray {
  const midLen = world.length - config.numParents + 1;
  const result = new Uint8Array(config.padLeft.length + midLen + config.padRight.length);
  result.set(config.padLeft, 0);
  for (let i = 0; i < midLen; i++) {
    result[config.padLeft.length + i] = resolver(world.subarray(i, i + config.numParents));
  }
  result.set(config.padRight, config.padLeft.length + midLen);
  return result;
}

export function automataStep(config: AutomataConfig, world: StateArray): StateArray {
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  return automataStep0(config, resolver, world);
}

export function automataStepBatch(config: AutomataConfig, initial: StateArray, stepCount: number): StateArray[] {
  const result: StateArray[] = [];
  let current = initial;
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  while (result.length < stepCount) {
    current = automataStep0(config, resolver, current);
    result.push(current);
  }
  return result;
}
