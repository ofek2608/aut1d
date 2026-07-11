import { Show } from 'solid-js'
import SidebarSection from '../layout/SidebarSection'
import AboutSection from './AboutSection'
import PaletteSelector from './PaletteSelector'
import AlignmentSelector from './AlignmentSelector'
import CustomPaletteEditor from './CustomPaletteEditor'
import { store, CUSTOM_PALETTE } from '../../store'

export default function ViewPanel() {
  return (
    <div class="panel view-panel">
      <h2 class="panel-title">
        <i class="fa-solid fa-palette" aria-hidden="true" />
        View
      </h2>

      <SidebarSection title="Palette" icon="palette">
        <PaletteSelector />
        <Show when={store.palette === CUSTOM_PALETTE}>
          <div class="section-header">Colors</div>
          <CustomPaletteEditor />
        </Show>
      </SidebarSection>

      <SidebarSection title="Alignment" icon="align-center">
        <AlignmentSelector />
      </SidebarSection>

      <AboutSection />
    </div>
  )
}
