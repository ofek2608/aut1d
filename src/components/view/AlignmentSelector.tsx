import { For } from 'solid-js'
import { store, setAlignment, type Alignment } from '../../store'
import styles from './AlignmentSelector.module.css'

const ALIGNMENTS: { value: Alignment; icon: string; label: string }[] = [
  { value: 'left', icon: 'align-left', label: 'Align left' },
  { value: 'center', icon: 'align-center', label: 'Align center' },
  { value: 'right', icon: 'align-right', label: 'Align right' },
]

export default function AlignmentSelector() {
  return (
    <div class={styles.grid}>
      <For each={ALIGNMENTS}>
        {({ value, icon, label }) => (
          <button
            type="button"
            class={styles.cell}
            classList={{ [styles.selected]: store.alignment === value }}
            onClick={() => setAlignment(value)}
            aria-pressed={store.alignment === value}
            aria-label={label}
            title={label}
          >
            <i class={`fa-solid fa-${icon}`} aria-hidden="true" />
          </button>
        )}
      </For>
    </div>
  )
}
