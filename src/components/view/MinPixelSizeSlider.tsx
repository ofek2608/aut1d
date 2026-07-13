import { localStore, setMinPixelSize } from '../../localStore'

export default function MinPixelSizeSlider() {
  return (
    <label class="field-label">
      <span>Min pixel {localStore.minPixelSize}</span>
      <input
        class="slider"
        type="range"
        min={1}
        max={8}
        step={1}
        value={localStore.minPixelSize}
        onInput={e => setMinPixelSize(Number(e.currentTarget.value))}
        aria-label="Minimum pixel size for sampled rendering"
      />
    </label>
  )
}
