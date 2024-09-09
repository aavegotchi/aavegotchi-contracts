import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet, ItemsFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";

import { itemTypes } from "../scripts/addItemTypes/itemTypes/rfSzn7Bdgs";
import { dataArgs as dataArgs1 } from "../data/airdrops/rarityfarming/szn7/rnd1";
import { dataArgs as dataArgs2 } from "../data/airdrops/rarityfarming/szn7/rnd2";
import { dataArgs as dataArgs3 } from "../data/airdrops/rarityfarming/szn7/rnd3";
import { dataArgs as dataArgs4 } from "../data/airdrops/rarityfarming/szn7/rnd4";

import { rankIds } from "../scripts/helperFunctions";
import { main } from "../scripts/airdrops/rfSzn7BdgsAirdrop";
import { getGotchisForASeason } from "../scripts/getGotchis";

describe("Airdrop SZN7 Baadges", async function () {
  this.timeout(200000000);

  let itemsFacet: ItemsFacet,
    aavegotchiFacet: AavegotchiFacet,
    signer: Signer,
    rarityRFSzn7: number[],
    kinshipRFSzn7: number[],
    xpRFSzn7: number[];

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

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      maticDiamondAddress,
      signer
    )) as ItemsFacet;

    let tieBreaker = await getGotchisForASeason("7");
    const [rarityBreaker, kinshipBreaker, xpBreaker] = tieBreaker;

    rarityRFSzn7 = await rankIds(rarityArray, rarityBreaker).map((id) =>
      parseInt(id)
    );

    kinshipRFSzn7 = await rankIds(kinshipArray, kinshipBreaker).map((id) =>
      parseInt(id)
    );

    xpRFSzn7 = await rankIds(xpArray, xpBreaker).map((id) => parseInt(id));

    await main();
  });

  it.only("Should airdrop szn7 champion baadges", async function () {
    //rarity champ

    expect(
      await exists(
        rarityRFSzn7[0].toString(),
        itemTypes[0].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //kinship champ
    expect(
      await exists(
        kinshipRFSzn7[0].toString(),
        itemTypes[1].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //xp champ
    expect(
      await exists(
        xpRFSzn7[0].toString(),
        itemTypes[2].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);
  });

  it.only("Should airdrop szn7 2nd and 3rd place baadges", async function () {
    //rarity 2nd

    expect(
      await exists(
        rarityRFSzn7[1].toString(),
        itemTypes[3].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //kinship 2nd
    expect(
      await exists(
        kinshipRFSzn7[1].toString(),
        itemTypes[4].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    // //xp 2nd
    expect(
      await exists(
        xpRFSzn7[1].toString(),
        itemTypes[5].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //rarity 3rd
    expect(
      await exists(
        rarityRFSzn7[2].toString(),
        itemTypes[6].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //kinship 3rd
    expect(
      await exists(
        kinshipRFSzn7[2].toString(),
        itemTypes[7].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //xp 3rd
    expect(
      await exists(
        xpRFSzn7[2].toString(),
        itemTypes[8].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);
  });

  it.only("Should airdrop szn7 top10 baadges", async function () {
    //rarity top 10

    expect(
      await exists(
        rarityRFSzn7[3].toString(),
        itemTypes[10].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        rarityRFSzn7[9].toString(),
        itemTypes[10].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //kinship top 10

    expect(
      await exists(
        kinshipRFSzn7[3].toString(),
        itemTypes[11].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        kinshipRFSzn7[9].toString(),
        itemTypes[11].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //XP top 10
    expect(
      await exists(
        xpRFSzn7[3].toString(),
        itemTypes[12].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        xpRFSzn7[9].toString(),
        itemTypes[12].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);
  });

  it.only("Should airdrop szn7 top100 baadges", async function () {
    //rarity top 100

    expect(
      await exists(
        rarityRFSzn7[10].toString(),
        itemTypes[13].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        rarityRFSzn7[99].toString(),
        itemTypes[13].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //kinship top 100

    expect(
      await exists(
        kinshipRFSzn7[10].toString(),
        itemTypes[14].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        kinshipRFSzn7[99].toString(),
        itemTypes[14].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    //XP top 100
    expect(
      await exists(
        xpRFSzn7[10].toString(),
        itemTypes[15].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);

    expect(
      await exists(
        xpRFSzn7[99].toString(),
        itemTypes[15].svgId.toString(),
        itemsFacet
      )
    ).to.equal(true);
  });
});

async function exists(tokenId: string, itemId: string, items: ItemsFacet) {
  let bal = await items.balanceOfToken(maticDiamondAddress, tokenId, itemId);

  return bal.gt(0);
}
