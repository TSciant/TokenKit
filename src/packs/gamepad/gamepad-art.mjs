/* TokenKit gamepad pack: the pictures. Pure strings, no DOM, so the same art renders in
   a web component, a React wrapper, a server, a test or Figma's SVG import.

   Drawn to the proportions of a modern offset dual-stick pad (about 1.55 : 1 across the
   grips): left stick high and outboard, d-pad low and inboard, the face diamond mirrored
   on the right, bumpers hugging the shoulders and triggers behind them. Every colour is
   a --tk-gamepad-* custom property, so a theme is a token swap. No maker's logo, no
   maker's button colours, no maker's symbols: the home button is a plain ring. */
import { GLYPHS, BUTTON_WORDS } from './gamepad-core.mjs';

export const PAD_VIEWBOX = [0, 0, 340, 232];
/* Where each control sits, in viewBox units. Hosts use this to place their own labels,
   outlines or call-outs (Boosty's HUD does). */
export const GEO = {
  ls: { x: 94, y: 96, r: 21 }, rs: { x: 214, y: 146, r: 21 },
  dpad: { x: 128, y: 146, r: 24 },
  up: { x: 128, y: 132, w: 14, h: 15 }, down: { x: 128, y: 160, w: 14, h: 15 }, left: { x: 114, y: 146, w: 15, h: 14 }, right: { x: 142, y: 146, w: 15, h: 14 },
  face: { x: 248, y: 96, r: 32 },
  north: { x: 248, y: 75, r: 10.5 }, west: { x: 227, y: 96, r: 10.5 }, east: { x: 269, y: 96, r: 10.5 }, south: { x: 248, y: 117, r: 10.5 },
  view: { x: 150, y: 98, w: 13, h: 8 }, menu: { x: 190, y: 98, w: 13, h: 8 }, home: { x: 170, y: 72, r: 9 },
  lb: { x: 84, y: 37, w: 70, h: 11 }, rb: { x: 256, y: 37, w: 70, h: 11 },
  lt: { x: 84, y: 26, w: 62, h: 18 }, rt: { x: 256, y: 26, w: 62, h: 18 },
};

const f = (n) => +n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* the shell: shoulders, a gently arched top, grips that flare down and out, and the
   arch between them. One closed path, mirrored about x = 170. */
const HALF = [
  // [cmd, ...points] for the right half, from top centre clockwise to bottom centre
  ['M', 170, 50],
  ['C', 200, 50, 226, 44, 252, 42],
  ['C', 286, 40, 308, 52, 318, 78],
  ['C', 330, 108, 336, 156, 334, 190],
  ['C', 332, 216, 314, 228, 296, 226],
  ['C', 280, 224, 270, 212, 262, 198],
  ['C', 252, 180, 240, 172, 222, 172],
  ['L', 170, 172],
];
function shellPath() {
  const right = HALF.map(([c, ...p]) => c + p.join(' ')).join(' ');
  // mirror: walk the right half backwards with x -> 340 - x
  const pts = HALF.map(([c, ...p]) => [c, p]);
  let left = '';
  for (let i = pts.length - 1; i > 0; i--) {
    const [c, p] = pts[i], prevEnd = pts[i - 1][1].slice(-2);
    const m = (x) => 340 - x;
    if (c === 'C') left += ` C${m(p[2])} ${p[3]} ${m(p[0])} ${p[1]} ${m(prevEnd[0])} ${prevEnd[1]}`;
    else left += ` L${m(prevEnd[0])} ${prevEnd[1]}`;
  }
  return right + left + ' Z';
}
export const SHELL_D = shellPath();
const TRIG = (s) => { const g = GEO[s], k = s === 'lt' ? 1 : -1, xo = g.x - k * g.w / 2, xi = g.x + k * g.w / 2, y0 = g.y - g.h / 2, y1 = g.y + g.h / 2 + 8;
  // a trigger seen from above: a broad rounded paddle rising behind the bumper, taller at its outer edge
  return `M${xo + k * 4} ${y1} C${xo} ${y0 + 10} ${xo + k * 6} ${y0} ${xo + k * 20} ${y0} L${xi - k * 12} ${y0 + 2} C${xi - k * 2} ${y0 + 3} ${xi} ${y0 + 8} ${xi} ${y1 - 4} L${xi} ${y1} Z`; };
const BUMP = (s) => { const g = GEO[s], k = s === 'lb' ? 1 : -1, xo = g.x - k * g.w / 2, xi = g.x + k * g.w / 2, y = g.y;
  // follows the shoulder curve: higher and rounder at the outer end
  return `M${xo + k * 2} ${y + 9} C${xo} ${y - 2} ${xo + k * 14} ${y - 7} ${g.x} ${y - 6} L${xi - k * 4} ${y - 3} C${xi + k * 1} ${y - 2} ${xi + k * 1} ${y + 4} ${xi - k * 3} ${y + 5} L${g.x - k * 6} ${y + 4} C${xo + k * 16} ${y + 3} ${xo + k * 8} ${y + 6} ${xo + k * 2} ${y + 9} Z`; };
const ARM = (d) => { const c = GEO.dpad, w = 14, r = 3, L = 21;
  // one arm of the cross, from the hub out, with a rounded tip
  const h = w / 2;
  if (d === 'up') return `M${c.x - h} ${c.y - h} V${c.y - L + r} Q${c.x - h} ${c.y - L} ${c.x - h + r} ${c.y - L} H${c.x + h - r} Q${c.x + h} ${c.y - L} ${c.x + h} ${c.y - L + r} V${c.y - h} Z`;
  if (d === 'down') return `M${c.x - h} ${c.y + h} V${c.y + L - r} Q${c.x - h} ${c.y + L} ${c.x - h + r} ${c.y + L} H${c.x + h - r} Q${c.x + h} ${c.y + L} ${c.x + h} ${c.y + L - r} V${c.y + h} Z`;
  if (d === 'left') return `M${c.x - h} ${c.y - h} H${c.x - L + r} Q${c.x - L} ${c.y - h} ${c.x - L} ${c.y - h + r} V${c.y + h - r} Q${c.x - L} ${c.y + h} ${c.x - L + r} ${c.y + h} H${c.x - h} Z`;
  return `M${c.x + h} ${c.y - h} H${c.x + L - r} Q${c.x + L} ${c.y - h} ${c.x + L} ${c.y - h + r} V${c.y + h - r} Q${c.x + L} ${c.y + h} ${c.x + L - r} ${c.y + h} H${c.x + h} Z`; };
const CHEV = (d) => { const c = GEO.dpad, o = 15, s = 3;
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d], x = c.x + dx * o, y = c.y + dy * o;
  return dx ? `M${x - dx * s * 0.2} ${y - s} L${x + dx * s} ${y} L${x - dx * s * 0.2} ${y + s} Z` : `M${x - s} ${y - dy * s * 0.2} L${x} ${y + dy * s} L${x + s} ${y - dy * s * 0.2} Z`; };

export function glyphMark(set, btn, cx, cy, size = 1) {
  const g = (GLYPHS[set] || GLYPHS.letters)[btn];
  if (set === 'shapes') {
    const s = 5.2 * size;
    if (g === 'circle') return `<circle class="gl" cx="${cx}" cy="${cy}" r="${f(s * 0.95)}"/>`;
    if (g === 'square') return `<rect class="gl" x="${f(cx - s * 0.82)}" y="${f(cy - s * 0.82)}" width="${f(s * 1.64)}" height="${f(s * 1.64)}" rx="1"/>`;
    if (g === 'diamond') return `<path class="gl" d="M${cx} ${f(cy - s * 1.1)} L${f(cx + s * 1.1)} ${cy} L${cx} ${f(cy + s * 1.1)} L${f(cx - s * 1.1)} ${cy} Z"/>`;
    return `<path class="gl" d="M${cx} ${f(cy - s * 1.05)} L${f(cx + s * 1.05)} ${f(cy + s * 0.8)} L${f(cx - s * 1.05)} ${f(cy + s * 0.8)} Z"/>`;
  }
  return `<text class="glt" x="${cx}" y="${f(cy + 4.1 * size)}" text-anchor="middle" font-size="${f(11.5 * size)}">${esc(g)}</text>`;
}

/* The full pad. `uid` keeps gradient ids unique when many pads share a page. */
export function padSVG({ glyphs = 'letters', uid = 'p', title = 'Gamepad', labelled = true } = {}) {
  const u = String(uid).replace(/[^a-z0-9_-]/gi, '');
  const face = ['north', 'west', 'east', 'south'].map((b) => { const g = GEO[b];
    return `<g class="b face" data-btn="${b}"><circle class="bw" cx="${g.x}" cy="${g.y + 1}" r="${g.r + 2.2}"/><circle class="bt" cx="${g.x}" cy="${g.y}" r="${g.r}" fill="url(#${u}-btn)"/><circle class="bsh" cx="${g.x}" cy="${g.y}" r="${g.r - 1}"/>${glyphMark(glyphs, b, g.x, g.y)}<circle class="hl" cx="${g.x}" cy="${g.y}" r="${g.r + 4}"/></g>`; }).join('');
  const arms = ['up', 'down', 'left', 'right'].map((d) => `<g class="b arm" data-btn="${d}"><path class="bt" d="${ARM(d)}"/><path class="chev" d="${CHEV(d)}"/></g>`).join('');
  const armHl = ['up', 'down', 'left', 'right'].map((d) => `<path class="hl" data-hl="${d}" d="${ARM(d)}"/>`).join('');
  const stick = (s) => { const g = GEO[s];
    return `<g class="stick" data-btn="${s}"><circle class="well" cx="${g.x}" cy="${g.y}" r="${g.r + 3}"/><circle class="wellin" cx="${g.x}" cy="${g.y}" r="${g.r}"/>`
      + `<g class="cap" data-cap="${s}"><circle class="capsh" cx="${g.x}" cy="${g.y + 2.4}" r="${g.r - 4}"/><circle class="capt" cx="${g.x}" cy="${g.y}" r="${g.r - 4}" fill="url(#${u}-cap)"/><circle class="caprim" cx="${g.x}" cy="${g.y}" r="${g.r - 6.5}"/><circle class="capdish" cx="${g.x}" cy="${g.y}" r="${g.r - 10}" fill="url(#${u}-dish)"/></g>`
      + `<circle class="hl" cx="${g.x}" cy="${g.y}" r="${g.r + 5}"/></g>`; };
  const trig = (s) => { const g = GEO[s], d = TRIG(s);
    return `<g class="b trig" data-btn="${s}"><path class="bt" d="${d}" fill="url(#${u}-trig)"/><clipPath id="${u}-c${s}"><path d="${d}"/></clipPath><rect class="fill" data-fill="${s}" clip-path="url(#${u}-c${s})" x="${g.x - g.w / 2}" y="${g.y - g.h / 2 - 6}" width="${g.w}" height="0"/><path class="hl" d="${d}"/></g>`; };
  const bump = (s) => `<g class="b bump" data-btn="${s}"><path class="bt" d="${BUMP(s)}" fill="url(#${u}-bump)"/><path class="hl" d="${BUMP(s)}"/></g>`;
  const small = (s) => { const g = GEO[s], ic = s === 'view'
      ? `<rect class="ic" x="${g.x - 3.2}" y="${g.y - 2.6}" width="4.2" height="3.4" rx=".6"/><rect class="ic" x="${g.x - 1}" y="${g.y - .8}" width="4.2" height="3.4" rx=".6"/>`
      : `<path class="ic" d="M${g.x - 3} ${g.y - 2}h6M${g.x - 3} ${g.y}h6M${g.x - 3} ${g.y + 2}h6"/>`;
    return `<g class="b small" data-btn="${s}"><rect class="bw" x="${g.x - g.w / 2 - 1.5}" y="${g.y - g.h / 2 - 1.5}" width="${g.w + 3}" height="${g.h + 3}" rx="${g.h / 2 + 1.5}"/><rect class="bt" x="${g.x - g.w / 2}" y="${g.y - g.h / 2}" width="${g.w}" height="${g.h}" rx="${g.h / 2}" fill="url(#${u}-btn)"/>${ic}<rect class="hl" x="${g.x - g.w / 2 - 4}" y="${g.y - g.h / 2 - 4}" width="${g.w + 8}" height="${g.h + 8}" rx="${g.h / 2 + 4}"/></g>`; };
  const H = GEO.home;
  return `<svg class="tk-gp-art" xmlns="http://www.w3.org/2000/svg" viewBox="${PAD_VIEWBOX.join(' ')}" ${labelled ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"'} data-glyphs="${esc(glyphs)}">
<defs>
<linearGradient id="${u}-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-hi"/><stop offset=".45" class="s-mid"/><stop offset="1" class="s-lo"/></linearGradient>
<radialGradient id="${u}-sheen" cx=".5" cy=".18" r=".62"><stop offset="0" class="sh-a"/><stop offset="1" class="sh-b"/></radialGradient>
<linearGradient id="${u}-btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="b-hi"/><stop offset="1" class="b-lo"/></linearGradient>
<radialGradient id="${u}-cap" cx=".42" cy=".34" r=".75"><stop offset="0" class="c-hi"/><stop offset="1" class="c-lo"/></radialGradient>
<radialGradient id="${u}-dish" cx=".5" cy=".62" r=".7"><stop offset="0" class="d-hi"/><stop offset="1" class="d-lo"/></radialGradient>
<linearGradient id="${u}-trig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="t-hi"/><stop offset="1" class="t-lo"/></linearGradient>
<linearGradient id="${u}-bump" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="u-hi"/><stop offset="1" class="u-lo"/></linearGradient>
</defs>
${labelled ? `<title>${esc(title)}</title>` : ''}
<g class="trigs">${trig('lt')}${trig('rt')}</g>
<path class="drop" d="${SHELL_D}" transform="translate(0 4)"/>
<g class="bumps">${bump('lb')}${bump('rb')}</g>
<path class="shell" d="${SHELL_D}" fill="url(#${u}-shell)"/>
<path class="sheen" d="${SHELL_D}" fill="url(#${u}-sheen)"/>
<path class="rim" d="${SHELL_D}"/>
<path class="seam" d="M60 64 C90 54 130 58 170 60 C210 58 250 54 280 64"/>
<path class="grip" d="M30 150 C34 182 42 206 58 214 M310 150 C306 182 298 206 282 214"/>
<g class="sticks">${stick('ls')}${stick('rs')}</g>
<g class="dp" data-btn="dpad"><circle class="well" cx="${GEO.dpad.x}" cy="${GEO.dpad.y}" r="${GEO.dpad.r + 2}"/><circle class="wellin" cx="${GEO.dpad.x}" cy="${GEO.dpad.y}" r="${GEO.dpad.r}"/><path class="crossdrop" d="${['up', 'down', 'left', 'right'].map(ARM).join(' ')}" transform="translate(0 1.6)"/>${arms}<circle class="hub" cx="${GEO.dpad.x}" cy="${GEO.dpad.y}" r="3.2"/>${armHl}</g>
<g class="faces">${face}</g>
<g class="mid">${small('view')}${small('menu')}<g class="b home" data-btn="home"><circle class="bw" cx="${H.x}" cy="${H.y}" r="${H.r + 2}"/><circle class="bt" cx="${H.x}" cy="${H.y}" r="${H.r}" fill="url(#${u}-btn)"/><circle class="homering" cx="${H.x}" cy="${H.y}" r="${H.r - 3.6}"/><circle class="hl" cx="${H.x}" cy="${H.y}" r="${H.r + 4}"/></g><circle class="led" cx="170" cy="58" r="1.4"/></g>
</svg>`;
}

/* A small 5-fret guitar controller glyph (jam / duo mode): headstock, neck with five
   coloured frets, body, strum bar and whammy. Fret colours are tokens too. */
export const FRETS = ['green', 'red', 'yellow', 'blue', 'orange'];
export function guitarSVG({ uid = 'g', title = 'Guitar controller', labelled = true } = {}) {
  const u = String(uid).replace(/[^a-z0-9_-]/gi, '');
  const frets = FRETS.map((c, i) => `<g class="b fret" data-btn="fret${i + 1}" data-fret="${c}"><rect class="bt fr-${c}" x="${30 + i * 13}" y="15" width="10" height="12" rx="2.4"/><rect class="hl" x="${28 + i * 13}" y="13" width="14" height="16" rx="3.5"/></g>`).join('');
  return `<svg class="tk-gp-art tk-gp-guitar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64" ${labelled ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"'}>
<defs><linearGradient id="${u}-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-hi"/><stop offset=".45" class="s-mid"/><stop offset="1" class="s-lo"/></linearGradient></defs>
${labelled ? `<title>${esc(title)}</title>` : ''}
<path class="drop" transform="translate(0 2)" d="M4 14 L22 18 L22 24 L4 28 Q0 21 4 14 Z M22 17 H100 V25 H22 Z M98 16 C102 6 114 2 126 6 C134 9 138 12 146 10 C160 4 180 6 190 20 C198 32 196 48 184 56 C172 63 154 60 144 54 C136 58 124 62 112 58 C100 54 96 44 100 34 C101 28 96 24 98 16 Z"/>
<path class="shell" fill="url(#${u}-shell)" d="M4 14 L22 18 L22 24 L4 28 Q0 21 4 14 Z M22 17 H100 V25 H22 Z M98 16 C102 6 114 2 126 6 C134 9 138 12 146 10 C160 4 180 6 190 20 C198 32 196 48 184 56 C172 63 154 60 144 54 C136 58 124 62 112 58 C100 54 96 44 100 34 C101 28 96 24 98 16 Z"/>
<path class="rim" d="M98 16 C102 6 114 2 126 6 C134 9 138 12 146 10 C160 4 180 6 190 20 C198 32 196 48 184 56 C172 63 154 60 144 54 C136 58 124 62 112 58 C100 54 96 44 100 34 C101 28 96 24 98 16 Z"/>
<rect class="neck" x="22" y="17" width="78" height="8" rx="1.5"/>
<g class="frets">${frets}</g>
<g class="b strum" data-btn="strum"><rect class="bw" x="118" y="27" width="34" height="12" rx="6"/><rect class="bt" x="120" y="29" width="30" height="8" rx="4"/><rect class="hl" x="115" y="24" width="40" height="18" rx="9"/></g>
<g class="b whammy" data-btn="whammy"><path class="bt bar" d="M162 44 L184 56" stroke-linecap="round"/><path class="hl bar" d="M162 44 L184 56" stroke-linecap="round"/></g>
<circle class="knob" cx="170" cy="28" r="4"/><circle class="led" cx="108" cy="21" r="1.4"/>
</svg>`;
}
export { BUTTON_WORDS };
