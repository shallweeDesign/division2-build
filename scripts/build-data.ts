/**
 * CSV → 正規化 JSON / Normalises the div2hub/game-data CSVs into typed GameData.
 *
 * The upstream schema (data/README.md) forbids empty cells and registers every
 * legitimate hole in known_gaps.json with an expiry date. This script enforces
 * that contract: unregistered or expired gaps, unknown slot syntax and dangling
 * ids all fail the build rather than producing a quietly wrong calculator.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AttributeDef, AttributeSlotSpec, Augment, BonusEntry, Category, GameData, GearItem,
  GearSlot, SetDef, SetTier, SkillVariant, Stat, Talent, Value, Weapon, WeaponMod, WeaponModSlot,
} from '../src/model/types.ts';
import { GEAR_SLOTS, WEAPON_MOD_CATEGORIES } from '../src/model/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'src/data/generated');

const problems: string[] = [];
const notes: string[] = [];
const fail = (msg: string) => problems.push(msg);

/** Minimal RFC4180 parser — descriptions contain quoted commas and newlines. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const header = rows.shift();
  if (!header) throw new Error('empty CSV');
  return rows
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const read = (rel: string) => parseCsv(readFileSync(join(DATA, rel), 'utf8'));

const NA = (v: string) => v === 'N/A' || v === '';

/** `12%` → percent 12; `4925` → flat 4925. */
function parseValue(raw: string, where: string): Value | null {
  if (NA(raw)) return null;
  const percent = raw.endsWith('%');
  const n = Number(raw.replace(/[%,]/g, ''));
  if (!Number.isFinite(n)) { fail(`${where}: cannot parse value "${raw}"`); return null; }
  return { n, percent };
}

// ── known gaps ────────────────────────────────────────────────────────────────
interface Gap { file: string; name: string; columns: string[] }
const today = new Date().toISOString().slice(0, 10);
const gapIndex = new Map<string, string>(); // `${file}|${name}|${column}` → reason

for (const entry of JSON.parse(readFileSync(join(DATA, 'known_gaps.json'), 'utf8')) as
  { reason: string; expires: string; gaps: Gap[] }[]) {
  const expired = entry.expires < today;
  for (const g of entry.gaps) {
    for (const col of g.columns) {
      if (expired) fail(`known gap expired ${entry.expires}: ${g.file} "${g.name}" column ${col} — fill it or extend the deadline upstream`);
      else gapIndex.set(`${g.file}|${g.name}|${col}`, entry.reason);
    }
  }
  if (!expired) notes.push(`${entry.reason} (until ${entry.expires})`);
}

/** Empty cells are only legal when registered as a known gap. */
function cell(row: Record<string, string>, col: string, file: string, nameCol = 'name'): string {
  const v = row[col] ?? '';
  if (v !== '') return v;
  const name = row[nameCol] ?? '?';
  if (gapIndex.has(`${file}|${name}|${col}`) || gapIndex.has(`${file}|@all|${col}`)) return '';
  fail(`${file}: "${name}" has an empty ${col} that is not registered in known_gaps.json`);
  return '';
}

// ── attribute slot syntax ─────────────────────────────────────────────────────
/**
 * Parse a `core_N` / `minor_N` / `mod_N` cell.
 * `type:<slug>|!<id>|!<id>` selectable, `fixed:<id>[:<value>]` locked, `N/A` absent.
 */
function parseSlot(raw: string, where: string, attrIds: Set<string>): AttributeSlotSpec {
  if (NA(raw)) return { mode: 'none' };

  if (raw.startsWith('type:')) {
    const [head, ...rest] = raw.split('|');
    const exclude = rest.map((r) => r.replace(/^!/, ''));
    for (const id of exclude) if (!attrIds.has(id)) fail(`${where}: excludes unknown attribute "${id}"`);
    return { mode: 'choice', slug: head!.slice(5), exclude };
  }

  if (raw.startsWith('fixed:')) {
    // `fixed:<id>` or `fixed:<id>:<value>` — the value may itself contain no colon.
    const rest = raw.slice(6);
    const cut = rest.lastIndexOf(':');
    const hasValue = cut > 0 && /^[-+0-9]/.test(rest.slice(cut + 1));
    const attributeId = hasValue ? rest.slice(0, cut) : rest;
    const value = hasValue ? parseValue(rest.slice(cut + 1), where) : null;
    if (!attrIds.has(attributeId)) fail(`${where}: fixed references unknown attribute "${attributeId}"`);
    return { mode: 'fixed', attributeId, value };
  }

  fail(`${where}: unrecognised slot syntax "${raw}"`);
  return { mode: 'none' };
}

// ── attributes & stats ────────────────────────────────────────────────────────
const CATEGORIES = new Set(['offensive', 'defensive', 'skill']);

function attributeDefs(file: string): AttributeDef[] {
  return read(file).map((r, i) => {
    const where = `${file} row ${i + 2} (${r['id']})`;
    const category = r['category'] ?? '';
    if (!CATEGORIES.has(category)) fail(`${where}: unknown category "${category}"`);
    return {
      id: r['id'] ?? '',
      statId: r['stat_id'] ?? '',
      min: parseValue(r['range_min'] ?? '', where) ?? { n: 0, percent: false },
      max: parseValue(r['range_max'] ?? '', where) ?? { n: 0, percent: false },
      protoMax: parseValue(r['proto_max'] ?? 'N/A', where),
      compatibility: NA(r['compatibility'] ?? '') ? [] : (r['compatibility'] ?? '').split('|'),
      category: category as Category,
      fidelity: parseValue(r['fidelity'] ?? 'N/A', where),
    };
  });
}

// ── set bonuses ───────────────────────────────────────────────────────────────
/** `stat:<id>:<value>|stat:...` or `talent:<name>` or `N/A`. */
function parseBonus(raw: string, where: string, statIds: Set<string>): BonusEntry[] {
  if (NA(raw)) return [];
  const out: BonusEntry[] = [];
  for (const part of raw.split('|')) {
    if (part.startsWith('talent:')) { out.push({ kind: 'talent', name: part.slice(7) }); continue; }
    if (part.startsWith('stat:')) {
      const rest = part.slice(5);
      const cut = rest.lastIndexOf(':');
      if (cut < 0) { fail(`${where}: stat bonus missing value → "${part}"`); continue; }
      const statId = rest.slice(0, cut);
      if (!statIds.has(statId)) fail(`${where}: unknown stat id "${statId}"`);
      const value = parseValue(rest.slice(cut + 1), where);
      if (value) out.push({ kind: 'stat', statId, value });
      continue;
    }
    fail(`${where}: unrecognised bonus syntax "${part}"`);
  }
  return out;
}

function setDefs(file: string, kind: 'brand' | 'gearset', maxPieces: number, statIds: Set<string>): SetDef[] {
  return read(file).map((r, i) => {
    const where = `${file} row ${i + 2} (${r['name']})`;
    const tiers: SetTier[] = [];
    for (let p = 1; p <= maxPieces; p++) {
      const entries = parseBonus(r[`${p}pc_bonus`] ?? 'N/A', `${where} ${p}pc`, statIds);
      if (entries.length) tiers.push({ pieces: p, entries });
    }
    // Gear sets grant nothing for a single piece. A brand with no bonuses at all
    // is legal — `Improvised` is crafted gear that belongs to no real brand.
    if (kind === 'gearset' && tiers.some((t) => t.pieces === 1)) fail(`${where}: gear set has a 1-piece bonus`);
    const core = r['default_core_stat_id'] ?? '';
    if (!NA(core) && !statIds.has(core)) fail(`${where}: unknown default_core_stat_id "${core}"`);
    return { name: r['name'] ?? '', kind, defaultCoreStatId: NA(core) ? null : core, tiers };
  });
}

// ── gear ──────────────────────────────────────────────────────────────────────
const SLOT_FILE: Record<GearSlot, string> = {
  mask: 'gear/masks.csv', chest: 'gear/chests.csv', backpack: 'gear/backpacks.csv',
  gloves: 'gear/gloves.csv', holster: 'gear/holsters.csv', knees: 'gear/knees.csv',
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const bool = (v: string, where: string) => {
  if (v === 'TRUE') return true;
  if (v === 'FALSE') return false;
  fail(`${where}: expected TRUE/FALSE, got "${v}"`);
  return false;
};

function parseTalentSlot(raw: string, where: string, talentNames: Set<string>, slugs: Set<string>) {
  if (NA(raw)) return null;
  if (raw.startsWith('fixed:')) {
    const name = raw.slice(6);
    if (!talentNames.has(name)) fail(`${where}: fixed talent "${name}" is not in the talents CSV`);
    return { mode: 'fixed' as const, name };
  }
  if (raw.startsWith('type:')) return { mode: 'choice' as const, slug: raw.slice(5) };
  // Bare compatibility slugs appear on gear (`chest`, `backpack`).
  if (slugs.has(raw)) return { mode: 'choice' as const, slug: raw };
  if (talentNames.has(raw)) return { mode: 'fixed' as const, name: raw };
  fail(`${where}: unrecognised talent slot "${raw}"`);
  return null;
}

function gearItems(attrIds: Set<string>, setNames: Set<string>, talentNames: Set<string>, talentSlugs: Set<string>) {
  const gear = {} as Record<GearSlot, GearItem[]>;
  for (const slot of GEAR_SLOTS) {
    const file = SLOT_FILE[slot];
    gear[slot] = read(file).map((r, i) => {
      const name = r['name'] ?? '';
      const where = `${file} row ${i + 2} (${name})`;
      const brandSet = NA(r['brand_set'] ?? '') ? null : r['brand_set']!;
      const gearSet = NA(r['gear_set'] ?? '') ? null : r['gear_set']!;
      if (brandSet && gearSet) fail(`${where}: belongs to both a brand and a gear set`);
      for (const s of [brandSet, gearSet]) if (s && !setNames.has(s)) fail(`${where}: unknown set "${s}"`);

      const slots = (prefix: string) =>
        [1, 2, 3]
          .map((n) => parseSlot(cell(r, `${prefix}_${n}`, file), `${where} ${prefix}_${n}`, attrIds))
          .filter((s) => s.mode !== 'none');

      return {
        id: `${slot}-${slug(name)}`,
        name,
        slot,
        brandSet,
        gearSet,
        isNamed: bool(r['is_named'] ?? '', `${where} is_named`),
        isExotic: bool(r['is_exotic'] ?? '', `${where} is_exotic`),
        cores: slots('core'),
        minors: slots('minor'),
        mods: slots('mod'),
        talent: parseTalentSlot(r['talent_slot'] ?? 'N/A', `${where} talent_slot`, talentNames, talentSlugs),
      } satisfies GearItem;
    });
  }
  return gear;
}

// ── weapon mods ───────────────────────────────────────────────────────────────
/**
 * `stats` is a `|`-separated list of `stat-id:value`, and a value may be
 * negative — a long scope buys headshot damage with reload speed.
 */
function weaponMods(statIds: Set<string>): WeaponMod[] {
  const file = 'weapons/weapon_mods.csv';
  return read(file).map((r, i) => {
    const name = r['name'] ?? '';
    const where = `${file} row ${i + 2} (${name})`;
    const category = cell(r, 'category', file);
    if (!(WEAPON_MOD_CATEGORIES as readonly string[]).includes(category)) {
      fail(`${where}: unknown category "${category}"`);
    }
    const compatibility = NA(r['compatibility'] ?? '') ? [] : (r['compatibility'] ?? '').split('|');
    const raw = cell(r, 'stats', file);
    const stats = NA(raw) ? [] : raw.split('|').map((part) => {
      const cut = part.indexOf(':');
      if (cut < 0) { fail(`${where}: stat "${part}" is missing its value`); return null; }
      const statId = part.slice(0, cut).trim();
      if (!statIds.has(statId)) fail(`${where}: unknown stat "${statId}"`);
      const value = parseValue(part.slice(cut + 1).trim(), `${where} ${statId}`);
      if (!value) { fail(`${where}: stat "${statId}" has no readable value`); return null; }
      return { statId, value };
    }).filter((x): x is { statId: string; value: Value } => x !== null);
    return { name, category: category as WeaponMod['category'], compatibility, stats };
  });
}

// ── weapons ───────────────────────────────────────────────────────────────────
const WEAPON_FILES: [string, string][] = [
  ['weapons/assault_rifles.csv', 'Assault Rifle'], ['weapons/lmgs.csv', 'LMG'],
  ['weapons/mmrs.csv', 'Marksman Rifle'], ['weapons/pistols.csv', 'Pistol'],
  ['weapons/rifles.csv', 'Rifle'], ['weapons/shotguns.csv', 'Shotgun'], ['weapons/smgs.csv', 'SMG'],
];

function weapons(attrIds: Set<string>, talentNames: Set<string>, modNames: Set<string>): Weapon[] {
  const out: Weapon[] = [];
  for (const [file, weaponType] of WEAPON_FILES) {
    read(file).forEach((r, i) => {
      const name = r['name'] ?? '';
      const where = `${file} row ${i + 2} (${name})`;
      const slotType = r['slot_type'] ?? '';
      if (slotType !== 'main' && slotType !== 'sidearm') fail(`${where}: unknown slot_type "${slotType}"`);
      const numOrNull = (col: string) => {
        const v = cell(r, col, file);
        if (v === '') return null;
        const n = Number(v.replace(/[,%]/g, ''));
        if (!Number.isFinite(n)) { fail(`${where}: ${col} is not a number → "${v}"`); return null; }
        return n;
      };
      const slots = (prefix: string) =>
        [1, 2, 3]
          .map((n) => parseSlot(cell(r, `${prefix}_${n}`, file), `${where} ${prefix}_${n}`, attrIds))
          .filter((s) => s.mode !== 'none');

      out.push({
        id: slug(`${weaponType}-${name}`),
        name,
        slotType: slotType === 'sidearm' ? 'sidearm' : 'main',
        weaponType,
        family: r['family'] ?? '',
        isNamed: bool(r['is_named'] ?? '', `${where} is_named`),
        isExotic: bool(r['is_exotic'] ?? '', `${where} is_exotic`),
        baseDamage: numOrNull('base_damage'),
        rpm: numOrNull('base_rpm'),
        magSize: numOrNull('base_mag_size'),
        reloadTime: numOrNull('base_reload_time'),
        optimalRange: numOrNull('optimal_range'),
        headshotDamage: parseValue(cell(r, 'hsd', file) || 'N/A', `${where} hsd`),
        cores: slots('core'),
        minors: slots('minor'),
        talent: parseTalentSlot(r['talent_slot'] ?? 'N/A', `${where} talent_slot`, talentNames, new Set()),
        mods: WEAPON_MOD_CATEGORIES.flatMap((category): WeaponModSlot[] => {
          const raw = r[category] ?? '';
          if (NA(raw)) return [];
          if (raw.startsWith('type:')) return [{ category, mode: 'choice', slug: raw.slice(5) }];
          if (raw.startsWith('fixed:')) {
            // One row ships a leading space before the part name.
            const modName = raw.slice(6).trim();
            if (!modNames.has(modName)) fail(`${where} ${category}: unknown mod "${modName}"`);
            return [{ category, mode: 'fixed', name: modName }];
          }
          fail(`${where} ${category}: expected "type:<slug>" or "fixed:<name>", got "${raw}"`);
          return [];
        }),
      });
    });
  }
  return out;
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  const stats: Stat[] = read('stats.csv').map((r) => ({
    id: r['id'] ?? '', name: r['name'] ?? '',
    valueFormats: NA(r['value_formats'] ?? '') ? [] : (r['value_formats'] ?? '').split('|'),
  }));
  const statIds = new Set(stats.map((s) => s.id));

  const attributes = attributeDefs('attributes.csv');
  const gearMods = attributeDefs('gear/gear_mods.csv');
  for (const a of [...attributes, ...gearMods]) {
    if (!statIds.has(a.statId)) fail(`attribute "${a.id}" references unknown stat "${a.statId}"`);
  }
  const attrIds = new Set([...attributes, ...gearMods].map((a) => a.id));

  const talentRows = (file: string): Talent[] =>
    read(file).map((r) => ({
      name: r['name'] ?? '',
      compatibility: NA(r['compatibility'] ?? '') ? [] : (r['compatibility'] ?? '').split('|'),
      description: r['description'] ?? '',
    }));
  const gearTalents = talentRows('gear/gear_talents.csv');
  const weaponTalents = talentRows('weapons/weapon_talents.csv');
  const wMods = weaponMods(new Set(stats.map((s) => s.id)));
  const gearTalentSlugs = new Set(gearTalents.flatMap((t) => t.compatibility));

  const sets = [
    ...setDefs('gear/brand_sets.csv', 'brand', 3, statIds),
    ...setDefs('gear/gear_sets.csv', 'gearset', 4, statIds),
  ];
  const setNames = new Set(sets.map((s) => s.name));

  const allTalents = new Set([...gearTalents, ...weaponTalents].map((t) => t.name));
  const gear = gearItems(attrIds, setNames, allTalents, gearTalentSlugs);

  // Every set must actually be wearable, and every worn set must exist.
  const worn = new Set<string>();
  for (const slot of GEAR_SLOTS) for (const it of gear[slot]) { if (it.brandSet) worn.add(it.brandSet); if (it.gearSet) worn.add(it.gearSet); }
  for (const s of sets) if (!worn.has(s.name)) fail(`set "${s.name}" has bonuses but no items`);

  const skills: SkillVariant[] = read('skills/skills.csv').map((r) => ({ name: r['name'] ?? '', skill: r['skill'] ?? '' }));
  const augments: Augment[] = read('augments.csv').map((r, i) => ({
    name: r['name'] ?? '',
    description: r['description'] ?? '',
    min: parseValue(r['min_value'] ?? 'N/A', `augments.csv row ${i + 2}`),
    max: parseValue(r['max_value'] ?? 'N/A', `augments.csv row ${i + 2}`),
  }));

  if (problems.length) {
    console.error(`\n✗ 資料驗證失敗 / data validation failed — ${problems.length} problem(s):\n`);
    for (const p of problems.slice(0, 40)) console.error(`  • ${p}`);
    if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
    process.exit(1);
  }

  const meta = JSON.parse(readFileSync(join(DATA, 'SOURCE.json'), 'utf8'));
  meta.knownGaps = notes;
  const data: GameData = {
    meta, stats, attributes, gearMods, sets, gearTalents, weaponTalents,
    weaponMods: wMods,
    gear, weapons: weapons(attrIds, allTalents, new Set(wMods.map((m) => m.name))), skills, augments,
  };

  if (problems.length) {
    console.error(`\n✗ 武器資料驗證失敗 / weapon validation failed:\n`);
    for (const p of problems.slice(0, 40)) console.error(`  • ${p}`);
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'game-data.json'), JSON.stringify(data));

  console.log(`✓ gear: ${GEAR_SLOTS.map((s) => `${s} ${data.gear[s].length}`).join(', ')}`);
  console.log(`✓ ${sets.filter((s) => s.kind === 'brand').length} brands, ${sets.filter((s) => s.kind === 'gearset').length} gear sets`);
  console.log(`✓ ${stats.length} stats, ${attributes.length} attributes, ${gearMods.length} gear mods`);
  console.log(`✓ ${gearTalents.length} gear talents, ${weaponTalents.length} weapon talents`);
  console.log(`✓ ${data.weapons.length} weapons, ${wMods.length} weapon mods, ${skills.length} skill variants, ${augments.length} augments`);
  for (const n of notes) console.warn(`⚠ 已知缺口 / known gap: ${n}`);
}

main();
