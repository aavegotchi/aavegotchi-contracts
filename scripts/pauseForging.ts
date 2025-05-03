import { ethers, network } from "hardhat";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { impersonate, maticForgeDiamond } from "./helperFunctions";

export async function pauseForging() {
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  let forgeDiamond;

  if (testing) {
    const forgeDiamondOwner = await getOwner(maticForgeDiamond);
    forgeDiamond = await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      maticForgeDiamond
    );
    forgeDiamond = await impersonate(
      forgeDiamondOwner,
      forgeDiamond,
      ethers,
      network
    );
  } else if (network.name === "matic") {
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  let tx = await forgeDiamond.toggleForging();
  await tx.wait();
  console.log("Forging paused at txn", tx.hash);
  console.log("Forging paused");
}

async function getOwner(address: string) {
  const ownershipFacet = await ethers.getContractAt("OwnershipFacet", address);
  const owner = await ownershipFacet.owner();
  return owner;
}

if (require.main === module) {
  pauseForging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
