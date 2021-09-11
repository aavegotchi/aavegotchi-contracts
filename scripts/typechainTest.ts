/* global ethers hre */
import { ethers } from "hardhat";

import { OwnershipFacet } from "../typechain/OwnershipFacet";

const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

async function main() {
  const diamond = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;

  const owner = await diamond.owner();
  console.log("Owner:  ", owner);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
