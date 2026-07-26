import { localStore, setUseRustRender } from '../../localStore'
import { rustRendererReady } from '../../automata/rustRender'

export default function RustRenderToggle() {
  return (
    <label class="field-label">
      <span>Rust renderer</span>
      <input
        type="checkbox"
        checked={localStore.useRustRender}
        disabled={!rustRendererReady()}
        onInput={e => setUseRustRender(e.currentTarget.checked)}
        title={rustRendererReady() ? 'Use Rust/WASM renderer' : 'Loading Rust renderer…'}
        aria-label="Use Rust renderer"
      />
    </label>
  )
}
