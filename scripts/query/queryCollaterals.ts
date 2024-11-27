import { request } from "graphql-request";
import { writeToFile } from "./getAavegotchisXPData";
import { formatUnits } from "ethers/lib/utils";

const maticGraphUrl: string = process.env.SUBGRAPH_CORE_MATIC as string;

interface GotchiCollateralsRes {
  aavegotchis: {
    id: string;
    escrow: string;
    collateral: string;
    stakedAmount: string;
  }[];
}

async function getGotchiCollaterals(
  blockNumber: number,
  index: number = 0,
  useBlockNumber: boolean
): Promise<GotchiCollateralsRes> {
  const query = useBlockNumber
    ? `{
        aavegotchis(first: 1000, skip: ${index}, block: {number: ${blockNumber}}) {
          id
          escrow
          collateral
          stakedAmount
        }
      }`
    : `{
        aavegotchis(first: 1000, skip: ${index}) {
          id
          escrow
          collateral
          stakedAmount
        }
      }`;

  return request(maticGraphUrl, query);
}

async function getAllGotchiCollaterals(
  blockNumber: number,
  useBlockNumber: boolean = true
) {
  const collaterals: {
    [gotchiId: string]: {
      escrow: string;
      collateral: string;
      stakedAmount: string;
      totalWorth: string;
      collateralAddress: string;
    };
  } = {};

  const collateralTypes: Set<string> = new Set();
  const collateralTotals: {
    [collateralType: string]: {
      name: string;
      amount: string;
      price: number;
    };
  } = {};

  let index = 0;
  const gotchiCount = 25000;

  // Add collateral address to token name mapping
  const collateralToToken: {
    [address: string]: { name: string; decimals: number; price: number };
  } = {
    // Haunt 1 Tokens
    "0xe0b22e0037b130a9f56bbb537684e6fa18192341": {
      name: "maDAI",
      decimals: 18,
      price: 1.0,
    },
    "0x20d3922b4a1a8560e1ac99fba4fade0c849e2142": {
      name: "maWETH",
      decimals: 18,
      price: 2531.0,
    },
    "0x823cd4264c1b951c9209ad0deaea9988fe8429bf": {
      name: "maAAVE",
      decimals: 18,
      price: 144.0,
    },
    "0x98ea609569bd25119707451ef982b90e3eb719cd": {
      name: "maLINK",
      decimals: 18,
      price: 11.38,
    },
    "0xdae5f1590db13e3b40423b5b5c5fbf175515910b": {
      name: "maUSDT",
      decimals: 6,
      price: 1.0,
    },
    "0xe20f7d1f0ec39c4d5db01f53554f2ef54c71f613": {
      name: "maYFI",
      decimals: 18,
      price: 4740.0,
    },
    // Haunt 2 Tokens
    "0x27f8d03b3a2196956ed754badc28d73be8830a6e": {
      name: "amDAI",
      decimals: 18,
      price: 1.0,
    },
    "0x5c2ed810328349100a66b82b78a1791b101c9d61": {
      name: "amWBTC",
      decimals: 8,
      price: 70164.0,
    },
    "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4": {
      name: "amWMATIC",
      decimals: 18,
      price: 0.32,
    },
    "0x0000000000000000000000000000000000000000": {
      name: "Burn",
      decimals: 18,
      price: 1.0,
    },
    "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360": {
      name: "amAAVE",
      decimals: 18,
      price: 144.0,
    },
    "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390": {
      name: "amWETH",
      decimals: 18,
      price: 2531,
    },
    "0x60d55f02a771d515e077c9c2403a1ef324885cec": {
      name: "amUSDT",
      decimals: 6,
      price: 1.0,
    },
    "0x1a13f4ca1d028320a707d99520abfefca3998b7f": {
      name: "amUSDC",
      decimals: 6,
      price: 1.0,
    },
    "0x9719d867a500ef117cc201206b8ab51e794d3f82": {
      name: "maUSDC",
      decimals: 6,
      price: 1.0,
    },
    "0x8c8bdbe9cee455732525086264a4bf9cf821c498": {
      name: "maUNI",
      decimals: 18,
      price: 7.92,
    },
    "0xf4b8888427b00d7caf21654408b7cba2ecf4ebd9": {
      name: "maTUSD",
      decimals: 18,
      price: 1.0,
    },
  };

  while (index < gotchiCount) {
    console.log(`Fetching gotchis ${index} to ${index + 1000}`);
    const response = await getGotchiCollaterals(
      blockNumber,
      index,
      useBlockNumber
    );

    for (const gotchi of response.aavegotchis) {
      const token = collateralToToken[gotchi.collateral];

      collaterals[gotchi.id] = {
        escrow: gotchi.escrow,
        collateral: token.name,
        stakedAmount: gotchi.stakedAmount,
        totalWorth: (
          Number(formatUnits(BigInt(gotchi.stakedAmount), token.decimals)) *
          token.price
        ).toFixed(2),
        collateralAddress: gotchi.collateral,
      };

      collateralTypes.add(token.name);

      if (!collateralTotals[gotchi.collateral]) {
        collateralTotals[gotchi.collateral] = {
          name: token.name,
          amount: "0",
          price: token.price,
        };
      }
      collateralTotals[gotchi.collateral].amount = (
        BigInt(collateralTotals[gotchi.collateral].amount) +
        BigInt(gotchi.stakedAmount)
      ).toString();
    }

    index += 1000;
  }

  // Simplify the formatting since we're already using token names
  const formattedTotals = Object.entries(collateralTotals)
    .filter(
      ([collateral]) =>
        collateral !== "0x0000000000000000000000000000000000000000"
    )
    .map(([collateral, { name, amount, price }]) => ({
      collateral,
      price,
      name,
      amount: formatUnits(
        BigInt(amount),
        collateralToToken[collateral].decimals
      ),
    }))
    .sort((a, b) => a.collateral.localeCompare(b.collateral));

  console.log("\nTotal Staked by Collateral:");
  formattedTotals.forEach(({ collateral, name, amount, price }) => {
    console.log(`${name}: ${amount} tokens worth (${Number(amount)} USD)`);
  });

  // Sort gotchis by price
  const sortedGotchis = Object.entries(collaterals)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => Number(b.totalWorth) - Number(a.totalWorth)); // Sort descending (highest to lowest)

  console.log("\nTop 1000 Most Valuable Gotchis:");
  sortedGotchis
    .slice(0, 1000)
    .forEach(
      ({
        id,
        stakedAmount,
        escrow,
        collateral,
        collateralAddress,
        totalWorth,
      }) => {
        console.log("collateral:", collateral);

        console.log(
          `Gotchi #${id}: ${formatUnits(
            stakedAmount,
            collateralToToken[collateralAddress].decimals
          )} of ${collateral} worth ${totalWorth} USD`
        );
      }
    );

  // Calculate and log total worth of all gotchis
  const totalWorthUSD = sortedGotchis.reduce(
    (sum, gotchi) => sum + Number(gotchi.totalWorth),
    0
  );

  console.log(
    `\nTotal Worth of All Gotchis: $${totalWorthUSD.toLocaleString()} USD`
  );

  await writeToFile("data/collaterals.json", {
    gotchiCollaterals: collaterals,
    uniqueCollaterals: Array.from(collateralTypes),
    stakedTotals: collateralTotals,
    sortedGotchis,
    totalWorthUSD, // Also including it in the output file
  });

  return {
    gotchiCollaterals: collaterals,
    uniqueCollaterals: Array.from(collateralTypes),
    stakedTotals: collateralTotals,
    sortedGotchis,
    totalWorthUSD, // Including in the return value
  };
}

// Execute the script
getAllGotchiCollaterals(0, false)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//Ways to handle the collateral migration

// Method 1: Full Withdrawal
//Users can opt to withdraw all of the collateral from their Aavegotchi without sacrificing it.

// Method 2: Conversion
//Users must swap their collateral for an equivalent amount of GHST.

// H1 Gotchis
// Step 1: User holds enough GHST on Polygon to cover the amount of collateral their Gotchi needs (25, 50, or 100 GHST).
// Step 2: Initiate the transaction to swap out the collateral for 25, 50, or 100 GHST.
// Step 3: All of the collateral is transferred back to the end user.
// Step 4: The user can either convert their collateral back via Aave, or OTC it with Pixelcraft for the current value.

// H2 Gotchis
// Step 1: User holds enough GHST on Polygon to cover the amount of collateral their Gotchi needs (25, 50, or 100 GHST).
// Step 2: Initiate the transaction to swap out the collateral for 25, 50, or 100 GHST.
// Step 3: All of the collateral is transferred back to the end user.
// Step 4: The user then uses the Aave interface or contract on Polygon to convert their collateral back to the original token.
