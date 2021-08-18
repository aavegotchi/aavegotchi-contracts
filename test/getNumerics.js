const { ethers } = require("hardhat");

let aavegotchiDiamondAddress,
  gotchiFacet,
  owner,
  testAdd,
  shopFacet,
  vrfFacet,
  eachAverage,
  aavegotchiGameFacet;
const allPortals = [
  "10000",
  "10001",
  "10002",
  "10003",
  "10004",
  "10005",
  "10006",
  "10007",
  "10008",
  "10009",
];

const averageArr = [];

function avr(arr) {
  var totalS = 0;
  for (var i in arr) {
    totalS += arr[i];
  }
  return totalS / arr.length;
}

aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
testAdd = "0x18376b013Ff6f238E9cdd9c1e72E2085197E525D";
const tokenId = 10029;

async function main() {
  signer = await ethers.provider.getSigner(owner);
  signer2 = await ethers.provider.getSigner(testAdd);
  aavegotchiGameFacet = (
    await ethers.getContractAt("AavegotchiGameFacet", aavegotchiDiamondAddress)
  ).connect(signer2);

  shopFacet = (
    await ethers.getContractAt("ShopFacet", aavegotchiDiamondAddress)
  ).connect(signer);
  vrfFacet = (
    await ethers.getContractAt("VrfFacet", aavegotchiDiamondAddress)
  ).connect(signer2);
  gotchiFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    aavegotchiDiamondAddress
  );
  for (let k = 0; k < 10; k++) {
    const aavegotchi = await gotchiFacet.getAavegotchi(allPortals[k]);
    eachAverage = avr(aavegotchi.numericTraits);
    console.log(eachAverage);
    averageArr.push(eachAverage);
  }
  console.log(avr(averageArr));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
