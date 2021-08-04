/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { itemTypes } = require("./itemTypes/h1BackgroundType");
const { H1bgs } = require("../../svgs/h1-BackgroundSvg");

const { sendToMultisig } = require("../libraries/multisig/multisig.js");

let signer;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasLimit = 15000000;

async function uploadSvgs(svgs, svgType, testing) {
  this.timeout = 200000000;
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

  console.log("Uploading ", svgs.length, "svgs");
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
    if (testing) {
      let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, {
        gasLimit: gasLimit,
      });
      let receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log(svgItemsEnd, svg.length);
    } else {
      let tx = await svgFacet.populateTransaction.storeSvg(
        svg,
        svgTypesAndSizes
      );
      await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
    }
    if (svgItemsEnd === svgs.length) {
      break;
    }
    svgItemsStart = svgItemsEnd;
  }
}

async function main() {
  this.timeout = 200000000;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MATIC_URL,
          },
        },
      ],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
    const dao = (
      await ethers.getContractAt("DAOFacet", diamondAddress)
    ).connect(signer);
    //make owner an itemManager
    await dao.addItemManagers([owner]);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
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

  let itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    diamondAddress
  );

  console.log("Adding items", 0, "to", itemTypes.length);
  if (testing) {
    tx = await daoFacet.addItemTypes(itemTypes, { gasLimit: gasLimit });
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Items were added:", tx.hash);
  } else {
    tx = await daoFacet.populateTransaction.addItemTypes(itemTypes, {
      gasLimit: gasLimit,
    });
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }

  await uploadSvgs(H1bgs, "wearables", testing);
  // console.log(sleevesSvgs)
  // await uploadSvgs(sleevesSvgs.map(value => value.svg), 'sleeves', testing)

  /** 
  let sleevesSvgId = 27
  let sleeves = []
  for (const sleeve of sleevesSvgs) {
    sleeves.push(
      {
        sleeveId: sleevesSvgId,
        wearableId: sleeve.id
      }
    )
    sleevesSvgId++
  }

  console.log('Associating sleeves svgs with body wearable svgs.')
  if (testing) {
    tx = await svgFacet.setSleeves(sleeves, { gasLimit: gasLimit })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Sleeves associated:', tx.hash)
  } else {
    tx = await svgFacet.populateTransaction.setSleeves(sleeves, { gasLimit: gasLimit })
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx)
  }
*/
  // const finalSVG = await svgFacet.getItemSvg("206");

  //console.log("final svg:", finalSVG);

  console.log("Mint items to aavegotchi.eth");
  let mintAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";

  console.log("Minting items");
  if (testing) {
    tx = await daoFacet.mintItems(mintAddress, [210], [1]);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Prize items minted:", tx.hash);
    // Aavegotchi equips

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"],
    });
    signer = await ethers.provider.getSigner(
      "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"
    );

    const aavegotchiOwnerSigner = await itemsFacet.connect(signer);

    await aavegotchiOwnerSigner.equipWearables(
      "2575",
      [0, 0, 0, 0, 0, 0, 0, 210, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    const addressBalanceAfter = (
      await itemsFacet.balanceOf(owner, 210)
    ).toString();
    const GotchiBalanceAfter = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();

    console.log("address balance:", addressBalanceAfter);
    console.log("gotchi balance after:", GotchiBalanceAfter);

    const svgOutput = await svgFacet.getAavegotchiSvg("2575");

    console.log("svg output:", svgOutput);
  } else {
    tx = await daoFacet.populateTransaction.mintItems(
      mintAddress,
      [210],
      [100],
      { gasLimit: gasLimit }
    );
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addH1 = main;
