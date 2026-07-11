import type { Accessor, Setter } from 'solid-js'

interface Props {
  leftOpen: Accessor<boolean>
  setLeftOpen: Setter<boolean>
  rightOpen: Accessor<boolean>
  setRightOpen: Setter<boolean>
}

export default function MobileNav(props: Props) {
  function toggleLeft() {
    props.setLeftOpen(v => !v)
    props.setRightOpen(false)
  }
  function toggleRight() {
    props.setRightOpen(v => !v)
    props.setLeftOpen(false)
  }

  return (
    <nav class="mobile-nav">
      <button
        class={`mobile-nav-btn${props.leftOpen() ? ' active' : ''}`}
        onClick={toggleLeft}
        aria-label="Toggle rules panel"
      >
        <i class="fa-solid fa-list-check" aria-hidden="true" />
        Rules
      </button>
      <button
        class={`mobile-nav-btn${props.rightOpen() ? ' active' : ''}`}
        onClick={toggleRight}
        aria-label="Toggle view panel"
      >
        <i class="fa-solid fa-palette" aria-hidden="true" />
        View
      </button>
    </nav>
  )
}
