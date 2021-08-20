/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { eyeShapeSvgs } = require("../../svgs/eyeShapes.js");

const gasPrice = 2000000000;

let signer;
let testing;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasLimit = 3000000;

async function uploadSvgs(svgs, svgType) {
  console.log("signer:", signer);
  let svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress, signer);

  function setupSvg(...svgData) {
    const svgTypesAndSizes = [];
    const svgItems = [];
    for (const [svgType, svg] of svgData) {
      console.log("svg type:", ethers.utils.formatBytes32String(svgType));
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

    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} eyeShape SVGs`);
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
      await svgFacet.storeSvg(svg, svgTypesAndSizes, {
        gasPrice: gasPrice,
      });
    }
    if (svgItemsEnd === svgs.length) {
      break;
    }
    svgItemsStart = svgItemsEnd;
  }
}

const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

async function main() {
  testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Upload SVGs");

  await uploadSvgs(eyeShapeSvgs, "eyeShapesH0", testing, {
    gasPrice: gasPrice,
    // gasLimit: gasLimit,
  });

  const svgContract = await ethers.getContractAt("SvgFacet", diamondAddress);
  const portal = await svgContract.portalAavegotchisSvg("8504");

  console.log("portal:", portal);
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
exports.uploadH2EyeShapeSVG = main;
