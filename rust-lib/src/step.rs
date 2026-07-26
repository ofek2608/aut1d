use crate::parser::AutomataConfig;
use crate::packed::PackedRow;
use crate::rules::resolve;
use crate::mods::apply_mods;

pub fn automata_step(
    config: &AutomataConfig,
    lookup: &[u8],
    world: &PackedRow,
    row: usize,
) -> PackedRow {
    let n_frames = config.pad_left.len().max(1);
    let frame_idx = (row - 1) % n_frames;
    let pad_l = &config.pad_left[frame_idx % config.pad_left.len()];
    let pad_r = &config.pad_right[frame_idx % config.pad_right.len()];

    let mid_len = world.len.saturating_sub(config.num_parents - 1);
    let out_len = pad_l.len + mid_len + pad_r.len;
    let mut result = PackedRow::new(out_len, config.bpc);

    for i in 0..pad_l.len {
        result.set(i, pad_l.get(i));
    }

    let mut parents = vec![0u8; config.num_parents];
    for i in 0..mid_len {
        for p in 0..config.num_parents {
            parents[p] = world.get(i + p);
        }
        let state = resolve(lookup, &parents, config.rule_mode, config.num_states);
        result.set(pad_l.len + i, state);
    }

    for i in 0..pad_r.len {
        result.set(pad_l.len + mid_len + i, pad_r.get(i));
    }

    apply_mods(&mut result, row, &config.mods);
    result
}

pub fn make_initial_row(config: &AutomataConfig) -> PackedRow {
    let mut initial = PackedRow::from_slice(
        &(0..config.initial.len).map(|i| config.initial.get(i)).collect::<Vec<_>>(),
        config.bpc,
    );
    apply_mods(&mut initial, 0, &config.mods);
    initial
}
