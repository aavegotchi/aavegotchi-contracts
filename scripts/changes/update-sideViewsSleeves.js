/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const { aavegotchiSvgs } = require("../../svgs/aavegotchi-side.js");

const { sideViewsLayer } = require("../upgrades/upgrade-sideViewsLayer.js");

const {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} = require("../../svgs/wearables-sides.js");

const {
  sideViewDimensions5,
  sideViewDimensions6,
  sideViewDimensions7
} = require("../../svgs/sideViewDimensions.js");

async function main() { 
  sideViewsLayer();
  
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;

  const gasPrice = 100000000000;

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

  //wearables
  const updatingLeftSvgs = [220]
  const updatingRightSvgs = [220]
  const updatingBackSvgs = [220]

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
    for (var i = 0; i < updatingRightSvgs.length; i++) {
      await updateSvgs(
        wearablesBackSvgs,
        "wearables-back",
        updatingBackSvgs[i],
        testing,
        itemSigner
      );
    }

  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  //update dimensions (id: 162, 213)
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions5, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  } 
  
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions6, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions7, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
 

  
  //sleeves
  const updatingSleevesLeft = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
  const updatingSleevesRight = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
  const updatingSleevesBack = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]

  for (var i = 0; i < updatingSleevesLeft.length; i++) {
    await updateSvgs(wearablesLeftSleeveSvgs, 'sleeves-left', updatingSleevesLeft[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesRight.length; i++) {
    await updateSvgs(wearablesRightSleeveSvgs, 'sleeves-right', updatingSleevesRight[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesBack.length; i++) {
    await updateSvgs(wearablesBackSleeveSvgs, 'sleeves-back', updatingSleevesBack[i], testing, itemSigner)
  }

  const rightHandExceptions = [
    {
      itemId: 201,
      side: 4,
      exceptionBool: true
    },
    {
      itemId: 217,
      side: 4,
      exceptionBool: true
    },
  ]

  const leftHandExceptions = [
    {
      itemId: 201,
      side: 5,
      exceptionBool: true
    },
    {
      itemId: 217,
      side: 5,
      exceptionBool: true
    },
  ]

  await svgViewsFacet.setSideViewExceptions(rightHandExceptions, {gasPrice: gasPrice});
  await svgViewsFacet.setSideViewExceptions(leftHandExceptions, {gasPrice: gasPrice});

    // BODY = 0;
    // FACE = 1;
    // EYES = 2;
    // HEAD = 3;
    // RIGHT = 4;
    // LEFT = 5;
    // PET = 6;
    // BG = 7;

    const numTraits1 = [99, 99, 99, 99, 12, 9];
    const wearables1 = [222, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0];

    const sidePreview = await svgViewsFacet.previewSideAavegotchi("2", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
    console.log("Side Preview: ", sidePreview);
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
