import { ethers } from "hardhat";
import { request } from "graphql-request";
import { IFakeGotchi, LendingGetterAndSetterFacet } from "../typechain";
import {
  maticDiamondAddress,
  maticFakeGotchiCards,
} from "../scripts/helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { dataArgs as dataArgs1 } from "../data/airdrops/rarityfarming/szn4/rnd1";
import { dataArgs as dataArgs2 } from "../data/airdrops/rarityfarming/szn4/rnd2";
import { dataArgs as dataArgs3 } from "../data/airdrops/rarityfarming/szn4/rnd3";
import { dataArgs as dataArgs4 } from "../data/airdrops/rarityfarming/szn4/rnd4";

import { getRfSznTypeRanking } from "../scripts/helperFunctions";

describe("Fake Gotchi Airdrop", async function () {
  this.timeout(200000000);
  const maticGraphUrl: string =
    "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
  const cardOwner = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  let fakeGotchis: IFakeGotchi,
    lendingGetter: LendingGetterAndSetterFacet,
    signer: Signer,
    batchAddressArray1: string[],
    batchAddressArray2: string[],
    batchAddressArray3: string[];

  interface Gotchi {
    id: string;
  }
  interface OriginalAddress {
    aavegotchis: {
      gotchiId: number;
      owner: Gotchi;
      originalOwner: Gotchi;
    }[];
  }

  function getOriginalOwnerAddress(_id: number): Promise<OriginalAddress> {
    let query = `
      {aavegotchis(where: {gotchiId_in: [${_id}]}) {
        gotchiId
        owner{
          id
        }
        originalOwner{
          id
        }
      }}
      `;
    return request(maticGraphUrl, query);
  }

  before(async function () {
    signer = await ethers.getSigner(maticFakeGotchiCards);

    batchAddressArray1 = [];
    batchAddressArray2 = [];
    batchAddressArray3 = [];

    lendingGetter = (await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      maticDiamondAddress,
      signer
    )) as LendingGetterAndSetterFacet;
    fakeGotchis = (await ethers.getContractAt(
      "IFakeGotchi",
      maticFakeGotchiCards,
      signer
    )) as IFakeGotchi;

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

    const rarity = await getRfSznTypeRanking(rarityArray, "rarity");
    const topRarity = rarity.slice(0, 10);
    const bottomRarity = rarity.slice(300, 320);

    const kinship = await getRfSznTypeRanking(kinshipArray, "kinship");
    const topKinship = kinship.slice(0, 10);
    const bottomKinship = rarity.slice(300, 320);

    const xp = await getRfSznTypeRanking(xpArray, "xp");
    const topXP = xp.slice(0, 4);
    const bottomXP = rarity.slice(300, 320);

    for (let i = 0; i < topRarity.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(topRarity[i]);
      let data = await getOriginalOwnerAddress(topRarity[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray1.push(ogOwner);
      } else {
        batchAddressArray1.push(curOwner);
      }
    }

    for (let i = 0; i < bottomRarity.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(bottomRarity[i]);
      let data = await getOriginalOwnerAddress(bottomRarity[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray1.push(ogOwner);
      } else {
        batchAddressArray1.push(curOwner);
      }
    }

    for (let i = 0; i < topKinship.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(topKinship[i]);
      let data = await getOriginalOwnerAddress(topKinship[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray2.push(ogOwner);
      } else {
        batchAddressArray2.push(curOwner);
      }
    }

    for (let i = 0; i < bottomKinship.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(bottomKinship[i]);
      let data = await getOriginalOwnerAddress(bottomKinship[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray2.push(ogOwner);
      } else {
        batchAddressArray2.push(curOwner);
      }
    }

    for (let i = 0; i < topXP.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(topXP[i]);
      let data = await getOriginalOwnerAddress(topXP[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray3.push(ogOwner);
      } else {
        batchAddressArray3.push(curOwner);
      }
    }

    for (let i = 0; i < bottomXP.length; i++) {
      let isLent = await lendingGetter.isAavegotchiLent(bottomXP[i]);
      let data = await getOriginalOwnerAddress(bottomXP[i]);
      let curOwner = data.aavegotchis[0].owner.id;

      if (isLent) {
        let ogOwner = data.aavegotchis[0].originalOwner.id;

        batchAddressArray3.push(ogOwner);
      } else {
        batchAddressArray3.push(curOwner);
      }
    }
  });

  it("Should be more than zero card balance for addresses in array", async function () {
    for (let i = 0; i < batchAddressArray1.length; i++) {
      console.log("Rarity Address: ", batchAddressArray1[i]);

      let ownerBalance = await fakeGotchis.balanceOf(batchAddressArray1[i], 0);
      console.log("Balance: ", ownerBalance.toString());

      expect(parseInt(ownerBalance.toString())).to.above(0);
    }

    for (let i = 0; i < batchAddressArray2.length; i++) {
      console.log("Kinship Address: ", batchAddressArray2[i]);

      let ownerBalance = await fakeGotchis.balanceOf(batchAddressArray2[i], 0);
      console.log("Balance: ", ownerBalance.toString());

      expect(parseInt(ownerBalance.toString())).to.above(0);
    }

    for (let i = 0; i < batchAddressArray3.length; i++) {
      console.log("XP Address: ", batchAddressArray3[i]);

      let ownerBalance = await fakeGotchis.balanceOf(batchAddressArray3[i], 0);
      console.log("Balance: ", ownerBalance.toString());

      expect(parseInt(ownerBalance.toString())).to.above(0);
    }
  });
});
