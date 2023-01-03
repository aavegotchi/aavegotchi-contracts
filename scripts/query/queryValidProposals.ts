import { request } from "graphql-request";

import fs from 'fs'
export const snapshotGraphUrl = "https://hub.snapshot.org/graphql"

interface MinimalProposalDetails {
  id: string,
  title: string,
  scores: number[]
}
interface Proposals {
  proposals: MinimalProposalDetails[]
}

//let proposalArray: { id: string; title: string }[] = []
const path = 'scripts/query/CompletedSnapshotDrops.json'

async function getProposals() {

  const query = `
  query {
    proposals(
      where: {
        space_in: ["aavegotchi.eth"],
        state: "closed",
        created_gt: 1661523250
      },
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      title
      scores
    }
  }
`;
  const res: Proposals = (await request(snapshotGraphUrl, query));
  return res
}

export async function getValidProposals() {
  const allProposals: Proposals = await getProposals()
  const proposals = allProposals.proposals
  let validProposals: MinimalProposalDetails[] = [];
  for (const proposal of proposals) {
    if (getDifferentialPercent(proposal.scores)) {
      validProposals.push(proposal)
    }
  }
  return validProposals

}

function getDifferentialPercent(scores: number[]): boolean {
  if (scores.length < 2) {
    return false;
  }

  let highest = scores[0];
  let secondHighest = scores[1];
  if (highest < secondHighest) {
    [highest, secondHighest] = [secondHighest, highest];
  }

  for (let i = 2; i < scores.length; i++) {
    if (scores[i] > highest) {
      secondHighest = highest;
      highest = scores[i];
    } else if (scores[i] > secondHighest) {
      secondHighest = scores[i];
    }
  }
  //10% difference between 2 highest options
  return (highest - secondHighest) / highest >= 0.1;
}


export async function appendToArray(data: MinimalProposalDetails, array: { id: string; title: string; }[]) {
  array.push({ id: data.id, title: data.title });
}

export async function writeToJsonFile(array: { id: string; title: string; }[]) {

  try {
    const json = await fs.promises.readFile(path, 'utf8');
    const existingArray = JSON.parse(json);
    const updatedArray = [...existingArray, ...array];
    await fs.promises.writeFile(path, JSON.stringify(updatedArray));
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.writeFile(path, JSON.stringify(array));
    } else {
      throw error;
    }
  }
}



export async function hasId(id: string): Promise<boolean> {

  try {
    const json = await fs.promises.readFile(path, 'utf8');
    const array = JSON.parse(json);
    return array.some((item: { id: string; }) => item.id === id);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export function propType(title: string): "coreprop" | "sigprop" {
  if (title.includes("AGIP")) {
    return "coreprop"
  }
  else {
    return "sigprop"
  }
}

