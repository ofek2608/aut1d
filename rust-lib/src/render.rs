use crate::packed::PackedRow;
use crate::mods::CellMods;

const BASE_CELL_SIZE: f64 = 4.0;
const OUTLINE_FILL: [u8; 3] = [0x89, 0x8a, 0x91];

fn parse_palette(palette_json: &str) -> Option<Vec<[u8; 3]>> {
    let arr: Vec<serde_json::Value> = serde_json::from_str(palette_json).ok()?;
    arr.iter()
        .map(|v| {
            let s = v.as_str()?;
            if s.len() != 7 || !s.starts_with('#') {
                return None;
            }
            let r = u8::from_str_radix(&s[1..3], 16).ok()?;
            let g = u8::from_str_radix(&s[3..5], 16).ok()?;
            let b = u8::from_str_radix(&s[5..7], 16).ok()?;
            Some([r, g, b])
        })
        .collect()
}

#[inline]
fn fill_rect(pixels: &mut [u8], width: u32, height: u32, x0: i64, y0: i64, x1: i64, y1: i64, rgb: [u8; 3]) {
    let x0 = x0.max(0).min(width as i64) as u32;
    let y0 = y0.max(0).min(height as i64) as u32;
    let x1 = x1.max(0).min(width as i64) as u32;
    let y1 = y1.max(0).min(height as i64) as u32;
    if x0 >= x1 || y0 >= y1 {
        return;
    }
    for y in y0..y1 {
        let row_base = (y * width + x0) as usize * 4;
        let row_end = (y * width + x1) as usize * 4;
        let row = &mut pixels[row_base..row_end];
        let mut off = 0;
        while off + 4 <= row.len() {
            row[off] = rgb[0];
            row[off + 1] = rgb[1];
            row[off + 2] = rgb[2];
            row[off + 3] = 255;
            off += 4;
        }
    }
}

pub fn render(
    rows: &[PackedRow],
    mods: &CellMods,
    width: u32,
    height: u32,
    pan_x: f64,
    pan_y: f64,
    zoom: f64,
    alignment: &str,
    min_pixel_size: f64,
    palette_json: &str,
) -> Option<Vec<u8>> {
    let palette = parse_palette(palette_json)?;
    let fallback = [0x88u8, 0x88, 0x88];

    let mut pixels = vec![0u8; (width * height * 4) as usize];
    let cs = BASE_CELL_SIZE * zoom;
    let w = width as f64;
    let rx = w / 2.0;

    if rows.is_empty() || width == 0 || height == 0 {
        return Some(pixels);
    }

    if cs < min_pixel_size {
        // Low zoom: sample one color per min_pixel_size×min_pixel_size block
        let mps = min_pixel_size;
        let half = mps / 2.0;
        for py_out in 0..height {
            for px_out in 0..width {
                let sy = (py_out as f64 / mps).floor() * mps + half;
                let sx = (px_out as f64 / mps).floor() * mps + half;

                let g = ((sy - pan_y) / cs).floor();
                if g < 0.0 || g as usize >= rows.len() {
                    continue;
                }
                let g = g as usize;
                let row = &rows[g];
                let row_len = row.len as f64;

                let ref_i = match alignment {
                    "left" => 0.0,
                    "right" => row_len - 1.0,
                    _ => row_len / 2.0,
                };

                let c = (ref_i + (sx - rx - pan_x) / cs).floor();
                if c < 0.0 || c as usize >= row.len {
                    continue;
                }
                let c = c as usize;
                let state = row.get(c) as usize;
                let rgb = palette.get(state).copied().unwrap_or(fallback);

                let off = (py_out * width + px_out) as usize * 4;
                pixels[off] = rgb[0];
                pixels[off + 1] = rgb[1];
                pixels[off + 2] = rgb[2];
                pixels[off + 3] = 255;
            }
        }
    } else {
        // High zoom: per-cell rects with optional outline
        let outline = if cs < 10.0 { 0i64 } else { 1i64 };

        let h = height as f64;
        let first_row = ((-pan_y) / cs).floor().max(0.0) as usize;
        let last_row = ((h - pan_y) / cs).ceil() as usize;
        let last_row = last_row.min(rows.len().saturating_sub(1));

        for g in first_row..=last_row {
            if g >= rows.len() {
                break;
            }
            let row = &rows[g];
            let row_len = row.len;
            let row_len_f = row_len as f64;

            let ref_i = match alignment {
                "left" => 0.0,
                "right" => row_len_f - 1.0,
                _ => row_len_f / 2.0,
            };

            let i_min_f = (ref_i + (-rx - pan_x) / cs).floor();
            let i_max_f = (ref_i + (w - rx - pan_x) / cs).ceil();
            let i_min = i_min_f.max(0.0) as usize;
            let i_max = (i_max_f as usize).min(row_len.saturating_sub(1));
            if i_min > i_max {
                continue;
            }

            let y0_f = pan_y + g as f64 * cs;
            let y1_f = pan_y + (g + 1) as f64 * cs;
            let cy0 = y0_f.round() as i64;
            let cy1 = y1_f.round() as i64;

            for c in i_min..=i_max {
                let x0_f = rx + pan_x + (c as f64 - ref_i) * cs;
                let x1_f = rx + pan_x + (c as f64 + 1.0 - ref_i) * cs;
                let cx0 = x0_f.round() as i64;
                let cx1 = x1_f.round() as i64;

                let is_mod = outline > 0 && mods.contains_key(&(c, g));
                if is_mod {
                    fill_rect(&mut pixels, width, height, cx0, cy0, cx1, cy1, OUTLINE_FILL);
                }

                let state = row.get(c) as usize;
                let rgb = palette.get(state).copied().unwrap_or(fallback);
                fill_rect(
                    &mut pixels,
                    width,
                    height,
                    cx0 + outline,
                    cy0 + outline,
                    cx1 - outline,
                    cy1 - outline,
                    rgb,
                );
            }
        }
    }

    Some(pixels)
}
