import { For, Index, createMemo } from 'solid-js';
import { store, setRule } from '../../store';
import type { StateArray } from '../../automata/config';
import { createRulePatterns } from '../../automata/rules';
import StateInput from './StateInput';
import styles from './RulesGrid.module.css';

function RulesGridEntry(props: { pattern: StateArray; ruleIndex: number }) {
  const outputState = () => store.config.rules[props.ruleIndex];

  return (
    <div class={styles.entry}>
      <div class={styles.neighborhood}>
        <Index each={[...props.pattern]}>
          {(state) => <StateInput value={state()} />}
        </Index>
      </div>
      <StateInput
        variant="output"
        value={outputState()}
        onEdit={newState => setRule(props.ruleIndex, newState)}
        title={`Rule ${props.ruleIndex}: click to cycle (currently ${outputState()})`}
      />
    </div>
  );
}

export default function RulesGrid() {
  const displayPositions = createMemo(() =>
    createRulePatterns(store.config.ruleMode, store.config.numParents, store.config.numStates),
  );

  return (
    <div class={styles.grid} style={{ '--num-parents': store.config.numParents }}>
      <For each={displayPositions()}>
        {(pattern, index) => <RulesGridEntry pattern={pattern} ruleIndex={index()} />}
      </For>
    </div>
  );
}
