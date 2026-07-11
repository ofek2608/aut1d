import { For, Index, createMemo } from 'solid-js'
import { store, setRule } from '../store'
import { decodeNeighborhood, displayRuleIndices } from '../rules'
import StateInput from './StateInput'
import styles from './RulesGrid.module.css'

export default function RulesGrid() {
  const displayIndices = createMemo(() =>
    displayRuleIndices(store.config.numParents, store.config.numStates, store.ruleMode),
  )

  return (
    <div class={styles.grid}>
      <For each={displayIndices()}>
        {(ruleIndex) => {
          const neighborhood = () =>
            decodeNeighborhood(ruleIndex, store.config.numParents, store.config.numStates)
          const outputState = () => store.config.rules[ruleIndex]

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
                onEdit={newState => setRule(ruleIndex, newState)}
                title={`Rule ${ruleIndex}: click to cycle (currently ${outputState()})`}
              />
            </div>
          )
        }}
      </For>
    </div>
  )
}
