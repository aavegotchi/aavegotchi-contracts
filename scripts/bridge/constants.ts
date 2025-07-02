import path from "path";

import { gql, GraphQLClient } from "graphql-request";
import dotenv from "dotenv";
// import { ethers } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
dotenv.config();

//keep this undefined if you want to use latest blockNumber
export let BLOCK_NUMBER = 73121283;

const graphQLClient = new GraphQLClient(process.env.SUBGRAPH_AAVEGOTHI_ETH);

// Shared interfaces
export interface TokenBalance {
  tokenId: string;
  balance: number;
}

export interface ContractOwnership {
  contractAddress: string;
  contractOwner: string;
  tokens?: TokenBalance[]; // used in getWearableData
  tokenIds?: string[]; // used in classifyAavegotchi
}

export interface SafeDetails {
  safeAddress: string;
  tokens?: TokenBalance[]; // used in getWearableData
  tokenIds?: string[]; // used in classifyAavegotchi
}

export interface EquippedItem {
  itemId: string;
  amount: string;
}

// Special addresses
export const ADDRESSES = {
  vault: "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63",
  gbmDiamond: "0xD5543237C656f25EEA69f1E247b8Fa59ba353306",
  raffles: "0x6c723cac1E35FE29a175b287AE242d424c52c1CE",
  raffles2: "0xa85f5a59a71842fddaabd4c2cd373300a31750d8",
  raffleOwner: "0x01F010a5e001fe9d6940758EA5e8c777885E351e", //PC wallet
  aavegotchiDiamond: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  forgeDiamond: "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442",
};

// Excluded addresses
export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD",
  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", //hardhat exposed pk, now a 702 contract breaking erc1155 received validations
].map((a) => a.toLowerCase());

// Base directories
export const BASE_OUTPUT_DIR = path.join(__dirname, "cloneData");

export const AAVEGOTCHI_DIR = path.join(`${BASE_OUTPUT_DIR}`, "aavegotchi");
export const AAVEGOTCHI_METADATA_DIR = path.join(
  `${AAVEGOTCHI_DIR}`,
  "metadata"
);

export const AAVEGOTCHI_WEARABLES_DIR = path.join(
  `${BASE_OUTPUT_DIR}`,
  "wearables"
);

export const FORGE_OUTPUT_DIR = path.join(
  `${BASE_OUTPUT_DIR}`,
  "forgeWearables"
);

export const BLOCKNUMBERFILE = path.join(
  `${BASE_OUTPUT_DIR}`,
  "blockNumber.json"
);

interface BlockNumber {
  aavegotchis: number;
  forgeItems: number;
  wearables: number;
}

export async function getAavegotchiOwnerEth(aavegotchiIds: string[]) {
  const query = gql`
    {
      aavegotchis(where: {id_in: ${JSON.stringify(aavegotchiIds)}}) {
        id
        owner {
          id
        }
      }
    }
  `;

  const data = await graphQLClient.request(query);
  console.log(`Found ${data.aavegotchis.length} Bridged Aavegotchis`);

  //get the addresses that are missing from the output

  // Return map of id to owner
  const owners = data.aavegotchis.reduce(
    (acc: Record<string, string>, gotchi: any) => {
      acc[gotchi.id] = gotchi.owner.id;

      return acc;
    },
    {}
  );

  return owners;
}

export async function getVaultOwner(
  tokenIds: string[],
  ethers: any,
  blockNumber: number
) {
  const vault = await ethers.getContractAt("IVault", ADDRESSES.vault);
  const owners: Record<string, string> = {};

  for (const tokenId of tokenIds) {
    try {
      const owner = await vault.getDepositor(maticDiamondAddress, tokenId, {
        blockTag: blockNumber,
      });
      owners[tokenId] = owner.toLowerCase();
    } catch (error) {
      console.error(`Error getting vault owner for token ${tokenId}:`, error);
    }
  }

  console.log(`Found ${Object.keys(owners).length} vault owners`);
  return owners;
}

import fs from "fs";

export async function writeBlockNumber(
  assetType: "aavegotchis" | "forgeItems" | "wearables",
  ethers: any
) {
  let blockNumber = BLOCK_NUMBER;
  if (!BLOCK_NUMBER) {
    blockNumber = await ethers.provider.getBlockNumber();
  }
  console.log(
    `Using anchor Block number for ${assetType} data: ${blockNumber}`
  );
  //create the file and folder if it doesn't exist
  if (!fs.existsSync(BASE_OUTPUT_DIR)) {
    fs.mkdirSync(BASE_OUTPUT_DIR);
  }
  if (!fs.existsSync(BLOCKNUMBERFILE)) {
    fs.writeFileSync(
      BLOCKNUMBERFILE,
      JSON.stringify({ [assetType]: blockNumber }, null, 2)
    );
  }
  //read the file and only update the assetType block number
  const blockNumberObject: BlockNumber = JSON.parse(
    fs.readFileSync(BLOCKNUMBERFILE, "utf8")
  );
  //direct update the block number
  blockNumberObject[assetType] = blockNumber;
  fs.writeFileSync(BLOCKNUMBERFILE, JSON.stringify(blockNumberObject, null, 2));
  return blockNumber;
}
