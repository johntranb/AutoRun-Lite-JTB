// Generates schematic-literal.svg — a LITERAL transcription of the hand-drawn
// sketch: detect each element and place it where it is on the page, using
// standard symbols and only the labels that appear in the photo.
// No functional reinterpretation.  Pure JS.  node generate3.js > schematic-literal.svg
'use strict';

const W = 1720, H = 1260;
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
function rect(x, y, w, h) { p(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`); }
function text(x, y, s, o = {}) {
  const { size = 26, anchor = 'start', weight = 600 } = o;
  p(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${STROKE}">${esc(s)}</text>`);
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
// Diode, anode top -> cathode bottom (triangle points down).
function diodeV(x, yTop, yBot) {
  const h = yBot - yTop, yA = yTop + h * 0.28, yC = yTop + h * 0.72;
  wire(x, yTop, x, yA);
  p(`<polygon points="${x - 16},${yA} ${x + 16},${yA} ${x},${yC}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  p(`<line x1="${x - 16}" y1="${yC}" x2="${x + 16}" y2="${yC}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(x, yC, x, yBot);
}
// Vertical BJT in a circle (matches the circled transistors in the sketch).
function bjtV(cx, cy, r, opts = {}) {
  const { baseSide = 'left', emitterAt = 'bottom', type = 'npn' } = opts;
  circle(cx, cy, r);
  const bx = baseSide === 'left' ? cx - 12 : cx + 12;
  const sign = baseSide === 'left' ? 1 : -1;
  const innerX = bx + sign * 26;
  p(`<line x1="${bx}" y1="${cy - 17}" x2="${bx}" y2="${cy + 17}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  const baseTerm = [baseSide === 'left' ? cx - r : cx + r, cy];
  wire(baseTerm[0], baseTerm[1], bx, cy);
  const topTerm = [innerX, cy - r - 6], botTerm = [innerX, cy + r + 6];
  wire(bx, cy - 7, innerX, cy - 20); wire(innerX, cy - 20, topTerm[0], topTerm[1]);
  wire(bx, cy + 7, innerX, cy + 20); wire(innerX, cy + 20, botTerm[0], botTerm[1]);
  const dx = innerX - bx, dy = emitterAt === 'top' ? -20 : 20;
  const mx = bx + dx * 0.55, my = cy + dy * 0.55;
  let ang = Math.atan2(dy, dx); if (type === 'pnp') ang += Math.PI;
  const L = 15, wgt = 0.42;
  const tx = mx + Math.cos(ang) * L * 0.5, ty = my + Math.sin(ang) * L * 0.5;
  p(`<polygon points="${tx},${ty} ${tx - Math.cos(ang - wgt) * L},${ty - Math.sin(ang - wgt) * L} ${tx - Math.cos(ang + wgt) * L},${ty - Math.sin(ang + wgt) * L}" fill="${STROKE}"/>`);
  return { base: baseTerm, top: topTerm, bot: botTerm,
           col: emitterAt === 'top' ? botTerm : topTerm, em: emitterAt === 'top' ? topTerm : botTerm };
}

// ===================================================================
//  BUILD — literal layout following the photo
// ===================================================================
const GRND = 1160;
wire(90, GRND, 1660, GRND);
ground(190, GRND);

// ---- Column 1: Vs  (resistor near top, diode near bottom) ----
text(118, 96, 'Vs', { size: 30 });
wire(150, 116, 150, 190);
resistorV(150, 190, 300);
wire(150, 300, 150, 700);
const n1 = [150, 700]; dot(n1[0], n1[1]);            // tap node -> Q(EN) base
wire(150, 700, 150, 980);
diodeV(150, 980, 1070);
wire(150, 1070, 150, GRND);

// ---- Column 2: EN  (circled transistor, diode below) ----
const Qen = bjtV(350, 700, 32, { baseSide: 'left', emitterAt: 'bottom', type: 'npn' });
text(Qen.col[0] - 32, 96, 'EN', { size: 30 });
wire(Qen.col[0], 116, Qen.col[0], Qen.col[1]);       // EN -> collector
wire(n1[0], n1[1], Qen.base[0], Qen.base[1]);        // Vs tap -> base
const ne = [Qen.em[0], 830];
wire(Qen.em[0], Qen.em[1], ne[0], ne[1]); dot(ne[0], ne[1]);
wire(ne[0], ne[1], ne[0], 910);
diodeV(ne[0], 910, 1000);
wire(ne[0], 1000, ne[0], GRND);

// ---- Column 3: reference transistor with emitter resistor R ----
const Qr = bjtV(560, 830, 32, { baseSide: 'left', emitterAt: 'bottom', type: 'npn' });
wire(ne[0], ne[1], Qr.base[0], Qr.base[1]);          // EN emitter -> base
wire(Qr.em[0], Qr.em[1], Qr.em[0], 930);
resistorV(Qr.em[0], 930, 1050); text(Qr.em[0] + 22, 1000, 'R', { size: 28 });
wire(Qr.em[0], 1050, Qr.em[0], GRND);
wire(Qr.col[0], Qr.col[1], Qr.col[0], 560);          // collector up toward mirror
text(612, 636, '5V / R', { size: 30, weight: 700 });

// ---- Current mirror:  node-A rail on top, 1X (with box) and 10X ----
const A = 300;
wire(520, A, 850, A);
text(670, A - 26, 'A', { size: 32, weight: 700 });

// 1X device (left) + box below it (both drawn in the sketch)
const Q1 = bjtV(600, 400, 32, { baseSide: 'right', emitterAt: 'top', type: 'pnp' });
wire(Q1.em[0], A, Q1.em[0], Q1.em[1]);
text(548, 408, '1X', { size: 26, anchor: 'end' });
wire(Q1.col[0], Q1.col[1], Q1.col[0], 470);
rect(Q1.col[0] - 40, 470, 80, 78);                   // the box under 1X
wire(Q1.col[0], 548, Q1.col[0], 560);
wire(Qr.col[0], 560, Q1.col[0], 560); dot(Qr.col[0], 560);   // meet reference branch

// 10X device (right) with series resistor from A
const Q10 = bjtV(760, 400, 32, { baseSide: 'left', emitterAt: 'top', type: 'pnp' });
wire(Q10.em[0], A, Q10.em[0], 330);
resistorV(Q10.em[0], 330, 368);
text(802, 408, '10X', { size: 26 });
wire(Q10.col[0], Q10.col[1], Q10.col[0], 720);       // 20 mA wire down...
wire(Q10.col[0], 720, 900, 720);                     // ...into the LS block
text(818, 660, '20 mA', { size: 28, weight: 700 });

// mirror interconnect wire between the two devices (node dot as drawn)
wire(Q1.base[0], Q1.base[1], Q10.base[0], Q10.base[1]);
dot((Q1.base[0] + Q10.base[0]) / 2, Q1.base[1]);

// ---- LS CRTS block (right) ----
const BX = 900, BY = 680, BW = 740, BH = 380;
rect(BX, BY, BW, BH);
text(BX + BW / 2, BY + BH + 66, 'LS CRTS', { size: 42, weight: 700, anchor: 'middle' });
const topR = BY + 40, botR = BY + BH - 40;
wire(BX + 20, topR, BX + BW - 20, topR);
wire(BX + 20, botR, BX + BW - 20, botR);
wire(BX, 720, BX, topR);                 // 20 mA enters left edge -> top rail
wire(BX + 20, botR, BX + 20, GRND);      // block bottom -> ground rail
dot(BX, topR); dot(BX + 20, botR);

// 4V shunt (box across the rails)
let cx = BX + 80;
rect(cx - 36, topR + 48, 72, 76);
wire(cx, topR, cx, topR + 48); wire(cx, topR + 124, cx, botR);
text(cx + 62, topR + 96, '4V shunt', { size: 26 });

// switch box (with small control device on top, as drawn)
cx = BX + 330;
rect(cx - 40, topR + 46, 80, 80);
wire(cx, topR, cx, topR + 46); wire(cx, topR + 126, cx, botR);
wire(cx - 40, topR + 30, cx + 4, topR + 30); circle(cx + 16, topR + 30, 11);

// resistor -> node VDG
cx = BX + 470;
wire(cx, topR, cx, topR + 34); resistorV(cx, topR + 34, topR + 100);
const vdg = [cx, topR + 128];
wire(cx, topR + 100, vdg[0], vdg[1]); dot(vdg[0], vdg[1]);
wire(vdg[0], vdg[1], vdg[0], botR);
text(cx + 24, vdg[1] - 4, 'VDG', { size: 26 });

// complementary pair (two boxes) — "compl compl"
const b1 = BX + 585, b2 = BX + 665;
rect(b1 - 24, topR + 34, 48, 48); rect(b2 - 24, topR + 34, 48, 48);
wire(vdg[0], vdg[1], b1 - 24, vdg[1]);
wire(b1, topR + 82, b1, botR); wire(b2, topR + 82, b2, botR);
wire(b1, topR + 34, b1, topR); wire(b2, topR + 34, b2, topR);
text((b1 + b2) / 2, topR + 150, 'compl  compl', { size: 22, anchor: 'middle' });

// ===================================================================
const svg =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Arial, sans-serif">\n` +
  `<title>Literal transcription of hand-drawn sketch</title>\n` +
  `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>\n` +
  parts.join('\n') + `\n</svg>\n`;
process.stdout.write(svg);
