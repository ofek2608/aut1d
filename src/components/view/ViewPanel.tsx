import { For } from 'solid-js'
import { store, setAlignment, setPalette, PALETTES, type Alignment } from '../../store'

const PALETTE_NAMES = Object.keys(PALETTES)

export default function ViewPanel() {
  return (
    <div class="panel view-panel">
      <h2 class="panel-title">
        <i class="fa-solid fa-palette" aria-hidden="true" />
        View
      </h2>

      <section class="panel-section">
        <div class="section-header">Palette</div>
        <div class="palette-list">
          <For each={PALETTE_NAMES}>
            {name => (
              <button
                class={`palette-row${store.palette === name ? ' active' : ''}`}
                onClick={() => setPalette(name)}
                title={name}
              >
                <span class="palette-name">{name}</span>
                <span class="palette-swatches">
                  <For each={PALETTES[name]}>
                    {color => <span class="swatch" style={{ background: color }} />}
                  </For>
                </span>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="panel-section">
        <div class="section-header">Alignment</div>
        <div class="alignment-buttons">
          <For each={['left', 'center', 'right'] as Alignment[]}>
            {a => (
              <button
                class={`align-btn${store.alignment === a ? ' active' : ''}`}
                onClick={() => setAlignment(a)}
                aria-label={`Align ${a}`}
                title={a[0].toUpperCase() + a.slice(1)}
              >
                <i class={`fa-solid fa-align-${a}`} aria-hidden="true" />
              </button>
            )}
          </For>
        </div>
        <p class="field-hint">Sets origin. Scroll to zoom, drag to pan.</p>
      </section>
    </div>
  )
}
