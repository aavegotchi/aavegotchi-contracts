import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { ADDRESSES } from "./constants";

import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";

async function main() {
  const [signer] = await ethers.getSigners();
  const testing = ["hardhat", "localhost"].includes(network.name);
  const owner = await diamondOwner(ADDRESSES.forgeDiamond, ethers);

  // Attach to the Forge diamond facets we need
  let forgeViewsFacet = (await ethers.getContractAt(
    "ForgeViewsFacet",
    ADDRESSES.forgeDiamond
  )) as any;
  let forgeFacet = (await ethers.getContractAt(
    "ForgeFacet",
    ADDRESSES.forgeDiamond
  )) as any;

  if (testing) {
    forgeFacet = await impersonate(owner, forgeFacet, ethers, network);
  } else {
    forgeFacet = await ethers.getContractAt(
      "ForgeFacet",
      ADDRESSES.forgeDiamond,
      new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0")
    );
  }

  const TOTAL_IDS = 25_000; // Maximum gotchi supply on Polygon
  const QUERY_BATCH_SIZE = 1_000;
  const SETTLE_BATCH_SIZE = 500;

  const gotchisWithSkill: number[] = [];

  console.log(`Scanning ${TOTAL_IDS} gotchi IDs for smithing skill points…`);

  for (let start = 0; start < TOTAL_IDS; start += QUERY_BATCH_SIZE) {
    const batchIds: number[] = Array.from(
      { length: QUERY_BATCH_SIZE },
      (_, i) => start + i
    );
    const batchIdsBN = batchIds.map((id) => BigNumber.from(id));

    // Fetch smithing skill points for this batch
    const skills: BigNumber[] =
      await forgeViewsFacet.batchGetGotchiSmithingSkillPoints(batchIdsBN);

    skills.forEach((sp, idx) => {
      if (sp.gt(0)) {
        gotchisWithSkill.push(batchIds[idx]);
      }
    });

    console.log(
      `Processed IDs ${start}–${
        start + QUERY_BATCH_SIZE - 1
      }. Total with skills so far: ${gotchisWithSkill.length}`
    );
  }

  if (gotchisWithSkill.length === 0) {
    console.log(
      "No gotchis with smithing skill points found – nothing to settle."
    );
    return;
  }

  console.log(
    `Found ${gotchisWithSkill.length} gotchis with smithing skills > 0.`
  );
  console.log("Settling forge queues in batches of 20…");

  for (
    let start = 0;
    start < gotchisWithSkill.length;
    start += SETTLE_BATCH_SIZE
  ) {
    const chunk = gotchisWithSkill.slice(start, start + SETTLE_BATCH_SIZE);

    console.log(`Settling gotchi IDs: [${chunk.join(", ")}]`);
    const tx = await forgeFacet.forceClaimForgeQueueItems(chunk, {
      gasPrice: gasPrice,
    });
    console.log(`  ➜ Tx submitted: ${tx.hash}`);
    await tx.wait();
    console.log("  ✓ Settled");
  }

  console.log("All unfinished forges have been settled.");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
