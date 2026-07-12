import { For, createEffect, createSignal } from 'solid-js'
import { localStore, setCustomColor } from '../../localStore'
import styles from './CustomPaletteEditor.module.css'

function ColorCell(props: {
  index: number
  color: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      class={styles.cell}
      classList={{ [styles.selected]: props.selected }}
      style={{ 'background-color': props.color }}
      onClick={() => props.onSelect()}
      aria-pressed={props.selected}
      title={`State ${props.index}`}
    />
  )
}

export default function CustomPaletteEditor() {
  const [selectedIndex, setSelectedIndex] = createSignal(0)

  createEffect(() => {
    const max = localStore.customColors.length - 1
    if (selectedIndex() > max) setSelectedIndex(Math.max(0, max))
  })

  const selectedColor = () => localStore.customColors[selectedIndex()] ?? '#888888'

  return (
    <div class={styles.editor}>
      <div class={styles.grid}>
        <For each={localStore.customColors}>
          {(color, index) => (
            <ColorCell
              index={index()}
              color={color}
              selected={selectedIndex() === index()}
              onSelect={() => setSelectedIndex(index())}
            />
          )}
        </For>
      </div>
      <label class={styles.pickerRow}>
        <span class={styles.pickerLabel}>Color</span>
        <input
          type="color"
          class={styles.picker}
          value={selectedColor()}
          onInput={e => setCustomColor(selectedIndex(), e.currentTarget.value)}
          aria-label={`Color for state ${selectedIndex()}`}
        />
        <input
          type="text"
          class={styles.hexInput}
          value={selectedColor()}
          onInput={e => {
            const value = e.currentTarget.value
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
              setCustomColor(selectedIndex(), value)
            }
          }}
          aria-label={`Hex color for state ${selectedIndex()}`}
        />
      </label>
    </div>
  )
}
