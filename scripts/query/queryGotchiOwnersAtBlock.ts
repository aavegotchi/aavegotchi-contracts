import axios from "axios";
import { maticGraphUrl } from "./queryAavegotchis";

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

  // Save the results to a file
  const fs = require("fs");

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

    // Prepare data for airdrop.csv
    const airdropData = new Map<string, number>();

    ["lastMonth", "lastSixMonths", "lastYear"].forEach((groupName) => {
      const group = ownershipGroups[groupName as keyof typeof ownershipGroups];
      group.forEach((count, owner) => {
        airdropData.set(owner, (airdropData.get(owner) || 0) + count);
      });
    });

    // Convert Map to array and sort by count (descending)
    const sortedAirdropData = Array.from(airdropData.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    // Prepare CSV content
    let csvContent = "address,gotchi_count\n";
    sortedAirdropData.forEach(([address, count]) => {
      csvContent += `${address},${count}\n`;
    });

    // Write to airdrop.csv
    fs.writeFileSync("airdrop.csv", csvContent);
    console.log("Airdrop data saved to airdrop.csv");

    // Write to airdrop.json
    const jsonContent = JSON.stringify(
      Object.fromEntries(sortedAirdropData),
      null,
      2
    );
    fs.writeFileSync("airdrop.json", jsonContent);
    console.log("Airdrop data saved to airdrop.json");
  }

  // Convert Maps to objects for JSON serialization
  const ownershipObject = Object.fromEntries(
    Object.entries(ownershipGroups).map(([key, value]) => [
      key,
      Object.fromEntries(value),
    ])
  );

  fs.writeFileSync(
    "gotchiOwnersByInteraction.json",
    JSON.stringify(ownershipObject, null, 2)
  );

  console.log("Results saved to gotchiOwnersByInteraction.json");
}

// Modified main execution function
async function main() {
  try {
    // const blockNumberInput = await getUserInput("Enter the block number: ");
    const blockNumber = 63675732; //parseInt(blockNumberInput, 10);

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
