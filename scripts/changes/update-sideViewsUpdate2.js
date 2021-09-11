/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const { aavegotchiSvgs } = require("../../svgs/aavegotchi-side.js");

const {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
} = require("../../svgs/wearables-sides.js");

async function main() {
  console.log("Update SVG Start");
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
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

    const gasPrice = 100000000000;

    let tx = await svgFacet.updateSvg(svg[svgId], array, {
      gasPrice: gasPrice,
    });
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


  let remaining = [125, 205, 212, 223, 229];

  let remainingLeft = [125, 205, 212, 223, 229];

  let remainingBack = [107, 125, 201, 205, 212, 217, 223, 229];

  const updatingLeftSvgs = remainingLeft;
  const updatingRightSvgs = remaining; //[66];
  const updatingBackSvgs = remainingBack;

  //left
  for (var i = 0; i < updatingLeftSvgs.length; i++) {
    await updateSvgs(
      wearablesLeftSvgs,
      "wearables-left",
      updatingLeftSvgs[i],
      testing,
      itemSigner
    );
  }

  //right
  for (var i = 0; i < updatingRightSvgs.length; i++) {
    await updateSvgs(
      wearablesRightSvgs,
      "wearables-right",
      updatingRightSvgs[i],
      testing,
      itemSigner
    );
  }

  //back
  for (var i = 0; i < updatingBackSvgs.length; i++) {
    await updateSvgs(
      wearablesBackSvgs,
      "wearables-back",
      updatingBackSvgs[i],
      testing,
      itemSigner
    );
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewsUpdate2 = main;
