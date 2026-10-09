/**
 * Wake a page the way a visitor does, before measuring it.
 *
 * Many sites hold scripts back until someone interacts (WP Rocket's "delay
 * JavaScript", for one) and load iframes only as they scroll into view. A
 * page opened by a tool and scrolled by script never sees either, so its
 * sliders sit uninitialised and its embedded forms stay blank. This moves
 * the mouse, presses a key, scrolls with the wheel to the bottom and back,
 * and waits for the network to settle.
 *
 * Interaction often brings up a cookie consent banner, which then covers
 * the content. It is recorded (its text and buttons, for the audit) and
 * declined: the most private choice, and the one that leaves the page as
 * someone who said no would see it.
 */

const CONSENT_SCOPE = /cookie|consent|gdpr|privacy|onetrust|cmp|cky|iubenda|termly|osano/i;
const DECLINE = /^(decline all|reject all|decline|reject|reject non-essential|necessary only|only necessary|deny)$/i;

/* Network quiet that means it: Playwright's own "networkidle" fires once per
   load, so content that starts loading later (a lazy iframe, a form inside
   it) would never be waited for. This counts requests in flight, frames'
   included, and waits for none for `idle` ms, up to `max`. */
async function quiet(page, { idle = 900, max = 12000 } = {}) {
  let inflight = 0;
  let last = Date.now();
  const up = () => {
    inflight++;
    last = Date.now();
  };
  const down = () => {
    inflight = Math.max(0, inflight - 1);
    last = Date.now();
  };
  page.on("request", up);
  page.on("requestfinished", down);
  page.on("requestfailed", down);
  return async () => {
    const start = Date.now();
    while (Date.now() - start < max) {
      if (inflight === 0 && Date.now() - last > idle) break;
      await page.waitForTimeout(150);
    }
    page.off("request", up);
    page.off("requestfinished", down);
    page.off("requestfailed", down);
  };
}

export async function wake(page, { settle = 1500 } = {}) {
  const settled = await quiet(page);
  await page.mouse.move(120, 160);
  await page.mouse.move(420, 320);
  await page.keyboard.press("Shift").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  /* Wheel to the bottom a viewport at a time, so lazy content loads as it would. */
  const view = page.viewportSize()?.height || 900;
  for (let i = 0; i < 60; i++) {
    const done = await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4);
    if (done) break;
    await page.mouse.wheel(0, view * 0.9);
    await page.waitForTimeout(220);
  }
  /* Every frame finished, and the network quiet, before anything is measured. */
  await Promise.all(page.frames().map((f) => f.waitForLoadState("load", { timeout: 10000 }).catch(() => {})));
  await settled();
  await page.waitForTimeout(settle);

  const consent = await declineConsent(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  return { consent };
}

/** Find a visible consent banner, note what it says, and press its decline button. */
export async function declineConsent(page) {
  const found = await page.evaluate(
    ({ scope, decline }) => {
      const scopeRe = new RegExp(scope, "i");
      const declineRe = new RegExp(decline, "i");
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none";
      };
      /* Consent tools draw their buttons as anything: a div with an id is common. */
      const buttons = [
        ...document.querySelectorAll(
          "button, a, [role=button], input[type=button], input[type=submit], [id*=reject i], [id*=decline i], [class*=reject i], [class*=decline i]",
        ),
      ].filter(visible);
      for (const b of buttons) {
        const label = (b.innerText || b.value || b.getAttribute("aria-label") || "").trim();
        if (!declineRe.test(label)) continue;
        let box = b;
        let inScope = false;
        for (let i = 0; i < 8 && box; i++, box = box.parentElement) {
          const tag = `${box.id} ${typeof box.className === "string" ? box.className : ""} ${box.getAttribute("role") || ""} ${box.getAttribute("aria-label") || ""}`;
          if (scopeRe.test(tag) || box.getAttribute("role") === "dialog") {
            inScope = true;
            break;
          }
        }
        if (!inScope) continue;
        const banner = box || b.parentElement;
        b.setAttribute("data-wake-decline", "");
        return {
          text: (banner.innerText || "").replace(/\s+/g, " ").trim().slice(0, 400),
          buttons: [...banner.querySelectorAll("button, a")].map((x) => (x.innerText || "").trim()).filter(Boolean).slice(0, 8),
          declinedWith: label,
        };
      }
      return null;
    },
    { scope: CONSENT_SCOPE.source, decline: DECLINE.source },
  );
  if (!found) return null;
  await page.click("[data-wake-decline]", { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(600);
  return found;
}
