/**
 * 鎖定捲動 / Stop the page scrolling behind a popup. Counted, so a lightbox
 * opened over a dialog unlocks only when the last one closes. Both html and
 * body are set, since mobile Safari scrolls whichever one the other misses.
 */
let locks = 0;

export function lockScroll(): () => void {
  if (locks++ === 0) {
    document.documentElement.classList.add('scroll-locked');
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--locks === 0) document.documentElement.classList.remove('scroll-locked');
  };
}
