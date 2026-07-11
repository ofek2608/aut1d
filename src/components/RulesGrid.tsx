import { For, Index } from 'solid-js'
import { store, setRule, PALETTES } from '../store'

function decodeNeighborhood(index: number, numParents: number, numStates: number): number[] {
  const digits: number[] = []
  let n = index
  for (let i = 0; i < numParents; i++) {
    digits.unshift(n % numStates)
    n = Math.floor(n / numStates)
  }
  return digits
}

export default function RulesGrid() {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic']
  const ruleCount = () => store.config.rules.length

  return (
    <div class="rules-grid">
      <For each={store.config.rules}>
        {(outputState, i) => {
          const neighborhood = () => decodeNeighborhood(i(), store.config.numParents, store.config.numStates)
          return (
            <div class="rule-entry">
              <div class="rule-neighborhood">
                <Index each={neighborhood()}>
                  {(s) => (
                    <div
                      class="rule-cell"
                      style={{ background: palette()[s()] ?? '#888' }}
                    />
                  )}
                </Index>
              </div>
              <div class="rule-arrow">→</div>
              <div
                class="rule-output"
                style={{ background: palette()[outputState] ?? '#888' }}
                title={`Rule ${i()}: click to cycle (currently ${outputState})`}
                onClick={() => setRule(i(), (outputState + 1) % store.config.numStates)}
              />
            </div>
          )
        }}
      </For>
      {ruleCount() > 50 && (
        <p class="rules-note">{ruleCount()} rules total</p>
      )}
    </div>
  )
}
