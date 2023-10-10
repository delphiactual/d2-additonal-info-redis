import { getAllDefs, getDef, loadLocal } from '@d2api/manifest-node';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { matchTable, ModEffect, ModInfo } from '../data/bounties/mod-config.js';
import { ItemCategoryHashes } from '../data/generated-enums.js';
import { writeFile } from './helpers.js';

type Ruleset = typeof matchTable[number];
type BountyMetadata = Ruleset['assign'];
type AssignmentCategory = keyof BountyMetadata;

loadLocal();

const inventoryItems = getAllDefs('InventoryItem');

const debug = true;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// collects mod->definition associations
const mods: Record<string, ModInfo> = {};

const accessors = {
  name: (item: DestinyInventoryItemDefinition) => item.displayProperties.name,
  desc: (item: DestinyInventoryItemDefinition) =>
    item.perks
      ?.flatMap((p) => {
        const perk = getDef('SandboxPerk', p.perkHash);
        return [perk?.displayProperties.description];
      })
      .join(' '),
  type: (item: DestinyInventoryItemDefinition) => item.itemTypeAndTierDisplayName,
};

const matchTypes = ['name', 'desc', 'type'] as const;

function assign(ruleset: Ruleset, mod: ModInfo) {
  Object.entries(ruleset.assign).forEach(([assignTo, assignValues]) => {
    //:[keyof typeof ruleset,number[]]
    // add these values to the bounty's attributes
    const assignTo_ = assignTo as AssignmentCategory;
    mod[assignTo_] = [...new Set([...(mod[assignTo_] ?? []), ...(assignValues ?? [])])];
  });
}

// loop through the manifest's bounties
for (const inventoryItem of inventoryItems) {
  // filter loops through acceptable categories -- includes loops through item's hashes
  if (
    !inventoryItem.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods) ||
    !inventoryItem.itemTypeAndTierDisplayName.includes('Mod') ||
    inventoryItem.itemTypeAndTierDisplayName.includes('Deprecated') ||
    inventoryItem.itemTypeAndTierDisplayName.includes('Empty') ||
    inventoryItem.displayProperties.name.includes('Empty') ||
    inventoryItem.displayProperties.description.includes('deprecated')
  ) {
    continue;
  }

  // normalize bounty's available data

  const thisMod: ModInfo = {};
  // loop through matching conditions
  for (const ruleset of matchTable) {
    // match against strings or regexen
    for (const matchType of matchTypes) {
      ruleset[matchType]?.forEach((match) => {
        // convert regex||string to regex
        match = match instanceof RegExp ? match : new RegExp(escapeRegExp(match));

        // and run the regex
        const stringToTest = accessors[matchType](inventoryItem);
        if (stringToTest && match.test(stringToTest)) {
          assign(ruleset, thisMod);
        }
      });
    }
  }

  if (Object.keys(thisMod).length > 0) {
    mods[inventoryItem.hash] = thisMod;
  } else {
    // These bounties won't show up in pursuits.json
    if (debug) {
      console.log('Skipped: ' + inventoryItem.displayProperties.name);
    }
  }

  if (debug) {
    console.log({
      ...thisMod,
      hash: inventoryItem.hash,
      name: accessors.name(inventoryItem),
      desc: accessors.desc(inventoryItem),
      type: accessors.type(inventoryItem),
      effects: thisMod.effects?.map((e) => ModEffect[e]),
    });
  }
}

writeFile('./output/mods.json', mods, true);
