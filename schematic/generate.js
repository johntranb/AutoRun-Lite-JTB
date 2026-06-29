// Generates oscillator.svg — a clean computer-drawn version of the hand-drawn
// two-stage crystal oscillator / buffer schematic (2x 2N5133).
// Pure JS, no dependencies. Run: node generate.js > oscillator.svg
'use strict';

const W = 1360, H = 950;
const STROKE = '#111';
const SW = 4;            // wire stroke width
const parts = [];

const p = s => parts.push(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function wire(x1, y1, x2, y2, w = SW) {
  p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${STROKE}" stroke-width="${w}" stroke-linecap="round"/>`);
}
function polyline(pts, w = SW, fill = 'none') {
  const d = pts.map(a => a.join(',')).join(' ');
  p(`<polyline points="${d}" fill="${fill}" stroke="${STROKE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
}
function dot(x, y, r = 6) { p(`<circle cx="${x}" cy="${y}" r="${r}" fill="${STROKE}"/>`); }
function terminal(x, y, r = 7) { p(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${STROKE}" stroke-width="3.5"/>`); }

function text(x, y, s, opts = {}) {
  const { size = 26, anchor = 'start', weight = 600 } = opts;
  p(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${STROKE}">${esc(s)}</text>`);
}

function ground(x, y) {
  wire(x, y - 0, x, y); // ensure point
  p(`<line x1="${x - 22}" y1="${y}" x2="${x + 22}" y2="${y}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - 13}" y1="${y + 8}" x2="${x + 13}" y2="${y + 8}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - 6}" y1="${y + 16}" x2="${x + 6}" y2="${y + 16}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
}

function resistorV(x, yTop, yBot) {
  const pts = [[x, yTop]];
  const teeth = 6, step = (yBot - yTop) / teeth, amp = 11;
  for (let i = 0; i < teeth; i++) {
    const yy = yTop + step * (i + 0.5);
    pts.push([i % 2 === 0 ? x + amp : x - amp, yy]);
  }
  pts.push([x, yBot]);
  polyline(pts);
}
function resistorH(xL, xR, y) {
  const pts = [[xL, y]];
  const teeth = 6, step = (xR - xL) / teeth, amp = 11;
  for (let i = 0; i < teeth; i++) {
    const xx = xL + step * (i + 0.5);
    pts.push([xx, i % 2 === 0 ? y - amp : y + amp]);
  }
  pts.push([xR, y]);
  polyline(pts);
}

function capV(x, yTop, yBot, plateW = 18) {
  const mid = (yTop + yBot) / 2;
  wire(x, yTop, x, mid - 4);
  p(`<line x1="${x - plateW}" y1="${mid - 4}" x2="${x + plateW}" y2="${mid - 4}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${x - plateW}" y1="${mid + 4}" x2="${x + plateW}" y2="${mid + 4}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(x, mid + 4, x, yBot);
}
function capH(xL, xR, y, plateH = 18) {
  const mid = (xL + xR) / 2;
  wire(xL, y, mid - 4, y);
  p(`<line x1="${mid - 4}" y1="${y - plateH}" x2="${mid - 4}" y2="${y + plateH}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<line x1="${mid + 4}" y1="${y - plateH}" x2="${mid + 4}" y2="${y + plateH}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(mid + 4, y, xR, y);
}
// Trimmer (variable) capacitor: a cap with an arrow drawn diagonally through it.
function trimmerCapH(xL, xR, y, plateH = 18) {
  capH(xL, xR, y, plateH);
  const mid = (xL + xR) / 2;
  const ax1 = mid - 26, ay1 = y + 24, ax2 = mid + 26, ay2 = y - 24;
  p(`<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="${STROKE}" stroke-width="3"/>`);
  // arrowhead at (ax2,ay2)
  p(`<polygon points="${ax2},${ay2} ${ax2 - 12},${ay2 + 2} ${ax2 - 3},${ay2 + 12}" fill="${STROKE}"/>`);
}
// Crystal: two holder plates with a rectangle body between them.
function crystalH(xL, xR, y) {
  const mid = (xL + xR) / 2;
  wire(xL, y, mid - 18, y);
  p(`<line x1="${mid - 18}" y1="${y - 15}" x2="${mid - 18}" y2="${y + 15}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  p(`<rect x="${mid - 11}" y="${y - 17}" width="22" height="34" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`);
  p(`<line x1="${mid + 18}" y1="${y - 15}" x2="${mid + 18}" y2="${y + 15}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  wire(mid + 18, y, xR, y);
}

function inductorV(x, yTop, yBot) {
  const loops = 4, h = (yBot - yTop) / loops, r = h / 2;
  let d = `M ${x} ${yTop}`;
  for (let i = 0; i < loops; i++) d += ` a ${r} ${r} 0 0 1 0 ${h}`;
  p(`<path d="${d}" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`);
}

// Zener diode (vertical), cathode at top (shunt regulator from V+ to GND).
function zenerV(x, yTop, yBot) {
  const yBar = yTop + 20;
  const yBase = yBar + 26;
  wire(x, yTop, x, yBar);
  // triangle (anode bottom -> apex up to cathode bar)
  p(`<polygon points="${x},${yBar} ${x - 16},${yBase} ${x + 16},${yBase}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  // cathode bar with zener bends
  p(`<polyline points="${x - 16},${yBar - 7} ${x - 16},${yBar} ${x + 16},${yBar} ${x + 16},${yBar + 7}" fill="none" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"/>`);
  wire(x, yBase, x, yBot);
}

// NPN transistor, base entering from the left. Returns terminal coords.
function npn(cx, cy, r = 34) {
  p(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${STROKE}" stroke-width="${SW}"/>`);
  const xb = cx - 12;
  // base bar
  p(`<line x1="${xb}" y1="${cy - 17}" x2="${xb}" y2="${cy + 17}" stroke="${STROKE}" stroke-width="${SW}" stroke-linecap="round"/>`);
  const baseTerm = [cx - r, cy];
  wire(baseTerm[0], baseTerm[1], xb, cy);
  const colTerm = [cx + 14, cy - r];
  const emTerm = [cx + 14, cy + r];
  // collector diagonal + lead
  wire(xb, cy - 7, cx + 14, cy - 19);
  wire(cx + 14, cy - 19, colTerm[0], colTerm[1]);
  // emitter diagonal + lead (with arrow)
  wire(xb, cy + 7, cx + 14, cy + 19);
  wire(cx + 14, cy + 19, emTerm[0], emTerm[1]);
  // emitter arrowhead pointing outward along diagonal
  p(`<polygon points="${cx + 14},${cy + 19} ${cx + 2},${cy + 13} ${cx + 6},${cy + 24}" fill="${STROKE}"/>`);
  return { base: baseTerm, col: colTerm, em: emTerm };
}

// ---- Open switch (vertical), open contacts between yTop and yBot ----
function switchV(x, yTop, yBot) {
  dot(x, yTop, 4);
  dot(x, yBot, 4);
  wire(x, yBot, x + 22, yTop + 6); // open blade
}

// ===================================================================
//  BUILD
// ===================================================================

// --- V+ rail ---
const RAIL = 120;
wire(110, RAIL, 1260, RAIL);

// --- Q1 bias divider (left) ---
wire(130, RAIL, 130, 170);
resistorV(130, 170, 230);
wire(130, 230, 130, 330);            // node Bd
text(78, 205, '15k', { anchor: 'end' });
const Bd = [130, 330];
wire(130, 330, 130, 360);
resistorV(130, 360, 420);
wire(130, 420, 130, 470);
ground(130, 470);
text(78, 397, '8200', { anchor: 'end' });

// base wire
wire(130, 330, 296, 330);

// --- Q1 (oscillator) ---
const Q1 = npn(330, 330);
text(372, 322, 'Q1', {});
text(372, 350, '2N5133', { size: 24 });

// 27 pF cap, base -> ground
dot(170, 330);
wire(170, 330, 170, 372);
capV(170, 372, 410);
wire(170, 410, 170, 450);
ground(170, 450);
text(122, 398, '27', { anchor: 'end' });

// crystal network (C1 trimmer || Y1) between collector bus and base
dot(250, 330);
wire(250, 330, 250, 255);            // left vertical (to Y1) ...
wire(250, 255, 250, 210);            // ... and up to C1
trimmerCapH(250, 380, 210);          // C1 trimmer (top branch)
crystalH(250, 380, 255);             // Y1 crystal (bottom branch)
wire(380, 210, 380, 255);            // right vertical joining both
wire(380, 200, 380, 210);            // up to collector bus
text(300, 192, 'C1', { size: 24 });
text(300, 300, 'Y1', { size: 24 });

// --- Q1 collector bus / load ---
wire(Q1.col[0], Q1.col[1], 344, 200);
wire(344, 200, 620, 200);            // collector bus
dot(380, 200); dot(470, 200);
// 1500 collector load
wire(470, RAIL, 470, 140);
resistorV(470, 140, 196);
wire(470, 196, 470, 200);
text(488, 168, '1500', {});

// --- Q1 emitter network ---
wire(Q1.em[0], Q1.em[1], 344, 470);
dot(344, 470);
// .01 bypass to ground
wire(344, 470, 430, 470);
capV(430, 478, 522);
wire(430, 522, 430, 560);
ground(430, 560);
text(456, 514, '.01', {});
// 1500 emitter resistor + switch to ground
wire(344, 470, 344, 500);
resistorV(344, 500, 560);
wire(344, 560, 344, 600);
switchV(344, 600, 645);
wire(344, 645, 344, 690);
ground(344, 690);
text(362, 535, '1500', {});

// --- coupling 100 pF -> node N ---
dot(620, 200);
wire(620, 200, 620, 330);
capH(620, 720, 330);
text(648, 318, '100', {});
const N = [720, 330];
dot(N[0], N[1]);

// --- node N: 8200 to gnd, Q2 base, OSC bus ---
wire(720, 330, 866, 330);            // to Q2 base
dot(790, 330);
wire(790, 330, 790, 360);
resistorV(790, 360, 420);
wire(790, 420, 790, 470);
ground(790, 470);
text(808, 397, '8200', {});

// OSC injection bus (downward)
wire(720, 330, 720, 800);
// TO OSC 2
terminal(470, 745);
text(455, 752, 'TO OSC 2', { size: 22, anchor: 'end' });
wire(477, 745, 560, 745);
capH(560, 640, 745, 14);
wire(640, 745, 720, 745);
dot(720, 745);
// TO OSC 3
terminal(470, 800);
text(455, 807, 'TO OSC 3', { size: 22, anchor: 'end' });
wire(477, 800, 560, 800);
capH(560, 640, 800, 14);
wire(640, 800, 720, 800);
dot(720, 800);

// --- Q2 (buffer) ---
const Q2 = npn(900, 330);
text(945, 322, 'Q2', {});
text(945, 350, '2N5133', { size: 24 });
wire(N[0], N[1], Q2.base[0], Q2.base[1]); // base already reached at 866; ensure

// --- Q2 collector: RFC1 + output ---
wire(Q2.col[0], Q2.col[1], 914, 200);
const Qc = [914, 200];
wire(914, RAIL, 914, 135);
inductorV(914, 135, 200);
text(932, 158, 'RFC1', { size: 24 });
text(932, 184, '16 µH', { size: 22 });
// output tap
dot(914, 250);
wire(914, 200, 914, 296);
wire(914, 250, 1010, 250);
capH(1010, 1078, 250);
wire(1078, 250, 1150, 250);
terminal(1150, 250);
text(1170, 256, 'OUTPUT', { size: 24 });

// --- Q2 emitter ---
wire(Q2.em[0], Q2.em[1], 914, 470);
wire(914, 470, 914, 490);
resistorV(914, 490, 550);
wire(914, 550, 914, 610);
ground(914, 610);
text(932, 522, '100', {});

// --- Supply (top right) ---
text(1200, 50, '+ 12–18 V', { size: 26 });
terminal(1180, 64);
wire(1180, 71, 1180, 80);
resistorV(1180, 80, 112);
wire(1180, 112, 1180, RAIL);
text(1198, 100, '100', { size: 24 });
// .01 supply decoupling
dot(1090, RAIL);
wire(1090, RAIL, 1090, 152);
capV(1090, 152, 184);
wire(1090, 184, 1090, 206);
ground(1090, 206);
text(1106, 152, '.01', { size: 24 });
// 12 V zener
dot(1250, RAIL);
wire(1250, RAIL, 1250, 150);
zenerV(1250, 150, 206);
ground(1250, 206);
text(1270, 188, '12V', { size: 24 });

// --- Notes ---
text(470, 852, 'RESISTORS  ½ W', { size: 26, weight: 700 });
text(470, 890, 'CAPACITORS  DISK CERAMIC', { size: 26, weight: 700 });
text(470, 928, 'EXCEPT  C1 — AIR-INSULATED TRIMMER', { size: 26, weight: 700 });

// ===================================================================
const svg =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Arial, sans-serif">\n` +
  `<title>Two-stage crystal oscillator / buffer (2x 2N5133)</title>\n` +
  `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>\n` +
  parts.join('\n') +
  `\n</svg>\n`;

process.stdout.write(svg);
