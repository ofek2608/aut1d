/// Packed row of cell states. Bits-per-cell chosen by num_states:
/// <=2 → 1bpc, <=4 → 2bpc, <=16 → 4bpc, else → 8bpc.
pub struct PackedRow {
    pub data: Vec<u8>,
    pub len: usize,
    pub bpc: u8, // bits per cell: 1, 2, 4, or 8
}

pub fn bits_per_cell(num_states: usize) -> u8 {
    if num_states <= 2 {
        1
    } else if num_states <= 4 {
        2
    } else if num_states <= 16 {
        4
    } else {
        8
    }
}

pub fn packed_byte_len(cell_count: usize, bpc: u8) -> usize {
    (cell_count * bpc as usize + 7) / 8
}

impl PackedRow {
    pub fn new(len: usize, bpc: u8) -> Self {
        Self {
            data: vec![0u8; packed_byte_len(len, bpc)],
            len,
            bpc,
        }
    }

    pub fn get(&self, col: usize) -> u8 {
        match self.bpc {
            8 => self.data[col],
            4 => {
                let byte = self.data[col / 2];
                if col % 2 == 0 {
                    byte >> 4
                } else {
                    byte & 0x0f
                }
            }
            2 => {
                let byte = self.data[col / 4];
                let shift = 6 - (col % 4) * 2;
                (byte >> shift) & 0x03
            }
            _ => {
                let byte = self.data[col / 8];
                let shift = 7 - (col % 8);
                (byte >> shift) & 0x01
            }
        }
    }

    pub fn set(&mut self, col: usize, val: u8) {
        match self.bpc {
            8 => self.data[col] = val,
            4 => {
                let byte = &mut self.data[col / 2];
                if col % 2 == 0 {
                    *byte = (*byte & 0x0f) | (val << 4);
                } else {
                    *byte = (*byte & 0xf0) | (val & 0x0f);
                }
            }
            2 => {
                let byte = &mut self.data[col / 4];
                let shift = 6 - (col % 4) * 2;
                *byte = (*byte & !(0x03 << shift)) | ((val & 0x03) << shift);
            }
            _ => {
                let byte = &mut self.data[col / 8];
                let shift = 7 - (col % 8);
                *byte = (*byte & !(1 << shift)) | ((val & 0x01) << shift);
            }
        }
    }

    pub fn from_slice(src: &[u8], bpc: u8) -> Self {
        let mut row = Self::new(src.len(), bpc);
        for (i, &v) in src.iter().enumerate() {
            row.set(i, v);
        }
        row
    }
}
