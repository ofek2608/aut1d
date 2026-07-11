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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <line x1="14" y1="6" x2="21" y2="6"/>
          <line x1="14" y1="12" x2="21" y2="12"/>
          <line x1="14" y1="18" x2="21" y2="18"/>
        </svg>
        Rules
      </button>
      <button
        class={`mobile-nav-btn${props.rightOpen() ? ' active' : ''}`}
        onClick={toggleRight}
        aria-label="Toggle view panel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        View
      </button>
    </nav>
  )
}
