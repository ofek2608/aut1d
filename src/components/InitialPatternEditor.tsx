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
              class="initial-cell"
              style={{ background: palette()[s()] ?? '#888' }}
              title={`State ${s()}, click to cycle`}
              onClick={() => cycleCell(i)}
            />
          )}
        </Index>
      </div>
      <div class="initial-controls">
        <button class="icon-btn" onClick={removeCell} disabled={store.config.initial.length <= 1} aria-label="Remove cell" title="Remove cell">
          <i class="fa-solid fa-minus" aria-hidden="true" />
        </button>
        <button class="icon-btn" onClick={addCell} aria-label="Add cell" title="Add cell">
          <i class="fa-solid fa-plus" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
