import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { main } from "../scripts/airdrops/pumpkinBdgAirdrop";
import { itemTypes } from "../scripts/addItemTypes/itemTypes/pumpkinBdg";
import { pumpkinSmashData } from "../data/airdrops/badges/pumpkinSmashing";

describe("Airdrop Pumpkin Smash Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet, signer: Signer;

  it("Should airdrop pumpkin badge", async function () {
    let players: number[] = [];
    signer = await ethers.getSigner(maticDiamondAddress);

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress,
      signer
    )) as AavegotchiFacet;

    for (let index = 0; index < pumpkinSmashData.length; index++) {
      if (!players.includes(pumpkinSmashData[index])) {
        players.push(pumpkinSmashData[index]);
      }
    }

    const first10Players: number[] = players.slice(0, 10);
    const last10Players: number[] = players.slice(382, 392);

    for (let x = 0; x < first10Players.length; x++) {
      let playerData = await aavegotchiFacet.getAavegotchi(first10Players[x]);
      let item = playerData.items[playerData.items.length - 1];
      let baadge = item[item.length - 1].toString();
      let ones = baadge[baadge.length - 23];
      let tens = baadge[baadge.length - 24];
      let hundreds = baadge[baadge.length - 25];
      let concatInteger = hundreds.concat(tens, ones);

      console.log(`1st 10 Player Id ${first10Players[x]}: `, concatInteger);

      expect(itemTypes[0].svgId.toString()).to.equal(concatInteger.toString());
    }

    for (let y = 0; y < last10Players.length; y++) {
      let playerData = await aavegotchiFacet.getAavegotchi(last10Players[y]);
      let item = playerData.items[playerData.items.length - 1];
      let baadge = item[item.length - 1].toString();
      let ones = baadge[baadge.length - 23];
      let tens = baadge[baadge.length - 24];
      let hundreds = baadge[baadge.length - 25];
      let concatInteger = hundreds.concat(tens, ones);

      console.log(`Last 10 Player Id ${last10Players[y]}: `, concatInteger);

      expect(itemTypes[0].svgId.toString()).to.equal(concatInteger.toString());
    }
  });
});
