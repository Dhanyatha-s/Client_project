/**
 * ecgConstants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clinical ECG rendering constants + dynamic layout resolver.
 *
 * Standard reference (AHA/ACC):
 *   Paper speed  : 25 mm/s
 *   Gain         : 10 mm/mV
 *   Minor square : 1 mm  = 0.04 s  = 0.1 mV
 *   Major square : 5 mm  = 0.20 s  = 0.5 mV
 *   Cal pulse    : 10 mm tall (1 mV), 5 mm wide (0.2 s)
 */

export const PAPER_SPEED   = 25;    // mm/s
export const GAIN          = 10;    // mm/mV
export const MINOR_MM      = 1;
export const MAJOR_MM      = 5;
export const CAL_H_MM      = 10;
export const CAL_W_MM      = 5;
export const SAMPLING_RATE = 250;   // Hz — must match storage.py

export const MM_TO_PX  = (mm) => mm * (96 / 25.4);
export const PX_PER_SEC = MM_TO_PX(PAPER_SPEED);   // ≈ 94.5 px/s
export const PX_PER_MV  = MM_TO_PX(GAIN);           // ≈ 37.8 px/mV
export const MINOR_PX   = MM_TO_PX(MINOR_MM);       // ≈ 3.78 px
export const MAJOR_PX   = MM_TO_PX(MAJOR_MM);       // ≈ 18.9 px

// ── Standard 12-lead clinical order ──────────────────────────────────────────
// When all 12 leads are present this ordering is used (AHA standard page layout)
export const STANDARD_12_ORDER = [
  "I","II","III","aVR","aVL","aVF","V1","V2","V3","V4","V5","V6"
];

// ── Dynamic layout resolver ───────────────────────────────────────────────────
/**
 * resolveLayout(leadNames)
 *
 * Given any array of lead names (1–12), returns:
 *   { cells, nRows, nCols, rowHeightMm }
 *
 * cells: Array<{ col, row, name }> — one entry per lead, correctly placed
 *
 * Grid rules (requirement §3):
 *   1 lead  → 1×1
 *   2 leads → 1×2  (2 rows, 1 col)
 *   3 leads → 1×3  (3 rows, 1 col)
 *   4 leads → 2×2
 *   5 leads → 2×3  (3 rows, 2 cols; last row partial)
 *   6 leads → 2×3
 *   7 leads → 3×3  (partial last col)
 *   8 leads → 2×4
 *   9 leads → 3×3
 *  10 leads → 2×5  (but 5 col is too narrow — use 3×4 with 2 empty)
 *  11 leads → 3×4  (one empty cell)
 *  12 leads → 3×4  (standard 12-lead page layout)
 *
 * For 12 leads the standard clinical column arrangement is preserved:
 *   Row 0: I, aVR, V1, V4
 *   Row 1: II, aVL, V2, V5
 *   Row 2: III, aVF, V3, V6
 */
export function resolveLayout(leadNames) {
  const n = leadNames.length;
  if (n === 0) return { cells: [], nRows: 0, nCols: 0, rowHeightMm: 30 };

  // ── Sort names: keep standard order where possible, append unknowns ─────
  const ordered = [
    ...STANDARD_12_ORDER.filter(l => leadNames.includes(l)),
    ...leadNames.filter(l => !STANDARD_12_ORDER.includes(l)),
  ];

  // ── Determine grid dimensions ─────────────────────────────────────────────
  let nRows, nCols;

  if      (n <= 1)  { nRows = 1; nCols = 1; }
  else if (n <= 3)  { nRows = n; nCols = 1; }
  else if (n <= 4)  { nRows = 2; nCols = 2; }
  else if (n <= 6)  { nRows = 3; nCols = 2; }
  else if (n <= 8)  { nRows = 2; nCols = 4; }
  else if (n <= 9)  { nRows = 3; nCols = 3; }
  else              { nRows = 3; nCols = 4; } // 10–12

  // ── Row height: shrinks slightly with more rows to keep canvas reasonable ─
  const rowHeightMm = nRows <= 1 ? 50 : nRows === 2 ? 40 : 30;

  // ── Special case: standard 12-lead page layout ────────────────────────────
  // Clinical convention: limb leads on left, augmented middle, chest right
  // Columns: [I,II,III] | [aVR,aVL,aVF] | [V1,V2,V3] | [V4,V5,V6]
  if (n === 12 && ordered.join(",") === STANDARD_12_ORDER.join(",")) {
    const cells = [
      { col:0, row:0, name:"I"   }, { col:1, row:0, name:"aVR" },
      { col:2, row:0, name:"V1"  }, { col:3, row:0, name:"V4"  },
      { col:0, row:1, name:"II"  }, { col:1, row:1, name:"aVL" },
      { col:2, row:1, name:"V2"  }, { col:3, row:1, name:"V5"  },
      { col:0, row:2, name:"III" }, { col:1, row:2, name:"aVF" },
      { col:2, row:2, name:"V3"  }, { col:3, row:2, name:"V6"  },
    ];
    return { cells, nRows: 3, nCols: 4, rowHeightMm: 30 };
  }

  // ── General case: fill left-to-right, top-to-bottom ──────────────────────
  const cells = ordered.map((name, idx) => ({
    col:  idx % nCols,
    row:  Math.floor(idx / nCols),
    name,
  }));

  return { cells, nRows, nCols, rowHeightMm };
}
