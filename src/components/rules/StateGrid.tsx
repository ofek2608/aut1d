import { For, createMemo } from "solid-js";
import { store, setSelectedState, setNumStates, activePalette } from "../../store";
import { MAX_STATES } from "../../automata/config";
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

function ChangeNumStatesButton(props: { icon: string; diff: number; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      class={styles.statePaletteGridButton}
      onClick={() => setNumStates(store.config.numStates + props.diff)}
      disabled={props.disabled}
      aria-label={props.label}
      title={props.label}
    >
      <i class={`fa-solid fa-${props.icon}`} aria-hidden="true" />
    </button>
  );
}

export default function StatePaletteGrid() {
  const stateIndices = createMemo(() =>
    Array.from({ length: store.config.numStates }, (_, index) => index),
  )

  return (
    <div class={styles.statePaletteGrid}>
      <For each={stateIndices()}>
        {state => <StatePaletteGridCell state={state} />}
      </For>
      <ChangeNumStatesButton icon="minus" diff={-1} label="Remove state" disabled={store.config.numStates <= 1} />
      <ChangeNumStatesButton icon="plus" diff={1} label="Add state" disabled={store.config.numStates >= MAX_STATES} />
    </div>
  )
}
