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
  AAVEGOTCHI_WEARABLES_DIR,
  writeBlockNumber,
} from "./constants";

dotenv.config();

interface WearableOwner {
  owner: string;
  balance: string;
}

interface AggregatedOwnership {
  [owner: string]: TokenBalance[];
}

// NEW: track progress by processed addresses instead of token IDs
interface AddressProgress {
  completedAddresses: string[];
}

interface TokenStatistics {
  [tokenId: string]: {
    regularHolders: number;
    contractHolders: number;
    contractEOAs: number;
    gnosisSafes: number;
    vaultHoldings: number;
    gbmHoldings: number;
    diamondHoldings: number;
    forgeDiamondHoldings: number;
  };
}

// Add new interface for raw data
interface RawHolderData {
  [tokenId: string]: WearableOwner[];
}

const FILES = {
  regularHolders: path.join(AAVEGOTCHI_WEARABLES_DIR, "wearables-regular.json"),
  contractHolders: path.join(
    AAVEGOTCHI_WEARABLES_DIR,
    "wearables-contractsWithoutEOAs.json"
  ),
  vault: path.join(AAVEGOTCHI_WEARABLES_DIR, "wearables-vault.json"),
  gbmDiamond: path.join(AAVEGOTCHI_WEARABLES_DIR, "wearables-gbmDiamond.json"),
  raffles: path.join(AAVEGOTCHI_WEARABLES_DIR, "wearables-raffles.json"),
  contractEOAs: path.join(
    AAVEGOTCHI_WEARABLES_DIR,
    "wearables-contractsWithEOA.json"
  ),
  gnosisSafes: path.join(AAVEGOTCHI_WEARABLES_DIR, "wearables-safe.json"),
  aavegotchiDiamond: path.join(
    AAVEGOTCHI_WEARABLES_DIR,
    "wearables-diamond.json"
  ),
  forgeDiamond: path.join(
    AAVEGOTCHI_WEARABLES_DIR,
    "wearables-forgeDiamond.json"
  ),
};

// Add these constants
const PROGRESS_FILE = path.join(
  AAVEGOTCHI_WEARABLES_DIR,
  "fetch_progress.json"
);
const STATS_FILE = path.join(AAVEGOTCHI_WEARABLES_DIR, "token_statistics.json");

// Add new file path
const RAW_DATA_FILE = path.join(
  AAVEGOTCHI_WEARABLES_DIR,
  "raw_holder_data.json"
);

// Add mapping between file keys and data keys
const DATA_TO_FILE_MAP = {
  regularHolders: "regularHolders",
  contractHolders: "contractHolders",
  vault: "vaultHolders",
  gbmDiamond: "gbmDiamondHolders",
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
  raffles2: AddressCategory.Raffles,
  raffleOwner: AddressCategory.Regular,
  aavegotchiDiamond: AddressCategory.Diamond,
  forgeDiamond: AddressCategory.Forge,
};

// Maximum owners per balanceOfBatch call
const CHUNK_SIZE = 200;

// Helper: fetch owners per tokenId using the existing subgraph query
async function fetchOwnersPerToken(
  tokenId: string,
  first: number,
  blockNumber: number,
  client: GraphQLClient
): Promise<string[]> {
  const owners: string[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const query = gql`{
      itemType(id:"${tokenId}", block: {number:${blockNumber}}) {
        owners(first:${first}, skip:${skip}, orderBy: owner, orderDirection: desc, where:{ balance_gt:"0" }) {
          owner
        }
      }
    }`;
    try {
      const resp = await client.request(query);
      const batch = (resp.itemType?.owners as Array<{ owner: string }>) || [];
      batch.forEach((o) => owners.push(o.owner.toLowerCase()));
      if (batch.length < first) {
        hasMore = false;
      } else {
        skip += first;
      }
      await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      console.error(`Subgraph error token ${tokenId} skip ${skip}:`, e);
      hasMore = false;
    }
  }
  return owners;
}

// Helper: balanceOfBatch with retry to withstand transient RPC failures
async function balanceOfBatchWithRetry(
  contract: any,
  owners: string[],
  ids: number[],
  blockTag?: number,
  maxAttempts = 3
): Promise<any[]> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await contract.balanceOfBatch(
        owners,
        ids,
        blockTag ? { blockTag } : {}
      );
    } catch (err) {
      attempt++;
      console.error(
        `balanceOfBatch attempt ${attempt} failed:`,
        err?.reason || err
      );
      if (attempt >= maxAttempts) throw err;
      // wait 1s * attempt before retry
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

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

  if (!fs.existsSync(AAVEGOTCHI_WEARABLES_DIR)) {
    fs.mkdirSync(AAVEGOTCHI_WEARABLES_DIR, { recursive: true });
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

function loadProgress(): AddressProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    // Backward-compat: convert old schema to new
    if (!Array.isArray(data.completedAddresses)) {
      data.completedAddresses = Array.isArray(data.completedIds)
        ? data.completedIds
        : [];
      delete data.completedIds;
    }
    return data as AddressProgress;
  }
  return { completedAddresses: [] };
}

function saveProgress(progress: AddressProgress) {
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
    diamondHoldings: data.aavegotchiDiamond.filter((t) => t.tokenId === tokenId)
      .length,
    forgeDiamondHoldings: data.forgeDiamond.filter((t) => t.tokenId === tokenId)
      .length,
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function getCumulativeStats(
  data: ReturnType<typeof loadExistingData>,
  progress: AddressProgress
) {
  return {
    regularHolders: Object.keys(data.regularHolders).length,
    contractHolders: Object.keys(data.contractHolders).length,
    contractEOAs: data.contractEOAs.length,
    gnosisSafes: data.gnosisSafeContracts.length,
    vaultHoldings: data.vaultHolders.length,
    gbmHoldings: data.gbmDiamondHolders.length,
    diamondHoldings: data.aavegotchiDiamond.length,
    totalTokensProcessed: progress.completedAddresses.length,
    forgeDiamondHoldings: data.forgeDiamond.length,
  };
}

// New helper: discover all unique holder addresses via the subgraph
async function fetchAllUniqueAddresses(): Promise<string[]> {
  const blockNumber = await writeBlockNumber("wearables", ethers);
  const first = 5000;
  const client = new GraphQLClient(process.env.SUBGRAPH_CORE_MATIC);

  const addresses = new Set<string>();
  const allWearableIds = Array.from({ length: 417 }, (_, i) =>
    (i + 1).toString()
  );

  for (const wearableId of allWearableIds) {
    console.log(`Discovering owners for wearable ID ${wearableId}`);
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const query = gql`{
        itemType(id: "${wearableId}", block: {number:${blockNumber}}) {
          owners(first: ${first}, skip: ${skip}, orderBy: owner, orderDirection: desc, where: { balance_gt: "0" }) {
            owner
          }
        }
      }`;

      try {
        const resp = await client.request(query);
        const owners =
          (resp.itemType?.owners as Array<{ owner: string }>) || [];
        owners.forEach((o) => addresses.add(o.owner.toLowerCase()));
        if (owners.length < first) {
          hasMore = false;
        } else {
          skip += first;
        }
        await new Promise((res) => setTimeout(res, 50));
      } catch (err) {
        console.error(
          `Subgraph query failed for wearable ${wearableId} at skip ${skip}:`,
          err
        );
        hasMore = false; // break out on error to continue with next id
      }
    }
  }

  console.log(`Discovered ${addresses.size} unique holder addresses`);
  return Array.from(addresses);
}

// Re-implement fetchAllHolderData using balanceOfBatch batching
async function fetchAllHolderData() {
  if (!fs.existsSync(AAVEGOTCHI_WEARABLES_DIR)) {
    fs.mkdirSync(AAVEGOTCHI_WEARABLES_DIR, { recursive: true });
  }

  let rawData: RawHolderData = {};
  if (fs.existsSync(RAW_DATA_FILE)) {
    rawData = JSON.parse(fs.readFileSync(RAW_DATA_FILE, "utf8"));
  }

  const client = new GraphQLClient(process.env.SUBGRAPH_CORE_MATIC);
  const blockNumber = await writeBlockNumber("wearables", ethers);
  const itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    ADDRESSES.aavegotchiDiamond
  );

  for (let id = 1; id <= 417; id++) {
    const tokenId = id.toString();
    console.log(`Fetching holders & balances for wearable ${tokenId}`);

    // 1. discover owners via subgraph
    const owners = await fetchOwnersPerToken(
      tokenId,
      5000,
      blockNumber,
      client
    );
    if (owners.length === 0) continue;

    // 2. batch on-chain balance fetch
    const batches = Math.ceil(owners.length / CHUNK_SIZE);
    for (let b = 0; b < batches; b++) {
      const slice = owners.slice(b * CHUNK_SIZE, (b + 1) * CHUNK_SIZE);
      const ids = new Array(slice.length).fill(id);
      try {
        const balances: any[] = await balanceOfBatchWithRetry(
          itemsFacet,
          slice,
          ids,
          blockNumber
        );
        balances.forEach((bal: any, idx: number) => {
          const balNum = parseInt(bal.toString());
          if (balNum > 0) {
            if (!rawData[tokenId]) rawData[tokenId] = [];
            rawData[tokenId].push({
              owner: slice[idx].toLowerCase(),
              balance: balNum.toString(),
            });
          }
        });
      } catch (err) {
        console.error(
          `balanceOfBatch failed token ${tokenId} batch ${b}:`,
          err
        );
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    // Save after each token processed
    fs.writeFileSync(RAW_DATA_FILE, JSON.stringify(rawData, null, 2));
    console.log(
      `Saved token ${tokenId} data with ${
        rawData[tokenId]?.length || 0
      } holders.`
    );
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
          // Instead of adding to rafflesHolders, add to regularHolders under the new owner
          if (!data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()]) {
            data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()] = [];
          }
          data.regularHolders[ADDRESSES.raffleOwner.toLowerCase()].push(
            tokenBalance
          );
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
    for (const fileMapKey of Object.keys(DATA_TO_FILE_MAP) as Array<
      keyof typeof DATA_TO_FILE_MAP
    >) {
      const dataPropertyKey = DATA_TO_FILE_MAP[fileMapKey];
      const filePath = FILES[fileMapKey];
      fs.writeFileSync(
        filePath,
        JSON.stringify(data[dataPropertyKey], null, 2)
      );
    }
  }

  return { data, stats };
}

// Modified main function
async function main() {
  console.log("Step 1: Fetching all holder data...");
  //write block number
  const rawData = await fetchAllHolderData();

  console.log("\nStep 2: Classifying holders...");
  const { data } = await classifyHolders(rawData);

  //delete raw data
  // fs.unlinkSync(RAW_DATA_FILE);

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
