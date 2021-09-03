/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const { sendToMultisig } = require("../libraries/multisig/multisig.js");

const { aavegotchiSvgs } = require("../../svgs/aavegotchi-side.js");

const { NonceManager } = require("@ethersproject/experimental");

const {
  collateralsLeftSvgs,
  collateralsRightSvgs,
} = require("../../svgs/collaterals-sides.js");

const {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs,
} = require("../../svgs/eyeShapes-sides.js");

const {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} = require("../../svgs/wearables-sides.js");

const {
  sideViewDimensions1,
  sideViewDimensions2,
  sideViewDimensions3,
  sideViewDimensions4,
  sideViewDimensions5,
  sideViewDimensions6,
  sideViewDimensions7,
  sideViewDimensions8,
} = require("../../svgs/sideViewDimensions.js");

async function main() {
  const gasPrice = 150000000000;

  console.log("Upload SVG Start");
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;
  let facet;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.getSigner(owner);
    let dao = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
    [account1Signer] = await ethers.getSigners();
    account1Address = await account1Signer.getAddress();
    let tx = await dao.addItemManagers([account1Address]);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("assigned", account1Address, "as item manager");
  } else if (hre.network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();

    console.log("account:", account);
    signer = accounts[0];

    nonceManagedSigner = new NonceManager(signer);

    console.log("signer", nonceManagedSigner);
  } else {
    throw Error("Incorrect network selected");
  }

  async function uploadSvgs(svgs, svgType, testing, uploadSigner) {
    console.log("***", svgType, "***");
    let svgFacet = await ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      uploadSigner
    );
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
      if (testing) {
        let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes);
        let receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log(svgItemsEnd, svg.length);
      } else {
        console.log(
          `Storing Svg: ${svgType} with IDs: ${svgItemsStart} to ${svgItemsEnd}`
        );

        try {
          const tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, {
            gasPrice: gasPrice,
          });
          console.log("tx hash:", tx.hash);
          await tx.wait();

          console.log("tx confirmed!");
        } catch (error) {
          console.log("Tx failed!", error);
        }
      }
      if (svgItemsEnd === svgs.length) {
        break;
      }
      svgItemsStart = svgItemsEnd;
    }
  }

  let tx;
  let receipt;
  let itemSigner;
  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }

  await uploadSvgs(aavegotchiSvgs.left, "aavegotchi-left", testing, itemSigner);

  await uploadSvgs(
    aavegotchiSvgs.right,
    "aavegotchi-right",
    testing,
    itemSigner
  );

  /*
  await uploadSvgs(aavegotchiSvgs.back, "aavegotchi-back", testing, itemSigner);

  await uploadSvgs(wearablesLeftSvgs, "wearables-left", testing, itemSigner);
  await uploadSvgs(wearablesRightSvgs, "wearables-right", testing, itemSigner);
  await uploadSvgs(wearablesBackSvgs, "wearables-back", testing, itemSigner);
  await uploadSvgs(
    wearablesLeftSleeveSvgs,
    "sleeves-left",
    testing,
    itemSigner
  );
  await uploadSvgs(
    wearablesRightSleeveSvgs,
    "sleeves-right",
    testing,
    itemSigner
  );
  await uploadSvgs(
    wearablesBackSleeveSvgs,
    "sleeves-back",
    testing,
    itemSigner
  );

  await uploadSvgs(
    collateralsLeftSvgs,
    "collaterals-left",
    testing,
    itemSigner
  );
  await uploadSvgs(
    collateralsRightSvgs,
    "collaterals-right",
    testing,
    itemSigner
  );
  await uploadSvgs(
    collateralsRightSvgs,
    "collaterals-back",
    testing,
    itemSigner
  );
  */

  await uploadSvgs(eyeShapesLeftSvgs, "eyeShapes-left", testing, itemSigner);
  await uploadSvgs(eyeShapesRightSvgs, "eyeShapes-right", testing, itemSigner);
  await uploadSvgs(eyeShapesRightSvgs, "eyeShapes-back", testing, itemSigner);

  console.log("Side view Dimensions: ", sideViewDimensions1[1]);

  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions1);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 1");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions2);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 2");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions3);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 3");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions4);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 4");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions5);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 5");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions6);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 6");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions7);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 7");

  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions8);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 8");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewsUploadSvg1 = main;
