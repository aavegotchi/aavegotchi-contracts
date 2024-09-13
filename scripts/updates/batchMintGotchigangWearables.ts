import { ethers, network } from "hardhat";
import {
  diamondOwner,
  gasPrice,
  impersonate,
  maticDiamondAddress,
  maticForgeDiamond,
} from "../helperFunctions";
import {
  ForgeDAOFacet,
  ForgeFacet,
  ForgeTokenFacet,
  ItemsFacet,
} from "../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { WEARABLE_BASE_QUANTITIES } from "../../helpers/constants";

export const forgeAddresses = [
  "0x4a478E4593A5D557dB640642c34Ae52800084451",
  "0x511997786FfBb021ACCC73e121411dABFc320BC8",
  maticForgeDiamond,
];

export const itemIds = {
  common: [404, 405, 406],
  uncommon: [407, 408, 409, 410],
  rare: [411, 412, 413],
  legendary: [414, 415],
  mythical: [416, 417],
};

/*
Send the following schematics to 0x4a478E4593A5D557dB640642c34Ae52800084451
Granny glasses: 52
Freckles: 42
Common Stohn: 26
Based Shades: 20
Rasta Glasses: 19
Braces: 25
Uncommon Stohn: 12
Aloha Flowers: 10
Baable Gum: 10
Rare Stohn: 5

___

Send the following schematics to 0x511997786FfBb021ACCC73e121411dABFc320BC8
Granny glasses: 100
Freckles: 100
Common Stohn: 100
Based Shades: 50
Rasta Glasses: 50
Braces: 50
Uncommon Stohn: 50
Aloha Flowers: 25
Baable Gum: 25
Rare Stohn: 25
Wild Fungi: 10
Face Mask: 10
Kawaii Mouth: 5
Baby Licky: 5
*/
export const predefinedAmounts = [
  [52, 42, 26, 20, 19, 25, 12, 10, 10, 5],
  [100, 100, 100, 50, 50, 50, 50, 25, 25, 25, 10, 10, 5, 5],
];

export async function batchMintGotchigangWearables() {
  let signer;
  const testing = ["hardhat", "localhost"].includes(network.name);

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    maticForgeDiamond,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeDAOFacet;

  let itemsFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    maticDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ItemsFacet;

  let forgeTokenFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
    maticForgeDiamond,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeTokenFacet;

  if (testing) {
    forgeDaoFacet = await impersonate(
      await diamondOwner(maticForgeDiamond, ethers),
      forgeDaoFacet,
      ethers,
      network
    );

    //Fix the hardfork issue
    await helpers.mine();

    const ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      maticForgeDiamond
    );
    const owner = await ownershipFacet.owner();

    console.log("current owner:", owner);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [owner, "0x100000000000000000000000"],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    maticForgeDiamond,
    signer
  )) as ForgeFacet;

  const totalAmounts = [
    WEARABLE_BASE_QUANTITIES.COMMON,
    WEARABLE_BASE_QUANTITIES.UNCOMMON,
    WEARABLE_BASE_QUANTITIES.RARE,
    WEARABLE_BASE_QUANTITIES.LEGENDARY,
    WEARABLE_BASE_QUANTITIES.MYTHICAL,
  ];
  const ids = Object.values(itemIds).flat();

  const amounts = Object.entries(itemIds).flatMap(([rarity, ids]) =>
    new Array(ids.length).fill(
      totalAmounts[
        ["common", "uncommon", "rare", "legendary", "mythical"].indexOf(rarity)
      ]
    )
  );

  /*
Send the following schematics to 0x4a478E4593A5D557dB640642c34Ae52800084451
Granny glasses: 52
Freckles: 42
Common Stohn: 26
Based Shades: 20
Rasta Glasses: 19
Braces: 25
Uncommon Stohn: 12
Aloha Flowers: 10
Baable Gum: 10
Rare Stohn: 5

___

Send the following schematics to 0x511997786FfBb021ACCC73e121411dABFc320BC8
Granny glasses: 100
Freckles: 100
Common Stohn: 100
Based Shades: 50
Rasta Glasses: 50
Braces: 50
Uncommon Stohn: 50
Aloha Flowers: 25
Baable Gum: 25
Rare Stohn: 25
Wild Fungi: 10
Face Mask: 10
Kawaii Mouth: 5
Baby Licky: 5
*/

  const amountsToForge = amounts.map(
    (total, i) =>
      total - (predefinedAmounts[0][i] || 0) - (predefinedAmounts[1][i] || 0)
  );

  const amountsToMint = [...predefinedAmounts, amountsToForge];

  for (let i = 0; i < forgeAddresses.length; i++) {
    const limitedIds = ids.slice(0, amountsToMint[i].length);
    const limitedAmounts = amountsToMint[i];
    console.log(`Batch minting to ${forgeAddresses[i]}`);
    console.log(`ids: ${limitedIds}`);
    console.log(`amounts: ${limitedAmounts}`);

    const tx = await forgeFacet.adminMintBatch(
      forgeAddresses[i],
      limitedIds,
      limitedAmounts,
      { gasPrice: gasPrice }
    );
    console.log("tx hash:", tx.hash);
    await tx.wait();
  }

  // const inventory = await forgeTokenFacet.balanceOfOwner(maticForgeDiamond);
  // console.log(inventory);

  //set geodePrizes

  const items = await itemsFacet.getItemTypes(ids);
  let modifiers: number[] = [];
  for (let i = 0; i < items.length; i++) {
    modifiers.push(Number(items[i].rarityScoreModifier));
  }

  console.log("Creating Geode Prizes for Schematics:", ids);
  console.log("Amounts:", amountsToForge);
  console.log("rarites", modifiers);

  const tx = await forgeDaoFacet.setMultiTierGeodePrizes(
    ids,
    amountsToForge,
    modifiers
  );
  console.log("tx hash:", tx.hash);
  await tx.wait();
}

if (require.main === module) {
  batchMintGotchigangWearables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
