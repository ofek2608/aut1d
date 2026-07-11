import { store, setNumParents, setRuleMode, randomizeRules, computedRuleCount } from '../../store'
import type { RuleMode } from '../../automata/config'
import { Show } from 'solid-js'
import SidebarSection from '../layout/SidebarSection'
import ConfigIdentifier from './ConfigIdentifier'
import RulesGrid from './RulesGrid'
import StateListEditor from './StateListEditor'
import StatePaletteGrid from './StateGrid'
import styles from './RulesPanel.module.css'

function RuleModeCell(props: { mode: RuleMode; icon: string; label: string }) {
  const selected = () => store.config.ruleMode === props.mode

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

      <SidebarSection title={`States (${store.config.numStates})`} icon="shapes">
        <StatePaletteGrid />
      </SidebarSection>

      <SidebarSection title="Rules" icon="table-cells" flexGrow>
        <label class="field-label">
          Parents
          <select
            value={store.config.numParents}
            onChange={e => setNumParents(Number(e.currentTarget.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option value={n}>{n}</option>)}
          </select>
        </label>
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
      </SidebarSection>

      <SidebarSection title="Pattern" icon="paintbrush">
        <StateListEditor />
      </SidebarSection>

      <SidebarSection title="Identifier" icon="barcode">
        <ConfigIdentifier />
      </SidebarSection>
    </div>
  )
}
