/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { itemTypes } = require("./venlyItemTypes");

const { wearablesSvgs, sleevesSvgs } = require("../svgs/venlyWearables");

const gasPrice = 2000000000;

let signer;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasLimit = 15000000;

async function main() {
  const itemManager = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  let owner = itemManager;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Equipping items");
  const itemsFacet = (
    await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )
  ).connect(signer);

  await itemsFacet.equipWearables("2575", [
    207, //body
    209, // face
    208, //eyes
    206, //head
    0, //hand left
    0, //hand right
    0, //pet
    0, //bg
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);

  const svgFacet = (
    await ethers.getContractAt("SvgFacet", diamondAddress)
  ).connect(signer);

  const svg = await svgFacet.getAavegotchiSvg("2575");

  console.log("svg:", svg);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
