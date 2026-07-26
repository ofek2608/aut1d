use std::collections::HashMap;
use crate::packed::PackedRow;

pub type CellMods = HashMap<(usize, usize), u8>; // (x, y) → state

pub fn parse_mods(value: &str, num_states: usize) -> Option<CellMods> {
    if value.is_empty() {
        return Some(HashMap::new());
    }
    let parts: Vec<&str> = value.split('.').collect();
    if parts.len() % 3 != 0 {
        return None;
    }
    let mut mods = HashMap::new();
    for chunk in parts.chunks(3) {
        let x: usize = chunk[0].parse().ok()?;
        let y: usize = chunk[1].parse().ok()?;
        let s: usize = chunk[2].parse().ok()?;
        if s >= num_states {
            return None;
        }
        mods.insert((x, y), s as u8);
    }
    Some(mods)
}

pub fn apply_mods(row: &mut PackedRow, y: usize, mods: &CellMods) {
    for (&(x, my), &state) in mods.iter() {
        if my == y && x < row.len {
            row.set(x, state);
        }
    }
}
