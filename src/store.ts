import { createStore, produce } from 'solid-js/store';
import { MAX_STATES, type AutomataConfig, type StateSequence, type RuleMode, type StateArray } from './automata/config';
import {
  applyRuleMode,
  normalizeRules,
  resizeRulesForParents,
  getRuleCountForStates,
} from './automata/rules';
import { randomInt } from './utils';
import { parseConfigIdentifier } from './automata/identifier';
import { ensureCustomColorsLength } from './localStore';

function clonePadSequence(sequence: StateSequence): StateSequence {
  return sequence.map(frame => frame.slice());
}

function readConfigFromUrl() {
  try {
    const value = new URLSearchParams(window.location.search).get('r');
    if (!value) return null;
    return parseConfigIdentifier(value);
  } catch {
    return null;
  }
}

const DEFAULT_CONFIG = readConfigFromUrl() ?? parseConfigIdentifier('S2#231123')!;

interface State {
  config: AutomataConfig;
  selectedState: number;
}

const [store, setStore] = createStore<State>({
  config: DEFAULT_CONFIG,
  selectedState: -1,
});

ensureCustomColorsLength(DEFAULT_CONFIG.numStates);

export function applyConfig(config: AutomataConfig) {
  setStore(produce(s => {
    s.config = {
      ...config,
      rules: normalizeRules(config.rules, config.numParents, config.numStates, config.ruleMode),
      initial: config.initial.slice(),
      padLeft: clonePadSequence(config.padLeft),
      padRight: clonePadSequence(config.padRight),
    };
  }));
  ensureCustomColorsLength(config.numStates);
}

export function setNumParents(n: number) {
  setStore(produce(s => {
    const { numStates, ruleMode } = s.config;
    s.config.numParents = n;
    s.config.rules = resizeRulesForParents(n, numStates, ruleMode);
    s.config.initial = new Uint8Array(2 * n - 3);
    s.config.padLeft = [new Uint8Array(n - 1)];
    s.config.padRight = [new Uint8Array(n - 1)];
  }));
}

export function setNumStates(n: number) {
  const clamped = Math.max(1, Math.min(MAX_STATES, n));
  setStore(produce(s => {
    const { numParents, numStates, ruleMode, rules } = s.config;
    if (clamped === numStates) return;
    s.config.numStates = clamped;
    s.config.rules = normalizeRules(rules, numParents, clamped, ruleMode);
  }));
  ensureCustomColorsLength(clamped);
}

export function setRule(displayPos: number, value: number) {
  if (displayPos < 0 || displayPos >= store.config.rules.length) return;
  const rules = store.config.rules.slice();
  rules[displayPos] = value;
  setStore('config', 'rules', rules);
}

export function setRuleMode(mode: RuleMode) {
  setStore(produce(s => {
    const { numParents, numStates, ruleMode, rules } = s.config;
    s.config.ruleMode = mode;
    s.config.rules = applyRuleMode(rules, numParents, numStates, ruleMode, mode);
  }));
}

export function randomizeRules() {
  const { numParents, numStates, ruleMode } = store.config;
  setStore(produce(s => {
    const count = getRuleCountForStates(ruleMode, numParents, numStates);
    s.config.rules = Uint8Array.from({ length: count }, () => randomInt(numStates));
  }));
}

export function computedRuleCount(): number {
  return getRuleCountForStates(store.config.ruleMode, store.config.numParents, store.config.numStates);
}

export function setInitial(cells: StateArray) {
  setStore('config', 'initial', cells);
}

export function setPadLeft(sequence: StateSequence) {
  setStore('config', 'padLeft', clonePadSequence(sequence));
}

export function setPadRight(sequence: StateSequence) {
  setStore('config', 'padRight', clonePadSequence(sequence));
}

export function setSelectedState(state: number) {
  setStore('selectedState', state);
}

export { store };
