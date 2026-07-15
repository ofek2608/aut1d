import { Index } from 'solid-js';
import { store, setPadLeft, setPadRight, setInitial } from '../../store';
import type { StateSequence, StateArray } from '../../automata/config';
import StateInput from './StateInput';
import styles from './StateListEditor.module.css';

function StateListRow(props: {
  label: string;
  cells: StateArray;
  onChange: (cells: StateArray) => void;
}) {
  function editCell(i: number, newState: number) {
    const cells = props.cells.slice();
    cells[i] = newState;
    props.onChange(cells);
  }

  function add() {
    const cells = new Uint8Array(props.cells.length + 1);
    cells.set(props.cells);
    props.onChange(cells);
  }

  function remove() {
    if (props.cells.length == 0) return;
    props.onChange(props.cells.slice(0, -1));
  }

  return (
    <div class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      <div class={styles.cells}>
        <Index each={[...props.cells]}>
          {(state, i) => (
            <StateInput
              value={state()}
              onEdit={newState => editCell(i, newState)}
              title={`State ${state()}, click to cycle`}
            />
          )}
        </Index>
        <button
          type="button"
          class={styles.iconBtn}
          onClick={remove}
          disabled={props.cells.length == 0}
          aria-label={`Remove ${props.label.toLowerCase()} cell`}
          title={`Remove ${props.label.toLowerCase()} cell`}
        >
          <i class="fa-solid fa-minus" aria-hidden="true" />
        </button>
        <button
          type="button"
          class={styles.iconBtn}
          onClick={add}
          aria-label={`Add ${props.label.toLowerCase()} cell`}
          title={`Add ${props.label.toLowerCase()} cell`}
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PadSequenceRow(props: {
  label: string;
  sequence: StateSequence;
  onChange: (sequence: StateSequence) => void;
}) {
  function frames(): StateArray[] {
    return props.sequence.map(frame => frame.slice());
  }

  function updateFrame(frameIndex: number, cells: StateArray) {
    const next = frames();
    next[frameIndex] = cells;
    props.onChange(next);
  }

  function editCell(frameIndex: number, cellIndex: number, newState: number) {
    const cells = props.sequence[frameIndex].slice();
    cells[cellIndex] = newState;
    updateFrame(frameIndex, cells);
  }

  function addCell(frameIndex: number) {
    const prev = props.sequence[frameIndex];
    const cells = new Uint8Array(prev.length + 1);
    cells.set(prev);
    updateFrame(frameIndex, cells);
  }

  function removeCell(frameIndex: number) {
    const prev = props.sequence[frameIndex];
    if (prev.length === 0) return;
    updateFrame(frameIndex, prev.slice(0, -1));
  }

  function addFrame() {
    props.onChange([...frames(), new Uint8Array(0)]);
  }

  function removeFrame() {
    if (props.sequence.length <= 1) return;
    props.onChange(frames().slice(0, -1));
  }

  return (
    <div class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      <div class={styles.sequence}>
        <Index each={frames()}>
          {(frame, frameIndex) => (
            <div class={styles.cells}>
              <Index each={[...frame()]}>
                {(state, cellIndex) => (
                  <StateInput
                    value={state()}
                    onEdit={newState => editCell(frameIndex, cellIndex, newState)}
                    title={`State ${state()}, click to cycle`}
                  />
                )}
              </Index>
              <button
                type="button"
                class={styles.iconBtn}
                onClick={() => removeCell(frameIndex)}
                disabled={frame().length === 0}
                aria-label={`Remove cell from ${props.label.toLowerCase()} frame ${frameIndex + 1}`}
                title={`Remove cell from frame ${frameIndex + 1}`}
              >
                <i class="fa-solid fa-minus" aria-hidden="true" />
              </button>
              <button
                type="button"
                class={styles.iconBtn}
                onClick={() => addCell(frameIndex)}
                aria-label={`Add cell to ${props.label.toLowerCase()} frame ${frameIndex + 1}`}
                title={`Add cell to frame ${frameIndex + 1}`}
              >
                <i class="fa-solid fa-plus" aria-hidden="true" />
              </button>
            </div>
          )}
        </Index>
        <div class={styles.controls}>
          <button
            type="button"
            class={styles.iconBtn}
            onClick={removeFrame}
            disabled={props.sequence.length <= 1}
            aria-label={`Remove last ${props.label.toLowerCase()} pad frame`}
            title="Remove last pad frame"
          >
            <i class="fa-solid fa-trash-can" aria-hidden="true" />
          </button>
          <button
            type="button"
            class={styles.iconBtn}
            onClick={addFrame}
            aria-label={`Add ${props.label.toLowerCase()} pad frame`}
            title="Add pad frame"
          >
            <i class="fa-solid fa-layer-group" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StateListEditor() {
  return (
    <div class={styles.editor}>
      <StateListRow label="Initial" cells={store.config.initial} onChange={setInitial} />
      <PadSequenceRow label="Left" sequence={store.config.padLeft} onChange={setPadLeft} />
      <PadSequenceRow label="Right" sequence={store.config.padRight} onChange={setPadRight} />
    </div>
  );
}
