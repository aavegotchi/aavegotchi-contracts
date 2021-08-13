/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { eyeShapeSvgs } = require("../../svgs/eyeShapesH2.js");
const { collateralsSvgs } = require("../../svgs/collateralsH2.js");
const { sendToMultisig } = require("../libraries/multisig/multisig.js");

let signer;
let testing;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasLimit = 15000000;

const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

async function main() {
  testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager]
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Upload SVGs");

  function setupSvg(...svgData) {
    const svgTypesAndSizes = [];
    const svgItems = [];
    for (const [svgType, svg] of svgData) {
      svgItems.push(svg.join(""));
      svgTypesAndSizes.push([
        ethers.utils.formatBytes32String(svgType),
        svg.map((value) => value.length)
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

  console.log("Uploading collaterals and eyeShapes SVG")
  ;[svg, svgTypesAndSizes] = setupSvg(
    ["collaterals", collateralsSvgs],
    ["eyeShapesH2", eyeShapeSvgs]
  );
  printSizeInfo(svgTypesAndSizes);

  let svgFacet = (
    await ethers.getContractAt("SvgFacet", diamondAddress)
  ).connect(signer);

  if (testing) {
    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, { gasLimit: gasLimit });
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  } else {
    let tx = await svgFacet.populateTransaction.storeSvg(svg, svgTypesAndSizes);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
exports.uploadH2SVG = main;
