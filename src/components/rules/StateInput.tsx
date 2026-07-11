import { store, activePalette, setSelectedState } from '../../store'
import styles from './StateInput.module.css'

export default function StateInput(props: {
  value: number
  onEdit?: (newState: number) => void
  variant?: 'default' | 'output'
  title?: string
}) {
  const palette = () => activePalette()
  const editable = () => props.onEdit != null

  function handleClick() {
    if (!editable()) return
    const selected = store.selectedState
    if (selected >= 0 && selected !== props.value) {
      props.onEdit?.(selected)
    } else {
      setSelectedState(-1)
      props.onEdit?.((props.value + 1) % store.config.numStates)
    }
  }

  const shared = () => ({
    class: styles.input,
    classList: {
      [styles.output]: props.variant === 'output',
      [styles.editable]: editable(),
    },
    style: { background: palette()[props.value] ?? '#888' },
    title: props.title,
  });

  if (editable()) {
    return (
      <button type="button" {...shared()} onClick={handleClick} aria-label={props.title} />
    )
  }

  return <div {...shared()} />
}
