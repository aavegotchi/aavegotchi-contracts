import { Alchemy, Network } from "alchemy-sdk";
import fs from "fs";
import {
  ADDRESSES,
  excludedAddresses,
  BASE_OUTPUT_DIR,
  SafeDetails,
  TokenBalance,
  ContractOwnership,
  FORGE_OUTPUT_DIR,
  writeBlockNumber,
} from "./constants";
import path from "path";
import dotenv from "dotenv";
import { ethers } from "hardhat";
import { getOwner, isSafe } from "./classifyAavegotchi";
dotenv.config();

const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.MATIC_MAINNET,
};

const FILES = {
  regularHolders: path.join(FORGE_OUTPUT_DIR, "forgeWearables-regular.json"),
  contractHolders: path.join(
    FORGE_OUTPUT_DIR,
    "forgeWearables-contractsWithoutEOAs.json"
  ),
  vault: path.join(FORGE_OUTPUT_DIR, "forgeWearables-vault.json"),
  gbmDiamond: path.join(FORGE_OUTPUT_DIR, "forgeWearables-gbmDiamond.json"),
  raffles: path.join(FORGE_OUTPUT_DIR, "forgeWearables-raffles.json"),
  contractEOAs: path.join(
    FORGE_OUTPUT_DIR,
    "forgeWearables-contractsWithEOA.json"
  ),
  gnosisSafes: path.join(FORGE_OUTPUT_DIR, "forgeWearables-safe.json"),
  aavegotchiDiamond: path.join(FORGE_OUTPUT_DIR, "forgeWearables-diamond.json"),
  forgeDiamond: path.join(FORGE_OUTPUT_DIR, "forgeWearables-forgeDiamond.json"),
};

interface NFTOwner {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: number;
  }[];
}

interface ClassifiedData {
  regularHolders: Record<string, TokenBalance[]>;
  contractHolders: Record<string, TokenBalance[]>;
  vaultHolders: TokenBalance[];
  gbmDiamondHolders: TokenBalance[];
  rafflesHolders: TokenBalance[];
  contractEOAs: ContractOwnership[];
  gnosisSafeContracts: SafeDetails[];
  aavegotchiDiamond: TokenBalance[];
  forgeDiamond: TokenBalance[];
}

interface Progress {
  processedOwners: string[];
  lastSaveTimestamp: number;
  analytics: Analytics;
}

interface Analytics {
  totalProcessed: number;
  regularHolders: Set<string>;
  contractHolders: Set<string>;
  contractEOAs: Set<string>;
  gnosisSafes: Set<string>;
  specialAddresses: {
    vault: number;
    gbm: number;
    raffles: number;
    diamond: number;
    forge: number;
  };
  errors: {
    address: string;
    error: string;
  }[];
}

const KEY_TO_DATA_MAP = {
  regularHolders: "regularHolders",
  contractHolders: "contractHolders",
  vault: "vaultHolders",
  gbmDiamond: "gbmDiamondHolders",
  raffles: "rafflesHolders",
  contractEOAs: "contractEOAs",
  gnosisSafes: "gnosisSafeContracts",
  aavegotchiDiamond: "aavegotchiDiamond",
  forgeDiamond: "forgeDiamond",
} as const;

const PROGRESS_FILE = path.join(
  FORGE_OUTPUT_DIR,
  "classification_progress.json"
);
const ANALYTICS_FILE = path.join(FORGE_OUTPUT_DIR, "analytics.json");
const SAVE_INTERVAL = 1 * 60 * 1000; // Save every 1 minute

function initializeFiles() {
  if (!fs.existsSync(FORGE_OUTPUT_DIR)) {
    fs.mkdirSync(FORGE_OUTPUT_DIR, { recursive: true });
  }

  const initialData = {
    regularHolders: {},
    contractHolders: {},
    vault: [],
    gbmDiamond: [],
    raffles: [],
    contractEOAs: [],
    gnosisSafes: [],
    aavegotchiDiamond: [],
    forgeDiamond: [],
  };

  for (const [key, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(initialData[key as keyof typeof initialData], null, 2)
      );
    }
  }
}

async function getForgeData() {
  const alchemy = new Alchemy(config);
  let pageKey = null;
  let allNfts: any[] = [];

  do {
    const response = await alchemy.nft.getOwnersForContract(
      ADDRESSES.forgeDiamond,
      {
        pageKey: pageKey,
        withTokenBalances: true,
      }
    );

    allNfts = allNfts.concat(response.owners);
    pageKey = response.pageKey;

    console.log(`Fetched ${allNfts.length} holders so far...`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (pageKey);

  return allNfts;
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    // Convert arrays back to Sets
    progress.analytics.regularHolders = new Set(
      progress.analytics.regularHolders
    );
    progress.analytics.contractHolders = new Set(
      progress.analytics.contractHolders
    );
    progress.analytics.contractEOAs = new Set(progress.analytics.contractEOAs);
    progress.analytics.gnosisSafes = new Set(progress.analytics.gnosisSafes);
    return progress;
  }

  return {
    processedOwners: [],
    lastSaveTimestamp: Date.now(),
    analytics: {
      totalProcessed: 0,
      regularHolders: new Set<string>(),
      contractHolders: new Set<string>(),
      contractEOAs: new Set<string>(),
      gnosisSafes: new Set<string>(),
      specialAddresses: {
        vault: 0,
        gbm: 0,
        raffles: 0,
        diamond: 0,
        forge: 0,
      },
      errors: [],
    },
  };
}

function saveProgress(progress: Progress, data: ClassifiedData) {
  // Convert Sets to arrays for JSON serialization
  const serializableProgress = {
    ...progress,
    analytics: {
      ...progress.analytics,
      regularHolders: Array.from(progress.analytics.regularHolders),
      contractHolders: Array.from(progress.analytics.contractHolders),
      contractEOAs: Array.from(progress.analytics.contractEOAs),
      gnosisSafes: Array.from(progress.analytics.gnosisSafes),
    },
  };

  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify(serializableProgress, null, 2)
  );
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(progress.analytics, null, 2));

  // Save classified data
  for (const [key, filePath] of Object.entries(FILES)) {
    const dataKey = KEY_TO_DATA_MAP[key as keyof typeof KEY_TO_DATA_MAP];
    const fileData = data[dataKey];
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
  }
}

async function classifyAndSaveData(nftOwners: NFTOwner[]) {
  const data: ClassifiedData = {
    regularHolders: {},
    contractHolders: {},
    vaultHolders: [],
    gbmDiamondHolders: [],
    rafflesHolders: [],
    contractEOAs: [],
    gnosisSafeContracts: [],
    aavegotchiDiamond: [],
    forgeDiamond: [],
  };

  const progress = loadProgress();
  let lastSaveTime = Date.now();

  for (const { ownerAddress, tokenBalances } of nftOwners) {
    const owner = ownerAddress.toLowerCase();

    // Skip if already processed
    if (progress.processedOwners.includes(owner)) {
      continue;
    }

    try {
      const balances = tokenBalances.map((tb) => ({
        tokenId: parseInt(tb.tokenId.slice(2), 16).toString(),
        balance: tb.balance,
      }));

      if (excludedAddresses.includes(owner)) continue;

      // Check special addresses first
      if (owner === ADDRESSES.vault.toLowerCase()) {
        data.vaultHolders.push(...balances);
        progress.analytics.specialAddresses.vault += balances.length;
      } else if (owner === ADDRESSES.gbmDiamond.toLowerCase()) {
        data.gbmDiamondHolders.push(...balances);
        progress.analytics.specialAddresses.gbm += balances.length;
      } else if (
        owner === ADDRESSES.raffles.toLowerCase() ||
        owner === ADDRESSES.raffles2.toLowerCase()
      ) {
        // Instead of adding to rafflesHolders, add to regularHolders under the new owner
        if (!data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()]) {
          data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()] = [];
        }
        data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()].push(
          ...balances
        );
        progress.analytics.regularHolders.add(
          ADDRESSES.raffleOwner.toLowerCase()
        );
      } else if (owner === ADDRESSES.aavegotchiDiamond.toLowerCase()) {
        data.aavegotchiDiamond.push(...balances);
        progress.analytics.specialAddresses.diamond += balances.length;
      } else if (owner === ADDRESSES.forgeDiamond.toLowerCase()) {
        data.forgeDiamond.push(...balances);
        progress.analytics.specialAddresses.forge += balances.length;
      } else {
        const code = await ethers.provider.getCode(owner);
        if (code !== "0x") {
          const contractOwner = await getOwner(owner);
          if (contractOwner) {
            data.contractEOAs.push({
              contractAddress: owner,
              contractOwner,
              tokens: balances,
            });
            progress.analytics.contractEOAs.add(owner);
          } else if (await isSafe(owner)) {
            data.gnosisSafeContracts.push({
              safeAddress: owner,
              tokens: balances,
            });
            progress.analytics.gnosisSafes.add(owner);
          } else {
            data.contractHolders[owner] = balances;
            progress.analytics.contractHolders.add(owner);
          }
        } else {
          data.regularHolders[owner] = balances;
          progress.analytics.regularHolders.add(owner);
        }
      }

      // Update analytics
      progress.analytics.totalProcessed++;
      progress.processedOwners.push(owner);

      // Save periodically
      if (Date.now() - lastSaveTime > SAVE_INTERVAL) {
        saveProgress(progress, data);
        lastSaveTime = Date.now();
        console.log(
          `Progress: ${progress.processedOwners.length}/${nftOwners.length} owners processed`
        );
        console.log(
          `Regular holders: ${progress.analytics.regularHolders.size}`
        );
        console.log(
          `Contract holders: ${progress.analytics.contractHolders.size}`
        );
        console.log(`Contract EOAs: ${progress.analytics.contractEOAs.size}`);
        console.log(`Gnosis Safes: ${progress.analytics.gnosisSafes.size}`);
        console.log(
          `Special Address Holdings:`,
          progress.analytics.specialAddresses
        );
        if (progress.analytics.errors.length > 0) {
          console.log(
            `Errors encountered: ${progress.analytics.errors.length}`
          );
        }
      }
    } catch (error) {
      progress.analytics.errors.push({
        address: owner,
        error: error.message,
      });
      console.error(`Error processing ${owner}:`, error);
    }
  }

  // Final save
  saveProgress(progress, data);
  return { data, analytics: progress.analytics };
}

async function main() {
  //write block number
  writeBlockNumber("forgeItems", ethers);

  try {
    initializeFiles();
    const allNfts = await getForgeData();
    console.log("Classifying and saving data...");
    const { data, analytics } = await classifyAndSaveData(allNfts);

    console.log("\nFinal Analytics:");
    console.log("Total Processed:", analytics.totalProcessed);
    console.log("Unique Regular Holders:", analytics.regularHolders.size);
    console.log("Unique Contract Holders:", analytics.contractHolders.size);
    console.log("Unique Contract EOAs:", analytics.contractEOAs.size);
    console.log("Unique Gnosis Safes:", analytics.gnosisSafes.size);
    console.log("\nSpecial Address Holdings:");
    console.log(analytics.specialAddresses);
    if (analytics.errors.length > 0) {
      console.log("\nErrors encountered:", analytics.errors.length);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
