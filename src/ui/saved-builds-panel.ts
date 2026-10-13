/**
 * 我的配裝 / Save the build on screen under a name, and load, overwrite or
 * delete saved ones.
 *
 * Saved builds live in the player's data (`cloud/user-data.ts`): in this
 * browser always, and in their account once signed in, so they follow the
 * player to another browser. Loading goes through `sanitizeBuild`, so a build
 * saved before a data update cannot trip a panel over a removed item.
 */
import type { GameData } from '../model/types.ts';
import { sanitizeBuild } from '../model/build.ts';
import { lang, t } from '../i18n/index.ts';
import { MAX_BUILDS, newBuildId, updateUserData, userData } from '../cloud/user-data.ts';
import { cloudEnabled, cloudState } from '../cloud/sync.ts';
import { build, load } from './store.ts';
import { el } from './dom.ts';

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

/** The saved build last loaded or saved, so "Update" knows what to overwrite. */
let currentId: string | null = null;
/** A delete waiting for its second click. */
let confirming: string | null = null;

const when = (ms: number) => new Date(ms).toLocaleString(lang() === 'zh-tw' ? 'zh-TW' : 'en-GB', {
  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function renderSavedBuildsPanel(root: HTMLElement, data: GameData) {
  const saved = userData().builds;
  const current = saved.find((b) => b.id === currentId) ?? null;
  if (!current) currentId = null;
  const full = saved.length >= MAX_BUILDS;

  const name = el('input', {
    type: 'text', maxlength: 60, class: 'saved-name',
    placeholder: fill(t('savedNamePlaceholder'), { n: String(saved.length + 1) }),
    'aria-label': t('savedName'),
  });

  const saveNew = () => {
    const id = newBuildId();
    const label = name.value.trim() || fill(t('savedNamePlaceholder'), { n: String(saved.length + 1) });
    updateUserData((d) => {
      d.builds.unshift({ id, name: label, build: structuredClone(build()), updatedAt: Date.now() });
    });
    currentId = id;
    renderSavedBuildsPanel(root, data);
  };

  const overwrite = () => {
    if (!current) return;
    updateUserData((d) => {
      const b = d.builds.find((x) => x.id === current.id);
      if (b) { b.build = structuredClone(build()); b.updatedAt = Date.now(); }
    });
    renderSavedBuildsPanel(root, data);
  };

  const row = (b: (typeof saved)[number]) => el('li', { class: `saved-row${b.id === currentId ? ' current' : ''}` }, [
    el('span', { class: 'saved-row-name' }, [b.name, el('small', {}, [when(b.updatedAt)])]),
    el('button', {
      class: 'ghost', type: 'button',
      onclick: () => { currentId = b.id; confirming = null; load(sanitizeBuild(data, b.build)); renderSavedBuildsPanel(root, data); },
    }, [t('savedLoad')]),
    el('button', {
      class: `ghost saved-delete${confirming === b.id ? ' confirming' : ''}`, type: 'button',
      onclick: () => {
        if (confirming !== b.id) { confirming = b.id; renderSavedBuildsPanel(root, data); return; }
        confirming = null;
        if (currentId === b.id) currentId = null;
        updateUserData((d) => { d.builds = d.builds.filter((x) => x.id !== b.id); });
        renderSavedBuildsPanel(root, data);
      },
    }, [confirming === b.id ? t('savedConfirmDelete') : t('savedDelete')]),
  ]);

  const signedIn = cloudState().status === 'signed-in';
  root.replaceChildren(el('details', { class: 'panel saved-builds', open: saved.length > 0 || undefined }, [
    el('summary', {}, [el('h2', {}, [`${t('savedTitle')} (${saved.length})`])]),
    el('div', { class: 'saved-actions' }, [
      name,
      el('button', { class: 'ghost', type: 'button', disabled: full || undefined, onclick: saveNew }, [t('savedSaveNew')]),
      current
        ? el('button', { class: 'ghost', type: 'button', onclick: overwrite }, [fill(t('savedOverwrite'), { n: current.name })])
        : null,
    ]),
    full ? el('p', { class: 'muted' }, [fill(t('savedFull'), { n: String(MAX_BUILDS) })]) : null,
    saved.length
      ? el('ul', { class: 'saved-list' }, saved.map(row))
      : el('p', { class: 'muted' }, [t('savedEmpty')]),
    el('p', { class: 'muted saved-where' }, [
      signedIn ? t('savedWhereCloud') : cloudEnabled() ? t('savedWhereSignIn') : t('savedWhereLocal'),
    ]),
  ]));
}
