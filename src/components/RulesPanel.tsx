import { store, setNumParents, setPadLeft, setPadRight, setRuleMode, randomizeRules, computedRuleCount, expectedFullRuleCount, PALETTES, type RuleMode } from '../store'
import { Index, Show } from 'solid-js'
import RulesGrid from './RulesGrid'
import InitialPatternEditor from './InitialPatternEditor'
import StatePaletteGrid from './StateGrid'
import gridStyles from './RulesGrid.module.css'
import styles from './RulesPanel.module.css'

function RuleModeCell(props: { mode: RuleMode; icon: string; label: string }) {
  const selected = () => store.ruleMode === props.mode

  return (
    <button
      type="button"
      class={styles.modeCell}
      classList={{ [styles.selected]: selected() }}
      onClick={() => setRuleMode(props.mode)}
      aria-pressed={selected()}
      aria-label={props.label}
      title={props.label}
    >
      <i class={`fa-solid fa-${props.icon}`} aria-hidden="true" />
    </button>
  )
}

function RandomizeButton() {
  return (
    <button
      type="button"
      class={styles.actionCell}
      onClick={randomizeRules}
      aria-label="Randomize rules"
      title="Randomize rules"
    >
      <i class="fa-solid fa-dice" aria-hidden="true" />
    </button>
  )
}

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
              class={gridStyles.cell}
              style={{ background: palette()[s()] ?? '#888', cursor: 'pointer' }}
              onClick={() => cycle(i)}
            />
          )}
        </Index>
      </div>
      <button class="icon-btn" onClick={remove} disabled={props.cells.length === 0} aria-label="Remove pad cell" title="Remove pad cell">
        <i class="fa-solid fa-minus" aria-hidden="true" />
      </button>
      <button class="icon-btn" onClick={add} aria-label="Add pad cell" title="Add pad cell">
        <i class="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function RulesPanel() {
  return (
    <div class="panel rules-panel">
      <h2 class="panel-title">
        <i class="fa-solid fa-list-check" aria-hidden="true" />
        Rules
      </h2>

      <section class="panel-section">
      <div class="section-header">States ({store.config.numStates})</div>
        <StatePaletteGrid />
      </section>

      <section class={`panel-section ${styles.rulesSection}`}>
        <label class="field-label">
          Parents
          <select
            value={store.config.numParents}
            onChange={e => setNumParents(Number(e.currentTarget.value))}
          >
            {[1, 2, 3, 4, 5].map(n => <option value={n}>{n}</option>)}
          </select>
        </label>
        <Show when={store.config.numParents >= 2}>
          <div class="section-header">Neighborhood</div>
        </Show>
        <div class={styles.modeGrid}>
          <Show when={store.config.numParents >= 2}>
            <RuleModeCell mode="asymmetric" icon="arrow-right-long" label="Asymmetric" />
            <RuleModeCell mode="symmetric" icon="right-left" label="Symmetric" />
            <Show when={store.config.numParents >= 3}>
              <RuleModeCell mode="unordered" icon="shuffle" label="Unordered" />
            </Show>
          </Show>
          <RandomizeButton />
        </div>
        <div class="section-header">
          Rules ({computedRuleCount()} / {expectedFullRuleCount()})
        </div>
        <RulesGrid />
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
    </div>
  )
}
