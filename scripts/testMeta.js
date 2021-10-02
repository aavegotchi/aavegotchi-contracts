/* global ethers hre */

const { threadId } = require("worker_threads");

// AavegotchiDiamond on matic
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
async function main() {
  const meta = await ethers.getContractAt("MetaDataFacet", diamondAddress);
  const data = await meta._tokenURI(1484);
  console.log(data);
}

main();
