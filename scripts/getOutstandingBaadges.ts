import { getGotchisForASeason } from "./getGotchis";
import {
  RelayerInfo,
  gameManager,
  gasPrice,
  maticDiamondAddress,
  rankIds,
  xpRelayerAddress,
} from "./helperFunctions";
import { dataArgs as dataArgs1 } from "../data/airdrops/rarityfarming/szn5/rnd1";
import { dataArgs as dataArgs2 } from "../data/airdrops/rarityfarming/szn5/rnd2";
import { dataArgs as dataArgs3 } from "../data/airdrops/rarityfarming/szn5/rnd3";
import { dataArgs as dataArgs4 } from "../data/airdrops/rarityfarming/szn5/rnd4";
import { itemTypes } from "./addItemTypes/itemTypes/rfSzn5Bdgs";
import { ethers, network } from "hardhat";
import { DAOFacet, ItemsFacet } from "../typechain";
import { Signer } from "ethers";
import { run } from "hardhat";
// import { getAavegotchiItemIds, exists } from "../test/szn5BaadgeAirdropTest";

import { assertBaadgeQuantities } from "./airdrops/baadgeHelpers";
import { ItemTypeInputNew } from "./itemTypeHelpers";
import { airdropTaskForBaadges } from "./svgHelperFunctions";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";

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
let itemsFacet: ItemsFacet;
let daoFacet: DAOFacet;
let signer: Signer;

const rarityBaadge = itemTypes[13];
const kinshipBaadge = itemTypes[14];
const xpBaadge = itemTypes[15];
const raankedBaadge = itemTypes[9];

async function sendAndUpdatebaadges() {
  const sendBadges = async (
    itemType: ItemTypeInputNew,
    recipients: number[]
  ) => {
    const airdrop = await airdropTaskForBaadges([itemType], recipients);
    await run("airdropBaadges", airdrop);
  };

  const {
    outstandingRarity,
    outstandingKinship,
    outstandingXP,
    pendingRaanked,
  } = await getOutstandingData();

  //get new max quantities
  const newMaxQuantities = [
    90 + outstandingRarity.length,
    90 + outstandingKinship.length,
    90 + outstandingXP.length,
    12905,
  ];
  const itemIds = [
    rarityBaadge.svgId,
    kinshipBaadge.svgId,
    xpBaadge.svgId,
    raankedBaadge.svgId,
  ];

  //first increase the quantity of the baadges
  console.log("updating max quantities for baadges");

  await daoFacet.updateItemTypeMaxQuantity(itemIds, newMaxQuantities);
  console.log("updated max quantities for baadges!");

  //mint baadges
  const tx = await daoFacet.mintItems(
    xpRelayerAddress,
    itemIds,
    [20, 8, 10, 96], //9 tokens outlier for raanked
    {
      gasPrice: gasPrice,
    }
  );
  await tx.wait();

  console.log("minted baadges!");

  //then send the baadges
  await sendBadges(rarityBaadge, outstandingRarity);
  await sendBadges(kinshipBaadge, outstandingKinship);
  await sendBadges(xpBaadge, outstandingXP);
  await sendBadges(
    raankedBaadge,
    pendingRaanked.map((x) => Number(x))
  );
}

async function getOutstandingData() {
  itemsFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    maticDiamondAddress,
    signer
  )) as ItemsFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [gameManager],
    });
    signer = await ethers.provider.getSigner(gameManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = await getRelayerSignerNoContext(); //use relayer signer

    // signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else throw Error("Incorrect network selected");

  daoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
    maticDiamondAddress,
    signer
  )) as DAOFacet;

  const [rarityBreaker, kinshipBreaker, xpBreaker] = await getGotchisForASeason(
    "5"
  );

  let outstandingRarity = [];
  let outstandingKinship = [];
  let outstandingXP = [];

  const rarityRFSzn5 = rankIds(rarityArray, rarityBreaker).map((x) =>
    Number(x)
  );
  const xpRFSzn5 = await rankIds(xpArray, xpBreaker).map((x) => Number(x));
  const kinshipRFSzn5 = await rankIds(kinshipArray, kinshipBreaker).map((x) =>
    Number(x)
  );

  const rarity100 = rarityRFSzn5.slice(10, 100);
  const kinship100 = kinshipRFSzn5.slice(10, 100);
  const xp100 = xpRFSzn5.slice(10, 100);

  const idsToCheck = [rarityBaadge, kinshipBaadge, xpBaadge];
  //const raaankedBaadge = itemTypes[9];

  for (let i = 0; i < rarity100.length; i++) {
    let bal = await itemsFacet.balanceOfToken(
      maticDiamondAddress,
      rarity100[i],
      idsToCheck[0].svgId.toString()
    );

    //if gotchi does not contain the badge, store in array
    if (bal.eq(0)) {
      outstandingRarity.push(rarity100[i]);
    }
  }

  for (let i = 0; i < kinship100.length; i++) {
    let bal = await itemsFacet.balanceOfToken(
      maticDiamondAddress,
      kinship100[i],
      idsToCheck[1].svgId.toString()
    );

    //if gotchi does not contain the badge, store in array
    if (bal.eq(0)) {
      outstandingKinship.push(kinship100[i]);
    }
  }

  for (let i = 0; i < xp100.length; i++) {
    let bal = await itemsFacet.balanceOfToken(
      maticDiamondAddress,
      xp100[i],
      idsToCheck[2].svgId.toString()
    );

    //if gotchi does not contain the badge, store in array
    if (bal.eq(0)) {
      outstandingXP.push(xp100[i]);
    }
  }

  console.log("Outstanding rarity gotchis: ", outstandingRarity.length);
  console.log("Outstanding kinship gotchis: ", outstandingKinship.length);
  console.log("Outstanding xp gotchis: ", outstandingXP.length);

  //check if each gotchi contains the baadge, store in an array if it does not

  //
  const totalPlayers = await assertBaadgeQuantities(
    itemTypes,
    rarityArray,
    kinshipArray,
    xpArray,
    true
  );

  //check if they have the raanked baadge
  //store in array if they do not

  const last1000Gotchis = totalPlayers.slice(12790, 12905);
  const pendingRaanked = [];
  for (let i = 0; i < last1000Gotchis.length; i++) {
    let bal = await itemsFacet.balanceOfToken(
      maticDiamondAddress,
      last1000Gotchis[i],
      raankedBaadge.svgId.toString()
    );

    //if gotchi does not contain the badge, store in array
    if (bal.eq(0)) {
      pendingRaanked.push(last1000Gotchis[i]);
    }
  }
  console.log("Pending raanked gotchis: ", pendingRaanked.length);

  return {
    outstandingRarity,
    outstandingKinship,
    outstandingXP,
    pendingRaanked,
  };
}

if (require.main === module) {
  sendAndUpdatebaadges()
    .then(() => process.exit(0))

    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export async function getRelayerSignerNoContext() {
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    console.log("Using Hardhat");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [xpRelayerAddress],
    });
    return await ethers.provider.getSigner(xpRelayerAddress);
  } else if (network.name === "matic") {
    console.log("USING MATIC");

    const credentials: RelayerInfo = {
      apiKey: process.env.DEFENDER_APIKEY!,
      apiSecret: process.env.DEFENDER_SECRET!,
    };

    const provider = new DefenderRelayProvider(credentials);
    return new DefenderRelaySigner(credentials, provider, {
      speed: "safeLow",
      validForSeconds: 7200,
    });
  } else if (network.name === "tenderly") {
    //impersonate
    console.log("Using tenderly");
    return (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }
}
