//updating IDs: 8(marine jacket) front sleeves, 25(thaave suit) all sleeves, 125(track suit) all sleeves

import { run, network, ethers } from "hardhat";

import { Signer } from "@ethersproject/abstract-signer";
import { SvgFacet } from "../../typechain";
import { wearablesSvgs as front } from "../../svgs/wearables";
import {
  convertSleevesToTaskFormat,
  UpdateSleevesTaskArgs,
} from "../../tasks/updateSleeveItemId";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { Sleeves } from "../itemTypeHelpers";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskFront,
} from "../svgHelperFunctions";
import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
  wearablesLeftSleeveSvgs as leftSleeve,
  wearablesRightSleeveSvgs as rightSleeve,
  wearablesBackSleeveSvgs as backSleeve,
} from "../../svgs/wearables-sides";

async function main() {
  console.log("Sleeves Length: ", leftSleeve.length);
  const side = ["front"];
  let sleevesTotalIds = 44;
  let bodyWearableIds = [
    0, 8, 11, 15, 16, 19, 22, 25, 28, 31, 37, 43, 46, 50, 54, 56, 74, 85, 91,
    102, 105, 109, 112, 114, 115, 125, 135, 138, 150, 160, 162, 203, 213, 220,
    222, 231, 234, 241, 244, 248, 250, 253, 256, 258,
  ];

  /*   for (let index = 0; index < frontItemIds.length; index++) {
    const itemId = frontItemIds[index];

    const sideArrays = [front[itemId]];

    for (let index = 0; index < side.length; index++) {
      let taskArgsFront: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `sleeves`,
        svgs: [sideArrays].join("***"),
      };

      await run("updateSvgs", taskArgsFront);
    }
  } */

  /*   const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  async function updateSvgs(
    svg: any[],
    svgType: string,
    svgId: number,
    uploadSigner: any
  ) {
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

    let tx = await svgFacet.updateSvg(svg[svgId], array);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }

  for (var i = 0; i < bodyWearableIds.length; i++) {
    await updateSvgs(front, "sleeves", bodyWearableIds[i], signer);
  } */

  //front wearables
  /*   let frontItemIds = [];

  for (let index = 0; index < front.length; index++) {
    frontItemIds.push(index);
  }

  let frontViewTaskArray = await updateSvgTaskFront(frontItemIds);
  for (let index = 0; index < frontViewTaskArray.length; index++) {
    await run("updateSvgs", frontViewTaskArray[index]);
  } */

  /*   for (let index = 0; index < bodyWearableIds.length; index++) {
    const itemId = bodyWearableIds[index];

    const sideArrays = [front[itemId]];

    for (let index = 0; index < side.length; index++) {
      let taskArgsFront: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `sleeves`,
        svgs: [sideArrays].join("***"),
      };

      await run("updateSvgs", taskArgsFront);
    }
  } */

  //side sleeves
  let sideSleeveIds = [];

  for (let index = 0; index < sleevesTotalIds; index++) {
    sideSleeveIds.push(index);
  }

  let sideViewsTaskArray = await updateSvgTaskForSideSleeves(sideSleeveIds);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  /*   let sleeves: Sleeves[] = [
    {
      sleeveId: 41,
      wearableId: 25,
    },
    {
      sleeveId: 42,
      wearableId: 125,
    },
  ]; */

  console.log("Bodywearables Length: ", bodyWearableIds.length);

  let sleeves: Sleeves[] = [];

  for (let index = 0; index < sleevesTotalIds; index++) {
    sleeves.push({
      sleeveId: index,
      wearableId: bodyWearableIds[index],
    });
  }

  await run("updateSleeves", convertSleevesToTaskFormat(sleeves));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addMissingSleevesFix = main;
