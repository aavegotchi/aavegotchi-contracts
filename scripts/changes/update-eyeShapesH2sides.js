/* global ethers hre */
/* eslint prefer-const: "off" */

const {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs,
} = require("../../svgs/eyeShapesH2-sides.js");

const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gasPrice = 100000000000;

async function main() {
  console.log("Update SVG Start");
  let account1Signer;
  let account1Address;
  let signer;

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

    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  async function uploadSvgs(svgType, svgs, uploadSigner) {
    const svgFacet = await ethers.getContractAt(
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

      let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes, {
        gasPrice: gasPrice,
      });
      console.log("tx hash:", tx.hash);
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

  let itemSigner;
  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }

  await uploadSvgs("eyeShapesH2-back", eyeShapesRightSvgs, itemSigner);

  // await uploadSvgs("eyeShapesH2-left", eyeShapesLeftSvgs, itemSigner);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewsUpdate = main;
