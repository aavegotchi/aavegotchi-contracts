import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { main } from "../scripts/airdrops/rfSzn3BdgsAirdrop";
import { itemTypes } from "../scripts/addItemTypes/itemTypes/rfSzn3Bdgs";
import { dataArgs as dataArgs1 } from "../data/airdrops/rarityfarming/szn3/rnd1";
import { dataArgs as dataArgs2 } from "../data/airdrops/rarityfarming/szn3/rnd2";
import { dataArgs as dataArgs3 } from "../data/airdrops/rarityfarming/szn3/rnd3";
import { dataArgs as dataArgs4 } from "../data/airdrops/rarityfarming/szn3/rnd4";

import {
  getRfSznTypeRanking,
  getPlaayersIds,
} from "../scripts/helperFunctions";

describe("Airdrop SZN3 Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet,
    signer: Signer,
    rarityRFSzn3: number[],
    kinshipRFSzn3: number[],
    xpRFSzn3: number[];

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

    rarityRFSzn3 = await getRfSznTypeRanking(rarityArray, "rarity");
    const top10rarity = rarityRFSzn3.slice(3, 10);
    const top100rarity = rarityRFSzn3.slice(10, 100);

    kinshipRFSzn3 = await getRfSznTypeRanking(kinshipArray, "kinship");
    const top10kinship = kinshipRFSzn3.slice(3, 10);
    const top100kinship = kinshipRFSzn3.slice(10, 100);

    xpRFSzn3 = await getRfSznTypeRanking(xpArray, "xp");
    const top10xp = xpRFSzn3.slice(3, 10);
    const top100xp = xpRFSzn3.slice(10, 100);

    // await main();
  });

  it.only("Should airdrop szn3 champion baadges", async function () {
    //rarity champ
    let rarityChamp = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[0]);
    let item = rarityChamp.items[rarityChamp.items.length - 2];
    let baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    let ones = baadge[baadge.length - 23];
    let tens = baadge[baadge.length - 24];
    let hundreds = baadge[baadge.length - 25];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity Champ: ", concatInteger);

    expect(itemTypes[0].svgId.toString()).to.equal(concatInteger.toString());

    //kinship champ
    let kinshipChamp = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[0]);
    item = kinshipChamp.items[kinshipChamp.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship Champ: ", concatInteger);

    expect(itemTypes[1].svgId.toString()).to.equal(concatInteger.toString());

    //xp champ (tiebreaker)
    let xpChamp = await aavegotchiFacet.getAavegotchi(xpRFSzn3[1]);
    item = xpChamp.items[xpChamp.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("XP: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP Champ: ", concatInteger);

    expect(itemTypes[2].svgId.toString()).to.equal(concatInteger.toString());
  });

  it.only("Should airdrop szn3 2nd and 3rd place baadges", async function () {
    //rarity 2nd
    let rarity2nd = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[1]);
    let item = rarity2nd.items[rarity2nd.items.length - 1];
    let baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    let ones = baadge[baadge.length - 23];
    let tens = baadge[baadge.length - 24];
    let hundreds = baadge[baadge.length - 25];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity 2nd: ", concatInteger);

    expect(itemTypes[3].svgId.toString()).to.equal(concatInteger.toString());

    //kinship 2nd
    let kinship2nd = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[1]);
    item = kinship2nd.items[kinship2nd.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship 2nd: ", concatInteger);

    expect(itemTypes[4].svgId.toString()).to.equal(concatInteger.toString());

    //xp 2nd (tiebreaker)
    let xp2nd = await aavegotchiFacet.getAavegotchi(xpRFSzn3[0]);
    item = xp2nd.items[xp2nd.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("XP: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP 2nd: ", concatInteger);

    expect(itemTypes[5].svgId.toString()).to.equal(concatInteger.toString());

    //rarity 3rd
    let rarity3rd = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[2]);
    item = rarity3rd.items[rarity3rd.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity 3rd: ", concatInteger);

    expect(itemTypes[6].svgId.toString()).to.equal(concatInteger.toString());

    //kinship 3rd
    let kinship3rd = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[2]);
    item = kinship3rd.items[kinship3rd.items.length - 2];
    baadge = item[item.length - 1].toString();
    console.log("Rarity: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship 3rd: ", concatInteger);

    expect(itemTypes[7].svgId.toString()).to.equal(concatInteger.toString());

    //xp 3rd
    let xp3rd = await aavegotchiFacet.getAavegotchi(xpRFSzn3[2]);
    item = xp3rd.items[xp3rd.items.length - 2];
    baadge = item[item.length - 1].toString();
    console.log("XP: ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP 3rd: ", concatInteger);

    expect(itemTypes[8].svgId.toString()).to.equal(concatInteger.toString());
  });

  it.only("Should airdrop szn3 top10 baadges", async function () {
    //rarity top 10
    let rarityTop10 = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[3]);
    let item = rarityTop10.items[rarityTop10.items.length - 2];
    let baadge = item[item.length - 1].toString();
    console.log("Rarity Top10 (4): ", baadge);
    let ones = baadge[baadge.length - 23];
    let tens = baadge[baadge.length - 24];
    let hundreds = baadge[baadge.length - 25];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity Top10 (4): ", concatInteger);

    expect(itemTypes[10].svgId.toString()).to.equal(concatInteger.toString());

    rarityTop10 = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[9]);
    item = rarityTop10.items[rarityTop10.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Rarity Top10 (10): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity Top10 (10): ", concatInteger);

    expect(itemTypes[10].svgId.toString()).to.equal(concatInteger.toString());

    //kinship top 10
    let kinshipTop10 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[3]);
    item = kinshipTop10.items[kinshipTop10.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Kinship Top10 (4): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship Top10 (4): ", concatInteger);

    expect(itemTypes[11].svgId.toString()).to.equal(concatInteger.toString());

    kinshipTop10 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[9]);
    item = kinshipTop10.items[kinshipTop10.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Kinship Top10 (10): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship Top10 (10): ", concatInteger);

    expect(itemTypes[11].svgId.toString()).to.equal(concatInteger.toString());

    //XP top 10
    let xpTop10 = await aavegotchiFacet.getAavegotchi(xpRFSzn3[3]);
    item = xpTop10.items[xpTop10.items.length - 2];
    baadge = item[item.length - 1].toString();
    console.log("XP Top10 (4): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP Top10 (4): ", concatInteger);

    expect(itemTypes[12].svgId.toString()).to.equal(concatInteger.toString());

    xpTop10 = await aavegotchiFacet.getAavegotchi(xpRFSzn3[9]);
    item = xpTop10.items[xpTop10.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("XP Top10 (10): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP Top10 (10): ", concatInteger);

    expect(itemTypes[12].svgId.toString()).to.equal(concatInteger.toString());
  });

  it.only("Should airdrop szn3 top100 baadges", async function () {
    //rarity top 100
    let rarityTop100 = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[10]);
    let item = rarityTop100.items[rarityTop100.items.length - 1];
    let baadge = item[item.length - 1].toString();
    console.log("Rarity Top100 (11): ", baadge);
    let ones = baadge[baadge.length - 23];
    let tens = baadge[baadge.length - 24];
    let hundreds = baadge[baadge.length - 25];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity Top100 (11): ", concatInteger);

    expect(itemTypes[13].svgId.toString()).to.equal(concatInteger.toString());

    rarityTop100 = await aavegotchiFacet.getAavegotchi(rarityRFSzn3[99]);
    item = rarityTop100.items[rarityTop100.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Rarity Top100 (100): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Rarity Top100 (100): ", concatInteger);

    expect(itemTypes[13].svgId.toString()).to.equal(concatInteger.toString());

    //kinship top 100
    let kinshipTop100 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[10]);
    item = kinshipTop100.items[kinshipTop100.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Kinship Top100 (11): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship Top100 (11): ", concatInteger);

    expect(itemTypes[14].svgId.toString()).to.equal(concatInteger.toString());

    kinshipTop100 = await aavegotchiFacet.getAavegotchi(kinshipRFSzn3[99]);
    item = kinshipTop100.items[kinshipTop100.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("Kinship Top100 (100): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("Kinship Top100 (100): ", concatInteger);

    expect(itemTypes[14].svgId.toString()).to.equal(concatInteger.toString());

    //XP top 100
    let xpTop100 = await aavegotchiFacet.getAavegotchi(xpRFSzn3[10]);
    item = xpTop100.items[xpTop100.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("XP Top100 (11): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP Top100 (11): ", concatInteger);

    expect(itemTypes[15].svgId.toString()).to.equal(concatInteger.toString());

    xpTop100 = await aavegotchiFacet.getAavegotchi(xpRFSzn3[99]);
    item = xpTop100.items[xpTop100.items.length - 1];
    baadge = item[item.length - 1].toString();
    console.log("XP Top100 (100): ", baadge);
    ones = baadge[baadge.length - 23];
    tens = baadge[baadge.length - 24];
    hundreds = baadge[baadge.length - 25];
    concatInteger = hundreds.concat(tens, ones);

    console.log("XP Top100 (100): ", concatInteger);

    expect(itemTypes[15].svgId.toString()).to.equal(concatInteger.toString());
  });
});
