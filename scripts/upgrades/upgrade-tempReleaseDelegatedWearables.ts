import { ethers, network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import {
  impersonate,
  maticDiamondAddress,
  maticDiamondUpgrader,
} from "../helperFunctions";

// New imports for fetching subgraph data
import { GraphQLClient, gql } from "graphql-request";
import { LedgerSigner } from "@anders-t/ethers-ledger";

// Small helper to chunk an array
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  const uri = process.env.SUBGRAPH_CORE_MATIC;
  if (!uri) {
    throw new Error("SUBGRAPH_CORE_MATIC environment variable not set");
  }

  const client = new GraphQLClient(uri);

  // Fetch all depositIds where `isReleased` is false
  const query = gql`
    {
      tokenCommitments(where: { isReleased: false }) {
        depositId
      }
    }
  `;

  const response = await client.request<{
    tokenCommitments: { depositId: string }[];
  }>(query);
  const depositIds: string[] = response.tokenCommitments.map(
    (c) => c.depositId
  );

  console.log(`Fetched ${depositIds.length} unreleased depositIds`);

  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  let itemRolesRegistryFacet = await ethers.getContractAt(
    "ItemsRolesRegistryFacet",
    maticDiamondAddress
  );

  if (testing) {
    itemRolesRegistryFacet = await impersonate(
      maticDiamondUpgrader,
      itemRolesRegistryFacet,
      ethers,
      network
    );
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
    itemRolesRegistryFacet = itemRolesRegistryFacet.connect(signer);
  } else throw Error("Incorrect network selected");

  for (let i = 0; i < depositIds.length; i++) {
    const id = depositIds[i];
    console.log(
      `\nReleasing depositId ${i + 1}/${depositIds.length} (size: ${id})`
    );

    const tx = await itemRolesRegistryFacet.releaseTokens(id);
    console.log(`  → releaseTokens(${id})  tx: ${tx.hash}`);
    await tx.wait();
  }

  console.log("\nAll unreleased deposits have been processed.");
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
