import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { AavegotchiFacet } from "../../typechain";
import dotenv from "dotenv";
import { BigNumber } from "ethers";
import { AAVEGOTCHI_METADATA_DIR, writeBlockNumber } from "./constants";

dotenv.config();

export interface AavegotchiInfo {
  name: string;
  owner: string;
  randomNumber: BigNumber;
  status: number; // 0 == portal, 1 == VRF_PENDING, 2 == open portal, 3 == Aavegotchi
  numericTraits: number[]; // [Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
  temporaryTraitBoosts: number[]; // [Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
  equippedWearables: number[]; // The currently equipped wearables of the Aavegotchi
  collateralType: string;
  escrow: string; // The escrow address this Aavegotchi manages
  minimumStake: BigNumber; // The minimum amount of collateral that must be staked. Set upon creation
  usedSkillPoints: BigNumber; // The number of skill points this aavegotchi has already used
  experience: BigNumber; // How much XP this Aavegotchi has accrued. Begins at 0
  interactionCount: BigNumber; // How many times the owner of this Aavegotchi has interacted with it
  claimTime: number; // The block timestamp when this Aavegotchi was claimed
  lastTemporaryBoost: number;
  hauntId: number;
  lastInteracted: number; // The last time this Aavegotchi was interacted with
  locked: boolean;
  items: number[]; // Array of item IDs owned by this Aavegotchi
  respecCount: BigNumber;
  baseRandomNumber: BigNumber;
}

interface AavegotchiMetadataMap {
  [tokenId: string]: AavegotchiInfo;
}

interface Progress {
  lastCompletedBatch: number;
  fetchedIds: number[];
}

const BATCH_SIZE = 20; // Number of Aavegotchis to fetch per batch
const MAX_RETRIES = 3;
const TOTAL_AAVEGOTCHIS = 25000;

const PROGRESS_FILE = `${AAVEGOTCHI_METADATA_DIR}/fetch_progress.json`;

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const OUTPUT_FILE = path.join(
  AAVEGOTCHI_METADATA_DIR,
  "aavegotchiMetadata.json"
);

async function main() {
  const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const contract = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    aavegotchiDiamondAddress
  )) as AavegotchiFacet;

  //write block number
  writeBlockNumber("aavegotchis", ethers);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(AAVEGOTCHI_METADATA_DIR)) {
    fs.mkdirSync(AAVEGOTCHI_METADATA_DIR, { recursive: true });
  }

  // Initialize or load existing metadata file
  let allAavegotchis: AavegotchiMetadataMap = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    allAavegotchis = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  }

  // Load progress if exists
  let progress: Progress = { lastCompletedBatch: -1, fetchedIds: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    console.log(`Resuming from batch ${progress.lastCompletedBatch + 1}`);
  }

  // Generate array of all token IDs
  const allTokenIds = Array.from(
    { length: TOTAL_AAVEGOTCHIS },
    (_, i) => i + 1
  );
  const remainingTokenIds = allTokenIds.filter(
    (id) => !progress.fetchedIds.includes(id)
  );
  const batches = chunk(remainingTokenIds, BATCH_SIZE);

  console.log(`Total batches to process: ${batches.length}`);

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    if (i <= progress.lastCompletedBatch) continue;

    const batch = batches[i];
    let retries = 0;
    let success = false;

    while (!success && retries < MAX_RETRIES) {
      try {
        console.log(`Fetching batch ${i + 1}/${batches.length}`);
        const batchData = await contract.batchGetBridgedAavegotchi(batch);

        // Process batch data
        batchData.forEach((gotchi, index) => {
          const tokenId = batch[index]; // Get tokenId from the batch array
          const metadata: AavegotchiInfo = {
            name: gotchi.name,
            owner: gotchi.owner,
            randomNumber: gotchi.randomNumber,
            status: gotchi.status,
            numericTraits: gotchi.numericTraits,
            temporaryTraitBoosts: gotchi.temporaryTraitBoosts,
            equippedWearables: gotchi.equippedWearables,
            collateralType: gotchi.collateralType,
            escrow: gotchi.escrow,
            minimumStake: gotchi.minimumStake,
            usedSkillPoints: gotchi.usedSkillPoints,
            experience: gotchi.experience,
            interactionCount: gotchi.interactionCount,
            claimTime: gotchi.claimTime,
            lastTemporaryBoost: gotchi.lastTemporaryBoost,
            hauntId: gotchi.hauntId,
            lastInteracted: gotchi.lastInteracted,
            locked: false,
            items: toNumbers(gotchi.items),
            respecCount: gotchi.respecCount,
            baseRandomNumber: gotchi.baseRandomNumber,
          };
          allAavegotchis[tokenId.toString()] = metadata;
        });

        // Write updated data to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allAavegotchis, null, 2));

        // Update progress
        progress.fetchedIds.push(...batch);
        progress.lastCompletedBatch = i;
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

        success = true;
        console.log(`Successfully processed and saved batch ${i + 1}`);
      } catch (error) {
        retries++;
        console.error(
          `Error processing batch ${i + 1}. Attempt ${retries}/${MAX_RETRIES}`
        );
        console.error(error);

        if (retries < MAX_RETRIES) {
          console.log("Retrying in 5 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          console.error(
            `Failed to process batch ${i + 1} after ${MAX_RETRIES} attempts`
          );
          throw error;
        }
      }
    }
  }

  console.log("Finished fetching all Aavegotchi data!");
  console.log(
    `Total Aavegotchis fetched: ${Object.keys(allAavegotchis).length}`
  );
}

function toNumbers(data: BigNumber[]): number[] {
  return data.map((item) => Number(item._hex));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
