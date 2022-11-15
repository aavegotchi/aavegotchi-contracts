import { run, ethers, network } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { itemTypes } from "../../scripts/addItemTypes/itemTypes/rfSzn3Bdgs";
import { airdropTaskForBaadges } from "../svgHelperFunctions";

import {
  gasPrice,
  getPlaayersIds,
  hasDuplicateGotchiIds,
  itemManagerAlt,
  maticDiamondAddress,
} from "../helperFunctions";

import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn3/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn3/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn3/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn3/rnd4";

export async function main() {
  const ids: number[] = [325];
  const maxQty: number[] = [12565];
  const addedQty: number[] = [1565];

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
    signer = accounts[0];

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const daoFacet = await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  );

  //Update max quantity
  let tx;
  let receipt;
  console.log("Update ItemTypeMaxQuantities");
  tx = await daoFacet.updateItemTypeMaxQuantity(ids, maxQty, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log("Updated ItemTypeMaxQuantities successfully");

  //Mint
  tx = await daoFacet.mintItems(itemManagerAlt, ids, addedQty, {
    gasPrice: gasPrice,
  });
  const mintReceipt = await tx.wait();
  if (!mintReceipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log("Mint Completed");

  //Airdrop
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

  const rarityPlaayers = await getPlaayersIds(rarityArray);
  const kinshipPlaayers = await getPlaayersIds(kinshipArray);
  const xpPlaayers = await getPlaayersIds(xpArray);

  const plaayers = [rarityPlaayers, kinshipPlaayers, xpPlaayers];
  const totalUniquePlaayers = await getPlaayersIds(plaayers);
  const addedPlayers = totalUniquePlaayers.slice(11000, 12565);
  console.log("Total Added Players: ", addedPlayers.length);

  console.log(
    "Does totalPlaayers Array Have Duplicates: ",
    await hasDuplicateGotchiIds(addedPlayers)
  );

  console.log(itemTypes[9].name);
  const raankingNumbersArray: number[] = [];
  for (let x = 0; x < addedPlayers.length; x++) {
    raankingNumbersArray.push(Number(addedPlayers[x]));
  }

  const perBatch = 100;
  const batches = Math.ceil(raankingNumbersArray.length / perBatch);

  console.log("Begin airdrops!");

  for (let index = 0; index < batches; index++) {
    console.log("Airdropping batch:", index);
    let gotchiBatch = raankingNumbersArray.slice(
      index * perBatch,
      (index + 1) * perBatch
    );

    let plaayerAirdrop = await airdropTaskForBaadges(
      [itemTypes[9]],
      gotchiBatch
    );

    await run("airdropBaadges", plaayerAirdrop);
    console.log("Complete Airdropping batch:", index);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
