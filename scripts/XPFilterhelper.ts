import { GotchiData } from "./query/getAavegotchisXPData";

//Vault address
const preferredAddress = "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63";

function removeIdFromVaultAddress(
  data: GotchiData[],
  ids: string[]
): GotchiData[] {
  return removeData(data, ids, preferredAddress);
}

function removeData(
  gotchiData: GotchiData[],
  idsToRemove: string[],
  key: string
): GotchiData[] {
  return gotchiData.map((data) => {
    if (data.address === key) {
      data.gotchiIds = data.gotchiIds.filter((id) => !idsToRemove.includes(id));
    }
    return data;
  });
}

export function reduceGotchiData(data: GotchiData[]) {
  console.log("Removing duplicates related to vaults and double ownership...");
  //first enumerate all duplicate ids
  const unifiedMap: string[] = findDuplicateIds(data);

  //construct a map of duplicate ids to addresses
  const duplicatesMap: Map<string, string[]> = findDuplicates(data, unifiedMap);

  //exclude values that are contained in a vault first
  const vaultIds: string[] = findKeysWithValue(duplicatesMap, preferredAddress);

  //reduce original mapping to only contain normal EOA duplicates
  const reducedMap: Map<string, string[]> = removeEntriesFromMap(
    duplicatesMap,
    vaultIds
  );

  //first handle vault gotchis
  data = removeIdFromVaultAddress(data, vaultIds);

  //then handle normal duplicates
  for (const [id] of reducedMap) {
    const addressToRemove = getFirstValueForKey(reducedMap, id);
    data = removeData(data, [id], addressToRemove);
  }

  return data;
}

function getFirstValueForKey(
  mapping: Map<string, string[]>,
  key: string
): string {
  const values = mapping.get(key);
  return values![0];
}

function removeEntriesFromMap(
  map: Map<string, string[]>,
  keysToRemove: string[]
) {
  for (const key of keysToRemove) {
    map.delete(key);
  }
  return map;
}

function findDuplicates(
  arr: GotchiData[],
  ids: string[]
): Map<string, string[]> {
  const duplicatesMap: Map<string, string[]> = new Map();

  for (const id of ids) {
    const addresses: string[] = [];

    for (const data of arr) {
      if (data.gotchiIds.includes(id)) {
        addresses.push(data.address);
      }
    }

    if (addresses.length > 1) {
      duplicatesMap.set(id, addresses);
    }
  }

  return duplicatesMap;
}

function findDuplicateIds(arr: GotchiData[]): string[] {
  const allIds: string[] = [];
  const duplicateIds: string[] = [];

  for (const data of arr) {
    for (const id of data.gotchiIds) {
      if (allIds.includes(id) && !duplicateIds.includes(id)) {
        duplicateIds.push(id);
      } else {
        allIds.push(id);
      }
    }
  }
  return duplicateIds;
}

function findKeysWithValue(
  map: Map<string, string[]>,
  targetValue: string
): string[] {
  const keys: string[] = [];

  for (const [key, value] of map.entries()) {
    if (value.includes(targetValue)) {
      keys.push(key);
    }
  }

  return keys;
}
