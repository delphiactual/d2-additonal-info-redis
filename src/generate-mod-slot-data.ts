import { getAllDefs, getDef, loadLocal } from '@d2api/manifest-node';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import stringifyObject from 'stringify-object';
import { D2CalculatedSeason } from './generate-season-info.js';
import { writeFile } from './helpers.js';

loadLocal();

const inventoryItems = getAllDefs('InventoryItem');

const namedSeasonExceptions: Record<number, string> = {
  420: 'outlaw',
  430: 'forge',
  450: 'opulence',
  460: 'maverick',
};

// pre-generate a table using an assumption based on existing pattern of plugCategoryIdentifier names
const seasonNumberByPlugCategoryIdentifier: Record<string, number> = {};
for (let season = 4; season <= D2CalculatedSeason; season++) {
  seasonNumberByPlugCategoryIdentifier[getSeasonID(season)] = season;
}

interface ModSocketMetadata {
  /** The season a mod was released in. This allows us to sort mods chronologically for LO purposes. */
  season: number;
  /** we use these two to match with search filters */
  tag: string;
  compatibleTags: string[];
  /** an item's socket's socketTypeHash is used to look up ModSocketMetadata */
  socketTypeHash: number;
  /**
   * mods don't inherently point back to their compatible slot,
   * they just have a plugCategoryHash.
   * a socket points to a socketType which refers to multiple plugCategoryHashes
   * so here is a more direct way, if you have a plugCategoryHash,
   * to find ModSocketMetadata without doing definition lookups and finds
   */
  plugCategoryHashes: number[];
  /**
   * hashes are used for faster lookups in loadout organizer,
   * they correspond directly to info found inside individual mod
   */
  compatiblePlugCategoryHashes: number[];
  /** this helps us look up the "empty socket" definition, for its icon/name */
  emptyModSocketHash: number;
}

const seasonalPlugCategoryIdentifier = 'enhancements.season_';

const emptySeasonalModSockets = inventoryItems.filter(
  (item) =>
    item.displayProperties.name === 'Empty Mod Socket' &&
    item.plug!.plugCategoryIdentifier.startsWith(seasonalPlugCategoryIdentifier)
);

const modMetadatas: ModSocketMetadata[] = emptySeasonalModSockets
  .map((emptyModSocket) => {
    // this socket type's itemTypeDisplayName
    const itemTypeDisplayName = emptyModSocket.itemTypeDisplayName;

    // the season associated with this mod slot
    const season =
      seasonNumberByPlugCategoryIdentifier[emptyModSocket.plug!.plugCategoryIdentifier];

    // a short name for the season
    const tag = seasonTagFromMod(emptyModSocket);

    // an example armor piece that has this empty socket
    const exampleArmorSocketEntry = findExampleSocketByEmptyModHash(emptyModSocket.hash);
    if (!exampleArmorSocketEntry) {
      return undefined;
    }
    // all mods that could go into this empty mod socket
    const compatibleTags = arrayUniq(
      getDef('PlugSet', exampleArmorSocketEntry?.reusablePlugSetHash)?.reusablePlugItems.map(
        (plugItem) => seasonTagFromMod(getDef('InventoryItem', plugItem.plugItemHash)!)
      ) || []
    );

    // this emptyModSocket's socketType
    const socketTypeHash = exampleArmorSocketEntry.socketTypeHash;

    // plugCategoryHashes whose native slot is this one
    const plugCategoryHashes = arrayUniq(
      inventoryItems
        .filter((item) => item.itemTypeDisplayName === itemTypeDisplayName)
        .map((item) => item.plug?.plugCategoryHash || 0)
        .filter(Boolean)
    );

    // plugCategoryHashes supported by this SocketType
    const compatiblePlugCategoryHashes = getDef('SocketType', socketTypeHash)!.plugWhitelist.map(
      (plugType) => plugType.categoryHash
    );

    return {
      season,
      tag,
      compatibleTags,
      socketTypeHash,
      plugCategoryHashes,
      compatiblePlugCategoryHashes,
      emptyModSocketHash: emptyModSocket.hash,
    };
  })
  .filter(Boolean) as ModSocketMetadata[];
modMetadatas.sort((mod1, mod2) => mod1.season - mod2.season);

const seasonNameOrder = modMetadatas.map((m) => m.tag);
modMetadatas.forEach((m) => {
  m.compatiblePlugCategoryHashes.sort();
  m.plugCategoryHashes.sort();
  m.compatibleTags.sort(
    (tag1, tag2) => seasonNameOrder.indexOf(tag1) - seasonNameOrder.indexOf(tag2)
  );
});

function findExampleSocketByEmptyModHash(emptyModSocketHash: number) {
  return inventoryItems
    .find((item) =>
      item.sockets?.socketEntries.find(
        (socket) => socket.singleInitialItemHash === emptyModSocketHash
      )
    )
    ?.sockets?.socketEntries.find((socket) => socket.singleInitialItemHash === emptyModSocketHash);
}

const pretty = `
export interface ModSocketMetadata {
  /** this allows us to sort mods chronologically for LO purposes */
  season: number;
  /** we use these two to match with search filters */
  tag: string;
  compatibleTags: string[];
  /** an item's socket's socketTypeHash is used to look up ModSocketMetadata */
  socketTypeHash: number;
  /**
   * mods don't inherently point back to their compatible slot,
   * they just have a plugCategoryHash.
   * a socket points to a socketType which refers to multiple plugCategoryHashes
   * so here is a more direct way, if you have a plugCategoryHash,
   * to find ModSocketMetadata without doing definition lookups and finds
   */
  plugCategoryHashes: number[];
  /**
   * hashes are used for faster lookups in loadout organizer,
   * they correspond directly to info found inside individual mod
   */
  compatiblePlugCategoryHashes: number[];
  /** this helps us look up the "empty socket" definition, for its icon/name */
  emptyModSocketHash: number;
}

const modSocketMetadata: ModSocketMetadata[] = ${stringifyObject([], {
  indent: '  ',
})};\n\nexport default modSocketMetadata;`;

writeFile('./output/specialty-modslot-metadata.ts', pretty);

/** i.e. "Opulent Armor Mod" ---> "opulent" */
function seasonTagFromMod(item: DestinyInventoryItemDefinition) {
  return item.itemTypeDisplayName.toLowerCase().split(' ')[0];
}

/** i.e. "4" ---> "420" ---> "outlaw"*/
function getSeasonID(season: number) {
  const id = 420 + 10 * (season - 4);
  return `enhancements.season_${namedSeasonExceptions[id] ?? `v${id}`}`;
}

export function arrayUniq<T>(array: T[]): T[] {
  return [...new Set(array)];
}
