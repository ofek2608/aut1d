import { For, Index, createMemo } from 'solid-js'
import { store, setRule, PALETTES } from '../store'
import { decodeNeighborhood, displayRuleIndices } from '../rules'
import styles from './RulesGrid.module.css'

export default function RulesGrid() {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic']

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
                  {(s) => (
                    <div
                      class={styles.cell}
                      style={{ background: palette()[s()] ?? '#888' }}
                    />
                  )}
                </Index>
              </div>
              <div
                class={styles.output}
                style={{ background: palette()[outputState()] ?? '#888' }}
                title={`Rule ${ruleIndex}: click to cycle (currently ${outputState()})`}
                onClick={() => setRule(ruleIndex, (outputState() + 1) % store.config.numStates)}
              />
            </div>
          )
        }}
      </For>
    </div>
  )
}
