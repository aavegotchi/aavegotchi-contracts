import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";

import { itemTypes } from "../scripts/addItemTypes/itemTypes/rfSzn6Bdgs";
import { dataArgs as dataArgs1 } from "../data/airdrops/rarityfarming/szn6/rnd1";
import { dataArgs as dataArgs2 } from "../data/airdrops/rarityfarming/szn6/rnd2";
import { dataArgs as dataArgs3 } from "../data/airdrops/rarityfarming/szn6/rnd3";
import { dataArgs as dataArgs4 } from "../data/airdrops/rarityfarming/szn6/rnd4";

import { getRfSznTypeRanking } from "../scripts/helperFunctions";
import { main } from "../scripts/airdrops/rfSzn6BdgsAirdrop";
describe("Airdrop SZN6 Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet,
    signer: Signer,
    rarityRFSzn5: number[],
    kinshipRFSzn5: number[],
    xpRFSzn5: number[];

  before(async function () {
    signer = await ethers.getSigner(maticDiamondAddress);

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

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress,
      signer
    )) as AavegotchiFacet;

    rarityRFSzn5 = await getRfSznTypeRanking(rarityArray, "rarity");

    kinshipRFSzn5 = await getRfSznTypeRanking(kinshipArray, "kinship");

    xpRFSzn5 = await getRfSznTypeRanking(xpArray, "xp");

    await main();
  });

  it.only("Should airdrop szn6 champion baadges", async function () {
    //rarity champ
    let rarityChamp = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[0]);

    let itemIds = getAavegotchiItemIds(rarityChamp);

    expect(exists(itemTypes[0].svgId.toString(), itemIds)).to.equal(true);

    //kinship champ
    let kinshipChamp = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[0]);
    itemIds = getAavegotchiItemIds(kinshipChamp);

    expect(exists(itemTypes[1].svgId.toString(), itemIds)).to.equal(true);

    //xp champ (tiebreaker)
    let xpChamp = await aavegotchiFacet.getAavegotchi(xpRFSzn5[0]);
    itemIds = getAavegotchiItemIds(xpChamp);

    expect(exists(itemTypes[2].svgId.toString(), itemIds)).to.equal(true);
  });

  it.only("Should airdrop szn6 2nd and 3rd place baadges", async function () {
    //rarity 2nd
    let rarity2nd = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[1]);
    let itemIds = getAavegotchiItemIds(rarity2nd);

    expect(exists(itemTypes[3].svgId.toString(), itemIds)).to.equal(true);

    //kinship 2nd
    let kinship2nd = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[1]);
    itemIds = getAavegotchiItemIds(kinship2nd);

    expect(exists(itemTypes[4].svgId.toString(), itemIds)).to.equal(true);

    // //xp 2nd
    let xp2nd = await aavegotchiFacet.getAavegotchi(xpRFSzn5[1]);
    itemIds = getAavegotchiItemIds(xp2nd);

    expect(exists(itemTypes[5].svgId.toString(), itemIds)).to.equal(true);

    //rarity 3rd
    let rarity3rd = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[2]);
    itemIds = getAavegotchiItemIds(rarity3rd);

    expect(exists(itemTypes[6].svgId.toString(), itemIds)).to.equal(true);

    //kinship 3rd
    let kinship3rd = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[2]);
    itemIds = getAavegotchiItemIds(kinship3rd);

    expect(exists(itemTypes[7].svgId.toString(), itemIds)).to.equal(true);

    //xp 3rd
    let xp3rd = await aavegotchiFacet.getAavegotchi(xpRFSzn5[2]);
    itemIds = getAavegotchiItemIds(xp3rd);

    expect(exists(itemTypes[8].svgId.toString(), itemIds)).to.equal(true);
  });

  it.only("Should airdrop szn6 top10 baadges", async function () {
    //rarity top 10
    let rarityTop10 = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[3]);
    let itemIds = getAavegotchiItemIds(rarityTop10);

    expect(exists(itemTypes[10].svgId.toString(), itemIds)).to.equal(true);

    rarityTop10 = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[9]);
    itemIds = getAavegotchiItemIds(rarityTop10);

    expect(exists(itemTypes[10].svgId.toString(), itemIds)).to.equal(true);

    //kinship top 10
    let kinshipTop10 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[3]);
    itemIds = getAavegotchiItemIds(kinshipTop10);

    expect(exists(itemTypes[11].svgId.toString(), itemIds)).to.equal(true);

    kinshipTop10 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[9]);
    itemIds = getAavegotchiItemIds(kinshipTop10);

    expect(exists(itemTypes[11].svgId.toString(), itemIds)).to.equal(true);

    //XP top 10
    let xpTop10 = await aavegotchiFacet.getAavegotchi(xpRFSzn5[3]);
    itemIds = getAavegotchiItemIds(xpTop10);

    expect(exists(itemTypes[12].svgId.toString(), itemIds)).to.equal(true);

    xpTop10 = await aavegotchiFacet.getAavegotchi(xpRFSzn5[9]);
    itemIds = getAavegotchiItemIds(xpTop10);

    expect(exists(itemTypes[12].svgId.toString(), itemIds)).to.equal(true);
  });

  it.only("Should airdrop szn6 top100 baadges", async function () {
    //rarity top 100
    let rarityTop100 = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[10]);
    let itemIds = getAavegotchiItemIds(rarityTop100);

    expect(exists(itemTypes[13].svgId.toString(), itemIds)).to.equal(true);

    rarityTop100 = await aavegotchiFacet.getAavegotchi(rarityRFSzn5[99]);
    itemIds = getAavegotchiItemIds(rarityTop100);

    expect(exists(itemTypes[13].svgId.toString(), itemIds)).to.equal(true);

    //kinship top 100
    let kinshipTop100 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[10]);
    itemIds = getAavegotchiItemIds(kinshipTop100);

    expect(exists(itemTypes[14].svgId.toString(), itemIds)).to.equal(true);

    kinshipTop100 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn5[99]);
    itemIds = getAavegotchiItemIds(kinshipTop100);

    expect(exists(itemTypes[14].svgId.toString(), itemIds)).to.equal(true);

    //XP top 100
    let xpTop100 = await aavegotchiFacet.getAavegotchi(xpRFSzn5[10]);
    itemIds = getAavegotchiItemIds(xpTop100);

    expect(exists(itemTypes[15].svgId.toString(), itemIds)).to.equal(true);

    xpTop100 = await aavegotchiFacet.getAavegotchi(xpRFSzn5[99]);
    itemIds = getAavegotchiItemIds(xpTop100);

    expect(exists(itemTypes[15].svgId.toString(), itemIds)).to.equal(true);
  });
});

function getAavegotchiItemIds(gotchi: any) {
  let itemIds: string[] = [];
  const allItems: any[] = gotchi.items;
  allItems.forEach((item) => {
    itemIds.push(item.itemId.toString());
  });
  return itemIds;
}

function exists(itemId: string, itemIds: string[]) {
  return itemIds.includes(itemId);
}
