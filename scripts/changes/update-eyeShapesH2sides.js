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

  async function updateSvgs(svg, svgType, svgId, testing, uploadSigner) {
    const svgFacet = await ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      uploadSigner
    );

    let svgLength = new TextEncoder().encode(svg[svgId]).length;

    const array = [
      {
        svgType: ethers.utils.formatBytes32String(svgType),
        ids: [svgId],
        sizes: [svgLength],
      },
    ];

    console.log(`Update: ${svgType}: ${svgId}`);

    const gasPrice = 100000000000;

    let tx = await svgFacet.updateSvg(svg[svgId], array, {
      gasPrice: gasPrice,
    });
    console.log("tx hash:", tx.hash);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }

  let itemSigner;
  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }

  for (var i = 0; i < eyeShapesRightSvgs.length; i++) {
    await updateSvgs(
      eyeShapesRightSvgs,
      "eyeShapesH2-right",
      i,
      testing,
      itemSigner
    );
  }

  for (var i = 0; i < eyeShapesLeftSvgs.length; i++) {
    await updateSvgs(
      eyeShapesLeftSvgs,
      "eyeShapesH2-left",
      i,
      testing,
      itemSigner
    );
  }

  for (var i = 0; i < eyeShapesRightSvgs.length; i++) {
    await updateSvgs(
      eyeShapesRightSvgs,
      "eyeShapesH2-back",
      i,
      testing,
      itemSigner
    );
  }

  /*
  await updateSvgs("eyeShapesH2-left", eyeShapesLeftSvgs, itemSigner);
  await updateSvgs("eyeShapesH2-right", eyeShapesRightSvgs, itemSigner);
  await updateSvgs("eyeShapesH2-back", eyeShapesRightSvgs, itemSigner);
  */
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
