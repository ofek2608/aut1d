import { For, Index, createMemo } from 'solid-js'
import { store, setRule } from '../../store'
import { decodeNeighborhood, displayRuleIndices } from '../../rules'
import StateInput from './StateInput'
import styles from './RulesGrid.module.css'

function RulesGridEntry(props: { ruleIndex: number; displayPos: number }) {
  const neighborhood = () => decodeNeighborhood(props.ruleIndex, store.config.numParents, store.config.numStates)
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
        onEdit={newState => setRule(props.ruleIndex, newState)}
        title={`Rule ${props.ruleIndex}: click to cycle (currently ${outputState()})`}
      />
    </div>
  )
}

export default function RulesGrid() {
  const displayIndices = createMemo(() =>
    displayRuleIndices(store.config.numParents, store.config.numStates, store.config.ruleMode),
  )

  return (
    <div class={styles.grid} style={{ '--num-parents': store.config.numParents }}>
      <For each={displayIndices()}>
        {(ruleIndex, displayPos) => (
          <RulesGridEntry ruleIndex={ruleIndex} displayPos={displayPos()} />
        )}
      </For>
    </div>
  )
}
