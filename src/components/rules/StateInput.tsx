import { store, PALETTES } from '../../store'
import styles from './StateInput.module.css'

export default function StateInput(props: {
  value: number
  onEdit?: (newState: number) => void
  variant?: 'default' | 'output'
  title?: string
}) {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic']
  const editable = () => props.onEdit != null

  function handleClick() {
    props.onEdit?.((props.value + 1) % store.config.numStates)
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
