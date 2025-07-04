import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { AavegotchiInfo } from "./getAavegotchiMetadata";

import {
  ADDRESSES,
  excludedAddresses,
  BASE_OUTPUT_DIR,
  AAVEGOTCHI_METADATA_DIR,
  ContractOwnership,
  SafeDetails,
  EquippedItem,
  getAavegotchiOwnerEth,
  getVaultOwner,
  writeBlockNumber,
  // AAVEGOTCHI_DIAMOND_BASE,
} from "./constants";

// New imports for owner-refresh
import { GraphQLClient, gql } from "graphql-request";
import dotenv from "dotenv";

dotenv.config();

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
  gbmDiamond: path.join(OUTPUT_DIR, "aavegotchi-gbmDiamond.json"),
  contractEOAs: path.join(OUTPUT_DIR, "aavegotchi-contractsWithEOA.json"),
  gnosisSafes: path.join(OUTPUT_DIR, "aavegotchi-safe.json"),
  wearables: path.join(OUTPUT_DIR, "aavegotchi998Data.json"),
  aavegotchiDiamond: path.join(OUTPUT_DIR, "aavegotchi-aavegotchiDiamond.json"),
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
    console.debug(`Found a safe`);
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
    gbmCount: number;
    contractEOAsCount: number;
    gnosisSafeCount: number;
    aavegotchiDiamondCount: number;
  };
}

const PROGRESS_FILE = path.join(OUTPUT_DIR, "classification-progress.json");
const BATCH_SIZE = 100; // Process 100 owners before saving
const SAVE_INTERVAL = 2 * 60 * 1000; // Save every 2 minutes

function initializeFiles() {
  const initialData = {
    regularHolders: {},
    contractHolders: {},
    gbmDiamond: [],
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
    gbmDiamondHolders: [] as string[],
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
  // Skip if no items array or if items array is empty/all zeros
  if (!items || items.every((item) => item === 0)) {
    return null;
  }

  // Get valid IDs from items array (non-zero)
  const validIds = new Set(items.filter((id) => id !== 0));
  const wearablesMap: Record<string, EquippedItem> = {};

  // Process each valid ID
  validIds.forEach((itemId) => {
    // Count equipped instances
    const equippedCount =
      equippedWearables?.filter((id) => id === itemId).length || 0;

    // If item exists in items but not equipped, it's a badge (amount = 1)
    const count = equippedCount || 1;

    // Convert hex to decimal string
    const decimalId = parseInt(itemId.toString()).toString();

    wearablesMap[decimalId] = {
      itemId: decimalId,
      amount: count.toString(),
    };
  });

  return Object.keys(wearablesMap).length > 0 ? wearablesMap : null;
}

// Add constant for metadata file path
const METADATA_FILE = path.join(
  AAVEGOTCHI_METADATA_DIR,
  "aavegotchiMetadata.json"
);

// =========================  Owner refresh helpers  ========================= //

interface Lending {
  id: string;
  gotchiTokenId: string;
  originalOwner: string;
  lender: string;
}

async function fetchUnfinishedLendings(
  blockNumber: number
): Promise<Lending[]> {
  const uri = process.env.SUBGRAPH_CORE_MATIC;
  if (!uri) {
    console.warn(
      "SUBGRAPH_CORE_MATIC env variable not set – skipping lending owner refresh."
    );
    return [];
  }

  const client = new GraphQLClient(uri);
  const allLendings: Lending[] = [];
  let skip = 0;
  const first = 1000;
  let hasMore = true;

  while (hasMore) {
    const query = gql`
      {
        gotchiLendings(
          first: ${first}
          block: {number:${blockNumber}}
          skip: ${skip}
          where: { completed: false, cancelled: false, borrower_not: null }
        ) {
          id
          gotchiTokenId
          originalOwner
          lender
        }
      }
    `;

    try {
      const response = await client.request<{ gotchiLendings: Lending[] }>(
        query
      );
      const lendings = response.gotchiLendings;

      if (lendings.length > 0) {
        allLendings.push(...lendings);
        skip += first;
      }

      if (lendings.length < first) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching lendings at skip ${skip}:`, error);
      hasMore = false;
    }
  }

  return allLendings;
}

async function refreshMetadataOwners(
  metadata: Record<string, AavegotchiInfo>,
  blockNumber: number
) {
  try {
    const lendings = await fetchUnfinishedLendings(blockNumber);
    console.log(
      `Found ${lendings.length} ongoing lendings; refreshing owners…`
    );

    let updated = 0;
    lendings.forEach((l) => {
      const tokenId = l.gotchiTokenId;
      if (metadata[tokenId]) {
        metadata[tokenId].owner = l.lender.toLowerCase();
        updated += 1;
      }
    });

    if (updated > 0) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
      console.log(`Owner refresh complete – ${updated} records updated.`);
    } else {
      console.log("No metadata owners needed refreshing.");
    }
  } catch (err) {
    console.error("Owner refresh failed – proceeding without it:", err);
  }
}

async function main() {
  if (!fs.existsSync(AAVEGOTCHI_METADATA_DIR)) {
    console.error("\nError: Aavegotchi metadata file not found!");
    console.error(`Expected location: ${AAVEGOTCHI_METADATA_DIR}`);
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
  const blockNumber = await writeBlockNumber("aavegotchis", ethers);

  // Initialize or load progress
  let progress: Progress = {
    processedOwners: [],
    lastSaveTimestamp: Date.now(),
    statistics: {
      regularHoldersCount: 0,
      contractHoldersCount: 0,
      excludedCount: 0,
      gbmCount: 0,
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
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf8"));

  // Immediately bring owner data up-to-date using ongoing lending data so that
  // classification works on fresh information.
  await refreshMetadataOwners(metadata, blockNumber);

  // Load existing data
  const existingData = loadExistingData();
  const regularHolders: OwnershipMap = existingData.regularHolders;
  const contractHolders: OwnershipMap = existingData.contractHolders;
  const gbmDiamondHolders: string[] = existingData.gbmDiamondHolders;
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
      let ownerTokens = Object.entries(
        metadata as Record<string, AavegotchiInfo>
      )
        .filter(([_, data]) => data.owner.toLowerCase() === owner)
        .map(([tokenId]) => tokenId)
        .sort((a, b) => parseInt(a) - parseInt(b));

      if (excludedAddresses.includes(owner)) {
        progress.statistics.excludedCount++;
      } else if (owner === ADDRESSES.vault.toLowerCase()) {
        // Get true owners for all tokens in vault
        console.log(`Processing ${ownerTokens.length} Vault Aavegotchis`);
        const trueOwners = await getVaultOwner(
          ownerTokens,
          ethers,
          blockNumber
        );

        // Group tokens by their true owners
        const tokensByOwner = ownerTokens.reduce(
          (acc: Record<string, string[]>, tokenId) => {
            const trueOwner = trueOwners[tokenId];
            if (!acc[trueOwner]) acc[trueOwner] = [];
            acc[trueOwner].push(tokenId);
            return acc;
          },
          {}
        );

        // Process each group of tokens
        for (const [trueOwner, tokens] of Object.entries(tokensByOwner)) {
          const trueOwnerLower = trueOwner.toLowerCase();

          if (excludedAddresses.includes(trueOwnerLower)) {
            progress.statistics.excludedCount++;
          } else {
            if (!regularHolders[trueOwnerLower]) {
              regularHolders[trueOwnerLower] = [];
            }
            regularHolders[trueOwnerLower].push(...tokens);
            progress.statistics.regularHoldersCount++;

            // Update metadata with true owner
            tokens.forEach((tokenId) => {
              if (metadata[tokenId]) {
                metadata[tokenId].owner = trueOwnerLower;
              }
            });
          }
        }
        console.log(
          `Successfully processed ${
            Object.keys(tokensByOwner).length
          } unique owners from the vault`
        );
      } else if (owner === ADDRESSES.aavegotchiDiamond.toLowerCase()) {
        // Get true owners for all tokens held by Diamond
        console.log(`Processing ${ownerTokens.length} Bridged Aavegotchis`);
        const trueOwners = await getAavegotchiOwnerEth(ownerTokens);

        // Log tokens missing from subgraph
        const missingTokens = ownerTokens.filter((id) => !trueOwners[id]);
        if (missingTokens.length > 0) {
          console.log(
            `Warning: ${missingTokens.length} tokens missing from eth subgraph have been allocated to the aavegotchi Diamond on target chain`
          );

          //allocate the tokens to the aavegotchi diamond , do not update the metadata
          aavegotchiDiamond.push(...missingTokens.map(String)); // Ensure they are strings

          // Update progress statistics based on the length of the actual array
          progress.statistics.aavegotchiDiamondCount = aavegotchiDiamond.length;
        }

        //remove the tokens that have been allocated to the aavegotchi diamond from the ownerTokens
        ownerTokens = ownerTokens.filter(
          (tokenId) => !aavegotchiDiamond.includes(String(tokenId))
        );

        // Group tokens by their true owners
        const tokensByOwner = ownerTokens.reduce(
          (acc: Record<string, string[]>, tokenId) => {
            const trueOwner = trueOwners[tokenId];
            if (!acc[trueOwner]) acc[trueOwner] = [];

            acc[trueOwner].push(tokenId);

            return acc;
          },
          {}
        );

        // Process each group of tokens - all owners are EOAs
        for (const [trueOwner, tokens] of Object.entries(tokensByOwner)) {
          const trueOwnerLower = trueOwner.toLowerCase();

          if (excludedAddresses.includes(trueOwnerLower)) {
            progress.statistics.excludedCount++;
          } else {
            if (!regularHolders[trueOwnerLower]) {
              regularHolders[trueOwnerLower] = [];
            }
            regularHolders[trueOwnerLower].push(...tokens);
            progress.statistics.regularHoldersCount++;

            // Update metadata with true owner
            tokens.forEach((tokenId) => {
              if (metadata[tokenId]) {
                metadata[tokenId].owner = trueOwnerLower;
              }
            });
          }
        }
        console.log(
          `Successfully processed ${
            Object.keys(tokensByOwner).length
          } unique owners from the eth subgraph`
        );
      } else if (
        owner === ADDRESSES.raffles.toLowerCase() ||
        owner === ADDRESSES.raffles2.toLowerCase()
      ) {
        // Add to regularHolders under the PC wallet
        if (!regularHolders[ADDRESSES.raffleOwner.toLowerCase()]) {
          regularHolders[ADDRESSES.raffleOwner.toLowerCase()] = [];
        }
        regularHolders[ADDRESSES.raffleOwner.toLowerCase()].push(
          ...ownerTokens
        );
        progress.statistics.regularHoldersCount++;

        // Update metadata owner for these tokens
        ownerTokens.forEach((tokenId) => {
          if (metadata[tokenId]) {
            metadata[tokenId].owner = ADDRESSES.raffleOwner.toLowerCase();
          }
        });
      } else if (owner === ADDRESSES.gbmDiamond.toLowerCase()) {
        gbmDiamondHolders.push(...ownerTokens);
        progress.statistics.gbmCount = gbmDiamondHolders.length;
      } else {
        const code = await ethers.provider.getCode(owner);
        if (code !== "0x") {
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

      // Process wearables for this owner's tokens directly to avoid skipping
      // Gotchis whose owner address may be mutated inside the special-case
      // branches above.
      ownerTokens.forEach((tokenId) => {
        const dataObj = (metadata as Record<string, AavegotchiInfo>)[tokenId];
        if (!dataObj) return;
        const w = processWearables(dataObj.equippedWearables, dataObj.items);
        if (w) wearablesMap[tokenId] = w;
      });

      // Mark owner as processed
      progress.processedOwners.push(owner);
      batchCount++;

      // Save progress periodically
      if (
        batchCount >= BATCH_SIZE ||
        Date.now() - progress.lastSaveTimestamp >= SAVE_INTERVAL
      ) {
        await saveProgress(
          progress,
          {
            regularHolders,
            contractHolders,
            gbmDiamondHolders,
            contractEOAs,
            gnosisSafeContracts,
            wearables: wearablesMap,
            aavegotchiDiamond,
          },
          metadata
        );
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

  // Save the updated metadata
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

  // Final save
  await saveProgress(
    progress,
    {
      regularHolders,
      contractHolders,
      gbmDiamondHolders,
      contractEOAs,
      gnosisSafeContracts,
      wearables: wearablesMap,
      aavegotchiDiamond,
    },
    metadata
  );

  console.log("\n=== Final Statistics ===");
  printStatistics(progress.statistics);
}

async function saveProgress(
  progress: Progress,
  data: {
    regularHolders: OwnershipMap;
    contractHolders: OwnershipMap;
    gbmDiamondHolders: string[];
    contractEOAs: ContractOwnership[];
    gnosisSafeContracts: SafeDetails[];
    wearables: AavegotchiWearables;
    aavegotchiDiamond: string[];
  },
  metadata: Record<string, AavegotchiInfo>
) {
  // Save progress
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  // Save all data files
  const dataToSave = [
    { path: FILES.regularHolders, data: data.regularHolders },
    { path: FILES.contractHolders, data: data.contractHolders },
    { path: FILES.gbmDiamond, data: data.gbmDiamondHolders },
    { path: FILES.contractEOAs, data: data.contractEOAs },
    { path: FILES.gnosisSafes, data: data.gnosisSafeContracts },
    { path: FILES.wearables, data: data.wearables },
    { path: FILES.aavegotchiDiamond, data: data.aavegotchiDiamond },
  ];

  for (const { path, data: fileData } of dataToSave) {
    fs.writeFileSync(path, JSON.stringify(fileData, null, 2));
  }

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

function printStatistics(stats: Progress["statistics"]) {
  console.log(`Regular holders: ${stats.regularHoldersCount}`);
  console.log(`Contract holders: ${stats.contractHoldersCount}`);
  console.log(`Excluded addresses: ${stats.excludedCount}`);
  console.log(`GBM Diamond holds: ${stats.gbmCount}`);
  console.log(`Contract EOAs: ${stats.contractEOAsCount}`);
  console.log(`Gnosis Safe contracts: ${stats.gnosisSafeCount}`);
  console.log(`Aavegotchi Diamond: ${stats.aavegotchiDiamondCount}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
