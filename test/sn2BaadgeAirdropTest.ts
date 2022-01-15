import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { main } from "../scripts/airdrops/rfSzn2BaadgesAirdrop";
import { itemTypes } from "../scripts/addItemTypes/itemTypes/rfSzn2Baadges";
import {
  kinship,
  rarity,
  rookKin,
  rookXP,
  xp,
  topTenKinship,
  top100Kinship,
  topTenRarity,
  top100Rarity,
  topTenRookKin,
  top100RookKin,
  topTenRookXP,
  top100RookXP,
  topTenXP,
  top100XP,
} from "../data/airdrops/badges/airdropTokenIdArrays";

describe("Airdrop SZN2 Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet;

  let signer: Signer;

  before(async function () {
    signer = await ethers.getSigner(maticDiamondAddress);

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress,
      signer
    )) as AavegotchiFacet;

    // await main();
  });

  it.only("Should airdrop szn2 rookie kin baadges", async function () {
    //rookie kin top 10
    let rookKinTopTen = await aavegotchiFacet.getAavegotchi(rookKin[9]);
    let item = rookKinTopTen.items[rookKinTopTen.items.length - 1];
    let baadge = item[item.length - 1].toString();
    let ones = baadge[baadge.length - 24];
    let tens = baadge[baadge.length - 25];
    let hundreds = baadge[baadge.length - 26];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("topTenRookKin: ", concatInteger);

    expect(itemTypes[24].svgId.toString()).to.equal(concatInteger.toString());

    //rookie kin top 100
    let rookKinTop100 = await aavegotchiFacet.getAavegotchi(rookKin[99]);
    let item2 = rookKinTop100.items[rookKinTop100.items.length - 1];
    let baadge2 = item2[item2.length - 1].toString();
    let ones2 = baadge2[baadge2.length - 24];
    let tens2 = baadge2[baadge2.length - 25];
    let hundreds2 = baadge2[baadge2.length - 26];
    let concatInteger2 = hundreds2.concat(tens2, ones2);

    console.log("top100RookKin: ", concatInteger2);

    expect(itemTypes[26].svgId.toString()).to.equal(concatInteger2.toString());
  });

  it.only("Should airdrop szn2 kinship baadges", async function () {
    //kinship top 10
    let kinshipTopTen = await aavegotchiFacet.getAavegotchi(kinship[9]);
    let item = kinshipTopTen.items[kinshipTopTen.items.length - 1];
    let baadge = item[item.length - 1].toString();
    let ones = baadge[baadge.length - 24];
    let tens = baadge[baadge.length - 25];
    let hundreds = baadge[baadge.length - 26];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("topTenKinship: ", concatInteger);

    expect(itemTypes[18].svgId.toString()).to.equal(concatInteger.toString());

    //kinship top 100
    let kinshipTop100 = await aavegotchiFacet.getAavegotchi(kinship[99]);
    let item2 = kinshipTop100.items[kinshipTop100.items.length - 1];
    let baadge2 = item2[item2.length - 1].toString();
    let ones2 = baadge2[baadge2.length - 24];
    let tens2 = baadge2[baadge2.length - 25];
    let hundreds2 = baadge2[baadge2.length - 26];
    let concatInteger2 = hundreds2.concat(tens2, ones2);

    console.log("top100Kinship: ", concatInteger2);

    expect(itemTypes[21].svgId.toString()).to.equal(concatInteger2.toString());
  });

  it.only("Should airdrop szn2 kinship top3 baadges", async function () {
    //1st
    let kinship1st = await aavegotchiFacet.getAavegotchi(kinship[0]);
    let item = kinship1st.items[kinship1st.items.length - 1];
    let baadge = item[item.length - 1].toString();
    let ones = baadge[baadge.length - 24];
    let tens = baadge[baadge.length - 25];
    let hundreds = baadge[baadge.length - 26];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("kinship1st: ", concatInteger);

    expect(itemTypes[1].svgId.toString()).to.equal(concatInteger.toString());

    //2nd
    let kinship2nd = await aavegotchiFacet.getAavegotchi(kinship[1]);
    let item2 = kinship2nd.items[kinship2nd.items.length - 1];
    let baadge2 = item2[item2.length - 1].toString();
    let ones2 = baadge2[baadge2.length - 24];
    let tens2 = baadge2[baadge2.length - 25];
    let hundreds2 = baadge2[baadge2.length - 26];
    let concatInteger2 = hundreds2.concat(tens2, ones2);

    console.log("kinship2nd: ", concatInteger2);

    expect(itemTypes[4].svgId.toString()).to.equal(concatInteger2.toString());

    //3rd
    let kinship3rd = await aavegotchiFacet.getAavegotchi(kinship[2]);
    let item3 = kinship3rd.items[kinship3rd.items.length - 1];
    let baadge3 = item3[item3.length - 1].toString();
    let ones3 = baadge3[baadge3.length - 24];
    let tens3 = baadge3[baadge3.length - 25];
    let hundreds3 = baadge3[baadge3.length - 26];
    let concatInteger3 = hundreds3.concat(tens3, ones3);

    console.log("kinship2nd: ", concatInteger3);

    expect(itemTypes[7].svgId.toString()).to.equal(concatInteger3.toString());
  });

  it.only("Should airdrop szn2 rarity 1st baadges", async function () {
    //1st
    let rarity1st = await aavegotchiFacet.getAavegotchi(rarity[0]);
    let item = rarity1st.items[rarity1st.items.length - 1];
    let baadge = item[item.length - 1].toString();
    let ones = baadge[baadge.length - 24];
    let tens = baadge[baadge.length - 25];
    let hundreds = baadge[baadge.length - 26];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("rarity1st: ", concatInteger);

    expect(itemTypes[0].svgId.toString()).to.equal(concatInteger.toString());
  });

  it.only("Should airdrop szn2 rookie xp top3 baadges", async function () {
    //1st
    let rookXP1st = await aavegotchiFacet.getAavegotchi(rookXP[0]);
    let item = rookXP1st.items[rookXP1st.items.length - 1];
    let baadge = item[item.length - 1].toString();
    let ones = baadge[baadge.length - 24];
    let tens = baadge[baadge.length - 25];
    let hundreds = baadge[baadge.length - 26];
    let concatInteger = hundreds.concat(tens, ones);

    console.log("rookXP1st: ", concatInteger);

    expect(itemTypes[12].svgId.toString()).to.equal(concatInteger.toString());

    //2nd
    let rookXP2nd = await aavegotchiFacet.getAavegotchi(rookXP[1]);
    let item2 = rookXP2nd.items[rookXP2nd.items.length - 1];
    let baadge2 = item2[item2.length - 1].toString();
    let ones2 = baadge2[baadge2.length - 24];
    let tens2 = baadge2[baadge2.length - 25];
    let hundreds2 = baadge2[baadge2.length - 26];
    let concatInteger2 = hundreds2.concat(tens2, ones2);

    console.log("kinship2nd: ", concatInteger2);

    expect(itemTypes[14].svgId.toString()).to.equal(concatInteger2.toString());

    //3rd
    let rookXP3rd = await aavegotchiFacet.getAavegotchi(rookXP[2]);
    let item3 = rookXP3rd.items[rookXP3rd.items.length - 1];
    let baadge3 = item3[item3.length - 1].toString();
    let ones3 = baadge3[baadge3.length - 24];
    let tens3 = baadge3[baadge3.length - 25];
    let hundreds3 = baadge3[baadge3.length - 26];
    let concatInteger3 = hundreds3.concat(tens3, ones3);

    console.log("kinship3rd: ", concatInteger3);

    expect(itemTypes[16].svgId.toString()).to.equal(concatInteger3.toString());
  });
});
