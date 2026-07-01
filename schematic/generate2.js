// Generates current-mirror-driver.svg — a clean machine-drawn version of the
// hand-drawn bias / 1:10 current-mirror / LS-CRTS block sketch.
// Pure JS, no dependencies.  Run: node generate2.js > current-mirror-driver.svg
'use strict';

const W = 1580, H = 1040;
const STROKE = '#111';
const SW = 4;
const parts = [];
const p = s => parts.push(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function wire(x1, y1, x2, y2, w = SW) {
  p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${STROKE}" stroke-width="${w}" stroke-linecap="round"/>`);
}
function polyline(pts, w = SW) {
  p(`<polyline points="${pts.map(a => a.join(',')).join(' ')}" fill="none" stroke="${STROKE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
}
function dot(x, y, r = 6) { p(`<circle cx="${x}" cy="${y}" r="${r}" fill="${STROKE}"/>`); }
function circle(x, y, r) { p(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`); }
function terminal(x, y, r = 7) { p(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${STROKE}" stroke-width="3.5"/>`); }
function rect(x, y, w, h) { p(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`); }
function text(x, y, s, o = {}) {
  const { size = 26, anchor = 'start', weight = 600, style = 'normal' } = o;
  p(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}" fill="${STROKE}">${esc(s)}</text>`);
}
function ground(x, y) {
  p(`<line x1="${x - 24}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - 14}" y1="${y + 9}" x2="${x + 14}" y2="${y + 9}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - 6}" y1="${y + 18}" x2="${x + 6}" y2="${y + 18}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
}
function resistorV(x, yTop, yBot) {
  const pts = [[x, yTop]]; const t = 6, s = (yBot - yTop) / t, a = 11;
  for (let i = 0; i < t; i++) pts.push([i % 2 ? x - a : x + a, yTop + s * (i + 0.5)]);
  pts.push([x, yBot]); polyline(pts);
}
function capV(x, yTop, yBot, pw = 18) {
  const m = (yTop + yBot) / 2;
  wire(x, yTop, x, m - 4);
  p(`<line x1="${x - pw}" y1="${m - 4}" x2="${x + pw}" y2="${m - 4}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - pw}" y1="${m + 4}" x2="${x + pw}" y2="${m + 4}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(x, m + 4, x, yBot);
}
// Diode (vertical), anode top -> cathode bottom (conducts downward).
function diodeV(x, yTop, yBot) {
  const h = yBot - yTop, yBar = yTop + h * 0.5, apex = yBar; // triangle base at top of body
  const yA = yTop + h * 0.28, yC = yTop + h * 0.72;
  wire(x, yTop, x, yA);
  p(`<polygon points="${x - 16},${yA} ${x + 16},${yA} ${x},${yC}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  p(`<line x1="${x - 16}" y1="${yC}" x2="${x + 16}" y2="${yC}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(x, yC, x, yBot);
}
// Zener (vertical), cathode top (shunt reference: reverse-biased from node to GND).
function zenerV(x, yTop, yBot) {
  const h = yBot - yTop, yBar = yTop + h * 0.32, yBase = yTop + h * 0.72;
  wire(x, yTop, x, yBar);
  p(`<polygon points="${x},${yBase} ${x - 16},${yBar} ${x + 16},${yBar}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  p(`<polyline points="${x - 16},${yBar - 7} ${x - 16},${yBar} ${x + 16},${yBar} ${x + 16},${yBar + 7}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"/>`);
  wire(x, yBase, x, yBot);
}
// Vertical BJT inside a circle. Collector/emitter vertical, base to a side.
// opts: {baseSide:'left'|'right', emitterAt:'top'|'bottom', type:'npn'|'pnp'}
function bjtV(cx, cy, r, opts = {}) {
  const { baseSide = 'left', emitterAt = 'bottom', type = 'npn' } = opts;
  circle(cx, cy, r);
  const bx = baseSide === 'left' ? cx - 12 : cx + 12;
  const sign = baseSide === 'left' ? 1 : -1;          // direction toward C/E terminals
  const innerX = bx + sign * 26;
  p(`<line x1="${bx}" y1="${cy - 17}" x2="${bx}" y2="${cy + 17}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  const baseTerm = [baseSide === 'left' ? cx - r : cx + r, cy];
  wire(baseTerm[0], baseTerm[1], bx, cy);
  const topTerm = [innerX, cy - r - 6];
  const botTerm = [innerX, cy + r + 6];
  // diagonals from base bar to the two terminals
  wire(bx, cy - 7, innerX, cy - 20); wire(innerX, cy - 20, topTerm[0], topTerm[1]);
  wire(bx, cy + 7, innerX, cy + 20); wire(innerX, cy + 20, botTerm[0], botTerm[1]);
  // arrow on the emitter diagonal
  const emTop = emitterAt === 'top';
  const dx = innerX - bx, dy = (emTop ? -20 : 20);          // vector base->inner along emitter diagonal
  const mx = bx + dx * 0.55, my = cy + dy * 0.55;
  // npn: arrow points outward (base->terminal); pnp: inward (terminal->base)
  let ang = Math.atan2(dy, dx); if (type === 'pnp') ang += Math.PI;
  const L = 15, wgt = 0.42;
  const tipx = mx + Math.cos(ang) * L * 0.5, tipy = my + Math.sin(ang) * L * 0.5;
  const b1x = tipx - Math.cos(ang - wgt) * L, b1y = tipy - Math.sin(ang - wgt) * L;
  const b2x = tipx - Math.cos(ang + wgt) * L, b2y = tipy - Math.sin(ang + wgt) * L;
  p(`<polygon points="${tipx},${tipy} ${b1x},${b1y} ${b2x},${b2y}" fill="${STROKE}"/>`);
  return { base: baseTerm, top: topTerm, bot: botTerm,
           col: emTop ? botTerm : topTerm, em: emTop ? topTerm : botTerm };
}

// ===================================================================
//  BUILD
// ===================================================================
const GND = 900;                       // bottom ground-rail y

// ---------- Bottom ground rail ----------
wire(120, GND, 1500, GND);
ground(150, GND);

// =========================================================
//  LEFT — bias / reference chain
// =========================================================

// --- Q_EN and Q_REF drawn first so wires can use exact terminal coords ---
const Qen = bjtV(340, 470, 30, { baseSide: 'left', emitterAt: 'bottom', type: 'npn' });
const Qref = bjtV(600, 580, 30, { baseSide: 'left', emitterAt: 'bottom', type: 'npn' });
const nBase = Qen.base[1];              // base-bias node height

// --- Vs branch:  Vs -> Rs -> node n1 -> zener -> GND ---
terminal(120, 70); text(96, 58, 'Vs', { size: 28 });
wire(120, 77, 120, 120);
resistorV(120, 120, 195); text(140, 165, 'Rs', { size: 22 });
wire(120, 195, 120, nBase);
const n1 = [120, nBase]; dot(n1[0], n1[1]);
wire(120, nBase, 120, 730);
zenerV(120, 730, 810); text(142, 782, 'Dz', { size: 22 });
wire(120, 810, 120, GND);
wire(n1[0], n1[1], Qen.base[0], Qen.base[1]);   // n1 -> Q_EN base (horizontal)

// --- EN branch:  EN -> Q_EN collector; emitter -> node ne -> D -> GND ---
terminal(Qen.col[0], 70); text(Qen.col[0] - 12, 58, 'EN', { size: 28, anchor: 'end' });
wire(Qen.col[0], 77, Qen.col[0], Qen.col[1]);
text(Qen.base[0] - 6, 452, 'Q₁', { size: 22, anchor: 'end' });
const ne = [Qen.em[0], 580];
wire(Qen.em[0], Qen.em[1], ne[0], ne[1]); dot(ne[0], ne[1]);
wire(ne[0], ne[1], ne[0], 650);
diodeV(ne[0], 650, 730); text(ne[0] + 20, 700, 'D', { size: 22 });
wire(ne[0], 730, ne[0], GND);

// --- Reference branch:  Q_REF with emitter resistor R sets I = 5V/R ---
wire(ne[0], ne[1], Qref.base[0], Qref.base[1]);  // ne -> Q_REF base
text(Qref.base[0] - 6, 562, 'Q₂', { size: 22, anchor: 'end' });
wire(Qref.em[0], Qref.em[1], Qref.em[0], 720);
resistorV(Qref.em[0], 720, 800); text(Qref.em[0] + 20, 768, 'R', { size: 26 });
wire(Qref.em[0], 800, Qref.em[0], GND);
text(415, 660, '5V / R', { size: 30, weight: 700 });
text(430, 698, '( I_ref )', { size: 22 });

// =========================================================
//  CENTER — 1:10 current mirror (PNP), node A on top rail
// =========================================================
const A = 210;                          // node-A rail y
wire(540, A, 790, A);
text(650, A - 18, 'A', { size: 30, weight: 700 });

// 1X reference device (diode-connected PNP)
const Q1x = bjtV(600, 300, 30, { baseSide: 'right', emitterAt: 'top', type: 'pnp' });
wire(Q1x.em[0], A, Q1x.em[0], Q1x.em[1]);        // emitter up to A
text(548, 306, '1X', { size: 24, anchor: 'end' });

// 10X output PNP with series R from A
const Q10x = bjtV(720, 300, 30, { baseSide: 'left', emitterAt: 'top', type: 'pnp' });
wire(Q10x.em[0], A, Q10x.em[0], 236);
resistorV(Q10x.em[0], 236, 288);
wire(Q10x.em[0], 288, Q10x.em[0], Q10x.em[1]);
text(762, 306, '10X', { size: 24 });

// diode-connect 1X: base -> its own collector (short jog beneath the device)
wire(Q1x.base[0], Q1x.base[1], Q1x.base[0], Q1x.col[1]);
wire(Q1x.base[0], Q1x.col[1], Q1x.col[0], Q1x.col[1]);
// mirror base tie to 10X
wire(Q1x.base[0], Q1x.base[1], Q10x.base[0], Q10x.base[1]);
// reference node: 1X collector down to Q_REF collector
const refY = 470;
wire(Q1x.col[0], Q1x.col[1], Q1x.col[0], refY);
wire(Qref.col[0], Qref.col[1], Qref.col[0], refY);
wire(Q1x.col[0], refY, Qref.col[0], refY);
dot(Qref.col[0], refY);

// 10X collector -> 20 mA output -> LS block
wire(Q10x.col[0], Q10x.col[1], Q10x.col[0], 540);
wire(Q10x.col[0], 540, 840, 540);
text(768, 486, '20 mA', { size: 28, weight: 700 });

// =========================================================
//  RIGHT — LS CRTS block
// =========================================================
const BX = 840, BY = 500, BW = 660, BH = 320;   // block outline
rect(BX, BY, BW, BH);
text(BX + BW / 2, BY + BH + 60, 'LS CRTS', { size: 40, weight: 700, anchor: 'middle' });
const topR = BY + 40;      // internal top rail (driven / 20 mA net)
const botR = BY + BH - 40; // internal bottom rail (GND)
wire(BX + 20, topR, BX + BW - 20, topR);
wire(BX + 20, botR, BX + BW - 20, botR);
wire(840, 540, 840, topR);                       // 20 mA feeds internal top rail
wire(BX + 20, botR, BX + 20, GND);               // block ground -> GND rail
dot(840, topR); dot(BX + 20, botR);

// 4V shunt  (box between rails)
const sh = BX + 70;
rect(sh - 34, topR + 45, 68, 68);
wire(sh, topR, sh, topR + 45); wire(sh, topR + 113, sh, botR);
text(sh + 60, topR + 92, '4V shunt', { size: 26 });

// switch block (box with control)
const sw = BX + 300;
rect(sw - 40, topR + 40, 80, 78);
wire(sw, topR, sw, topR + 40); wire(sw, topR + 118, sw, botR);
// small control device drawn on top
wire(sw - 40, topR + 26, sw + 6, topR + 26); circle(sw + 16, topR + 26, 10);
text(sw, topR + 92, 'sw', { size: 22, anchor: 'middle' });

// VDG resistor  (top rail -> node VDG -> bottom rail)
const rg = BX + 430;
wire(rg, topR, rg, topR + 30); resistorV(rg, topR + 30, topR + 95);
const vdg = [rg, topR + 120];
wire(rg, topR + 95, vdg[0], vdg[1]); dot(vdg[0], vdg[1]);
wire(vdg[0], vdg[1], vdg[0], botR);
text(rg + 22, vdg[1] - 4, 'VDG', { size: 26 });

// complementary output pair (two boxes) tapping VDG
const c1 = BX + 540, c2 = BX + 610;
rect(c1 - 22, topR + 30, 44, 44);
rect(c2 - 22, topR + 30, 44, 44);
wire(vdg[0], vdg[1], c1 - 22, vdg[1]);
wire(c1, topR + 74, c1, botR); wire(c2, topR + 74, c2, botR);
wire(c1, topR + 30, c1, topR); wire(c2, topR + 30, c2, topR);
text(c1 + 6, topR + 140, 'compl. pair', { size: 22, anchor: 'middle' });

// ===================================================================
const svg =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Arial, sans-serif">\n` +
  `<title>Bias reference / 1:10 current mirror driving LS CRTS block</title>\n` +
  `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>\n` +
  parts.join('\n') + `\n</svg>\n`;
process.stdout.write(svg);
