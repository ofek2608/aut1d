import { For } from 'solid-js'
import { store, setPalette, PALETTES, CUSTOM_PALETTE } from '../../store'
import styles from './PaletteSelector.module.css'

const PALETTE_NAMES = Object.keys(PALETTES)

function PaletteRow(props: { name: string; colors: string[] }) {
  const selected = () => store.palette === props.name

  return (
    <button
      type="button"
      class={styles.row}
      classList={{ [styles.selected]: selected() }}
      onClick={() => setPalette(props.name)}
      aria-pressed={selected()}
      title={props.name}
    >
      <span class={styles.name}>{props.name}</span>
      <span class={styles.swatches}>
        <For each={props.colors}>
          {color => <span class={styles.swatch} style={{ background: color }} />}
        </For>
      </span>
    </button>
  )
}

export default function PaletteSelector() {
  return (
    <div class={styles.list}>
      <For each={PALETTE_NAMES}>
        {name => <PaletteRow name={name} colors={PALETTES[name]} />}
      </For>
      <PaletteRow name={CUSTOM_PALETTE} colors={store.customColors} />
    </div>
  )
}
