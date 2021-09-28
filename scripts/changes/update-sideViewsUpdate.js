/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const { aavegotchiSvgs } = require("../../svgs/aavegotchi-side.js");

const {
  collateralsLeftSvgs,
  collateralsRightSvgs,
} = require("../../svgs/collaterals-sides.js");

const {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs,
} = require("../../svgs/eyeShapesH2-sides.js");

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
  /* console.log("Update SVG Start"); */
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
    /* console.log("assigned", account1Address, "as item manager"); */
  } else if (hre.network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();
    /* console.log("account:", account); */

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

    /* console.log(`Update: ${svgType}: ${svgId}`); */

    const gasPrice = 100000000000;

    let tx = await svgFacet.updateSvg(svg[svgId], array, {
      gasPrice: gasPrice,
    });
    /* console.log("tx hash:", tx.hash); */
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

  //141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244

  let remaining = [
    /* 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155,
    156, 157, 158, 159, 160, 161, 162, 199, 200, 201, 202, 203, 204, 205, 206,
    207, 208, 209, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222,
    223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237,
    238, 239, 240, 241,*/ 242,
    243, 244, 125, 205, 212, 223, 229
  ];

  let remainingLeft = [
    125, 205, 212, 223, 229,
  ];

  let remainingBack = [
    125, 201, 205, 212, 217, 223, 229,
  ];

  const updatingSleevesLeft = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
  const updatingSleevesRight = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
  const updatingSleevesBack = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]

  const updatingLeftSvgs = remainingLeft;
  const updatingRightSvgs = remaining; //[66];
  const updatingBackSvgs = remainingBack;

  // console.log("updating left:", updatingLeftSvgs);

  //left
  for (var i = 0; i < updatingLeftSvgs.length; i++) {
    /* console.log(`Updating: ${i} ${updatingLeftSvgs[i]}`); */
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

  //sleeves
  for (var i = 0; i < updatingSleevesLeft.length; i++) {
    await updateSvgs(wearablesLeftSleeveSvgs, 'sleeves-left', updatingSleevesLeft[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesRight.length; i++) {
    await updateSvgs(wearablesRightSleeveSvgs, 'sleeves-right', updatingSleevesRight[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesBack.length; i++) {
    await updateSvgs(wearablesBackSleeveSvgs, 'sleeves-back', updatingSleevesBack[i], testing, itemSigner)
  }
/*   console.log("Sleeves Array Length: ", wearablesLeftSleeveSvgs.length)
  console.log("Updating Sleeves Array Length: ", updatingSleevesBack.length) */
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
