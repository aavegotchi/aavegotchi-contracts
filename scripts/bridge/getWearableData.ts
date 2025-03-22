import { GraphQLClient, gql } from "graphql-request";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { getOwner, isSafe } from "./classifyAavegotchi";
import {
  ADDRESSES,
  excludedAddresses,
  BASE_OUTPUT_DIR,
  TokenBalance,
  ContractOwnership,
  SafeDetails,
} from "./constants";

dotenv.config();

interface WearableOwner {
  owner: string;
  balance: string;
}

interface AggregatedOwnership {
  [owner: string]: TokenBalance[];
}

interface TokenProgress {
  completedIds: string[];
  currentId?: string;
  currentSkip?: number;
}

interface TokenStatistics {
  [tokenId: string]: {
    regularHolders: number;
    contractHolders: number;
    contractEOAs: number;
    gnosisSafes: number;
    vaultHoldings: number;
    gbmHoldings: number;
    rafflesHoldings: number;
    diamondHoldings: number;
    forgeDiamondHoldings: number;
  };
}

// Add new interface for raw data
interface RawHolderData {
  [tokenId: string]: WearableOwner[];
}

const OUTPUT_DIR = path.join(BASE_OUTPUT_DIR, "wearables");
const FILES = {
  regularHolders: path.join(OUTPUT_DIR, "wearables-regular.json"),
  contractHolders: path.join(OUTPUT_DIR, "wearables-contractsWithoutEOAs.json"),
  vault: path.join(OUTPUT_DIR, "wearables-vault.json"),
  gbmDiamond: path.join(OUTPUT_DIR, "wearables-gbmDiamond.json"),
  raffles: path.join(OUTPUT_DIR, "wearables-raffles.json"),
  contractEOAs: path.join(OUTPUT_DIR, "wearables-contractsWithEOA.json"),
  gnosisSafes: path.join(OUTPUT_DIR, "wearables-safe.json"),
  aavegotchiDiamond: path.join(OUTPUT_DIR, "wearables-diamond.json"),
  forgeDiamond: path.join(OUTPUT_DIR, "wearables-forgeDiamond.json"),
};

// Add these constants
const PROGRESS_FILE = path.join(OUTPUT_DIR, "fetch_progress.json");
const STATS_FILE = path.join(OUTPUT_DIR, "token_statistics.json");

// Add new file path
const RAW_DATA_FILE = path.join(OUTPUT_DIR, "raw_holder_data.json");

// Add mapping between file keys and data keys
const DATA_TO_FILE_MAP = {
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

// Add enum for address categories
enum AddressCategory {
  Regular = "regular",
  Contract = "contract",
  Vault = "vault",
  GBM = "gbm",
  Raffles = "raffles",
  Diamond = "diamond",
  Forge = "forge",
  ContractEOA = "contractEOA",
  Safe = "safe",
}

// Add cache interface
interface CategoryCache {
  [address: string]: {
    category: AddressCategory;
    contractOwner?: string; // Only for ContractEOA
  };
}

// Update the mapping between address keys and categories
const ADDRESS_TO_CATEGORY: Record<keyof typeof ADDRESSES, AddressCategory> = {
  vault: AddressCategory.Vault,
  gbmDiamond: AddressCategory.GBM,
  raffles: AddressCategory.Raffles,
  aavegotchiDiamond: AddressCategory.Diamond,
  forgeDiamond: AddressCategory.Forge,
};

// Initialize files function
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
    forgeDiamond: [],
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const [key, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          initialData[key as keyof typeof initialData] || {},
          null,
          2
        )
      );
      console.log(`Initialized ${filePath}`);
    }
  }
}

function loadExistingData() {
  const data = {
    regularHolders: {} as AggregatedOwnership,
    contractHolders: {} as AggregatedOwnership,
    vaultHolders: [] as TokenBalance[],
    gbmDiamondHolders: [] as TokenBalance[],
    rafflesHolders: [] as TokenBalance[],
    contractEOAs: [] as ContractOwnership[],
    gnosisSafeContracts: [] as SafeDetails[],
    aavegotchiDiamond: [] as TokenBalance[],
    forgeDiamond: [] as TokenBalance[],
  };

  // Load existing data from files
  for (const [key, filePath] of Object.entries(FILES)) {
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      data[key as keyof typeof data] = fileData;
    }
  }

  return data;
}

function loadProgress(): TokenProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  }
  return { completedIds: [] };
}

function saveProgress(progress: TokenProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function updateTokenStats(
  stats: TokenStatistics,
  tokenId: string,
  data: ReturnType<typeof loadExistingData>
) {
  stats[tokenId] = {
    regularHolders: Object.keys(data.regularHolders).length,
    contractHolders: Object.keys(data.contractHolders).length,
    contractEOAs: data.contractEOAs.length,
    gnosisSafes: data.gnosisSafeContracts.length,
    vaultHoldings: data.vaultHolders.filter((t) => t.tokenId === tokenId)
      .length,
    gbmHoldings: data.gbmDiamondHolders.filter((t) => t.tokenId === tokenId)
      .length,
    rafflesHoldings: data.rafflesHolders.filter((t) => t.tokenId === tokenId)
      .length,
    diamondHoldings: data.aavegotchiDiamond.filter((t) => t.tokenId === tokenId)
      .length,
    forgeDiamondHoldings: data.forgeDiamond.filter((t) => t.tokenId === tokenId)
      .length,
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function getCumulativeStats(
  data: ReturnType<typeof loadExistingData>,
  progress: TokenProgress
) {
  return {
    regularHolders: Object.keys(data.regularHolders).length,
    contractHolders: Object.keys(data.contractHolders).length,
    contractEOAs: data.contractEOAs.length,
    gnosisSafes: data.gnosisSafeContracts.length,
    vaultHoldings: data.vaultHolders.length,
    gbmHoldings: data.gbmDiamondHolders.length,
    rafflesHoldings: data.rafflesHolders.length,
    diamondHoldings: data.aavegotchiDiamond.length,
    totalTokensProcessed: progress.completedIds.length,
    forgeDiamondHoldings: data.forgeDiamond.length,
  };
}

// New function to fetch all holder data
async function fetchAllHolderData() {
  const first = 5000;
  const allWearableIds = Array.from({ length: 10 }, (_, i) =>
    (i + 1).toString()
  );
  const uri = process.env.SUBGRAPH_CORE_MATIC;
  const client = new GraphQLClient(uri);

  // Create directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Initialize or load raw data
  let rawData: RawHolderData = {};
  if (fs.existsSync(RAW_DATA_FILE)) {
    rawData = JSON.parse(fs.readFileSync(RAW_DATA_FILE, "utf8"));
  } else {
    fs.writeFileSync(RAW_DATA_FILE, JSON.stringify({}, null, 2));
  }

  const progress = loadProgress();

  // Filter out completed IDs
  const remainingIds = allWearableIds.filter(
    (id) => !progress.completedIds.includes(id)
  );

  for (const wearableId of remainingIds) {
    console.log(`Fetching data for wearable ID: ${wearableId}`);
    let hasMore = true;
    let skip =
      progress.currentId === wearableId ? progress.currentSkip || 0 : 0;
    let owners: WearableOwner[] = [];

    while (hasMore) {
      try {
        const response = await client.request(gql`{
          itemType(id: "${wearableId}") {
            owners(first: ${first}, skip: ${skip}, orderBy: owner, orderDirection: desc, where: { balance_gt: "0" }) {
              owner
              balance
            }
          }
        }`);

        const newOwners = response.itemType.owners;
        if (newOwners.length < first) hasMore = false;
        owners = owners.concat(newOwners);

        skip += first;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Error fetching wearable ${wearableId} at skip ${skip}:`,
          error
        );
        hasMore = false;
      }
    }

    rawData[wearableId] = owners;
    fs.writeFileSync(RAW_DATA_FILE, JSON.stringify(rawData, null, 2));
    progress.completedIds.push(wearableId);
    saveProgress(progress);
  }

  return rawData;
}

// New function to classify holders
async function classifyHolders(rawData: RawHolderData) {
  initializeFiles();
  const data = loadExistingData();
  const stats: TokenStatistics = {};
  const categoryCache: CategoryCache = {};

  // Log the addresses and their categories when pre-populating cache
  Object.entries(ADDRESSES).forEach(([key, address]) => {
    const category = ADDRESS_TO_CATEGORY[key as keyof typeof ADDRESSES];
    console.log(`Mapping ${key} (${address}) to category: ${category}`);
    categoryCache[address.toLowerCase()] = {
      category,
    };
  });

  // Log cache contents for verification
  console.log("Pre-populated cache:", categoryCache);

  for (const [wearableId, owners] of Object.entries(rawData)) {
    console.log(`Classifying holders for wearable ID: ${wearableId}`);

    for (const { owner, balance } of owners) {
      const ownerLower = owner.toLowerCase();
      const tokenBalance = {
        tokenId: wearableId,
        balance: parseInt(balance),
      };

      if (excludedAddresses.includes(ownerLower)) continue;

      // Check cache first
      if (!categoryCache[ownerLower]) {
        const code = await ethers.provider.getCode(ownerLower);
        if (code === "0x") {
          categoryCache[ownerLower] = { category: AddressCategory.Regular };
        } else {
          const contractOwner = await getOwner(ownerLower);
          if (contractOwner) {
            categoryCache[ownerLower] = {
              category: AddressCategory.ContractEOA,
              contractOwner,
            };
          } else if (await isSafe(ownerLower)) {
            categoryCache[ownerLower] = { category: AddressCategory.Safe };
          } else {
            categoryCache[ownerLower] = { category: AddressCategory.Contract };
          }
        }
      }

      // Use cached category
      const cached = categoryCache[ownerLower];
      switch (cached.category) {
        case AddressCategory.Vault:
          data.vaultHolders.push(tokenBalance);
          break;
        case AddressCategory.GBM:
          data.gbmDiamondHolders.push(tokenBalance);
          break;
        case AddressCategory.Raffles:
          data.rafflesHolders.push(tokenBalance);
          break;
        case AddressCategory.Diamond:
          data.aavegotchiDiamond.push(tokenBalance);
          break;
        case AddressCategory.Forge:
          console.log(`Adding to forge holders: ${ownerLower}`);
          data.forgeDiamond.push(tokenBalance);
          break;
        case AddressCategory.ContractEOA:
          const existingContract = data.contractEOAs.find(
            (c) => c.contractAddress === ownerLower
          );
          if (existingContract) {
            existingContract.tokens.push(tokenBalance);
          } else {
            data.contractEOAs.push({
              contractAddress: ownerLower,
              contractOwner: cached.contractOwner!,
              tokens: [tokenBalance],
            });
          }
          break;
        case AddressCategory.Safe:
          const existingSafe = data.gnosisSafeContracts.find(
            (s) => s.safeAddress === ownerLower
          );
          if (existingSafe) {
            existingSafe.tokens.push(tokenBalance);
          } else {
            data.gnosisSafeContracts.push({
              safeAddress: ownerLower,
              tokens: [tokenBalance],
            });
          }
          break;
        case AddressCategory.Contract:
          if (!data.contractHolders[ownerLower]) {
            data.contractHolders[ownerLower] = [];
          }
          data.contractHolders[ownerLower].push(tokenBalance);
          break;
        case AddressCategory.Regular:
          if (!data.regularHolders[ownerLower]) {
            data.regularHolders[ownerLower] = [];
          }
          data.regularHolders[ownerLower].push(tokenBalance);
          break;
      }
    }

    updateTokenStats(stats, wearableId, data);
    // Save data files
    for (const [fileKey, filePath] of Object.entries(FILES)) {
      const dataKey =
        DATA_TO_FILE_MAP[fileKey as keyof typeof DATA_TO_FILE_MAP];
      fs.writeFileSync(filePath, JSON.stringify(data[dataKey], null, 2));
    }
  }

  return { data, stats };
}

// Modified main function
async function main() {
  console.log("Step 1: Fetching all holder data...");
  const rawData = await fetchAllHolderData();

  console.log("\nStep 2: Classifying holders...");
  const { data } = await classifyHolders(rawData);

  //delete raw data
  fs.unlinkSync(RAW_DATA_FILE);

  const finalStats = getCumulativeStats(data, loadProgress());
  console.log("\nCumulative Statistics:");
  console.log("------------------------");
  console.log(`Total Tokens Processed: ${finalStats.totalTokensProcessed}`);
  console.log(`Regular Holders: ${finalStats.regularHolders}`);
  console.log(`Contract Holders: ${finalStats.contractHolders}`);
  console.log(`Contract EOAs: ${finalStats.contractEOAs}`);
  console.log(`Gnosis Safes: ${finalStats.gnosisSafes}`);
  console.log(`Vault Holdings: ${finalStats.vaultHoldings}`);
  console.log(`GBM Holdings: ${finalStats.gbmHoldings}`);
  console.log(`Raffles Holdings: ${finalStats.rafflesHoldings}`);
  console.log(`Diamond Holdings: ${finalStats.diamondHoldings}`);
  console.log(`Forge Diamond Holdings: ${finalStats.forgeDiamondHoldings}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
