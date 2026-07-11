import { Show } from 'solid-js'
import { IDENTIFIER_KEYS } from '../../automata/identifier'
import styles from './IdentifierInfoModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function IdentifierInfoModal(props: Props) {
  function onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) props.onClose()
  }

  return (
    <Show when={props.open}>
      <div class={styles.backdrop} onClick={onBackdropClick}>
        <div
          class={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="identifier-info-title"
        >
          <div class={styles.header}>
            <h3 class={styles.title} id="identifier-info-title">Config identifier</h3>
            <button
              type="button"
              class={styles.closeBtn}
              onClick={() => props.onClose()}
              aria-label="Close identifier info"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <div class={styles.body}>
            <table class={styles.table}>
              <thead>
                <tr>
                  <th>Argument</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {IDENTIFIER_KEYS.map(item => (
                  <tr>
                    <td class={styles.keyCell}>{item.key}</td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Show>
  )
}
