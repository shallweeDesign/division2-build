/**
 * 共用標題列 / The header both pages share: title, the page tabs, and actions.
 *
 * The pages are separate HTML files, so the tabs are plain links. They are
 * built from Vite's `BASE_URL` rather than relative paths, which keeps them
 * right under `/` in dev and `/lab/division2_builder/` once deployed.
 */
import { t } from '../i18n/index.ts';
import { el } from './dom.ts';
import { accountWidget } from './account.ts';

export type Page = 'build' | 'loot' | 'collectibles' | 'map' | 'talents';

const HREF: Record<Page, string> = {
  build: import.meta.env.BASE_URL,
  loot: `${import.meta.env.BASE_URL}loot/`,
  collectibles: `${import.meta.env.BASE_URL}collectibles/`,
  map: `${import.meta.env.BASE_URL}map/`,
  talents: `${import.meta.env.BASE_URL}talents/`,
};

export function renderHeader(header: HTMLElement, page: Page, actions: (Node | null)[]) {
  const tab = (target: Page, label: string) => el('a', {
    class: `tab${page === target ? ' active' : ''}`,
    href: HREF[target],
    'aria-current': page === target ? 'page' : undefined,
  }, [label]);
  header.replaceChildren(
    el('h1', {}, [t('title')]),
    el('nav', { class: 'tabs' }, [
      tab('build', t('navBuild')), tab('talents', t('navTalents')), tab('loot', t('navLoot')), tab('collectibles', t('navCollectibles')), tab('map', t('navMap')),
    ]),
    el('div', { class: 'header-actions' }, [...actions, accountWidget()]),
  );
}
