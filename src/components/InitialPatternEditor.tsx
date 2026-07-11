import { Index } from 'solid-js'
import { store, setInitial, PALETTES } from '../store'

export default function InitialPatternEditor() {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic']

  function cycleCell(i: number) {
    const cells = store.config.initial.slice()
    cells[i] = (cells[i] + 1) % store.config.numStates
    setInitial(cells)
  }

  function addCell() { setInitial([...store.config.initial, 0]) }

  function removeCell() {
    if (store.config.initial.length <= 1) return
    setInitial(store.config.initial.slice(0, -1))
  }

  return (
    <div class="initial-editor">
      <div class="initial-cells">
        <Index each={store.config.initial}>
          {(s, i) => (
            <div
              class="rule-cell"
              style={{ background: palette()[s()] ?? '#888', cursor: 'pointer', 'flex-shrink': '0' }}
              title={`State ${s()}, click to cycle`}
              onClick={() => cycleCell(i)}
            />
          )}
        </Index>
      </div>
      <div class="initial-controls">
        <button class="icon-btn" onClick={removeCell} disabled={store.config.initial.length <= 1}>−</button>
        <button class="icon-btn" onClick={addCell}>+</button>
      </div>
    </div>
  )
}
