import { ethers, network } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../../svgs/wearables-sides";

import { sideViewDimensions9 } from "../../svgs/sideViewDimensions";
import { SvgFacet } from "../../typechain";

async function main() {
  const gasPrice = 7666197020;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;

  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
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
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();
    /* console.log("account:", account); */

    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  //
  let arrFixes = [245, 246, 247, 248, 249, 250, 251, 252, 253];

  let itemSigner;
  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }
  // console.log("updating sideviews")
  // await updateSvgs(wearablesLeftSvgs,"wearables-left",253,itemSigner)
  // await updateSvgs(wearablesRightSvgs,"wearables-right",253,itemSigner)
  // await updateSvgs(wearablesBackSvgs,"wearables-back",253,itemSigner)
  console.log("upload sleeves");

  // //fix sleeves for Geckoshirt
  // await updateSvgs(wearablesLeftSleeveSvgs,"sleeves-left",36,itemSigner)
  // await updateSvgs(wearablesRightSleeveSvgs,"sleeves-right",36,itemSigner)

  // //Update sleeves for Geckoshirt
  // await updateSvgs(wearablesLeftSleeveSvgs,"sleeves-left",37,itemSigner)
  // await updateSvgs(wearablesRightSleeveSvgs,"sleeves-right",37,itemSigner)

  // //Fix sleeves for Astronaut suit
  //  await updateSvgs(wearablesLeftSleeveSvgs,"sleeves-left",38,itemSigner)
  //  await updateSvgs(wearablesRightSleeveSvgs,"sleeves-right",38,itemSigner)

  console.log("updating dimensions");
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  //for all dimensions fixes
  let tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions9, {
    gasPrice: gasPrice,
  });

  // let receipt = await tx.wait();
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`);
  // }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;
