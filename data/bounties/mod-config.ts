import { DamageType } from 'bungie-api-ts/destiny2';

// TODO: could draw icons... maybe after mods get redone
export enum ModEffect {
  None = 0, // Reserve 0
  // Standardized per-weapon mods
  Finder,
  Targeting,
  Dexterity,
  Loader,
  Reserves,
  Unflinching,
  Holster,
  Scavenger,
  Siphon,
  Scout,
  // More like effects that any mod can have
  Stat,
  Resistance,
  Super,
  ClassAbility,
  Grenade,
  Orbs,
  Finisher,
  Champion,
  ArmorCharge,
}

/** Interesting things about mods that we can't figure out from the translated defs */
export interface ModInfo {
  effects?: ModEffect[];
  element?: DamageType[]; // effects arc
  // element cost
  // modslot
  // raid
  // artifact mods
}

export const matchTable: {
  assign: ModInfo;
  name?: (string | RegExp)[];
  desc?: (string | RegExp)[];
  type?: (string | RegExp)[];
}[] = [
  {
    assign: { effects: [ModEffect.Finder] },
    name: ['Finder'],
  },
  {
    assign: { effects: [ModEffect.Targeting] },
    name: ['Targeting'],
  },
  {
    assign: { effects: [ModEffect.Dexterity] },
    name: ['Dexterity'],
  },
  {
    assign: { effects: [ModEffect.Loader] },
    name: ['Loader'],
  },
  {
    assign: { effects: [ModEffect.Reserves] },
    name: ['Reserves'],
  },
  {
    assign: { effects: [ModEffect.Siphon] },
    name: ['Siphon'],
  },
  {
    assign: { effects: [ModEffect.Scout] },
    name: ['Scout'],
  },
  {
    assign: { effects: [ModEffect.Unflinching] },
    name: ['Unflinching'],
  },
  {
    assign: { effects: [ModEffect.Holster] },
    name: ['Holster'],
  },
  {
    assign: { effects: [ModEffect.Scavenger] },
    name: ['Scavenger'],
  },

  {
    assign: { effects: [ModEffect.Resistance] },
    name: ['Resistance', 'Dampener'],
    desc: [/resistance/i],
  },
  {
    assign: { effects: [ModEffect.Super] },
    desc: ['Super'],
  },
  {
    assign: { effects: [ModEffect.Champion] },
    desc: ['Champion'],
  },
  {
    assign: { effects: [ModEffect.ClassAbility] },
    desc: [/class ability/i],
  },
  {
    assign: { effects: [ModEffect.Finisher] },
    desc: [/finisher/i],
  },
  {
    assign: { effects: [ModEffect.Grenade] },
    desc: [/grenade/i],
  },
  {
    assign: { effects: [ModEffect.Orbs] },
    desc: ['Orb of Power'],
  },
  {
    assign: { effects: [ModEffect.ArmorCharge] },
    desc: ['Armor Charge'],
  },
  {
    assign: { effects: [ModEffect.Stat] },
    desc: ['Intellect', 'Discipline', 'Strength', 'Resilience', 'Recovery', 'Mobility'],
  },

  {
    assign: { element: [DamageType.Arc] },
    desc: ['Arc'],
  },
  {
    assign: { element: [DamageType.Thermal] },
    desc: ['Solar'],
  },
  {
    assign: { element: [DamageType.Void] },
    desc: ['Void'],
  },
  {
    assign: { element: [DamageType.Stasis] },
    desc: ['Stasis'],
  },
  {
    assign: { element: [DamageType.Strand] },
    desc: ['Strand'],
  },
  {
    assign: { element: [DamageType.Kinetic] },
    desc: ['Kinetic'],
  },
];
