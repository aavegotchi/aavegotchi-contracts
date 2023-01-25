import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { itemTypes } from "../scripts/addItemTypes/itemTypes/tooorkeyBdg";
import { toorkeyChaserData } from "../data/airdrops/badges/tooorkeyChasers";
import { airdropTooorkeyBadge } from "../scripts/airdrops/tooorkeyBdgAirdrop";

describe("Airdrop Tooorkey Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet, signer: Signer;

  before(async function() {
    await airdropTooorkeyBadge();
  })

  it("Should airdrop tooorkey badge", async function () {
    signer = await ethers.getSigner(maticDiamondAddress);

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress,
      signer
    )) as AavegotchiFacet;

    const first10Players: number[] = toorkeyChaserData.slice(0, 10);
    const last10Players: number[] = toorkeyChaserData.slice(toorkeyChaserData.length - 10, toorkeyChaserData.length);

    for (let x = 0; x < first10Players.length; x++) {
      let playerData = await aavegotchiFacet.getAavegotchi(first10Players[x]);
      let baadgeItem = playerData.items[playerData.items.length - 1];
      let baadgeItemType = baadgeItem.itemType;
      console.log(`1st 10 Player Id ${first10Players[x]}: `, baadgeItemType.svgId);
      expect(itemTypes[0].svgId).to.equal(baadgeItemType.svgId);
    }

    for (let y = 0; y < last10Players.length; y++) {
      let playerData = await aavegotchiFacet.getAavegotchi(last10Players[y]);
      let baadgeItem = playerData.items[playerData.items.length - 1];
      let baadgeItemType = baadgeItem.itemType;
      console.log(`Last 10 Player Id ${last10Players[y]}: `, baadgeItemType.svgId);
      expect(itemTypes[0].svgId).to.equal(baadgeItemType.svgId);
    }
  });
});
