/**
 * 燈箱 / A full-screen image viewer: one image at a time, its caption in
 * white on a translucent black band across the image's lower edge, and
 * previous / next through the whole set (buttons, ← →, or a swipe). Esc, the
 * × or a click on the backdrop closes it.
 */
import { t } from '../i18n/index.ts';
import { el } from './dom.ts';
import { lockScroll } from './scroll-lock.ts';

export interface LightboxItem { src: string; caption: string }

export function openLightbox(items: LightboxItem[], start: number) {
  if (!items.length) return;
  let i = Math.max(0, Math.min(start, items.length - 1));
  const unlock = lockScroll();

  const img = el('img', { class: 'lightbox-img', alt: '' });
  const caption = el('figcaption', { class: 'lightbox-caption' });
  const count = el('span', { class: 'lightbox-count' });
  const show = () => {
    const it = items[i]!;
    img.src = it.src;
    img.alt = it.caption;
    caption.textContent = it.caption;
    count.textContent = `${i + 1} / ${items.length}`;
  };
  const step = (d: number) => { i = (i + d + items.length) % items.length; show(); };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    unlock();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  };

  const nav = (d: number, label: string, glyph: string) => el('button', {
    type: 'button', class: `lightbox-nav ${d < 0 ? 'prev' : 'next'}`, 'aria-label': label,
    onclick: (e: Event) => { e.stopPropagation(); step(d); },
  }, [glyph]);

  const figure = el('figure', { class: 'lightbox-figure', onclick: (e: Event) => e.stopPropagation() }, [img, caption]);
  const overlay = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', onclick: close }, [
    figure,
    items.length > 1 ? nav(-1, t('lightboxPrev'), '‹') : null,
    items.length > 1 ? nav(1, t('lightboxNext'), '›') : null,
    el('button', { type: 'button', class: 'lightbox-close', 'aria-label': t('detailClose'), onclick: close }, ['×']),
    items.length > 1 ? count : null,
  ]);

  // A horizontal swipe on touch screens steps too.
  let x0: number | null = null;
  figure.addEventListener('touchstart', (e) => { x0 = e.touches[0]?.clientX ?? null; }, { passive: true });
  figure.addEventListener('touchend', (e) => {
    const x1 = e.changedTouches[0]?.clientX;
    if (x0 !== null && x1 !== undefined && Math.abs(x1 - x0) > 40) step(x1 < x0 ? 1 : -1);
    x0 = null;
  });

  show();
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
}
