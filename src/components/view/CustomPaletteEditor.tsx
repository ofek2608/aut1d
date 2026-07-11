import { For } from 'solid-js'
import { store, setCustomColor, setSelectedCustomColor } from '../../store'
import styles from './CustomPaletteEditor.module.css'

function ColorCell(props: { index: number; color: string }) {
  const selected = () => store.selectedCustomColor === props.index

  return (
    <button
      type="button"
      class={styles.cell}
      classList={{ [styles.selected]: selected() }}
      style={{ 'background-color': props.color }}
      onClick={() => setSelectedCustomColor(props.index)}
      aria-pressed={selected()}
      title={`State ${props.index}`}
    />
  )
}

export default function CustomPaletteEditor() {
  const selectedColor = () => store.customColors[store.selectedCustomColor] ?? '#888888'

  return (
    <div class={styles.editor}>
      <div class={styles.grid}>
        <For each={store.customColors}>
          {(color, index) => <ColorCell index={index()} color={color} />}
        </For>
      </div>
      <label class={styles.pickerRow}>
        <span class={styles.pickerLabel}>Color</span>
        <input
          type="color"
          class={styles.picker}
          value={selectedColor()}
          onInput={e => setCustomColor(store.selectedCustomColor, e.currentTarget.value)}
          aria-label={`Color for state ${store.selectedCustomColor}`}
        />
        <input
          type="text"
          class={styles.hexInput}
          value={selectedColor()}
          onInput={e => {
            const value = e.currentTarget.value
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
              setCustomColor(store.selectedCustomColor, value)
            }
          }}
          aria-label={`Hex color for state ${store.selectedCustomColor}`}
        />
      </label>
    </div>
  )
}
