pub type RuleMode = u8;
pub const ASYMMETRIC: RuleMode = 0;
pub const SYMMETRIC: RuleMode = 1;
pub const UNORDERED: RuleMode = 2;

pub fn binomial(n: usize, k: usize) -> usize {
    if k > n {
        return 0;
    }
    let k = k.min(n - k);
    let mut result: f64 = 1.0;
    for i in 0..k {
        result = result * (n - i) as f64 / (i + 1) as f64;
    }
    result.round() as usize
}

pub fn get_rule_count(mode: RuleMode, num_parents: usize, num_states: usize) -> usize {
    match mode {
        ASYMMETRIC => num_states.pow(num_parents as u32),
        SYMMETRIC => {
            (num_states.pow(num_parents as u32)
                + num_states.pow(((num_parents + 1) / 2) as u32))
                / 2
        }
        _ => binomial(num_states + num_parents - 1, num_parents),
    }
}

pub fn get_state_count_for_rules(
    mode: RuleMode,
    num_parents: usize,
    num_rules: usize,
) -> Option<usize> {
    if num_rules == 0 {
        return None;
    }
    let mut num_states = 1usize;
    while get_rule_count(mode, num_parents, num_states) < num_rules {
        num_states += 1;
        if num_states > 26 {
            return None;
        }
    }
    let count = get_rule_count(mode, num_parents, num_states);
    let prev_count = if num_states > 1 {
        get_rule_count(mode, num_parents, num_states - 1)
    } else {
        0
    };
    if count < num_rules || prev_count >= num_rules {
        return None;
    }
    Some(num_states)
}

fn is_symmetric_canonical(digits: &[u8]) -> bool {
    for i in 0..digits.len() {
        if 2 * i >= digits.len() {
            break;
        }
        let a = digits[i];
        let b = digits[digits.len() - 1 - i];
        if a < b {
            return true;
        }
        if a > b {
            return false;
        }
    }
    true
}

fn canonical_parents(parents: &[u8], mode: RuleMode) -> Vec<u8> {
    let mut copy = parents.to_vec();
    match mode {
        ASYMMETRIC => {}
        SYMMETRIC => {
            if !is_symmetric_canonical(&copy) {
                copy.reverse();
            }
        }
        _ => {
            copy.sort_unstable();
        }
    }
    copy
}

fn encode_parents(parents: &[u8], num_states: usize) -> usize {
    let mut key = 0usize;
    for &p in parents {
        key = key * num_states + p as usize;
    }
    key
}

fn fill_patterns_with_max(
    patterns: &mut Vec<Vec<u8>>,
    digits: &mut Vec<u8>,
    position: usize,
    num_parents: usize,
    max_state: u8,
    mode: RuleMode,
    has_max: bool,
) {
    if position == num_parents {
        patterns.push(digits.clone());
        return;
    }
    let min_digit = match mode {
        ASYMMETRIC => 0,
        SYMMETRIC => {
            let other = num_parents - 1 - position;
            if other < position {
                digits[other]
            } else {
                0
            }
        }
        _ => {
            if position == 0 {
                0
            } else {
                digits[position - 1]
            }
        }
    };
    let min_digit = if position == num_parents - 1 && !has_max {
        max_state
    } else {
        min_digit
    };
    for digit in min_digit..=max_state {
        digits[position] = digit;
        fill_patterns_with_max(
            patterns,
            digits,
            position + 1,
            num_parents,
            max_state,
            mode,
            has_max || digit == max_state,
        );
    }
}

pub fn create_rule_patterns(
    mode: RuleMode,
    num_parents: usize,
    num_states: usize,
) -> Vec<Vec<u8>> {
    let mut patterns = Vec::new();
    let mut digits = vec![0u8; num_parents];
    for max_state in 0..num_states as u8 {
        fill_patterns_with_max(&mut patterns, &mut digits, 0, num_parents, max_state, mode, false);
    }
    patterns
}

/// Returns a lookup table indexed by encoded canonical parents → output state.
/// Size = num_states^num_parents. Missing entries default to 0.
pub fn build_lookup(
    mode: RuleMode,
    num_parents: usize,
    num_states: usize,
    rules: &[u8],
) -> Vec<u8> {
    let table_size = num_states.pow(num_parents as u32);
    let mut lookup = vec![0u8; table_size];
    let patterns = create_rule_patterns(mode, num_parents, num_states);
    for (i, pattern) in patterns.iter().enumerate() {
        let key = encode_parents(pattern, num_states);
        lookup[key] = rules.get(i).copied().unwrap_or(0);
    }
    lookup
}

pub fn resolve(
    lookup: &[u8],
    parents: &[u8],
    mode: RuleMode,
    num_states: usize,
) -> u8 {
    let canonical = canonical_parents(parents, mode);
    let key = encode_parents(&canonical, num_states);
    lookup.get(key).copied().unwrap_or(0)
}
