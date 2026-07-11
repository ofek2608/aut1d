import { createSignal, Show, type JSX } from 'solid-js'
import styles from './SidebarSection.module.css'

interface Props {
  title: string
  icon: string
  flexGrow?: boolean
  children: JSX.Element
}

export default function SidebarSection(props: Props) {
  const [open, setOpen] = createSignal(true)

  return (
    <section
      class={styles.section}
      classList={{ [styles.flexGrow]: props.flexGrow }}
    >
      <button
        type="button"
        class={styles.header}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open()}
      >
        <span class={styles.headerLeft}>
          <i class={`fa-solid fa-${props.icon}`} aria-hidden="true" />
          <span class={styles.title}>{props.title}</span>
        </span>
        <i
          class={`fa-solid fa-chevron-down ${styles.chevron}`}
          classList={{ [styles.chevronCollapsed]: !open() }}
          aria-hidden="true"
        />
      </button>
      <Show when={open()}>
        <div class={styles.content}>
          {props.children}
        </div>
      </Show>
    </section>
  )
}
