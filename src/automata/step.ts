import type { AutomataConfig, StateArray } from "./config";
import { createRuleResolver } from "./rules";

function automataStep0(
  config: AutomataConfig,
  resolver: (parents: ArrayLike<number>) => number,
  world: StateArray,
  row: number,
): StateArray {
  const padLeft = config.padLeft[(row - 1) % config.padLeft.length];
  const padRight = config.padRight[(row - 1) % config.padRight.length];
  const midLen = world.length - config.numParents + 1;
  const result = new Uint8Array(padLeft.length + midLen + padRight.length);
  result.set(padLeft, 0);
  for (let i = 0; i < midLen; i++) {
    result[padLeft.length + i] = resolver(world.subarray(i, i + config.numParents));
  }
  result.set(padRight, padLeft.length + midLen);
  return result;
}

export function automataStep(config: AutomataConfig, world: StateArray, row: number = 1): StateArray {
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  return automataStep0(config, resolver, world, row);
}

export function automataStepBatch(
  config: AutomataConfig,
  initial: StateArray,
  stepCount: number,
  startRow: number = 1,
): StateArray[] {
  const result: StateArray[] = [];
  let current = initial;
  let row = startRow;
  const resolver = createRuleResolver(config.ruleMode, config.numParents, config.numStates, config.rules);
  while (result.length < stepCount) {
    current = automataStep0(config, resolver, current, row);
    result.push(current);
    row++;
  }
  return result;
}
