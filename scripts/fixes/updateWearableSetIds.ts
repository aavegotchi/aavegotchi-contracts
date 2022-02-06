//updating ID 8(marine jacket) front sleeves

import { Signer } from "@ethersproject/abstract-signer";
import { network, ethers } from "hardhat";
import { WearableSetOutput } from "../../tasks/addWearableSets";

import { DAOFacet } from "../../typechain";
import { itemManagerAlt, maticDiamondAddress } from "../helperFunctions";

async function main() {
  const setIds = [137];

  const setInfo: WearableSetOutput[] = [
    {
      name: "Daimyogotchi",
      traitsBonuses: [7, 0, 1, 2, -1],
      wearableIds: [155, 313, 314, 315],
      allowedCollaterals: [],
    },
  ];

  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    signer = await ethers.provider.getSigner(itemManagerAlt);
  } else if (network.name === "matic") {
    signer = (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const daoFacet = (await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  )) as DAOFacet;

  const tx = await daoFacet.updateWearableSets(setIds, setInfo);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Updated wearable sets");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.marineJacketSleeveFix = main;
