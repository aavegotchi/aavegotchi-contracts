import axios from "axios";
import { maticGraphUrl } from "./queryAavegotchis";
import readline from "readline";

interface Aavegotchi {
  id: string;
  originalOwner: {
    id: string;
  };
  lastInteracted: string;
}

interface QueryResult {
  aavegotchis: Aavegotchi[];
}

async function queryAllGotchiOwners(blockNumber: number) {
  const pageSize = 1000; // GraphQL query limit
  const totalGotchis = 25000;
  let lastId = "";
  const allAavegotchis: Aavegotchi[] = [];

  while (allAavegotchis.length < totalGotchis) {
    const query = `
      query {
        aavegotchis(
          first: ${pageSize}, 
          where: { id_gt: "${lastId}", status: "3" }, 
          orderBy: id,
          block: { number: ${blockNumber} }
        ) {
          id
          originalOwner {
            id
          }
          lastInteracted
        }
      }
    `;

    try {
      const response = await axios.post<{ data: QueryResult }>(maticGraphUrl, {
        query,
      });
      const aavegotchis = response.data.data.aavegotchis;

      if (aavegotchis.length === 0) break;

      allAavegotchis.push(...aavegotchis);
      lastId = aavegotchis[aavegotchis.length - 1].id;

      console.log(`Fetched ${allAavegotchis.length} Aavegotchis with status 3`);
    } catch (error) {
      console.error("Error fetching data:", error);
      break;
    }
  }

  console.log(`Total Aavegotchis fetched: ${allAavegotchis.length}`);

  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const ownershipGroups = {
    lastMonth: new Map<string, number>(),
    lastSixMonths: new Map<string, number>(),
    lastYear: new Map<string, number>(),
    moreThanYear: new Map<string, number>(),
  };

  const groupTotals = {
    lastMonth: 0,
    lastSixMonths: 0,
    lastYear: 0,
    moreThanYear: 0,
  };

  allAavegotchis.forEach((gotchi) => {
    const ownerId = gotchi.originalOwner.id;
    const lastInteracted = new Date(parseInt(gotchi.lastInteracted) * 1000);

    let group: keyof typeof ownershipGroups;

    if (lastInteracted >= oneMonthAgo) {
      group = "lastMonth";
    } else if (lastInteracted >= sixMonthsAgo) {
      group = "lastSixMonths";
    } else if (lastInteracted >= oneYearAgo) {
      group = "lastYear";
    } else {
      group = "moreThanYear";
    }

    ownershipGroups[group].set(
      ownerId,
      (ownershipGroups[group].get(ownerId) || 0) + 1
    );
    groupTotals[group]++;
  });

  console.log("\nOwnership Summary by Interaction Time:");
  for (const [groupName, group] of Object.entries(ownershipGroups)) {
    console.log(`\n${groupName}:`);
    console.log(`Total unique owners: ${group.size}`);
    console.log(
      `Total Aavegotchis in this group: ${
        groupTotals[groupName as keyof typeof groupTotals]
      }`
    );
    console.log("Top 10 owners by Aavegotchi count:");

    const sortedOwners = Array.from(group.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedOwners.forEach(([owner, count], index) => {
      console.log(`${index + 1}. Owner: ${owner}, Aavegotchis: ${count}`);
    });
  }

  // Convert Maps to objects for JSON serialization
  const ownershipObject = Object.fromEntries(
    Object.entries(ownershipGroups).map(([key, value]) => [
      key,
      Object.fromEntries(value),
    ])
  );

  // Save the results to a file
  const fs = require("fs");
  fs.writeFileSync(
    "gotchiOwnersByInteraction.json",
    JSON.stringify(ownershipObject, null, 2)
  );

  console.log("Results saved to gotchiOwnersByInteraction.json");
}

// New function to get user input
function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Modified main execution function
async function main() {
  try {
    const blockNumberInput = await getUserInput("Enter the block number: ");
    const blockNumber = parseInt(blockNumberInput, 10);

    if (isNaN(blockNumber)) {
      throw new Error("Invalid block number");
    }

    await queryAllGotchiOwners(blockNumber);
    process.exit(0);
  } catch (error) {
    console.error("Unhandled error:", error);
    process.exit(1);
  }
}

// Execute the script
main();
