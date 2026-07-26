mod mods;
mod packed;
mod parser;
mod render;
mod rules;
mod step;

use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use packed::PackedRow;
use parser::AutomataConfig;

struct AutomataState {
    config: AutomataConfig,
    lookup: Vec<u8>,
    rows: Vec<PackedRow>,
}

thread_local! {
    static STATE: RefCell<Option<AutomataState>> = const { RefCell::new(None) };
}

/// Parse and store an automata config. Generates row 0 (initial row).
/// Returns false if identifier is invalid; clears any previous state.
#[wasm_bindgen]
pub fn set_automata(identifier: &str) -> bool {
    let config = match parser::parse_config(identifier) {
        Some(c) => c,
        None => {
            STATE.with(|s| *s.borrow_mut() = None);
            return false;
        }
    };
    let lookup = rules::build_lookup(
        config.rule_mode,
        config.num_parents,
        config.num_states,
        &config.rules,
    );
    let initial = step::make_initial_row(&config);
    STATE.with(|s| {
        *s.borrow_mut() = Some(AutomataState {
            lookup,
            rows: vec![initial],
            config,
        });
    });
    true
}

/// Generate rows until at least `count` rows exist. No-op if already sufficient.
#[wasm_bindgen]
pub fn ensure_rows(count: u32) {
    STATE.with(|s| {
        let mut opt = s.borrow_mut();
        if let Some(state) = opt.as_mut() {
            let target = count as usize;
            while state.rows.len() < target {
                let row_idx = state.rows.len();
                let prev = &state.rows[row_idx - 1];
                let prev_clone = PackedRow {
                    data: prev.data.clone(),
                    len: prev.len,
                    bpc: prev.bpc,
                };
                let next = step::automata_step(&state.config, &state.lookup, &prev_clone, row_idx);
                state.rows.push(next);
            }
        }
    });
}

/// Render stored rows to RGBA pixel data (width × height × 4 bytes).
/// Returns undefined if no automata is set.
#[wasm_bindgen]
pub fn render_rows(
    width: u32,
    height: u32,
    pan_x: f64,
    pan_y: f64,
    zoom: f64,
    alignment: &str,
    min_pixel_size: f64,
    palette_json: &str,
) -> Option<Vec<u8>> {
    STATE.with(|s| {
        let opt = s.borrow();
        let state = opt.as_ref()?;
        render::render(
            &state.rows,
            &state.config.mods,
            width,
            height,
            pan_x,
            pan_y,
            zoom,
            alignment,
            min_pixel_size,
            palette_json,
        )
    })
}

/// Free all stored row data and config. Call when switching away from Rust rendering.
#[wasm_bindgen]
pub fn clear_rows() {
    STATE.with(|s| *s.borrow_mut() = None);
}

/// Row length for the given row index, or -1 if out of range / no state.
#[wasm_bindgen]
pub fn get_row_len(row: u32) -> i32 {
    STATE.with(|s| {
        let opt = s.borrow();
        opt.as_ref()
            .and_then(|state| state.rows.get(row as usize))
            .map(|r| r.len as i32)
            .unwrap_or(-1)
    })
}

/// Cell state at (row, col), or -1 if out of range / no state.
#[wasm_bindgen]
pub fn get_cell(row: u32, col: u32) -> i32 {
    STATE.with(|s| {
        let opt = s.borrow();
        opt.as_ref()
            .and_then(|state| state.rows.get(row as usize))
            .filter(|r| (col as usize) < r.len)
            .map(|r| r.get(col as usize) as i32)
            .unwrap_or(-1)
    })
}
