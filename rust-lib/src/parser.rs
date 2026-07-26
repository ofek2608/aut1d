use std::collections::HashMap;
use crate::rules::{
    RuleMode, ASYMMETRIC, SYMMETRIC, UNORDERED,
    get_rule_count, get_state_count_for_rules,
};
use crate::mods::{CellMods, parse_mods};
use crate::packed::{PackedRow, bits_per_cell};

pub struct AutomataConfig {
    pub num_parents: usize,
    pub num_states: usize,
    pub rule_mode: RuleMode,
    pub rules: Vec<u8>,
    pub initial: PackedRow,
    pub pad_left: Vec<PackedRow>,
    pub pad_right: Vec<PackedRow>,
    pub mods: CellMods,
    pub bpc: u8,
}

fn decode_state_char(ch: char) -> Option<usize> {
    if ch >= 'a' && ch <= 'z' {
        return Some(ch as usize - 'a' as usize);
    }
    if ch >= '1' && ch <= '9' {
        return Some(ch as usize - '1' as usize);
    }
    None
}

fn decode_state_string(s: &str, num_states: usize) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(s.len());
    for ch in s.chars() {
        let state = decode_state_char(ch)?;
        if state >= num_states {
            return None;
        }
        out.push(state as u8);
    }
    Some(out)
}

fn decode_state_sequence(s: &str, num_states: usize) -> Option<Vec<Vec<u8>>> {
    s.split('.').map(|part| decode_state_string(part, num_states)).collect()
}

fn default_pattern(num_parents: usize) -> (Vec<u8>, Vec<u8>, Vec<u8>) {
    let pad_width = num_parents.saturating_sub(1);
    let init_len = if 2 * num_parents > 3 { 2 * num_parents - 3 } else { 1 };
    (
        vec![0u8; pad_width],
        vec![0u8; init_len],
        vec![0u8; pad_width],
    )
}

fn into_packed_rows(seqs: Vec<Vec<u8>>, bpc: u8) -> Vec<PackedRow> {
    seqs.into_iter().map(|v| PackedRow::from_slice(&v, bpc)).collect()
}

fn mirror_pad(seq: &[Vec<u8>]) -> Vec<Vec<u8>> {
    seq.iter()
        .map(|row| row.iter().rev().copied().collect())
        .collect()
}

fn parse_identifier_map(identifier: &str) -> Option<HashMap<String, String>> {
    let mut map = HashMap::new();
    let bytes = identifier.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        let key_start = i;
        while i < bytes.len() && (bytes[i].is_ascii_uppercase() || bytes[i] == b'#') {
            i += 1;
        }
        if i == key_start {
            return None;
        }
        let key = identifier[key_start..i].to_string();

        // value ends at next key start or end of string
        // value chars: digits, lowercase, dots, underscores, optionally one trailing ;/-
        let val_start = i;
        while i < bytes.len()
            && (bytes[i].is_ascii_digit()
                || bytes[i].is_ascii_lowercase()
                || bytes[i] == b'.'
                || bytes[i] == b'_')
        {
            i += 1;
        }
        let has_sentinel = i < bytes.len() && (bytes[i] == b';' || bytes[i] == b'-');
        if has_sentinel {
            i += 1;
        }
        let val = identifier[val_start..i - if has_sentinel { 1 } else { 0 }].to_string();

        map.insert(key, val);
    }

    if i != bytes.len() {
        return None;
    }
    Some(map)
}

pub fn parse_config(identifier: &str) -> Option<AutomataConfig> {
    let trimmed = identifier.trim();
    if trimmed.is_empty() {
        return None;
    }

    let map = parse_identifier_map(trimmed)?;

    // Check conflicting keys
    let mode_keys = ["A", "S", "U"];
    if mode_keys.iter().filter(|k| map.contains_key(**k)).count() > 1 {
        return None;
    }
    if map.contains_key("PS") && map.contains_key("PL") {
        return None;
    }
    if map.contains_key("PS") && map.contains_key("PR") {
        return None;
    }
    if map.contains_key("R") && map.contains_key("#") {
        return None;
    }

    // Mode + num_parents
    let (rule_mode, num_parents) = if let Some(v) = map.get("A") {
        (ASYMMETRIC, v.parse::<usize>().ok()?)
    } else if let Some(v) = map.get("S") {
        (SYMMETRIC, v.parse::<usize>().ok()?)
    } else if let Some(v) = map.get("U") {
        (UNORDERED, v.parse::<usize>().ok()?)
    } else {
        return None;
    };

    if num_parents < 1 || num_parents > 9 {
        return None;
    }

    // Rules
    let rules_text = map.get("#").or_else(|| map.get("R"))?;
    let num_states = get_state_count_for_rules(rule_mode, num_parents, rules_text.len())?;
    if get_rule_count(rule_mode, num_parents, num_states) != rules_text.len() {
        return None;
    }
    let rules = decode_state_string(rules_text, num_states)?;

    let bpc = bits_per_cell(num_states);

    // Pattern defaults
    let (default_pad_left, default_initial, default_pad_right) = default_pattern(num_parents);

    let pad_left_raw: Vec<Vec<u8>>;
    let pad_right_raw: Vec<Vec<u8>>;
    let initial_raw: Vec<u8>;

    if let Some(ps) = map.get("PS") {
        let pl = decode_state_sequence(ps, num_states)?;
        let pr = mirror_pad(&pl);
        pad_left_raw = pl;
        pad_right_raw = pr;
    } else {
        pad_left_raw = if let Some(pl) = map.get("PL") {
            decode_state_sequence(pl, num_states)?
        } else {
            vec![default_pad_left]
        };
        pad_right_raw = if let Some(pr) = map.get("PR") {
            decode_state_sequence(pr, num_states)?
        } else {
            vec![default_pad_right]
        };
    }

    initial_raw = if let Some(i) = map.get("I") {
        let v = decode_state_string(i, num_states)?;
        if v.is_empty() {
            return None;
        }
        v
    } else {
        default_initial
    };

    // Mods
    let mods = if let Some(mod_str) = map.get("MOD") {
        parse_mods(mod_str, num_states)?
    } else {
        std::collections::HashMap::new()
    };

    Some(AutomataConfig {
        num_parents,
        num_states,
        rule_mode,
        rules,
        initial: PackedRow::from_slice(&initial_raw, bpc),
        pad_left: into_packed_rows(pad_left_raw, bpc),
        pad_right: into_packed_rows(pad_right_raw, bpc),
        mods,
        bpc,
    })
}
