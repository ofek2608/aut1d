import { store, setNumParents, setRuleMode, randomizeRules, computedRuleCount, type RuleMode } from '../../store'
import { Show } from 'solid-js'
import RulesGrid from './RulesGrid'
import StateListEditor from './StateListEditor'
import StatePaletteGrid from './StateGrid'
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
          <RuleModeCell mode="asymmetric" icon="arrow-right-long" label="Asymmetric" />
          <RuleModeCell mode="symmetric" icon="right-left" label="Symmetric" />
          <RuleModeCell mode="unordered" icon="shuffle" label="Unordered" />
          <RandomizeButton />
        </div>
        <div class="section-header">
          Rules ({computedRuleCount()})
        </div>
        <RulesGrid />
      </section>

      <section class="panel-section">
        <div class="section-header">Pattern</div>
        <StateListEditor />
      </section>
    </div>
  )
}
