import { For, Index, createMemo } from 'solid-js'
import { store, setRule } from '../../store'
import { orderedDisplayNeighborhoods } from '../../automata/rules'
import StateInput from './StateInput'
import styles from './RulesGrid.module.css'

function RulesGridEntry(props: { displayPos: number }) {
  const neighborhood = () =>
    orderedDisplayNeighborhoods(
      store.config.numParents,
      store.config.numStates,
      store.config.ruleMode,
    )[props.displayPos]

  const outputState = () => store.config.rules[props.displayPos]

  return (
    <div class={styles.entry}>
      <div class={styles.neighborhood}>
        <Index each={neighborhood()}>
          {(state) => <StateInput value={state()} />}
        </Index>
      </div>
      <StateInput
        variant="output"
        value={outputState()}
        onEdit={newState => setRule(props.displayPos, newState)}
        title={`Rule ${props.displayPos}: click to cycle (currently ${outputState()})`}
      />
    </div>
  )
}

export default function RulesGrid() {
  const displayPositions = createMemo(() =>
    Array.from({ length: store.config.rules.length }, (_, index) => index),
  )

  return (
    <div class={styles.grid} style={{ '--num-parents': store.config.numParents }}>
      <For each={displayPositions()}>
        {displayPos => <RulesGridEntry displayPos={displayPos} />}
      </For>
    </div>
  )
}
