import { For } from "solid-js";
import { store, setSelectedState, setNumStates, PALETTES } from "../store";
import styles from "./StateGrid.module.css";

function StatePaletteGridCell(props: { state: number }) {
  const palette = () => PALETTES[store.palette] ?? PALETTES['classic'];
  const selected = () => store.selectedState === props.state;

  return (
    <button
      type="button"
      class={styles.statePaletteGridCell}
      classList={{ [styles.selected]: selected() }}
      style={{ 'background-color': palette()[props.state] ?? '#888888' }}
      onClick={() => setSelectedState(props.state)}
      aria-pressed={selected()}
      title={`State ${props.state}`}
    />
  );
}

function ChangeNumStatesButton(props: { text: string, diff: number }) {
  return (
    <input
      class={styles.statePaletteGridButton}
      type="button"
      value={props.text}
      onClick={() => setNumStates(store.config.numStates + props.diff)}
    />
  )
}

export default function StatePaletteGrid() {
  return (
    <div class={styles.statePaletteGrid}>
      <For each={Array.from({ length: store.config.numStates }, (_, index) => index)}>
        {state => <StatePaletteGridCell state={state} />}
      </For>
      <ChangeNumStatesButton text="+" diff={1} />
      <ChangeNumStatesButton text="-" diff={-1} />
    </div>
  )
}
