import { Signer } from "@ethersproject/abstract-signer";
import { network, ethers } from "hardhat";
import { WearableSetOutput } from "../../tasks/addWearableSets";

import { DAOFacet } from "../../typechain";
import { itemManagerAlt, maticDiamondAddress } from "../helperFunctions";

export async function updateWearableSets() {
  const setIds = [3, 56, 93];

  const setInfo: WearableSetOutput[] = [
    {
      name: "Link Marine",
      wearableIds: [10, 11, 12],
      traitsBonuses: [4, 0, 2, 0, 2], //add 2 BRN to compensate for Link Bubbly -2 BRN that contradicts +2 BRN
      allowedCollaterals: [],
    },
    {
      name: "Off Duty Hazmat",
      wearableIds: [111, 112, 123],
      traitsBonuses: [4, 2, 0, 2, 0], //add +2 SPK to compensate for -2 SPK of Apple Juice
      allowedCollaterals: [],
    },
    {
      name: "Venly Biker",
      wearableIds: [206, 207, 208, 209],
      traitsBonuses: [4, -1, 1, 0, 0], //change NRG to -1 to be in line with others
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

updateWearableSets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
