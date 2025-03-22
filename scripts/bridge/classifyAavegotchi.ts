import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { AavegotchiInfo } from "./getAavegotchiMetadata";

import {
  ADDRESSES,
  excludedAddresses,
  BASE_OUTPUT_DIR,
  METADATA_DIR,
  ContractOwnership,
  SafeDetails,
  EquippedItem,
} from "./constants";

interface OwnershipMap {
  [owner: string]: string[]; // Array of tokenIds
}

interface AavegotchiWearables {
  [tokenId: string]: {
    [itemId: string]: EquippedItem;
  };
}

const OUTPUT_DIR = path.join(BASE_OUTPUT_DIR, "aavegotchi");

const FILES = {
  regularHolders: path.join(OUTPUT_DIR, "aavegotchi-regular.json"),
  contractHolders: path.join(
    OUTPUT_DIR,
    "aavegotchi-contractsWithoutEOAs.json"
  ),

  vault: path.join(OUTPUT_DIR, "aavegotchi-vault.json"),
  gbmDiamond: path.join(OUTPUT_DIR, "aavegotchi-gbmDiamond.json"),
  raffles: path.join(OUTPUT_DIR, "aavegotchi-raffles.json"),
  contractEOAs: path.join(OUTPUT_DIR, "aavegotchi-contractsWithEOA.json"),
  gnosisSafes: path.join(OUTPUT_DIR, "aavegotchi-safe.json"),
  aavegotchiDiamond: path.join(OUTPUT_DIR, "aavegotchi-diamond.json"),
  wearables: path.join(OUTPUT_DIR, "aavegotchi998Data.json"),
};

export const getOwner = async (contractAddress: string): Promise<string> => {
  try {
    const owner = await ethers.getContractAt("OwnerShipFacet", contractAddress);
    return await owner.owner();
  } catch (error) {
    console.debug(`Unknown contract, Checking for Safe`);
    return "";
  }
};

export const isSafe = async (contractAddress: string): Promise<boolean> => {
  try {
    const safe = await ethers.getContractAt("ISafe", contractAddress);
    console.log(contractAddress);
    const version = await safe.VERSION();
    console.debug(`Safe version: ${version}`);
    return version === "1.3.0";
  } catch (error) {
    console.debug(`Not a Safe`);
    return false;
  }
};

interface Progress {
  processedOwners: string[];
  lastSaveTimestamp: number;
  statistics: {
    regularHoldersCount: number;
    contractHoldersCount: number;
    excludedCount: number;
    vaultCount: number;
    gbmCount: number;
    rafflesCount: number;
    contractEOAsCount: number;
    gnosisSafeCount: number;
    aavegotchiDiamondCount: number;
  };
}

const PROGRESS_FILE = path.join(OUTPUT_DIR, "classification-progress.json");
const BATCH_SIZE = 100; // Process 100 owners before saving
const SAVE_INTERVAL = 5 * 60 * 1000; // Save every 5 minutes

function initializeFiles() {
  const initialData = {
    regularHolders: {},
    contractHolders: {},
    vault: [],
    gbmDiamond: [],
    raffles: [],
    contractEOAs: [],
    gnosisSafes: [],
    aavegotchiDiamond: [],
  };

  for (const [key, path] of Object.entries(FILES)) {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(
        path,
        JSON.stringify(
          initialData[key as keyof typeof initialData] || {},
          null,
          2
        )
      );
      console.log(`Initialized ${path}`);
    }
  }
}

function loadExistingData() {
  const data = {
    regularHolders: {} as OwnershipMap,
    contractHolders: {} as OwnershipMap,
    vaultHolders: [] as string[],
    gbmDiamondHolders: [] as string[],
    rafflesHolders: [] as string[],
    contractEOAs: [] as ContractOwnership[],
    gnosisSafeContracts: [] as SafeDetails[],
    aavegotchiDiamond: [] as string[],
  };

  // Load existing data from files
  for (const [key, path] of Object.entries(FILES)) {
    if (fs.existsSync(path)) {
      const fileData = JSON.parse(fs.readFileSync(path, "utf8"));
      data[key as keyof typeof data] = fileData;
    }
  }

  return data;
}

function processWearables(
  equippedWearables: number[],
  items: number[]
): Record<string, EquippedItem> | null {
  // Skip if both arrays are empty or all zeros
  if (
    (equippedWearables.every((item) => item === 0) &&
      items.every((item) => item === 0)) ||
    !equippedWearables.length ||
    !items.length
  ) {
    return null;
  }

  // Get valid IDs from items array (non-zero)
  const validIds = new Set(items.filter((id) => id !== 0));
  const wearablesMap: Record<string, EquippedItem> = {};

  // Process each valid ID
  validIds.forEach((itemId) => {
    const count = equippedWearables.filter((id) => id === itemId).length;
    wearablesMap[itemId.toString()] = {
      itemId: itemId.toString(),
      amount: count.toString(),
    };
  });

  return Object.keys(wearablesMap).length > 0 ? wearablesMap : null;
}

async function main() {
  if (!fs.existsSync(METADATA_DIR)) {
    console.error("\nError: Aavegotchi metadata file not found!");
    console.error(`Expected location: ${METADATA_DIR}`);
    console.error("\nTo generate the metadata file, run:");
    console.error(
      "npx hardhat run scripts/bridge/getAavegotchiMetadata.ts --network {network}"
    );
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Initialize files if they don't exist
  initializeFiles();

  // Initialize or load progress
  let progress: Progress = {
    processedOwners: [],
    lastSaveTimestamp: Date.now(),
    statistics: {
      regularHoldersCount: 0,
      contractHoldersCount: 0,
      excludedCount: 0,
      vaultCount: 0,
      gbmCount: 0,
      rafflesCount: 0,
      contractEOAsCount: 0,
      gnosisSafeCount: 0,
      aavegotchiDiamondCount: 0,
    },
  };

  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    console.log(
      `Resuming from ${progress.processedOwners.length} processed owners`
    );
  }

  console.log("Reading Aavegotchi metadata...");
  const metadata = JSON.parse(fs.readFileSync(METADATA_DIR, "utf8"));

  // Load existing data
  const existingData = loadExistingData();
  const regularHolders: OwnershipMap = existingData.regularHolders;
  const contractHolders: OwnershipMap = existingData.contractHolders;
  const vaultHolders: string[] = existingData.vaultHolders;
  const gbmDiamondHolders: string[] = existingData.gbmDiamondHolders;
  const rafflesHolders: string[] = existingData.rafflesHolders;
  const contractEOAs: ContractOwnership[] = existingData.contractEOAs;
  const gnosisSafeContracts: SafeDetails[] = existingData.gnosisSafeContracts;
  const aavegotchiDiamond: string[] = existingData.aavegotchiDiamond;
  // Get unique owners
  const uniqueOwners = [
    ...new Set(
      Object.values(metadata as Record<string, AavegotchiInfo>).map((data) =>
        data.owner.toLowerCase()
      )
    ),
  ];

  console.log(`Total unique owners to process: ${uniqueOwners.length}`);
  let batchCount = 0;

  // Add wearables map
  const wearablesMap: AavegotchiWearables = {};

  // Process each owner
  for (const owner of uniqueOwners) {
    if (progress.processedOwners.includes(owner)) {
      continue;
    }

    try {
      // Get all tokens for this owner
      const ownerTokens = Object.entries(
        metadata as Record<string, AavegotchiInfo>
      )
        .filter(([_, data]) => data.owner.toLowerCase() === owner)
        .map(([tokenId]) => tokenId)
        .sort((a, b) => parseInt(a) - parseInt(b));

      if (excludedAddresses.includes(owner)) {
        progress.statistics.excludedCount++;
      } else if (owner === ADDRESSES.vault.toLowerCase()) {
        vaultHolders.push(...ownerTokens);
        progress.statistics.vaultCount = vaultHolders.length;
      } else if (owner === ADDRESSES.aavegotchiDiamond.toLowerCase()) {
        aavegotchiDiamond.push(...ownerTokens);
        progress.statistics.aavegotchiDiamondCount = aavegotchiDiamond.length;
      } else if (owner === ADDRESSES.gbmDiamond.toLowerCase()) {
        gbmDiamondHolders.push(...ownerTokens);
        progress.statistics.gbmCount = gbmDiamondHolders.length;
      } else if (owner === ADDRESSES.raffles.toLowerCase()) {
        rafflesHolders.push(...ownerTokens);
        progress.statistics.rafflesCount = rafflesHolders.length;
      } else {
        const code = await ethers.provider.getCode(owner);
        if (code !== "0x") {
          // progress.statistics.contractHoldersCount++;
          const contractOwner = await getOwner(owner);
          if (contractOwner) {
            const existingContract = contractEOAs.find(
              (c) => c.contractAddress === owner
            );
            if (existingContract) {
              existingContract.tokenIds.push(...ownerTokens);
            } else {
              contractEOAs.push({
                contractAddress: owner,
                contractOwner,
                tokenIds: ownerTokens,
              });
            }
            progress.statistics.contractEOAsCount = contractEOAs.length;
          } else if (await isSafe(owner)) {
            gnosisSafeContracts.push({
              safeAddress: owner,
              tokenIds: ownerTokens,
            });
            progress.statistics.gnosisSafeCount = gnosisSafeContracts.length;
          } else {
            contractHolders[owner] = ownerTokens;
            progress.statistics.contractHoldersCount++;
          }
        } else {
          regularHolders[owner] = ownerTokens;
          progress.statistics.regularHoldersCount++;
        }
      }

      // Process wearables for each Aavegotchi
      Object.entries(metadata as Record<string, AavegotchiInfo>)
        .filter(([_, data]) => data.owner.toLowerCase() === owner)
        .forEach(([tokenId, data]) => {
          const wearables = processWearables(
            data.equippedWearables,
            data.items
          );
          if (wearables) {
            wearablesMap[tokenId] = wearables;
          }
        });

      // Mark owner as processed
      progress.processedOwners.push(owner);
      batchCount++;

      // Save progress periodically
      if (
        batchCount >= BATCH_SIZE ||
        Date.now() - progress.lastSaveTimestamp >= SAVE_INTERVAL
      ) {
        await saveProgress(progress, {
          regularHolders,
          contractHolders,
          vaultHolders,
          gbmDiamondHolders,
          rafflesHolders,
          contractEOAs,
          gnosisSafeContracts,
          wearables: wearablesMap,
          aavegotchiDiamond,
        });
        batchCount = 0;
        progress.lastSaveTimestamp = Date.now();

        // Print progress
        const percentComplete = (
          (progress.processedOwners.length / uniqueOwners.length) *
          100
        ).toFixed(2);
        console.log(
          `\nProgress: ${percentComplete}% (${progress.processedOwners.length}/${uniqueOwners.length})`
        );
        printStatistics(progress.statistics);
      }
    } catch (error) {
      console.error(`Error processing owner ${owner}:`, error);
    }
  }

  // Final save
  await saveProgress(progress, {
    regularHolders,
    contractHolders,
    vaultHolders,
    gbmDiamondHolders,
    rafflesHolders,
    contractEOAs,
    gnosisSafeContracts,
    wearables: wearablesMap,
    aavegotchiDiamond,
  });

  console.log("\n=== Final Statistics ===");
  printStatistics(progress.statistics);
}

async function saveProgress(
  progress: Progress,
  data: {
    regularHolders: OwnershipMap;
    contractHolders: OwnershipMap;
    vaultHolders: string[];
    gbmDiamondHolders: string[];
    rafflesHolders: string[];
    contractEOAs: ContractOwnership[];
    gnosisSafeContracts: SafeDetails[];
    wearables: AavegotchiWearables;
    aavegotchiDiamond: string[];
  }
) {
  // Save progress
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  // Save all data files
  const dataToSave = [
    { path: FILES.regularHolders, data: data.regularHolders },
    { path: FILES.contractHolders, data: data.contractHolders },
    { path: FILES.vault, data: data.vaultHolders },
    { path: FILES.gbmDiamond, data: data.gbmDiamondHolders },
    { path: FILES.raffles, data: data.rafflesHolders },
    { path: FILES.contractEOAs, data: data.contractEOAs },
    { path: FILES.gnosisSafes, data: data.gnosisSafeContracts },
    { path: FILES.wearables, data: data.wearables },
    { path: FILES.aavegotchiDiamond, data: data.aavegotchiDiamond },
  ];

  for (const { path, data: fileData } of dataToSave) {
    fs.writeFileSync(path, JSON.stringify(fileData, null, 2));
  }
}

function printStatistics(stats: Progress["statistics"]) {
  console.log(`Regular holders: ${stats.regularHoldersCount}`);
  console.log(`Contract holders: ${stats.contractHoldersCount}`);
  console.log(`Excluded addresses: ${stats.excludedCount}`);
  console.log(`Vault holds: ${stats.vaultCount}`);
  console.log(`GBM Diamond holds: ${stats.gbmCount}`);
  console.log(`Raffles Contract holds: ${stats.rafflesCount}`);
  console.log(`Contract EOAs: ${stats.contractEOAsCount}`);
  console.log(`Gnosis Safe contracts: ${stats.gnosisSafeCount}`);
  console.log(`Aavegotchi Diamond holds: ${stats.aavegotchiDiamondCount}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
