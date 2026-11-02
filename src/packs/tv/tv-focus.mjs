/* TokenKit TV pack: spatial focus. No DOM: it works on plain items and their
   rectangles, so the same rules run in a test and on a screen.

     item = { key, rect: { x, y, w, h }, row, level, current }

   `row` groups tiles that sit in one line (a <tk-tv-row>); `level` is the part of the
   screen they belong to ('main', or 'menu' for the sidebar). The rules:

     left / right   stay in the line: the nearest item ahead whose box shares height
                    with the current one. At the end of a line nothing happens (no
                    wrap). With nothing ahead in this level, the move may cross into
                    another level (the sidebar beside the rows).
     up / down      the nearest line ahead in this level, then the item in it closest
                    across. Crossing levels up or down only reaches an item that
                    shares width with the current one (a bar above the rows), never a
                    sidebar item off to the side.
     memory         each row and each level keeps its last focus. Moving into another
                    row lands on that row's last focus; moving into another level
                    lands on that level's last focus, or the first time, on its
                    current item (the menu entry for the open page).
     back           returns to the level focus came from. With nowhere to go back to
                    it says so (returns false), and the host decides: nothing traps. */

export const r = (x, y, w, h) => ({ x, y, w, h });
/* A DOMRect (or anything with left / top / width / height) as { x, y, w, h }. */
export const rectOf = (b) => (b ? { x: b.x ?? b.left ?? 0, y: b.y ?? b.top ?? 0, w: b.w ?? b.width ?? 0, h: b.h ?? b.height ?? 0 } : null);

const H = (dir) => dir === 'left' || dir === 'right';
const overlap = (a, b, axis) => axis === 'y'
  ? Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5
  : Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5;
const cx = (a) => a.x + a.w / 2, cy = (a) => a.y + a.h / 2;

/* Is b ahead of a in this direction? By centres, and its far edge must be past a's. */
export function isAhead(a, b, dir) {
  switch (dir) {
    case 'right': return cx(b) > cx(a) + 1 && b.x + b.w > a.x + a.w;
    case 'left': return cx(b) < cx(a) - 1 && b.x < a.x;
    case 'down': return cy(b) > cy(a) + 1 && b.y + b.h > a.y + a.h;
    case 'up': return cy(b) < cy(a) - 1 && b.y < a.y;
    default: return false;
  }
}
/* The gap from a's leading edge to b's near edge (negative when they overlap). */
function gap(a, b, dir) {
  switch (dir) {
    case 'right': return b.x - (a.x + a.w);
    case 'left': return a.x - (b.x + b.w);
    case 'down': return b.y - (a.y + a.h);
    default: return a.y - (b.y + b.h);
  }
}
/* The nearest band ahead (items whose near edge is within half the current item of
   the nearest one), then the one closest across. */
function closest(a, pool, dir) {
  if (!pool.length) return null;
  const across = H(dir) ? (b) => Math.abs(cy(b.rect) - cy(a)) : (b) => Math.abs(cx(b.rect) - cx(a));
  const gaps = pool.map((b) => gap(a, b.rect, dir));
  const min = Math.min(...gaps), tol = Math.max(8, (H(dir) ? a.w : a.h) / 2);
  let best = null, bestA = Infinity, bestG = Infinity;
  pool.forEach((b, i) => {
    if (gaps[i] > min + tol) return;
    const d = across(b);
    if (d < bestA - 0.5 || (Math.abs(d - bestA) <= 0.5 && gaps[i] < bestG)) { best = b; bestA = d; bestG = gaps[i]; }
  });
  return best;
}

/* The item a move in `dir` lands on by geometry alone, or null. */
export function pickNext(from, items, dir) {
  if (!from?.rect || !H(dir) && dir !== 'up' && dir !== 'down') return null;
  const a = from.rect;
  const ahead = items.filter((i) => i !== from && i.key !== from.key && i.rect && (i.rect.w > 0 || i.rect.h > 0) && isAhead(a, i.rect, dir));
  const same = ahead.filter((i) => i.level === from.level), other = ahead.filter((i) => i.level !== from.level);
  let pool;
  if (H(dir)) {
    pool = same.filter((i) => overlap(a, i.rect, 'y'));
    if (!pool.length) { const lined = other.filter((i) => overlap(a, i.rect, 'y')); pool = lined.length ? lined : other; }
  } else {
    pool = same.length ? same : other.filter((i) => overlap(a, i.rect, 'x'));
  }
  return closest(a, pool, dir);
}

/* The navigator: moves, memory and back, over a host's own items.

     items()      the focusable items now, in reading order
     current()    the item that has focus, or null
     focus(item)  give it focus (the host scrolls it into view) */
export function createFocusNav({ items, current, focus }) {
  const rowLast = new Map(), levelLast = new Map();
  let stack = [];   // [{ level, key }]: where Back goes
  const find = (key, list = items()) => (key == null ? null : list.find((i) => i.key === key) ?? null);
  const firstOf = (level, list = items()) => list.find((i) => i.level === level) ?? null;
  const currentOf = (level, list = items()) => list.find((i) => i.level === level && i.current) ?? null;
  function remember(it) {
    if (!it) return;
    if (it.row != null) rowLast.set(it.row, it.key);
    if (it.level != null) levelLast.set(it.level, it.key);
  }
  function go(to, from) {
    if (!to) return null;
    if (from && to.level !== from.level) {
      const top = stack[stack.length - 1];
      if (top && top.level === to.level) stack.pop();          // going back the way focus came
      else stack.push({ level: from.level, key: from.key });
    }
    focus(to); remember(to);
    return to;
  }
  const nav = {
    move(dir) {
      const list = items(), cur = current();
      if (!cur) return go(firstOf('main', list) ?? list[0] ?? null, null);
      let to = pickNext(cur, list, dir);
      if (!to) return null;
      if (to.level !== cur.level) to = find(levelLast.get(to.level), list) ?? currentOf(to.level, list) ?? to;
      else if (!H(dir) && to.row != null && to.row !== cur.row) to = find(rowLast.get(to.row), list) ?? to;
      return go(to, cur);
    },
    /* Back to the level focus came from. False when there is none: the host's call. */
    back() {
      const list = items(), cur = current();
      while (stack.length) {
        const { level, key } = stack.pop();
        if (cur && level === cur.level) continue;
        const to = find(levelLast.get(level), list) ?? find(key, list) ?? firstOf(level, list);
        if (to) { focus(to); remember(to); return to; }
      }
      return false;
    },
    /* Into a level (menu opens the sidebar), remembering where focus was. */
    enter(level) {
      const list = items(), cur = current();
      if (cur && cur.level === level) return cur;
      const to = find(levelLast.get(level), list) ?? currentOf(level, list) ?? firstOf(level, list);
      return go(to, cur);
    },
    /* Home: the first item of the main level, with the way back forgotten. */
    home() {
      const to = firstOf('main');
      stack = [];
      if (to) { focus(to); remember(to); }
      return to;
    },
    remember,
    get depth() { return stack.length; },
    lastIn: (row) => rowLast.get(row) ?? null,
    reset() { rowLast.clear(); levelLast.clear(); stack = []; },
  };
  return nav;
}
