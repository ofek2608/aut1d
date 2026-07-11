import { Index } from 'solid-js'
import { store, setPadLeft, setPadRight, setInitial } from '../store'
import StateInput from './StateInput'
import styles from './StateListEditor.module.css'

function StateListRow(props: {
  label: string
  cells: number[]
  onChange: (cells: number[]) => void
}) {
  function editCell(i: number, newState: number) {
    const cells = [...props.cells]
    cells[i] = newState
    props.onChange(cells)
  }

  function add() {
    props.onChange([...props.cells, 0])
  }

  function remove() {
    if (props.cells.length == 0) return
    props.onChange(props.cells.slice(0, -1))
  }

  return (
    <div class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      <div class={styles.cells}>
        <Index each={props.cells}>
          {(state, i) => (
            <StateInput
              value={state()}
              onEdit={newState => editCell(i, newState)}
              title={`State ${state()}, click to cycle`}
            />
          )}
        </Index>
        <button
          type="button"
          class={styles.iconBtn}
          onClick={remove}
          disabled={props.cells.length == 0}
          aria-label={`Remove ${props.label.toLowerCase()} cell`}
          title={`Remove ${props.label.toLowerCase()} cell`}
        >
          <i class="fa-solid fa-minus" aria-hidden="true" />
        </button>
        <button
          type="button"
          class={styles.iconBtn}
          onClick={add}
          aria-label={`Add ${props.label.toLowerCase()} cell`}
          title={`Add ${props.label.toLowerCase()} cell`}
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default function StateListEditor() {
  return (
    <div class={styles.editor}>
      <StateListRow label="Initial" cells={store.config.initial} onChange={setInitial} />
      <StateListRow label="Left" cells={store.config.padLeft} onChange={setPadLeft} />
      <StateListRow label="Right" cells={store.config.padRight} onChange={setPadRight} />
    </div>
  )
}
