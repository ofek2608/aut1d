import { createEffect, createMemo, createSignal } from 'solid-js'
import { store, applyConfig } from '../../store'
import { parseConfigIdentifier, serializeConfigIdentifier } from '../../configIdentifier'
import styles from './ConfigIdentifier.module.css'

export default function ConfigIdentifier() {
  const serialized = createMemo(() => serializeConfigIdentifier(store.config))
  const [draft, setDraft] = createSignal(serialized())
  const [focused, setFocused] = createSignal(false)

  createEffect(() => {
    if (!focused()) {
      setDraft(serialized())
    }
  })

  function tryApply(value: string) {
    const config = parseConfigIdentifier(value)
    if (config) applyConfig(config)
  }

  function handleInput(value: string) {
    setDraft(value)
    tryApply(value)
  }

  async function copyIdentifier() {
    try {
      await navigator.clipboard.writeText(draft())
    } catch {
      // ignore clipboard errors
    }
  }

  async function pasteIdentifier() {
    try {
      const text = await navigator.clipboard.readText()
      setDraft(text)
      tryApply(text)
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div class={styles.row}>
      <input
        type="text"
        class={styles.input}
        value={draft()}
        spellcheck={false}
        aria-label="Automata config identifier"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setDraft(serialized())
        }}
        onInput={e => handleInput(e.currentTarget.value)}
      />
      <button
        type="button"
        class={styles.actionBtn}
        onClick={copyIdentifier}
        aria-label="Copy identifier"
        title="Copy identifier"
      >
        <i class="fa-regular fa-copy" aria-hidden="true" />
      </button>
      <button
        type="button"
        class={styles.actionBtn}
        onClick={pasteIdentifier}
        aria-label="Paste identifier"
        title="Paste identifier"
      >
        <i class="fa-regular fa-paste" aria-hidden="true" />
      </button>
    </div>
  )
}
