import { ethers } from "hardhat";
import { expect } from "chai";
import { ForgeDAOFacet, ForgeFacet, ForgeTokenFacet } from "../../typechain";
import { maticForgeDiamond } from "../../scripts/helperFunctions";

import {
  forgeAddresses,
  itemIds,
  predefinedAmounts,
} from "../../scripts/updates/batchMintGotchigangWearables";

describe("Testing Gotchigang Schematics ditribution", async function () {
  const totalAmounts = [1000, 500, 250, 100, 10];

  const amounts = Object.entries(itemIds).flatMap(([rarity, ids]) =>
    new Array(ids.length).fill(
      totalAmounts[
        ["common", "uncommon", "rare", "legendary", "mythical"].indexOf(rarity)
      ]
    )
  );
  console.log(amounts);

  let forgeDiamondAddress = maticForgeDiamond;
  let forgeTokenFacet: ForgeTokenFacet;

  before(async function () {
    forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      forgeDiamondAddress
    )) as ForgeTokenFacet;
  });

  it("should assert all balances", async function () {
    const allIds = Object.values(itemIds).flat();

    const forgeAmount1 = predefinedAmounts[0];
    const forgeIds1 = allIds.slice(0, forgeAmount1.length);

    const forgeAmount2 = predefinedAmounts[1];
    const forgeIds2 = allIds;

    const forgeAmount3 = amounts.map(
      (total, i) =>
        total - (predefinedAmounts[0][i] || 0) - (predefinedAmounts[1][i] || 0)
    );
    const forgeIds3 = allIds;

    const bal1 = await forgeTokenFacet.balanceOfOwner(forgeAddresses[0]);
    const bal2 = await forgeTokenFacet.balanceOfOwner(forgeAddresses[1]);
    const bal3 = await forgeTokenFacet.balanceOfOwner(forgeAddresses[2]);

    const assertBalances = (
      forgeIds: number[],
      forgeAmounts: number[],
      bal: any[]
    ) => {
      for (let i = 0; i < forgeIds.length; i++) {
        const expectedId = forgeIds[i];
        const expectedAmount = forgeAmounts[i];
        const actualItem = bal.find((item) => item.tokenId.eq(expectedId));

        if (actualItem) {
          expect(actualItem.balance).to.equal(expectedAmount);
        }
      }
    };

    assertBalances(forgeIds1, forgeAmount1, bal1);
    assertBalances(forgeIds2, forgeAmount2, bal2);
    assertBalances(forgeIds3, forgeAmount3, bal3);

    for (let i = 0; i < amounts.length; i++) {
      const sum =
        (forgeAmount1[i] || 0) +
        (forgeAmount2[i] || 0) +
        (forgeAmount3[i] || 0);

      expect(sum).to.equal(amounts[i], `Sum mismatch at index ${i}`);
      console.log(`Total minted for schematics ${allIds[i]}: ${sum}`);
    }
  });
});
