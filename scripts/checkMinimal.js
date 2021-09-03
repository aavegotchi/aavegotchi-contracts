/* global ethers */
const { LedgerSigner } = require("@ethersproject/hardware-wallets");
//const { ethers } = require("ethers");
const {
  addGotchiMinimal,
} = require("../scripts/upgrades/upgrade-addAavegotchiMinimal.js");

async function main() {
  console.log("adding new function");
  await addGotchiMinimal();
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const gameFacet = await ethers.getContractAt(
    "AavegotchiGameFacet",
    diamondAddress
  );
  const minimalDetails = await gameFacet.aaveGotchiMinimal(6845);
  console.log(minimalDetails.toString());
}

main()
  .then(() => console.log("completed"))
  .catch((error) => {
    console.error(error);
  });
