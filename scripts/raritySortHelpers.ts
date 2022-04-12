import { LeaderboardAavegotchi, LeaderboardType, FoundSet } from "../types";
import request from "graphql-request";

import { wearableSetArrays } from "./wearableSets";
import { maticGraphUrl } from "./query/queryAavegotchis";
// const totalResults: number = 6000;

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

function returnRarity(number: number) {
  if (number < 50) return 100 - number;
  else return number + 1;
}
function _distanceFrom50(trait: number) {
  return Math.abs(50 - trait);
}

export function _aavegotchiNumericTraits(aavegotchi: LeaderboardAavegotchi) {
  const val = aavegotchi.withSetsNumericTraits?.reduce(
    (total: number, val: number) => {
      return total + val;
    }
  );

  if (val === 0) return aavegotchi.modifiedNumericTraits;
  if (aavegotchi.withSetsNumericTraits) return aavegotchi.withSetsNumericTraits;
  else return aavegotchi.modifiedNumericTraits;
}

export function stripGotchis(ids: LeaderboardAavegotchi[]) {
  return ids.map((gotchi: LeaderboardAavegotchi) => gotchi.id);
}

export function confirmCorrectness(
  subgraphData: string[],
  localData: string[]
) {
  let j = 0;

  if (subgraphData.length !== localData.length) {
    console.log("length mismatch, exiting");
  }
  for (let i = 0; i < subgraphData.length; i++) {
    // console.log("subgraph vs local:", subgraphData[i], localData[i]);

    if (subgraphData[i] === localData[i]) {
      j++;
    }
  }

  return j;
}

export function leaderboardQuery(
  orderBy: string,
  orderDirection: string,
  blockNumber: string,
  extraFilters?: string
): string {
  // const extraWhere = extraFilters ? "," + extraFilters : "";
  // const where = `where:{baseRarityScore_gt:0, owner_not:"0x0000000000000000000000000000000000000000" ${extraWhere}}`;
  const aavegotchi = `
    id
    name
    baseRarityScore
    modifiedRarityScore
    withSetsRarityScore
    numericTraits
    modifiedNumericTraits
    withSetsNumericTraits
    stakedAmount
    equippedWearables
    kinship
    equippedSetID
    equippedSetName
    experience
    level
    collateral
    hauntId
    lastInteracted
    owner {
        id
    }`;
  const reqs: string[] = [];
  const max_runs = 25_000 / 1000; // 25_000 gotchis atm
  for (let i = 0; i < max_runs; i++) {
    reqs.push(`first${
      i * 1000
    }:aavegotchis(block:{number: ${blockNumber}} first:1000, orderBy: gotchiId, where: {
        gotchiId_gte: ${i * 1000}, gotchiId_lt: ${
      (i + 1) * 1000
    } , baseRarityScore_gt: 0
      }) {
        ${aavegotchi}
      }`);
  }

  return `{
    ${reqs.join("")}
  }`;
}

export function leaderboardQueryOld(
  orderBy: string,
  orderDirection: string,
  blockNumber: string,
  extraFilters?: string
): string {
  const extraWhere = extraFilters ? "," + extraFilters : "";
  const where = `where:{baseRarityScore_gt:0, owner_not:"0x0000000000000000000000000000000000000000" ${extraWhere}}`;
  const aavegotchi = `
    id
    name
    baseRarityScore
    modifiedRarityScore
    withSetsRarityScore
    numericTraits
    modifiedNumericTraits
    withSetsNumericTraits
    stakedAmount
    equippedWearables
    kinship
    equippedSetID
    equippedSetName
    experience
    level
    collateral
    hauntId
    lastInteracted
    owner {
        id
    }`;
  return `
    {
      top1000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, ${where}) {
        ${aavegotchi}
      }
      top2000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:1000, ${where}) {
        ${aavegotchi}
      }
      top3000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:2000, ${where}) {
        ${aavegotchi}
      }
      top4000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:3000, ${where}) {
        ${aavegotchi}
      }
      top5000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:4000, ${where}) {
        ${aavegotchi}
      }
      top6000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:5000, ${where}) {
        ${aavegotchi}
      }
    }
  `;
}

export async function fetchAndSortLeaderboard(
  category: "withSetsRarityScore" | "kinship" | "experience",
  blockNumber: string,
  tieBreakerIndex: number
) {
  let eachFinalResult: LeaderboardAavegotchi[] = [];
  const query = leaderboardQuery(`${category}`, "desc", blockNumber);

  const queryresponse = await request(maticGraphUrl, query);

  const leaderboardResults: LeaderboardAavegotchi[] = Object.values(
    queryresponse
  ).flat(1) as LeaderboardAavegotchi[];

  //Add in set bonuses
  leaderboardResults.map((leaderboardGotchi) => {
    //  if (leaderboardGotchi.withSetsRarityScore === null) {
    const foundSets = findSets(leaderboardGotchi.equippedWearables);

    if (foundSets.length > 0) {
      const bestSet = foundSets[0];

      const setTraitBonuses: number[] = bestSet.traitsBonuses;
      const brsBonus = setTraitBonuses[0];

      const nrg = setTraitBonuses[1];
      const agg = setTraitBonuses[2];
      const spk = setTraitBonuses[3];
      const brn = setTraitBonuses[4];
      const setBonusArray = [nrg, agg, spk, brn];

      leaderboardGotchi.equippedSetName = bestSet.name;

      const withSetsNumericTraits = leaderboardGotchi.modifiedNumericTraits;

      const beforeSetBonus = calculateRarityScore(
        leaderboardGotchi.modifiedNumericTraits
      );

      setBonusArray.forEach((trait, index) => {
        withSetsNumericTraits[index] =
          withSetsNumericTraits[index] + setBonusArray[index];
      });

      const afterSetBonus = calculateRarityScore(withSetsNumericTraits);

      const bonusDifference = afterSetBonus - beforeSetBonus;

      leaderboardGotchi.withSetsNumericTraits = withSetsNumericTraits;

      leaderboardGotchi.withSetsRarityScore = Number(
        Number(leaderboardGotchi.modifiedRarityScore) +
          Number(bonusDifference) +
          Number(brsBonus)
      ).toString();
    } else {
      leaderboardGotchi.withSetsRarityScore =
        leaderboardGotchi.modifiedRarityScore;
      leaderboardGotchi.withSetsNumericTraits =
        leaderboardGotchi.modifiedNumericTraits;
    }

    eachFinalResult.push(leaderboardGotchi);
    // }
    return leaderboardGotchi;
  });

  function _sortByBRS(a: LeaderboardAavegotchi, b: LeaderboardAavegotchi) {
    if (a.withSetsRarityScore == b.withSetsRarityScore) {
      return Number(b.kinship) - Number(a.kinship);
    }
    return Number(b.withSetsRarityScore) - Number(a.withSetsRarityScore);
  }

  function _sortByKinship(a: LeaderboardAavegotchi, b: LeaderboardAavegotchi) {
    if (a.kinship === b.kinship) {
      //Kinship and XP are the same
      if (a.experience === b.experience) {
        return (
          _distanceFrom50(
            Number(_aavegotchiNumericTraits(b)[tieBreakerIndex])
          ) -
          _distanceFrom50(Number(_aavegotchiNumericTraits(a)[tieBreakerIndex]))
        );
      } else return Number(b.experience) - Number(a.experience);
    }
    return Number(b.kinship) - Number(a.kinship);
  }

  function _sortByExperience(
    a: LeaderboardAavegotchi,
    b: LeaderboardAavegotchi
  ) {
    if (a.experience === b.experience) {
      if (
        _distanceFrom50(_aavegotchiNumericTraits(a)[tieBreakerIndex]) ===
        _distanceFrom50(_aavegotchiNumericTraits(b)[tieBreakerIndex])
      ) {
        return Number(b.kinship) - Number(a.kinship);
      } else {
        //Kinship and XP are the same
        return (
          _distanceFrom50(
            Number(_aavegotchiNumericTraits(b)[tieBreakerIndex])
          ) -
          _distanceFrom50(Number(_aavegotchiNumericTraits(a)[tieBreakerIndex]))
        );
      }
    } else return Number(b.experience) - Number(a.experience);
  }

  const sortingOptions: {
    [k in LeaderboardType]: (
      a: LeaderboardAavegotchi,
      b: LeaderboardAavegotchi
    ) => number;
  } = {
    withSetsRarityScore: _sortByBRS,
    kinship: _sortByKinship,
    experience: _sortByExperience,
  };

  console.log("category:", category);
  let sortedData = eachFinalResult.sort(sortingOptions[`${category}`]);

  sortedData = [...new Set(sortedData)];

  // eachFinalResult = sortedData.slice(0, 7500);

  return sortedData.slice(0, 7500);
}
