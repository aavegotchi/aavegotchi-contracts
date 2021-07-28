/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { itemTypes } = require("./venlyItemTypes");

const { wearablesSvgs, sleevesSvgs } = require("../svgs/venlyWearables");

const gasPrice = 2000000000;

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
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }
  let tx;
  let receipt;

  let daoFacet = (
    await ethers.getContractAt("DAOFacet", diamondAddress)
  ).connect(signer);
  let svgFacet = (
    await ethers.getContractAt("SvgFacet", diamondAddress)
  ).connect(signer);
  console.log("Adding items", 0, "to", itemTypes.length);

  tx = await daoFacet.addItemTypes(itemTypes, { gasPrice: gasPrice });

  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Items were added:", tx.hash);

  console.log("Upload SVGs");
  await uploadSvgs(wearablesSvgs, "wearables", { gasPrice: gasPrice });

  /*await uploadSvgs(
    sleevesSvgs.map((value) => value.svg),
    "sleeves",
    { gasPrice: gasPrice }
  );
  */

  /*
  let sleevesSvgId = 28;
  let sleeves = [];
  for (const sleeve of sleevesSvgs) {
    sleeves.push({
      sleeveId: sleevesSvgId,
      wearableId: sleeve.id,
    });
    sleevesSvgId++;
  }
  */

  /*
  console.log("Associating sleeves svgs with body wearable svgs.");
  tx = await svgFacet.setSleeves(sleeves, {
    gasLimit: gasLimit,
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Sleeves associated:", tx.hash);
  */

  const itemIds = [];
  const quantities = [];
  itemTypes.forEach((itemType) => {
    itemIds.push(itemType.svgId);
    quantities.push(itemType.maxQuantity);
  });

  console.log("itemids", itemIds);
  console.log("quantities:", quantities);

  console.log("Mint prize items to itemManager");

  const coderdan = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";

  tx = await daoFacet.mintItems(coderdan, itemIds, quantities, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }

  console.log("Prize items minted:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
