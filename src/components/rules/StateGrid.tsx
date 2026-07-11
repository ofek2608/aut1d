import { For } from "solid-js";
import { store, setSelectedState, setNumStates, activePalette } from "../../store";
import styles from "./StateGrid.module.css";

function StatePaletteGridCell(props: { state: number }) {
  const palette = () => activePalette();
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

function ChangeNumStatesButton(props: { icon: string; diff: number; label: string }) {
  return (
    <button
      type="button"
      class={styles.statePaletteGridButton}
      onClick={() => setNumStates(store.config.numStates + props.diff)}
      aria-label={props.label}
      title={props.label}
    >
      <i class={`fa-solid fa-${props.icon}`} aria-hidden="true" />
    </button>
  );
}

export default function StatePaletteGrid() {
  return (
    <div class={styles.statePaletteGrid}>
      <For each={Array.from({ length: store.config.numStates }, (_, index) => index)}>
        {state => <StatePaletteGridCell state={state} />}
      </For>
      <ChangeNumStatesButton icon="minus" diff={-1} label="Remove state" />
      <ChangeNumStatesButton icon="plus" diff={1} label="Add state" />
    </div>
  )
}
