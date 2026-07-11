import { applyPreset, store } from '../store'

const PRESETS = [
  { name: 'rule110', label: 'Rule 110' },
  { name: 'rule30',  label: 'Rule 30'  },
  { name: 'rule90',  label: 'Rule 90'  },
]

export default function PresetButtons() {
  const available = () => store.config.numParents === 3 && store.config.numStates === 2

  return (
    <div class="preset-buttons">
      {PRESETS.map(p => (
        <button
          class="preset-btn"
          disabled={!available()}
          onClick={() => applyPreset(p.name)}
        >
          {p.label}
        </button>
      ))}
      {!available() && <p class="presets-note">Presets for 3 parents, 2 states</p>}
    </div>
  )
}
