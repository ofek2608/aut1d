import styles from './SidebarResizer.module.css'

export default function SidebarResizer(props: {
  onDrag: (deltaX: number) => void
}) {
  function onMouseDown(e: MouseEvent) {
    e.preventDefault()
    let lastX = e.clientX

    function onMouseMove(moveEvent: MouseEvent) {
      const delta = moveEvent.clientX - lastX
      lastX = moveEvent.clientX
      props.onDrag(delta)
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      class={`${styles.resizer} desktop-only`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
    />
  )
}
