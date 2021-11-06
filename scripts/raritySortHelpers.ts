import { all } from "underscore";
import {
  LeaderboardAavegotchi,
  LeaderboardType,
  FoundSet,
  LeaderboardSortingOption,
} from "../types";

import { wearableSetArrays } from "./wearableSets";
const tiebreakerIndex = 0;
const totalResults: number = 6000;

export function findSets(equipped: number[]) {
  const setData = wearableSetArrays;
  const foundSets: Array<FoundSet> = [];

  const getEquipmentIds = (acc: Array<number>, value: number) => {
    if (Number(value) > 0) {
      acc.push(Number(value));
    }
    return acc;
  };

  const equippedIds = equipped?.reduce(getEquipmentIds, []);

  for (const wearableSet of setData) {
    const setWearableIds = wearableSet.wearableIds.reduce(getEquipmentIds, []);
    if (
      setWearableIds.every((wearableId: number) =>
        equippedIds?.includes(wearableId)
      ) /*&& setWearableIds.length > numWearableIds*/
    ) {
      const setFound = {
        name: wearableSet.name,
        wearableIds: setWearableIds,
        traitsBonuses: wearableSet.traitsBonuses.map((v: any) => Number(v)),
        allowedCollaterals: wearableSet.allowedCollaterals.map((v: any) =>
          Number(v)
        ),
      };

      foundSets.push(setFound);
    }
  }

  foundSets.sort(function (a, b) {
    return b.traitsBonuses[0] - a.traitsBonuses[0];
  });

  return foundSets;
}

export function calculateRarityScore(traitArray: number[]) {
  const energy: number = returnRarity(traitArray[0]);
  const aggressiveness: number = returnRarity(traitArray[1]);
  const spookiness: number = returnRarity(traitArray[2]);
  const brainSize: number = returnRarity(traitArray[3]);
  const eyeShape: number = returnRarity(traitArray[4]);
  const eyeColor: number = returnRarity(traitArray[5]);
  return energy + aggressiveness + spookiness + brainSize + eyeShape + eyeColor;
}

export function _sortByBRS(a: LeaderboardAavegotchi, b: LeaderboardAavegotchi) {
  if (a.withSetsRarityScore == b.withSetsRarityScore) {
    return Number(b.kinship) - Number(a.kinship);
  }
  return Number(b.withSetsRarityScore) - Number(a.withSetsRarityScore);
}

export function _sortByKinship(
  a: LeaderboardAavegotchi,
  b: LeaderboardAavegotchi
) {
  if (a.kinship === b.kinship) {
    //Kinship and XP are the same
    if (a.experience === b.experience) {
      return (
        _distanceFrom50(Number(_aavegotchiNumericTraits(b)[tiebreakerIndex])) -
        _distanceFrom50(Number(_aavegotchiNumericTraits(a)[tiebreakerIndex]))
      );
    } else return Number(b.experience) - Number(a.experience);
  }
  return Number(b.kinship) - Number(a.kinship);
}

export function _sortByExperience(
  a: LeaderboardAavegotchi,
  b: LeaderboardAavegotchi
) {
  if (a.experience === b.experience) {
    if (
      _distanceFrom50(_aavegotchiNumericTraits(a)[tiebreakerIndex]) ===
      _distanceFrom50(_aavegotchiNumericTraits(b)[tiebreakerIndex])
    ) {
      return Number(b.kinship) - Number(a.kinship);
    } else {
      //Kinship and XP are the same
      return (
        _distanceFrom50(Number(_aavegotchiNumericTraits(b)[tiebreakerIndex])) -
        _distanceFrom50(Number(_aavegotchiNumericTraits(a)[tiebreakerIndex]))
      );
    }
  } else return Number(b.experience) - Number(a.experience);
}

function returnRarity(number: number) {
  if (number < 50) return 100 - number;
  else return number + 1;
}
function _distanceFrom50(trait: number) {
  return Math.abs(50 - trait);
}

export function _aavegotchiNumericTraits(aavegotchi: LeaderboardAavegotchi) {
  const val = aavegotchi.withSetsNumericTraits?.reduce((total, val) => {
    return total + val;
  });

  if (val === 0) return aavegotchi.modifiedNumericTraits;
  if (aavegotchi.withSetsNumericTraits) return aavegotchi.withSetsNumericTraits;
  else return aavegotchi.modifiedNumericTraits;
}

export function stripGotchis(_in: LeaderboardAavegotchi[]) {
  const allIds: string[] = [];
  for (let i = 0; i < _in.length; i++) {
    allIds.push(_in[i].id);
  }
  return allIds;
}

export function confirmCorrectness(table1: string[], table2: string[]) {
  let j = 0;
  if (table1.length != table2.length) {
    console.log("length mismatch, exiting");
  }
  for (let i = 0; i < table1.length; i++) {
    if (table1[i] === table2[i]) {
      j++;
      //  console.log(`${table1[i]} matches ${table2[i]}`);
    }
  }
  console.log(j);
}
