/* TokenKit keyboard pack: the pictures. Pure strings, no DOM, so the same art renders in
   a web component, a React wrapper, a server, a test or Figma's SVG import.

   Only the keys asked for are drawn, each where it sits on an ANSI keyboard, on one
   deck cropped to them; the arrows sit in their own group to the right, bottoms
   aligned, as they do on a real board. Every colour is a --tk-keyboard-* custom
   property, so a theme is a token swap. No maker's logo, legend font or colourway.

   Radii are concentric (inner = outer - gap): the cap's top face is the cap's radius
   less its inset, the deck is the cap's radius plus the gap to the deck's edge, and the
   highlight ring is the cap's radius plus its offset. */
import { MAIN, ARROWS, capLabel, keyWord } from './keyboard-core.mjs';

export const UNIT = 44;          // one key unit, in viewBox units
export const CAP_INSET = 2;      // space around a cap inside its unit
export const CAP_R = 7;          // the cap's corner radius
export const FACE_INSET = 3;     // the top face, inset from the cap's sides and top
export const FACE_R = CAP_R - FACE_INSET;
export const DECK_PAD = 14;      // deck edge to the first unit
export const DECK_R = CAP_R + CAP_INSET + DECK_PAD;
export const RING = 3;           // highlight ring offset outside the cap
export const RING_R = CAP_R + RING;
const GROUP_GAP = 0.5;           // units between the main block and the arrows

const f = (n) => +n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* Where each asked-for key sits, in viewBox units, and the viewBox around them. */
export function keyboardLayout(codes) {
  const main = codes.filter((c) => c in MAIN), arrows = codes.filter((c) => c in ARROWS);
  const units = [];
  let maxX = 0, minY = Infinity, maxY = -Infinity;
  if (main.length) {
    const minX = Math.min(...main.map((c) => MAIN[c][0]));
    minY = Math.min(...main.map((c) => MAIN[c][1]));
    for (const c of main) { const [x, y, w] = MAIN[c]; units.push({ code: c, x: x - minX, y: y - minY, w }); maxX = Math.max(maxX, x - minX + w); maxY = Math.max(maxY, y - minY + 1); }
  }
  if (arrows.length) {
    const ax0 = Math.min(...arrows.map((c) => ARROWS[c][0])), ay0 = Math.min(...arrows.map((c) => ARROWS[c][1]));
    const aw = Math.max(...arrows.map((c) => ARROWS[c][0] + 1)) - ax0, ah = Math.max(...arrows.map((c) => ARROWS[c][1] + 1)) - ay0;
    const left = main.length ? maxX + GROUP_GAP : 0;
    const bottom = main.length ? maxY : ah;                     // bottoms aligned with the main block
    for (const c of arrows) { const [x, y] = ARROWS[c]; units.push({ code: c, x: left + x - ax0, y: bottom - ah + y - ay0, w: 1 }); }
    maxX = left + aw;
  }
  if (!units.length) return { viewBox: [0, 0, 2 * DECK_PAD + UNIT, 2 * DECK_PAD + UNIT], caps: [] };
  const top = Math.min(0, ...units.map((u) => u.y)); // arrows taller than a one-row block
  const rows = Math.max(...units.map((u) => u.y + 1)) - top;
  const caps = units.map((u) => ({ code: u.code, x: f(DECK_PAD + u.x * UNIT + CAP_INSET), y: f(DECK_PAD + (u.y - top) * UNIT + CAP_INSET), w: f(u.w * UNIT - 2 * CAP_INSET), h: UNIT - 2 * CAP_INSET }));
  return { viewBox: [0, 0, f(2 * DECK_PAD + maxX * UNIT), f(2 * DECK_PAD + rows * UNIT)], caps };
}

/* The arrow drawn on an arrow key's face, pointing its way. */
const ARROW_DIR = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 };
const arrowGlyph = (code, cx, cy) => `<path class="lg ar" d="M0 -6L6 3H-6Z" transform="translate(${f(cx)} ${f(cy)}) rotate(${ARROW_DIR[code]})"/>`;

function cap({ code, x, y, w, h }, labels, uid) {
  const fx = FACE_INSET, fy = FACE_INSET - 1, fw = w - 2 * FACE_INSET, fh = h - FACE_INSET - 6;
  const cx = w / 2, cy = fy + fh / 2;
  const label = capLabel(code, labels);
  const word = label.length > 2;
  const legend = code in ARROW_DIR ? arrowGlyph(code, cx, cy)
    : `<text class="lg${word ? ' wd' : ''}" x="${f(cx)}" y="${f(cy + (word ? 3.6 : 5))}" text-anchor="middle">${esc(label)}</text>`;
  return `<g class="k" data-code="${code}" transform="translate(${x} ${y})"><title>${esc(keyWord(code, labels))}</title>`
    + `<rect class="hl" x="${-RING}" y="${-RING}" width="${f(w + 2 * RING)}" height="${f(h + 2 * RING)}" rx="${RING_R}"/>`
    + `<rect class="skirt" width="${w}" height="${h}" rx="${CAP_R}"/>`
    + `<g class="top"><rect class="face" fill="url(#${uid}-face)" x="${fx}" y="${fy}" width="${f(fw)}" height="${f(fh)}" rx="${FACE_R}"/>${legend}</g></g>`;
}

/* The whole picture. `labels`: a layout map (code -> character) or null for US caps. */
export function keyboardSVG({ codes = [], uid = 'tkkb', title = 'Keyboard', labels = null } = {}) {
  const { viewBox, caps } = keyboardLayout(codes);
  const [, , W, H] = viewBox;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" data-keys="${caps.length}">`
    + `<defs><linearGradient id="${uid}-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="d-hi"/><stop offset="1" class="d-lo"/></linearGradient>`
    + `<linearGradient id="${uid}-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="f-hi"/><stop offset="1" class="f-lo"/></linearGradient></defs>`
    + `<rect class="drop" x="2" y="4" width="${W - 4}" height="${H - 2}" rx="${DECK_R}"/>`
    + `<rect class="deck" width="${W}" height="${H}" rx="${DECK_R}" fill="url(#${uid}-deck)"/>`
    + `<rect class="rim" x=".6" y=".6" width="${f(W - 1.2)}" height="${f(H - 1.2)}" rx="${DECK_R - 0.6}"/>`
    + `<g class="caps">${caps.map((c) => cap(c, labels, uid)).join('')}</g></svg>`;
}
