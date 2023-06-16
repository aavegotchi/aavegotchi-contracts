import {
  getEthSubgraphGotchis,
  getUsersWithGotchisOfAddresses,
  getVaultGotchis,
  GotchiId,
} from "./queryAavegotchis";
import { UserGotchisOwned } from "../../types";
import { getVotingAddresses } from "./queryVotingAddresses";
import {
  currentOverrides,
  getProposalDetails,
  ProposalDetails,
} from "../../tasks/grantXP_snapshot";
import MerkleTree from "merkletreejs";
import { keccak256 } from "ethers/lib/utils";

import * as fs from "fs";
import { propType } from "../helperFunctions";
import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { reduceGotchiData } from "../XPFilterhelper";

export interface GotchiData {
  address: string;
  gotchiIds: string[];
}

interface XPProof {
  leaf: string;
  proof: string[];
}

export const rootPath = "scripts/airdrops/xpDrops/";

export async function queryAllAavegotchis(
  blockTag: number,
  addresses: string[],
  hre: HardhatRuntimeEnvironment
) {
  let resolvedAddresses: string[] = await resolveENS(addresses, hre);

  let finalData: GotchiData[] = [];

  const exceptions = currentOverrides;
  resolvedAddresses = resolvedAddresses.concat(exceptions);
  if (resolvedAddresses.includes(exceptions[0])) {
    console.log("exception added!");
  }

  //remove duplicate addresses
  addresses = [...new Set(resolvedAddresses)].map((val) => val.toLowerCase());
  //fetch lent gotchis
  let index = 0;
  let prevLength = 0;
  let allGotchiIds: string[] = [];
  do {
    const result = await getUsersWithGotchisOfAddresses(
      addresses,
      blockTag,
      index
    );

    index += 1000;
    prevLength = allGotchiIds.length;

    //record id for each user
    result.users.forEach((e) => {
      let gotchisOwned = e.batch1.map((f: GotchiId) => f.id);
      gotchisOwned = gotchisOwned.concat(e.batch2.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch3.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch4.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch5.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(
        e.batch1owned.map((f: GotchiId) => f.id)
      );
      gotchisOwned = gotchisOwned.concat(
        e.batch2owned.map((f: GotchiId) => f.id)
      );
      gotchisOwned = gotchisOwned.concat(
        e.batch3owned.map((f: GotchiId) => f.id)
      );
      gotchisOwned = gotchisOwned.concat(
        e.batch4owned.map((f: GotchiId) => f.id)
      );
      gotchisOwned = gotchisOwned.concat(
        e.batch5owned.map((f: GotchiId) => f.id)
      );
      allGotchiIds = allGotchiIds.concat(gotchisOwned);

      //eliminate duplicates in same address
      gotchisOwned = [...new Set(gotchisOwned)];

      const map: GotchiData = {
        address: e.id,
        gotchiIds: [],
      };
      finalData.push(map);
      //copy gotchiIds
      addGotchiId(finalData, e.id, gotchisOwned);

      allGotchiIds = allGotchiIds.concat(gotchisOwned);
    });
  } while (allGotchiIds.length != prevLength);

  const batchSize = 1000;
  const batches = Math.ceil(addresses.length / batchSize);
  let mainnetUsers: UserGotchisOwned[] = [];

  //get vault gotchis
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const vaultUsers: UserGotchisOwned[] = await getVaultGotchis(
      batch,
      blockTag
    );
    vaultUsers.forEach((e) => {
      allGotchiIds = allGotchiIds.concat(e.gotchisOwned.map((f) => f.id));
      addGotchiId(
        finalData,
        e.id,
        e.gotchisOwned.map((f) => f.id)
      );
    });
  }

  //Ethereum
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const users: UserGotchisOwned[] = await getEthSubgraphGotchis(batch);

    if (users.length > 0) {
      mainnetUsers = mainnetUsers.concat(users);
    }
  }
  //Handle mainnet Gotchis
  const mainnetTokenIds: string[] = [];
  mainnetUsers.forEach((user) => {
    let claimedGotchis: string[] = [];
    //make sure gotchis are claimed

    user.gotchisOwned.forEach((gotchi) => {
      //get status
      if (gotchi.status === "3") {
        claimedGotchis.push(gotchi.id);
        allGotchiIds.push(gotchi.id);
      }
      if (claimedGotchis.length > 0) {
        addGotchiId(
          finalData,
          user.id,
          user.gotchisOwned.map((f) => f.id)
        );
      }

      mainnetTokenIds.push(gotchi.id);
    });
  });

  finalData = removeEmpty(eliminateDuplicates(finalData));

  finalData = reduceGotchiData(finalData);

  console.log("Unique addresses:", finalData.length);
  const x = new Set(allGotchiIds);
  const y = console.log("Unique Gotchis", Array.from(x).length);

  return finalData;
}

async function resolveENS(addresses: string[], hre: HardhatRuntimeEnvironment) {
  let finalAddresses: string[] = [];

  for (let index = 0; index < addresses.length; index++) {
    let address = addresses[index];
    if (address.includes(".eth")) {
      const resolved = await hre.ethers.provider.resolveName(address);
      address = resolved ? resolved : address;
    }

    if (await ethers.utils.isAddress(address)) {
      finalAddresses.push(address);
    }
  }
  return finalAddresses;
}

function addGotchiId(data: GotchiData[], address: string, gotchiIds: string[]) {
  const targetToUpdate = data.find((item) => item.address === address);
  if (targetToUpdate) {
    targetToUpdate.gotchiIds = targetToUpdate.gotchiIds.concat(gotchiIds);
  }
}

function eliminateDuplicates(arr: GotchiData[]): GotchiData[] {
  const uniqueAddresses = new Set<string>();
  const result: GotchiData[] = [];

  for (const obj of arr) {
    if (!uniqueAddresses.has(obj.address)) {
      uniqueAddresses.add(obj.address);
      result.push(obj);
    }
  }

  return result;
}

export async function generateMerkleTree(
  propId: string,
  hre: HardhatRuntimeEnvironment
) {
  let leaves: string[] = [];
  let leaf: string;

  const voters: string[] = await getVotingAddresses(propId);
  const propDetails: ProposalDetails = await getProposalDetails(propId);
  console.log("Using data at block", propDetails.snapshot);

  const data: GotchiData[] = await queryAllAavegotchis(
    propDetails.snapshot,
    voters,
    hre
  );
  //generate leaves
  for (const user of data) {
    leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256[]"],
      [user.address, user.gotchiIds]
    );
    leaves.push(leaf);
  }
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const xpProofs: { [address: string]: XPProof } = {};
  data.forEach((user, index) => {
    const proof = tree.getProof(leaves[index]);
    xpProofs[user.address] = {
      leaf: "0x" + leaves[index].toString(),
      proof: proof.map((p) => "0x" + p.data.toString("hex")),
    };
  });

  //write the tree to a file

  const parentPath = getParentPath(propDetails.id);
  if (!fs.existsSync(parentPath)) {
    //create folder if it doesn't exist
    fs.mkdirSync(parentPath, { recursive: true });
  }
  //write tree
  await writeToFile(`${parentPath}/tree.json`, xpProofs);

  //write json data
  const jsonData: { [address: string]: GotchiData } = {};
  data.forEach((user) => {
    jsonData[user.address] = user;
  });

  await writeToFile(`${parentPath}/data.json`, jsonData);
  const proposalType = propType(propDetails.title);

  console.log(
    `data and tree written for' ${proposalType} ${propDetails.title} with id ${propId}`
  );

  //return root
  console.log("Merkle root:", "0x" + tree.getRoot().toString("hex"));
  return {
    root: "0x" + tree.getRoot().toString("hex"),
    prop: propDetails,
  };
}

export function getParentPath(propTitle: string): string {
  return rootPath + `${propType(propTitle)}/${propTitle}`;
}

function removeEmpty(data: GotchiData[]) {
  let nonEmpty: GotchiData[] = [];
  let empty: GotchiData[] = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].gotchiIds.length > 0) {
      nonEmpty.push(data[i]);
    } else {
      empty.push(data[i]);
    }
  }
  console.log("found", empty.length, "addresses without gotchis");
  return nonEmpty;
}

//gets the proof of a particular address
export async function getProof(address: string, propId: string) {
  const prop: ProposalDetails = await getProposalDetails(propId);
  const filePath = getParentPath(prop.title) + "/tree.json";

  //retrieve proof
  const jsonString = fs.readFileSync(filePath, "utf-8");
  const jsonObj = JSON.parse(jsonString);
  try {
    const proof: XPProof = jsonObj[address];

    return proof ? proof.proof : null;
  } catch (error) {
    return null;
  }
}

export async function getGotchiIds(address: string, propId: string) {
  const prop: ProposalDetails = await getProposalDetails(propId);
  const filePath = getParentPath(prop.title) + "/data.json";

  //retrieve gotchiIds
  const jsonString = fs.readFileSync(filePath, "utf-8");
  const jsonObj = JSON.parse(jsonString);
  try {
    const data: GotchiData = jsonObj[address];

    return data ? data.gotchiIds : null;
  } catch (error) {
    return null;
  }
}

export async function writeToFile(fullPath: string, data: any) {
  await new Promise<void>((resolve, reject) => {
    fs.writeFile(fullPath, JSON.stringify(data), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
