import { createSignal, Show } from 'solid-js'
import CanvasView from './components/CanvasView'
import RulesPanel from './components/RulesPanel'
import ViewPanel from './components/ViewPanel'
import MobileNav from './components/MobileNav'
import './App.css'

export default function App() {
  const [leftOpen, setLeftOpen] = createSignal(false)
  const [rightOpen, setRightOpen] = createSignal(false)

  function closeAll() {
    setLeftOpen(false)
    setRightOpen(false)
  }

  return (
    <div class="app-layout">
      {/* Desktop panels */}
      <div class="panel-left desktop-only">
        <RulesPanel />
      </div>

      <div class="panel-center">
        <CanvasView />
      </div>

      <div class="panel-right desktop-only">
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
