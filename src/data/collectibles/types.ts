/**
 * 收集品資料格式 / The shape every collection on the collectibles page shares.
 *
 * A collection is one mission's hunt: its items in route order, grouped into
 * stages for scanning. Progress is stored per collection id as the ticked
 * item numbers (`cloud/user-data.ts`), so `id` and each item's `n` must never
 * change once published.
 */

export interface Bilingual { zh: string; en: string }

/** What an item is, which decides how its number is shown. */
export type ItemKind = 'collectible' | 'echo' | 'trophy' | 'key';

export interface CollectItem {
  /** Stable number within the collection; also the screenshot file name. */
  n: number;
  kind?: ItemKind;
  /** The guide's name for it. */
  en: string;
  zh: string;
  /** Where to look, in our words. */
  where: string;
  /** Anything that makes it harder than "walk up and grab it". */
  tip?: string;
}

export interface CollectStage extends Bilingual { items: CollectItem[] }

export interface Collection {
  /** Hash route and progress key. */
  id: string;
  tab: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  /** Mission type, e.g. incursion or raid. */
  type: Bilingual;
  /** What finishing it gives you. */
  reward: Bilingual;
  /** Guides the items link into, credited under the list with `source`. */
  guides: { name: string; url: string }[];
  source: Bilingual;
  /** Rules for the whole hunt, Chinese only (English readers get the guide). */
  rules: string[];
  stages: CollectStage[];
  /** Link to the guide section covering this item. */
  link: (item: CollectItem) => string;
}

export const itemsOf = (c: Collection) => c.stages.flatMap((s) => s.items);
