import { createSignal, Show } from 'solid-js'
import CanvasView from './components/CanvasView'
import RulesPanel from './components/rules/RulesPanel'
import ViewPanel from './components/view/ViewPanel'
import MobileNav from './components/layout/MobileNav'
import SidebarResizer from './components/layout/SidebarResizer'
import './App.css'

const DEFAULT_LEFT_WIDTH = 260
const DEFAULT_RIGHT_WIDTH = 240
const MIN_SIDEBAR_WIDTH = 180
const MAX_SIDEBAR_WIDTH = 480
const MIN_CENTER_WIDTH = 200

function clampSidebarWidth(width: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width))
}

export default function App() {
  const [leftOpen, setLeftOpen] = createSignal(false)
  const [rightOpen, setRightOpen] = createSignal(false)
  const [leftWidth, setLeftWidth] = createSignal(DEFAULT_LEFT_WIDTH)
  const [rightWidth, setRightWidth] = createSignal(DEFAULT_RIGHT_WIDTH)

  function closeAll() {
    setLeftOpen(false)
    setRightOpen(false)
  }

  function resizeLeft(delta: number) {
    setLeftWidth(w => {
      const next = clampSidebarWidth(w + delta)
      const maxLeft = window.innerWidth - rightWidth() - MIN_CENTER_WIDTH
      return Math.min(next, maxLeft)
    })
  }

  function resizeRight(delta: number) {
    setRightWidth(w => {
      const next = clampSidebarWidth(w - delta)
      const maxRight = window.innerWidth - leftWidth() - MIN_CENTER_WIDTH
      return Math.min(next, maxRight)
    })
  }

  return (
    <div class="app-layout">
      {/* Desktop panels */}
      <div class="panel-left desktop-only" style={{ width: `${leftWidth()}px` }}>
        <RulesPanel />
      </div>

      <SidebarResizer onDrag={resizeLeft} />

      <div class="panel-center">
        <CanvasView />
      </div>

      <SidebarResizer onDrag={resizeRight} />

      <div class="panel-right desktop-only" style={{ width: `${rightWidth()}px` }}>
        <ViewPanel />
      </div>

      {/* Mobile drawers */}
      <div class={`drawer drawer-left mobile-only${leftOpen() ? ' open' : ''}`}>
        <RulesPanel />
      </div>
      <div class={`drawer drawer-right mobile-only${rightOpen() ? ' open' : ''}`}>
        <ViewPanel />
      </div>

      <Show when={leftOpen() || rightOpen()}>
        <div class="drawer-backdrop mobile-only" onClick={closeAll} />
      </Show>

      <div class="mobile-only">
        <MobileNav
          leftOpen={leftOpen}
          setLeftOpen={setLeftOpen}
          rightOpen={rightOpen}
          setRightOpen={setRightOpen}
        />
      </div>
    </div>
  )
}
