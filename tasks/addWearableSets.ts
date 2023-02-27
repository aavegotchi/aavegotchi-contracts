import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../typechain/DAOFacet";
import { gasPrice } from "../scripts/helperFunctions";
import { BigNumberish } from "@ethersproject/bignumber";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { itemTypes, maxQuantityToRarity } from "../data/itemTypes/itemTypes";

export interface WearableSetInput {
  setId?: number | undefined;
  name: string;
  wearableIds: BigNumberish[];
  traitsBonuses: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  allowedCollaterals: BigNumberish[];
}

export interface WearableSetOutput {
  setId?: number | undefined;
  name: string;
  wearableIds: BigNumberish[];
  traitsBonuses: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  setTraits?: number[];
  allowedCollaterals: BigNumberish[];
}

function trimSetNames(sets: WearableSetInput[]): WearableSetInput[] {
  const output: WearableSetInput[] = [];
  sets.forEach((set) => {
    set.name = set.name.trim();
    output.push(set);
  });
  return output;
}

export interface AddWearableSetsTaskArgs {
  itemManager: string;
  diamondAddress: string;
  setsFile: string;
  overrideTraits: "true" | "false";
}

function assignBrsAndSetPoints(
  wearableSet: WearableSetInput,
  rarityLevelQuantities: number[]
) {
  //Now assign the BRS bonus
  let brsBonus = 0;
  let setPoints = 0;

  //4 godlikes w/ 4 items
  if (wearableSet.wearableIds.length >= 4 && rarityLevelQuantities[5] === 4) {
    brsBonus = 8;
    setPoints = 5;
  }

  //2 or 3 godlikes w/ 4 items
  else if (
    wearableSet.wearableIds.length >= 4 &&
    rarityLevelQuantities[5] >= 2
  ) {
    brsBonus = 7;
    setPoints = 4;
  }

  //1 godlike w/ 4 items
  else if (
    wearableSet.wearableIds.length === 3 &&
    rarityLevelQuantities[5] === 1
  ) {
    brsBonus = 6;
    setPoints = 4;
    //1 godlike w/ 3 items
  } else if (
    wearableSet.wearableIds.length === 3 &&
    rarityLevelQuantities[5] >= 1
  ) {
    brsBonus = 6;
    setPoints = 3;
    //1 mythical
  } else if (rarityLevelQuantities[5] === 0 && rarityLevelQuantities[4] > 0) {
    brsBonus = 5;
    setPoints = 3;
  }
  //1 legendary
  else if (
    rarityLevelQuantities[5] === 0 &&
    rarityLevelQuantities[4] === 0 &&
    rarityLevelQuantities[3] > 0
  ) {
    brsBonus = 4;
    setPoints = 2;
  }
  //1 rare
  else if (
    rarityLevelQuantities[5] === 0 &&
    rarityLevelQuantities[4] === 0 &&
    rarityLevelQuantities[3] === 0 &&
    rarityLevelQuantities[2] > 0
  ) {
    brsBonus = 3;
    setPoints = 2;
  }
  //1 uncommon
  else if (
    rarityLevelQuantities[5] === 0 &&
    rarityLevelQuantities[4] === 0 &&
    rarityLevelQuantities[3] === 0 &&
    rarityLevelQuantities[2] === 0 &&
    rarityLevelQuantities[1] > 0
  ) {
    brsBonus = 2;
    setPoints = 1;
  }
  //1 common
  else if (
    rarityLevelQuantities[5] === 0 &&
    rarityLevelQuantities[4] === 0 &&
    rarityLevelQuantities[3] === 0 &&
    rarityLevelQuantities[2] === 0 &&
    rarityLevelQuantities[1] === 0 &&
    rarityLevelQuantities[0] > 0
  ) {
    brsBonus = 1;
    setPoints = 1;
  }

  return { brsBonus: brsBonus, setPoints: setPoints };
}

function addSetTraits(
  wearableSet: WearableSetInput,
  overrideTraits: "true" | "false"
): WearableSetOutput {
  const totalTraits: number[] = [0, 0, 0, 0, 0, 0];

  let rarityLevelQuantities = [0, 0, 0, 0, 0, 0];
  let expectedModifier = 0;
  let realModifier = 0;

  wearableSet.wearableIds.forEach((id) => {
    const wearableInfo = itemTypes.find(
      (itemType) => itemType.svgId.toString() === id.toString()
    );

    const quantity = maxQuantityToRarity(
      Number(wearableInfo?.maxQuantity.toString())
    );

    if (quantity === "Common") {
      expectedModifier += 1;
      rarityLevelQuantities[0] += 1;
    } else if (quantity === "Uncommon") {
      expectedModifier += 2;
      rarityLevelQuantities[1] += 1;
    } else if (quantity === "Rare") {
      expectedModifier += 3;
      rarityLevelQuantities[2] += 1;
    } else if (quantity === "Legendary") {
      expectedModifier += 4;
      rarityLevelQuantities[3] += 1;
    } else if (quantity === "Mythical") {
      expectedModifier += 5;
      rarityLevelQuantities[4] += 1;
    } else if (quantity === "Godlike") {
      expectedModifier += 6;
      rarityLevelQuantities[5] += 1;
    } else throw new Error("Wrong quantity");

    wearableInfo?.traitModifiers.forEach((modifier, index) => {
      totalTraits[index] = totalTraits[index] + Number(modifier.toString());
    });

    wearableInfo?.traitModifiers.map(
      (val) => (realModifier += Math.abs(Number(val.toString())))
    );
  });

  //Tests that the set has been properly balanced, with no contradicting items
  if (realModifier !== expectedModifier)
    throw new Error("Modifiers do not match");

  const { brsBonus, setPoints } = assignBrsAndSetPoints(
    wearableSet,
    rarityLevelQuantities
  );

  let sortRarityLevelQuantities = totalTraits.map((val, index) => {
    return {
      trait: index,
      value: val,
    };
  });

  sortRarityLevelQuantities = sortRarityLevelQuantities.sort((a, b) => {
    return Math.abs(b.value) - Math.abs(a.value);
  });

  let highestBoost = 0;
  if (
    (setPoints >= 2 && Math.abs(sortRarityLevelQuantities[0].value) > 8) ||
    Math.abs(sortRarityLevelQuantities[0].value) -
      Math.abs(sortRarityLevelQuantities[1].value) >=
      3
  ) {
    highestBoost = 2;
  } else highestBoost = 1;

  let finalSetPoints = [0, 0, 0, 0, 0, 0];

  let allocatedPoints = 0;
  let currentIndex = 0;

  while (allocatedPoints < setPoints) {
    //Iterate through all of the setPoints

    //First lets assign them all to the highest trait
    const currentTrait = sortRarityLevelQuantities[currentIndex];

    if (currentTrait.value > 0) {
      //Check discrepancy between points

      if (currentIndex === 0) {
        finalSetPoints[currentTrait.trait] += highestBoost;
        allocatedPoints += highestBoost;
      } else {
        finalSetPoints[currentTrait.trait] += 1;
        allocatedPoints++;
      }
    } else if (currentTrait.value < 0) {
      if (currentIndex === 0) {
        finalSetPoints[currentTrait.trait] -= highestBoost;
        allocatedPoints += highestBoost;
      } else {
        finalSetPoints[currentTrait.trait] -= 1;
        allocatedPoints++;
      }
    }

    if (currentIndex === 3) currentIndex = 0;
    else currentIndex++;
  }

  let finalSetBonus: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [0, 0, 0, 0, 0];

  if (overrideTraits === "true") {
    //First iterate through all the traits to determine
    finalSetBonus = [
      brsBonus,
      finalSetPoints[0],
      finalSetPoints[1],
      finalSetPoints[2],
      finalSetPoints[3],
    ];
  } else {
    finalSetBonus = [
      wearableSet.traitsBonuses[0],
      wearableSet.traitsBonuses[1],
      wearableSet.traitsBonuses[2],
      wearableSet.traitsBonuses[3],
      wearableSet.traitsBonuses[4],
    ];
  }

  return {
    ...wearableSet,
    // setTraits: totalTraits,
    traitsBonuses: finalSetBonus,
    allowedCollaterals: [],
  };
}

task("addWearableSets", "Uploads Wearable Sets to the Aavegotchi Diamond")
  .addParam("itemManager", "Address of the item manager")
  .addParam("diamondAddress", "Address of the Diamond to add")
  .addParam("overrideTraits", "Whether or not to automatically generate traits")
  .addParam("setsFile", "File name of the sets to add")

  .setAction(
    async (
      taskArgs: AddWearableSetsTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const itemFile: string = taskArgs.setsFile;
      const diamondAddress: string = taskArgs.diamondAddress;
      const itemManager = taskArgs.itemManager;

      const { sets } = require(`../data/wearableSets/${itemFile}.ts`);

      //Ensure no names have empty strings at the end
      let wearableSets: WearableSetInput[] = trimSetNames(sets);

      //Add in trait modifiers
      const finalWearableSets = wearableSets.map((set) =>
        addSetTraits(set, taskArgs.overrideTraits)
      );

      console.log(`Adding ${finalWearableSets.length} new sets:`);

      console.log(finalWearableSets);

      let signer: Signer;

      let owner = itemManager;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [owner],
        });
        signer = await hre.ethers.provider.getSigner(owner);
      } else if (hre.network.name === "matic") {
        signer = await (await hre.ethers.getSigners())[0];
      } else {
        throw Error("Incorrect network selected");
      }

      const daoFacet = (await hre.ethers.getContractAt(
        "DAOFacet",
        diamondAddress,
        signer
      )) as DAOFacet;

      const tx = await daoFacet.addWearableSets(finalWearableSets, {
        gasPrice: gasPrice,
      });

      const receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log("Sets were added:", tx.hash);
    }
  );
