import { GraphQLClient, gql } from "graphql-request";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { ADDRESSES } from "./constants";

dotenv.config();

const LENDINGS_OUTPUT_DIR = path.join(__dirname, "lendings");
const OUTPUT_FILE = path.join(LENDINGS_OUTPUT_DIR, "unfinishedLendings.json");
const PROGRESS_FILE = path.join(LENDINGS_OUTPUT_DIR, "progress.json");
const BATCH_SIZE = 30;

interface Lending {
  id: string;
}

interface Progress {
  lastProcessedIndex: number;
  lastProcessedLendingId: string | null;
}

async function fetchUnfinishedLendings() {
  const uri = process.env.SUBGRAPH_CORE_MATIC;
  if (!uri) {
    throw new Error("SUBGRAPH_CORE_MATIC environment variable not set");
  }
  const client = new GraphQLClient(uri);

  const allLendingIds: string[] = [];
  let skip = 0;
  const first = 1000;
  let hasMore = true;

  console.log("Starting to fetch unfinished Gotchi lendings...");

  while (hasMore) {
    const query = gql`
      {
        gotchiLendings(
          first: ${first}
          skip: ${skip}
          where: { completed: false, cancelled: false }
        ) {
          id
        }
      }
    `;

    try {
      const response = await client.request<{ gotchiLendings: Lending[] }>(
        query
      );
      const lendings = response.gotchiLendings;

      if (lendings.length > 0) {
        lendings.forEach((lending) => {
          allLendingIds.push(lending.id);
        });
        console.log(
          `Fetched ${lendings.length} lendings, total so far: ${allLendingIds.length}`
        );
        skip += first;
      } else {
        hasMore = false;
      }

      if (lendings.length < first) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching lendings at skip ${skip}:`, error);
      hasMore = false; // Stop on error
    }
  }

  return allLendingIds;
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
    return JSON.parse(data);
  }
  return { lastProcessedIndex: -1, lastProcessedLendingId: null };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  console.log(
    `Progress saved. Last processed index: ${progress.lastProcessedIndex}`
  );
}

async function main() {
  // Step 1: Fetch and save all lending IDs
  const lendingIds = await fetchUnfinishedLendings();
  console.log(`\nTotal unfinished lendings found: ${lendingIds.length}`);

  if (!fs.existsSync(LENDINGS_OUTPUT_DIR)) {
    fs.mkdirSync(LENDINGS_OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${LENDINGS_OUTPUT_DIR}`);
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(lendingIds, null, 2));
  console.log(
    `Successfully saved ${lendingIds.length} lending IDs to ${OUTPUT_FILE}`
  );

  if (lendingIds.length === 0) {
    console.log("No lendings to process. Exiting.");
    return;
  }

  // Step 2: Process lendings in batches
  console.log("\nStarting to force-end lendings in batches...");
  const progress = loadProgress();

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const gotchiLendingFacet = await ethers.getContractAt(
    "GotchiLendingFacet",
    ADDRESSES.aavegotchiDiamond,
    signer
  );

  const startIndex = progress.lastProcessedIndex + 1;
  if (startIndex >= lendingIds.length) {
    console.log("All lendings have already been processed.");
    return;
  }

  console.log(
    `Resuming from index ${startIndex}. Last processed ID was ${
      progress.lastProcessedLendingId || "None"
    }.`
  );

  for (let i = startIndex; i < lendingIds.length; i += BATCH_SIZE) {
    const batch = lendingIds.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(lendingIds.length / BATCH_SIZE);

    if (batch.length === 0) continue;

    console.log(
      `\nProcessing batch ${batchNumber}/${totalBatches} (IDs ${batch[0]} to ${
        batch[batch.length - 1]
      })`
    );

    try {
      const uint32Batch = batch.map((id) => parseInt(id, 10)); // Convert string IDs to uint32
      const tx = await gotchiLendingFacet.batchForceEndGotchiLending(
        uint32Batch
      );
      console.log(
        `Transaction sent for batch ${batchNumber}. Hash: ${tx.hash}`
      );
      await tx.wait();
      console.log(`Transaction for batch ${batchNumber} confirmed.`);

      // Update progress
      progress.lastProcessedIndex = i + batch.length - 1;
      progress.lastProcessedLendingId = batch[batch.length - 1];
      saveProgress(progress);
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error);
      console.log(
        "Stopping script due to error. Rerun to resume from last successful batch."
      );
      process.exit(1);
    }
  }

  console.log("\nAll lendings processed successfully.");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
