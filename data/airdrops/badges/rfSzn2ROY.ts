import { rankings } from "./rfSzn2ROYRankings";

export interface RankingObject {
  cumulatedRanks: number;
  id: number;
}

export interface DictionaryObject {
  totalRank: number;
  timesRanked: number;
}

export interface Dictionary {
  [gotchiId: string]: DictionaryObject;
}

export const rookieOfYear = findRoy(rankings);

function findRoy(rankings: RankingObject[]) {
  let gotchiDictionary: Dictionary = {};

  //Iterate through all rankings
  for (let index = 0; index < rankings.length; index++) {
    const obj = rankings[index];

    //Aggregate each Gotchi
    if (gotchiDictionary[obj.id]) {
      gotchiDictionary[obj.id] = {
        timesRanked: gotchiDictionary[obj.id].timesRanked + 1,
        totalRank: gotchiDictionary[obj.id].totalRank + obj.cumulatedRanks,
      };
    } else {
      gotchiDictionary[obj.id] = {
        totalRank: obj.cumulatedRanks,
        timesRanked: 1,
      };
    }
  }

  const finals = Object.entries(gotchiDictionary)
    .filter((val) => val[1].timesRanked === 3)
    .sort((a, b) => a[1].totalRank - b[1].totalRank);

  //return the final ID
  console.log("ROY is: ", finals[0][0]);
  return finals[0][0];
}
