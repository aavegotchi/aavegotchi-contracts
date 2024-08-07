import { selectedGotchisQueryPerBlock } from "./raritySortHelpers";

//import { dataArgs } from "../data/airdrops/rarityfarming/szn5/rnd1";
import request from "graphql-request";
import { maticGraphUrl } from "./query/queryAavegotchis";

import { rarityFarmingBlockNumbers } from "./rarityFarmingBlockNumbers";
import { RarityFarmingData } from "../types";

export interface GotchiRoundData {
  withSetsRarityScore1000: {
    id: string;
    withSetsRarityScore: string;
  }[];

  experience1000: {
    id: string;
    experience: string;
  }[];

  kinship1000: {
    id: string;
    kinship: string;
  }[];
}

async function getGotchisForARound(
  blockNumber: string,
  sznNumber: string,
  round: string
) {
  const query = selectedGotchisQueryPerBlock(
    blockNumber,
    await getGotchisFromData(sznNumber, round)
  );

  const queryResponse: GotchiRoundData = await request(maticGraphUrl, query);

  return queryResponse;
}

//returns top1000 in the form brs,kinship,xp
export async function getGotchisForASeason(sznNumber: string) {
  const finalData: GotchiRoundData[] = [];

  //get index since data starts from szn5
  if (parseInt(sznNumber) < 5) {
    throw new Error("Invalid season number, must be greater or equal to 5");
  }
  const index = parseInt(sznNumber) - 5;
  const seasonData = Object.values(rarityFarmingBlockNumbers)[index];
  //4 rounds
  for (let i = 0; i < 4; i++) {
    const blockNumber = Object.values(seasonData)[i];
    finalData.push(
      await getGotchisForARound(blockNumber, sznNumber, `${i + 1}`)
    );
  }

  return sortAndAverage(finalData);
}

function sortAndAverage(finalData: GotchiRoundData[]) {
  const calculateScores = (scoreMap: Map<string, number>) => {
    for (let [key, value] of scoreMap) {
      scoreMap.set(key, Math.ceil(value / 4));
    }
    const sortedScoreMap = new Map(
      [...scoreMap.entries()].sort((a, b) => b[1] - a[1])
    );
    return Array.from(sortedScoreMap.keys()).map(Number);
  };

  const rarityMap = new Map<string, number>();
  const experienceMap = new Map<string, number>();
  const kinshipMap = new Map<string, number>();

  for (let i = 0; i < finalData.length; i++) {
    for (let j = 0; j < finalData[i].withSetsRarityScore1000.length; j++) {
      const gotchiId = finalData[i].withSetsRarityScore1000[j].id;
      const score = parseInt(
        finalData[i].withSetsRarityScore1000[j].withSetsRarityScore
      );
      rarityMap.set(gotchiId, (rarityMap.get(gotchiId) || 0) + score);
    }
    for (let j = 0; j < finalData[i].experience1000.length; j++) {
      const gotchiId = finalData[i].experience1000[j].id;
      const score = parseInt(finalData[i].experience1000[j].experience);
      experienceMap.set(gotchiId, (experienceMap.get(gotchiId) || 0) + score);
    }
    for (let j = 0; j < finalData[i].kinship1000.length; j++) {
      const gotchiId = finalData[i].kinship1000[j].id;
      const score = parseInt(finalData[i].kinship1000[j].kinship);
      kinshipMap.set(gotchiId, (kinshipMap.get(gotchiId) || 0) + score);
    }
  }

  const top1000Rarity = calculateScores(rarityMap);
  const top1000Experience = calculateScores(experienceMap);
  const top1000Kinship = calculateScores(kinshipMap);

  return [top1000Rarity, top1000Kinship, top1000Experience];
}

export async function getGotchisFromData(szn: string, round: string) {
  //fetch data from file
  let dataArgs;
  const file = `../data/airdrops/rarityfarming/szn${szn}/rnd${round}.ts`;
  dataArgs = await import(file);
  dataArgs = dataArgs.dataArgs as RarityFarmingData;

  return [
    dataArgs.rarityGotchis.slice(0, 1000),
    dataArgs.xpGotchis.slice(0, 1000),
    dataArgs.kinshipGotchis.slice(0, 1000),
  ];
}
