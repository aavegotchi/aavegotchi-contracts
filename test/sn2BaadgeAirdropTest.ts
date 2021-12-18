import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-batchUpdateItemPrice";
import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { main } from "../scripts/airdrops/rfSzn2BaadgesAirdrop";
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
} from "../scripts/airdrops/airdropTokenIdArrays";

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

  it.only("Should airdrop szn2 baadges", async function () {
    // for (let index = 0; index < topTenRookKin.length; index++) {
    //   let rookKinTopTen = await aavegotchiFacet.getAavegotchi(
    //     topTenRookKin[index]
    //   );
    //   let items = rookKinTopTen.items;
    //   for (let index = 0; index < items.length; index++) {
    //     let svgId = items[index];
    //     svgId[svgId.length - 1];
    //   }

    // }

    let rookKinTopTen = await aavegotchiFacet.getAavegotchi(rookKin[10]);
    let item = rookKinTopTen.items[rookKinTopTen.items.length - 1];
    let baadge = item[item.length - 1];

    console.log("topTenRookKin: ", baadge);
  });
});
