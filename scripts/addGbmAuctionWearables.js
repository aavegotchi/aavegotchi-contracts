/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { itemTypes } = require("./gbmAuctionItemTypes");
const { wearablesSvgs, sleevesSvgs } = require("../svgs/gbmWearables");
const { impersonate } = require("./helperFunctions");

console.log("sleeves:", sleevesSvgs);

let signer;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasLimit = 15000000;

async function uploadSvgs(svgs, svgType) {
  let svgFacet = (
    await ethers.getContractAt("SvgFacet", diamondAddress)
  ).connect(signer);
  function setupSvg(...svgData) {
    const svgTypesAndSizes = [];
    const svgItems = [];
    for (const [svgType, svg] of svgData) {
      svgItems.push(svg.join(""));
      svgTypesAndSizes.push([
        ethers.utils.formatBytes32String(svgType),
        svg.map((value) => value.length),
      ]);
    }
    return [svgItems.join(""), svgTypesAndSizes];
  }

  // eslint-disable-next-line no-unused-vars
  function printSizeInfo(svgTypesAndSizes) {
    console.log("------------- SVG Size Info ---------------");
    let sizes = 0;
    for (const [svgType, size] of svgTypesAndSizes) {
      console.log(ethers.utils.parseBytes32String(svgType) + ":" + size);
      for (const nextSize of size) {
        sizes += nextSize;
      }
    }
    console.log("Total sizes:" + sizes);
  }

  console.log("Uploading ", svgs.length, " svgs");
  let svg, svgTypesAndSizes;
  console.log("Number of svg:" + svgs.length);
  let svgItemsStart = 0;
  let svgItemsEnd = 0;
  while (true) {
    let itemsSize = 0;
    while (true) {
      if (svgItemsEnd === svgs.length) {
        break;
      }
      itemsSize += svgs[svgItemsEnd].length;
      if (itemsSize > 24576) {
        break;
      }
      svgItemsEnd++;
    }
    [svg, svgTypesAndSizes] = setupSvg([
      svgType,
      svgs.slice(svgItemsStart, svgItemsEnd),
    ]);
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`);
    printSizeInfo(svgTypesAndSizes);
    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, {
      gasLimit: gasLimit,
    });
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log(svgItemsEnd, svg.length);
    if (svgItemsEnd === svgs.length) {
      break;
    }
    svgItemsStart = svgItemsEnd;
  }
}

async function main() {
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let owner = itemManager;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }
  let tx;
  let receipt;
  // let itemsTransferFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress)).connect(signer)
  let daoFacet = (
    await ethers.getContractAt("DAOFacet", diamondAddress)
  ).connect(signer);
  let svgFacet = (
    await ethers.getContractAt("SvgFacet", diamondAddress)
  ).connect(signer);
  console.log("Adding items", 0, "to", itemTypes.length);

  tx = await daoFacet.addItemTypes(itemTypes);

  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Items were added:", tx.hash);

  await uploadSvgs(wearablesSvgs, "wearables");
  await uploadSvgs(
    sleevesSvgs.map((value) => value.svg),
    "sleeves"
  );

  let sleevesSvgId = 28;
  let sleeves = [];
  for (const sleeve of sleevesSvgs) {
    sleeves.push({
      sleeveId: sleevesSvgId,
      wearableId: sleeve.id,
    });
    sleevesSvgId++;
  }
  console.log("Associating sleeves svgs with body wearable svgs.");
  tx = await svgFacet.setSleeves(sleeves, { gasLimit: gasLimit });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Sleeves associated:", tx.hash);

  const itemIds = [];
  const quantities = [];
  for (const itemType of itemTypes) {
    itemIds.push(itemType.svgId);
    quantities.push(itemType.maxQuantity);
  }

  console.log("Mint prize items");

  const itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    diamondAddress
  );
  let coderdan = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";

  tx = await daoFacet.mintItems(coderdan, itemIds, quantities);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }

  console.log("Prize items minted:", tx.hash);

  //Impersonate coderdan

  const impersonatedItems = await impersonate(coderdan, itemsFacet);

  let equipIds = [203, 0, 202, 0, 201, 205, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  await impersonatedItems.equipWearables("1484", equipIds);

  const svg = await svgFacet.getAavegotchiSvg("1484");

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
