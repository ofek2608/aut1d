import { createStore, produce } from 'solid-js/store'
import { automataStep, type AutomataConfig } from './automata'

export type Alignment = 'left' | 'center' | 'right'

export const PALETTES: Record<string, string[]> = {
  classic:  ['#ffffff', '#000000', '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a', '#ffd6a5', '#caffbf', '#a8dadc'],
  pastel:   ['#fdf4ff', '#ffd6ff', '#c8b6ff', '#b8c0ff', '#bbd0ff', '#a0c4ff', '#9bf6ff', '#caffbf', '#fdffb6', '#ffadad', '#ffc6ff', '#bde0fe', '#a2d2ff', '#cdb4db', '#ffc8dd', '#ffafcc'],
  retro:    ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#aa5500'],
  ocean:    ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#caf0f8', '#e0fbfc', '#98c1d9', '#3d5a80', '#293241', '#1b4332', '#2d6a4f', '#40916c', '#52b788'],
  fire:     ['#03071e', '#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08', '#ffe169', '#fdf4b2', '#fcf6bd', '#f19c79', '#c77dff', '#a44a3f'],
  mono:     ['#000000', '#111111', '#222222', '#333333', '#555555', '#777777', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee', '#ffffff', '#e8d5b7', '#c9b99a', '#a89070'],
}

const DEFAULT_BATCH = 500


const DEFAULT_CONFIG: AutomataConfig = {
  numParents: 3,
  numStates: 2,
  rules: [0, 1, 1, 1, 0, 1, 1, 0],
  initial: [0],
  padLeft: [0],
  padRight: [0],
}

interface State {
  config: AutomataConfig
  alignment: Alignment
  palette: string
  rows: number[][]
}

const [store, setStore] = createStore<State>({
  config: DEFAULT_CONFIG,
  alignment: 'center',
  palette: 'classic',
  rows: [],
})

export function regenerateRows(targetCount = DEFAULT_BATCH) {
  const config = { ...store.config }
  const rows: number[][] = [config.initial.slice()]
  let prev = config.initial
  for (let i = 1; i < targetCount; i++) {
    const next = automataStep(config, prev)
    rows.push(next)
    prev = next
  }
  setStore('rows', rows)
}

export function extendRows(targetCount: number) {
  if (store.rows.length >= targetCount) return
  const config = { ...store.config }
  setStore(produce(s => {
    let prev = s.rows[s.rows.length - 1]
    while (s.rows.length < targetCount) {
      const next = automataStep(config, prev)
      s.rows.push(next)
      prev = next
    }
  }))
}

export function setNumParents(n: number) {
  const ruleLen = Math.pow(n, store.config.numStates)
  const half = Math.floor((n - 1) / 2)
  setStore('config', {
    numParents: n,
    rules: new Array(ruleLen).fill(0),
    padLeft: new Array(half).fill(0),
    padRight: new Array(n - 1 - half).fill(0),
  })
}

export function setNumStates(n: number) {
  setStore('config', {
    numStates: n,
    rules: new Array(Math.pow(store.config.numParents, n)).fill(0),
  })
}

export function setRule(index: number, value: number) {
  setStore('config', 'rules', index, value)
}

export function setInitial(cells: number[]) {
  setStore('config', 'initial', cells)
}

export function setPadLeft(cells: number[]) {
  setStore('config', 'padLeft', cells)
}

export function setPadRight(cells: number[]) {
  setStore('config', 'padRight', cells)
}

export function setAlignment(a: Alignment) {
  setStore('alignment', a)
}

export function setPalette(name: string) {
  if (name in PALETTES) setStore('palette', name)
}

export function applyPreset(name: string) {
  if (name === 'rule110') setStore('config', { numParents: 3, numStates: 2, rules: [0, 1, 1, 1, 0, 1, 1, 0], initial: [0,0,1,0,0], padLeft: [0, 0], padRight: [0, 0] })
  else if (name === 'rule30') setStore('config', { numParents: 3, numStates: 2, rules: [0, 1, 1, 1, 1, 0, 0, 0], initial: [0,0,1,0,0], padLeft: [0, 0], padRight: [0, 0] })
  else if (name === 'rule90') setStore('config', { numParents: 3, numStates: 2, rules: [0, 1, 0, 1, 1, 0, 1, 0], initial: [0,0,1,0,0], padLeft: [0, 0], padRight: [0, 0] })
}

export { store }
