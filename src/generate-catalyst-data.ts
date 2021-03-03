import { get, getAll, loadLocal } from '@d2api/manifest/node';
import { writeFile } from './helpers';

loadLocal();

const catalystPresentationNodeHash = 1984921914;

const inventoryItems = getAll('DestinyInventoryItemDefinition');

// this is keyed with record hashes, and the values are catalyst inventoryItem icons
// (more interesting than the all-identical icons on catalyst triumphs)
const triumphData: any = { icon: String, source: String };

// loop the catalyst section of triumphs
get(
  'DestinyPresentationNodeDefinition',
  catalystPresentationNodeHash
)?.children.presentationNodes.forEach((p) =>
  get('DestinyPresentationNodeDefinition', p.presentationNodeHash)?.children.records.forEach(
    (r) => {
      const recordName = get('DestinyRecordDefinition', r.recordHash)?.displayProperties.name;

      // look for an inventoryItem with the same name, and tierType 6 (should find the catalyst for that gun)
      const itemWithSameName_Icon = inventoryItems.find(
        (i) => i.displayProperties.name === recordName && i.inventory!.tierType === 6
      );

      // and get its icon image
      const icon = itemWithSameName_Icon?.displayProperties?.icon;

      const itemWithSameName_Source = SourceFromOtherSource(recordName);

      const source = itemWithSameName_Source?.hash ?? NoSourceToSource(recordName);

      const value = !source ? SourceI18nValue(recordName) : null;

      // this "if" check is because of classified data situations
      if (icon) {
        triumphData[r.recordHash] = {};
        triumphData[r.recordHash].icon = icon;
        triumphData[r.recordHash].source = source;
        triumphData[r.recordHash].key = value;
      } else {
        console.log(`no catalyst image found for ${r.recordHash} ${recordName}`);
      }
    }
  )
);

writeFile('./output/catalyst-triumph-info.json', triumphData);

function NoSourceToSource(name: string | undefined) {
  switch (name?.replace(' Catalyst', '')) {
    case 'Cerberus+1':
      return SourceFromOtherSource('Crimson Catalyst')?.hash;
    case 'Bad Juju':
    case "Izanagi's Burden":
    case 'Lumina':
    case 'Lord of Wolves':
    case 'Trinity Ghoul':
    case 'Black Talon':
      return SourceFromOtherSource('Skyburner Catalyst')?.hash;
    case 'Ace of Spades':
      return SourceFromOtherSource('Sunshot Catalyst')?.hash;
    default:
      return null;
  }
}

function SourceFromOtherSource(name: string | undefined) {
  return inventoryItems.find(
    (i) =>
      i.displayProperties.name === name &&
      i.itemType === 20 &&
      i.displayProperties.iconSequences &&
      i.displayProperties.iconSequences.length > 0
  );
}

function SourceI18nValue(name: string | undefined) {
  switch (name?.replace(' Catalyst', '')) {
    case "Dead Man's Tale":
    case 'Outbreak Perfected':
    case "Eriana's Vow":
    case 'Hawkmoon':
    case "Tommy's Matchbook":
    case "Ticuu's Divination":
    case 'The Fourth Horseman':
    case 'Duality':
    case 'No Time to Explain':
    case 'Witherhoard':
    case 'Ruinous Effigy':
    case 'Symmetry':
    case "Leviathan's Breath":
      return name?.replace('Catalyst', '').replace(/'/g, '').replace(/ /g, '');
    default:
      return null;
  }
}
