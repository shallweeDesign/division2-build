/**
 * 帳號按鈕 / The header's sign-in control: "Sign in with Google" when signed
 * out, the player's avatar, sync state and "Sign out" when signed in.
 *
 * One element per page, kept across header re-renders (a language switch
 * rebuilds the header) and redrawn whenever the sign-in state changes.
 * Renders nothing while Firebase is not configured.
 */
import { t } from '../i18n/index.ts';
import { cloudEnabled, cloudState, onCloudState, signIn, signOut } from '../cloud/sync.ts';
import type { CloudState } from '../cloud/sync.ts';
import { el } from './dom.ts';

const node = el('div', { class: 'account' });

function draw(s: CloudState) {
  if (!cloudEnabled()) { node.replaceChildren(); return; }
  switch (s.status) {
    case 'signed-out':
      node.replaceChildren(el('button', { class: 'ghost account-signin', type: 'button', onclick: () => { void signIn(); } }, [
        t('signIn'),
      ]));
      return;
    case 'loading':
      node.replaceChildren(el('span', { class: 'account-status' }, [t('syncing')]));
      return;
    case 'error':
      node.replaceChildren(
        el('span', { class: 'account-status error', title: s.error ?? '' }, [t('syncError')]),
        el('button', { class: 'ghost', type: 'button', onclick: () => { void signIn(); } }, [t('signIn')]),
      );
      return;
    case 'signed-in': {
      const u = s.user!;
      node.replaceChildren(
        el('span', { class: 'account-user', title: `${u.name} · ${u.email}\n${t('synced')}` }, [
          u.photo
            ? el('img', { src: u.photo, alt: '', referrerpolicy: 'no-referrer', width: 24, height: 24 })
            : el('span', { class: 'account-initial' }, [(u.name || u.email || '?').slice(0, 1).toUpperCase()]),
          el('span', { class: 'account-synced', 'aria-label': t('synced') }, ['✓']),
        ]),
        el('button', { class: 'ghost', type: 'button', onclick: () => { void signOut(); } }, [t('signOut')]),
      );
      return;
    }
    default:
      node.replaceChildren();
  }
}

onCloudState(draw);

/** The page's account element, redrawn for the current language. */
export function accountWidget(): HTMLElement {
  draw(cloudState());
  return node;
}
