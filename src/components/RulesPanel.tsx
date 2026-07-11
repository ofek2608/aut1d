import { store, setNumParents, setNumStates, setPadLeft, setPadRight, PALETTES } from '../store'
import { Index } from 'solid-js'
import RulesGrid from './RulesGrid'
import InitialPatternEditor from './InitialPatternEditor'
import PresetButtons from './PresetButtons'

function PadEditor(props: { label: string; cells: number[]; onChange: (c: number[]) => void }) {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic']
  function cycle(i: number) {
    const c = [...props.cells]
    c[i] = (c[i] + 1) % store.config.numStates
    props.onChange(c)
  }
  function add() { props.onChange([...props.cells, 0]) }
  function remove() {
    if (props.cells.length === 0) return
    props.onChange(props.cells.slice(0, -1))
  }
  return (
    <div class="pad-editor">
      <span class="pad-label">{props.label}</span>
      <div class="pad-cells">
        <Index each={props.cells}>
          {(s, i) => (
            <div
              class="rule-cell"
              style={{ background: palette()[s()] ?? '#888', cursor: 'pointer' }}
              onClick={() => cycle(i)}
            />
          )}
        </Index>
      </div>
      <button class="icon-btn" onClick={remove} disabled={props.cells.length === 0}>−</button>
      <button class="icon-btn" onClick={add}>+</button>
    </div>
  )
}

export default function RulesPanel() {
  return (
    <div class="panel rules-panel">
      <h2 class="panel-title">Rules</h2>

      <section class="panel-section">
        <label class="field-label">
          Parents
          <select
            value={store.config.numParents}
            onChange={e => setNumParents(Number(e.currentTarget.value))}
          >
            {[1, 2, 3, 4, 5].map(n => <option value={n}>{n}</option>)}
          </select>
        </label>
        <label class="field-label">
          States
          <select
            value={store.config.numStates}
            onChange={e => setNumStates(Number(e.currentTarget.value))}
          >
            {[2, 3, 4, 5].map(n => <option value={n}>{n}</option>)}
          </select>
        </label>
      </section>

      <section class="panel-section">
        <div class="section-header">Presets</div>
        <PresetButtons />
      </section>

      <section class="panel-section">
        <div class="section-header">Padding</div>
        <PadEditor label="Left" cells={store.config.padLeft} onChange={setPadLeft} />
        <PadEditor label="Right" cells={store.config.padRight} onChange={setPadRight} />
      </section>

      <section class="panel-section">
        <div class="section-header">Initial ({store.config.initial.length} cells)</div>
        <InitialPatternEditor />
      </section>

      <section class="panel-section rules-section">
        <div class="section-header">Rules ({store.config.rules.length})</div>
        <RulesGrid />
      </section>
    </div>
  )
}
