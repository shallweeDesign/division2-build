/** 極小 DOM 輔助 / Minimal element helpers, enough to avoid a framework. */
type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') node.className = String(v);
    else node.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined) node.append(c as Node | string);
  return node;
}

export function clear(node: HTMLElement) {
  node.replaceChildren();
}

/** A labelled `<select>`; `options` are [value, label] pairs. */
export function select(
  value: string | null,
  options: [string, string][],
  onChange: (v: string) => void,
  placeholder?: string,
): HTMLSelectElement {
  const s = el('select', { onchange: (e) => onChange((e.target as HTMLSelectElement).value) });
  if (placeholder !== undefined) s.append(el('option', { value: '' }, [placeholder]));
  for (const [v, label] of options) {
    s.append(el('option', { value: v, selected: v === value }, [label]));
  }
  s.value = value ?? '';
  return s;
}
