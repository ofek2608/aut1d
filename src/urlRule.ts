import { createEffect, createRoot } from 'solid-js'
import { serializeConfigIdentifier } from './automata/identifier'
import { store } from './store'

/** Identifiers at or above this length are omitted from the URL bar (still accepted when opening a link). */
export const MAX_URL_IDENTIFIER_LENGTH = 150

const RULE_PARAM = 'r'

function syncRuleToUrl() {
  const identifier = serializeConfigIdentifier(store.config, true)
  const url = new URL(window.location.href)

  if (identifier.length >= MAX_URL_IDENTIFIER_LENGTH) {
    url.searchParams.delete(RULE_PARAM)
  } else {
    url.searchParams.set(RULE_PARAM, identifier)
  }

  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) {
    history.replaceState(null, '', next)
  }
}

export function startUrlRuleSync() {
  createRoot(() => {
    createEffect(() => {
      syncRuleToUrl()
    })
  })
}
