import { run, network, ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  getDiamondSigner,
  maticFakeGotchiCards,
  itemManagerAlt,
  gasPrice,
} from "../../scripts/helperFunctions";
import {
  getRfSznTypeRanking,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";
import { IFakeGotchi } from "../../typechain";
import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn4/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn4/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn4/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn4/rnd4";

export async function main() {
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [maticFakeGotchiCards],
    });
    signer = await ethers.getSigner(maticFakeGotchiCards);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const fakeGotchis = (await ethers.getContractAt(
    "IFakeGotchi",
    maticFakeGotchiCards
  )) as IFakeGotchi;

  const itemsTransferFacet = await ethers.getContractAt(
    "ItemsTransferFacet",
    maticDiamondAddress,
    signer
  );

  //Gotchi IDs
  const rarityArray = [
    dataArgs1.rarityGotchis,
    dataArgs2.rarityGotchis,
    dataArgs3.rarityGotchis,
    dataArgs4.rarityGotchis,
  ];
  const kinshipArray = [
    dataArgs1.kinshipGotchis,
    dataArgs2.kinshipGotchis,
    dataArgs3.kinshipGotchis,
    dataArgs4.kinshipGotchis,
  ];
  const xpArray = [
    dataArgs1.xpGotchis,
    dataArgs2.xpGotchis,
    dataArgs3.xpGotchis,
    dataArgs4.xpGotchis,
  ];

  const rarity = await getRfSznTypeRanking(rarityArray, "rarity");
  console.log("Rarity: ", rarity);
  const top334Rarity = rarity.slice(0, 334);
  console.log("Top 334 Rarity Length: ", top334Rarity.length);
  console.log("Top 334 Rarity: ", top334Rarity);

  const kinship = await getRfSznTypeRanking(kinshipArray, "kinship");
  console.log("Kinship: ", kinship);
  const top333Kinship = kinship.slice(0, 333);
  console.log("Top 333 Kinship Length: ", top333Kinship.length);
  console.log("Top 333 Kinship: ", top333Kinship);

  const xp = await getRfSznTypeRanking(xpArray, "xp");
  console.log("XP: ", xp);
  const top333XP = xp.slice(0, 333);
  console.log("Top 333 XP Length: ", top333XP.length);
  console.log("Top 333 XP: ", top333XP);

  //Airdrop
  await fakeGotchis.safeBatchTransferFrom(maticFakeGotchiCards, maticDiamondAddress, [#], [1000], []);

  let tokenIds: number[] = [];
  let _ids: Number[] = [];
  let _values: Number[] = [];
  let batchIds: any[] = [];
  let batchValues: any[] = [];

  _values.push(1);

  for (let x = 0; x < top334Rarity.length; x++){
    tokenIds.push(top334Rarity[x]);
    batchIds.push(
    batchValues.push(_values);
  }
  for (let y = 0; y < top333Kinship.length; y++){
    tokenIds.push(top333Kinship[y]);
    batchIds.push(
    batchValues.push(_values);
  }
  for (let z = 0; z < top333XP.length; z++){
    tokenIds.push(top333XP[z]);
    batchIds.push(
    batchValues.push(_values);
  }

  const tx = await itemsTransferFacet.batchBatchTransferToParent(
    maticFakeGotchiCards,
    maticDiamondAddress,
    tokenIds,
    batchIds,
    batchValues,
    { gasPrice: gasPrice }
  );
  console.log("Tx hash:", tx.hash);
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
