import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { store } from '../store'
import { getRows, onRowsChange, regenerateRows, extendRows } from '../automata/rows'
import { localStore, activePalette } from '../localStore'
// rowWorldStart not needed: per-row alignment uses row.length directly

const BASE_CELL_SIZE = 4
const MIN_ZOOM = 0.01
const MAX_ZOOM = 8
const REGEN_THRESHOLD = 500

export default function CanvasView() {
  let containerRef!: HTMLDivElement
  let canvasRef!: HTMLCanvasElement
  let sampleCanvas: HTMLCanvasElement | undefined
  let rafId = 0

  const [canvasW, setCanvasW] = createSignal(0)
  const [canvasH, setCanvasH] = createSignal(0)
  const [panX, setPanX] = createSignal(0)
  const [panY, setPanY] = createSignal(0)
  const [zoom, setZoom] = createSignal(1.0)
  const [rowTick, setRowTick] = createSignal(0)

  const cellSize = createMemo(() => BASE_CELL_SIZE * zoom())

  onMount(() => {
    onCleanup(onRowsChange(() => setRowTick(t => t + 1)))
  })

  // Pan state
  let dragging = false
  let lastX = 0, lastY = 0

  // Pinch state
  let pinching = false
  let lastDist = 0, lastMidX = 0, lastMidY = 0

  function getPos(clientX: number, clientY: number) {
    const rect = containerRef.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function applyZoom(factor: number, cx: number, cy: number) {
    const zOld = zoom()
    const zNew = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zOld * factor))
    const ratio = zNew / zOld
    const centerX = canvasW() / 2
    batch(() => {
      setZoom(zNew)
      setPanX(px => cx - centerX - (cx - centerX - px) * ratio)
      setPanY(py => cy - (cy - py) * ratio)
    })
    maybeExtend()
  }

  // Mouse
  function onMouseDown(e: MouseEvent) {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging) return
    setPanX(x => x + e.clientX - lastX)
    setPanY(y => y + e.clientY - lastY)
    lastX = e.clientX
    lastY = e.clientY
    maybeExtend()
  }
  function onMouseUp() { dragging = false }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    let delta = e.deltaY
    if (e.deltaMode === 1) delta *= 20
    if (e.deltaMode === 2) delta *= 600
    const factor = Math.pow(1.001, -delta)
    const { x, y } = getPos(e.clientX, e.clientY)
    applyZoom(factor, x, y)
  }

  // Touch
  function onTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      pinching = false
      dragging = true
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      dragging = false
      pinching = true
      const t0 = e.touches[0], t1 = e.touches[1]
      lastDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
      lastMidX = (t0.clientX + t1.clientX) / 2
      lastMidY = (t0.clientY + t1.clientY) / 2
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - lastX
      const dy = e.touches[0].clientY - lastY
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      setPanX(x => x + dx)
      setPanY(y => y + dy)
      maybeExtend()
    } else if (e.touches.length === 2 && pinching) {
      const t0 = e.touches[0], t1 = e.touches[1]
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
      const midX = (t0.clientX + t1.clientX) / 2
      const midY = (t0.clientY + t1.clientY) / 2
      if (lastDist > 0) {
        const { x, y } = getPos(midX, midY)
        applyZoom(dist / lastDist, x, y)
      }
      setPanX(px => px + midX - lastMidX)
      setPanY(py => py + midY - lastMidY)
      lastDist = dist
      lastMidX = midX
      lastMidY = midY
      maybeExtend()
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) { dragging = false; pinching = false }
    else if (e.touches.length === 1) { pinching = false }
  }

  function maybeExtend() {
    const cs = cellSize()
    const rows = getRows()
    const totalH = rows.length * cs
    const visibleBottom = -panY() + canvasH()
    if (totalH < visibleBottom) {
      extendRows(store.config, rows.length + REGEN_THRESHOLD)
    }
  }

  // Re-generate when automata config changes
  createEffect(() => {
    const c = store.config
    void c.rules.slice()
    void c.initial.slice()
    void c.padLeft.slice()
    void c.padRight.slice()
    void c.numParents
    void c.numStates
    void c.ruleMode
    const target = untrack(() => Math.max(REGEN_THRESHOLD, Math.ceil(canvasH() / cellSize()) + REGEN_THRESHOLD))
    regenerateRows({ ...c }, target)
  })

  // Ensure enough rows when canvas resizes
  createEffect(() => {
    const h = canvasH()
    if (h === 0) return
    const target = untrack(() => Math.ceil(h / cellSize()) + REGEN_THRESHOLD)
    extendRows({ ...store.config }, target)
  })

  // ResizeObserver
  onMount(() => {
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const w = Math.floor(width), h = Math.floor(height)
      canvasRef.width = w
      canvasRef.height = h
      setCanvasW(w)
      setCanvasH(h)
    })
    ro.observe(containerRef)
    onCleanup(() => ro.disconnect())
  })

  // Draw
  createEffect(() => {
    rowTick()
    const rows = getRows()
    const cs = cellSize()
    const outline = cs < 10 ? 0 : 1;
    const palette = activePalette()
    const px = panX()
    const py = panY()
    const w = canvasW()
    const h = canvasH()
    const rx = canvasW() / 2
    const alignment = localStore.alignment
    const mps = localStore.minPixelSize

    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      const ctx = canvasRef?.getContext('2d')!
      if (!ctx || rows.length === 0 || w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h)

      if (cs < mps) {
        const paletteRgb = palette.map(hex => {
          const color = hex ?? '#888888'
          return [
            parseInt(color.slice(1, 3), 16),
            parseInt(color.slice(3, 5), 16),
            parseInt(color.slice(5, 7), 16),
          ]
        })
        const fallbackRgb = [0x88, 0x88, 0x88]
        const iw = Math.ceil(w / mps)
        const ih = Math.ceil(h / mps)
        const imageData = new ImageData(iw, ih)
        const data = imageData.data
        const half = mps / 2

        for (let iy = 0; iy < ih; iy++) {
          const sy = iy * mps + half
          const g = Math.floor((sy - py) / cs)
          if (g < 0 || g >= rows.length) continue
          const row = rows[g]
          if (!row) continue
          const rowLen = row.length
          const refI = alignment === 'left' ? 0
            : alignment === 'right' ? rowLen - 1
            : rowLen / 2

          for (let ix = 0; ix < iw; ix++) {
            const sx = ix * mps + half
            const c = Math.floor(refI + (sx - rx - px) / cs)
            if (c < 0 || c >= rowLen) continue
            const rgb = paletteRgb[row[c]] ?? fallbackRgb
            const off = (iy * iw + ix) * 4
            data[off] = rgb[0]
            data[off + 1] = rgb[1]
            data[off + 2] = rgb[2]
            data[off + 3] = 255
          }
        }

        if (!sampleCanvas) sampleCanvas = document.createElement('canvas')
        if (sampleCanvas.width !== iw) sampleCanvas.width = iw
        if (sampleCanvas.height !== ih) sampleCanvas.height = ih
        const sampleCtx = sampleCanvas.getContext('2d')!
        sampleCtx.putImageData(imageData, 0, 0)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(sampleCanvas, 0, 0, iw * mps, ih * mps)
      } else {
        function fillCell(x: number, y: number, state: number) {
          ctx.fillStyle = palette[state] ?? '#888888';
          const x1 = Math.round(x + outline);
          const y1 = Math.round(y + outline);
          const x2 = Math.round(x + cs - outline);
          const y2 = Math.round(y + cs - outline);
          const width = x2 - x1;
          const height = y2 - y1;
          ctx.fillRect(x1, y1, width, height)
        }

        const firstRow = Math.max(0, Math.floor(-py / cs))
        const lastRow = Math.min(rows.length - 1, Math.ceil((h - py) / cs))

        for (let g = firstRow; g <= lastRow; g++) {
          const row = rows[g]
          if (!row) continue
          const rowLen = row.length

          const refI = alignment === 'left' ? 0
            : alignment === 'right' ? rowLen - 1
            : rowLen / 2

          const iMin = Math.max(0, Math.floor(refI + (-rx - px) / cs))
          const iMax = Math.min(rowLen - 1, Math.ceil(refI + (w - rx - px) / cs))
          if (iMin > iMax) continue

          const y = py + g * cs

          let c = iMin
          while (c <= iMax) {
            const state = row[c]
            let end = c + 1
            fillCell(rx + px + (c - refI) * cs, y, state)
            c = end
          }
        }
      }
    })
  })

  onCleanup(() => cancelAnimationFrame(rafId))

  function zoomIn()  { applyZoom(1.5, canvasW() / 2, canvasH() / 2) }
  function zoomOut() { applyZoom(1 / 1.5, canvasW() / 2, canvasH() / 2) }
  function resetView() { batch(() => { setPanX(0); setPanY(0); setZoom(1.0) }) }

  return (
    <div
      ref={containerRef!}
      class="canvas-container"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <canvas
        ref={canvasRef!}
        class="automata-canvas"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      <div class="canvas-controls">
        <button class="ctrl-btn" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
          <i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true" />
        </button>
        <button class="ctrl-btn" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
          <i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true" />
        </button>
        <button class="ctrl-btn" onClick={resetView} aria-label="Reset view" title="Reset view">
          <i class="fa-solid fa-house" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
