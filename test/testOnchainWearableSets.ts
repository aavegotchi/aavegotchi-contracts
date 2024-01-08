import { ethers, network } from "hardhat";
import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet, ItemsFacet, WearableSetsFacet } from "../typechain";
import { expect } from "chai";

import { upgrade } from "../scripts/upgrades/upgrade-addWearableSetHandlers";

let erc721: AavegotchiFacet;
let itemFacet: ItemsFacet;
let wearableSetFacet: WearableSetsFacet;
let owner: string;

describe("Onchain WearableSet tests", async function () {
  this.timeout(200000000);

  before(async function () {
    await upgrade();
    wearableSetFacet = (await ethers.getContractAt(
      "WearableSetsFacet",
      maticDiamondAddress
    )) as WearableSetsFacet;
  });

  //gotchis with existing sets offchain
  const tokenId1 = 3410; //foxy meta //set 15
  let tokenId1EquippedWearables: number[];

  it("Should add wearable set onchain without equipping/unequipping", async function () {
    [itemFacet, owner] = await useOwner(tokenId1.toString());
    wearableSetFacet = await impersonate(
      owner,
      wearableSetFacet,
      ethers,
      network
    );

    const tx = await wearableSetFacet.addWearableSets(tokenId1, [15]);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding wearable set failed: ${tx.hash}`);
    }
    console.log("Adding wearable set succeeded:", tx.hash);
    const wearableSets = await wearableSetFacet.getTokenWearableSets(tokenId1);

    expect(wearableSets[0]).to.equal(15);
  });

  it("Should remove a wearable set automatically if at most a dependent item is unequipped", async function () {
    let wearables = [...(await itemFacet.equippedWearables(tokenId1))];
    tokenId1EquippedWearables = wearables;

    // Look for wearable 39
    const index = wearables.indexOf(39);
    wearables[index] = 0;

    // Equip new wearables
    await itemFacet.equipWearables({
      tokenId: tokenId1,
      //@ts-ignore
      wearablesToEquip: wearables,
      wearableSetsToEquip: [15],
    });

    //verify that the wearable set was removed
    const wearableSets = await wearableSetFacet.getTokenWearableSets(tokenId1);
    expect(wearableSets.length).to.equal(0);
  });

  it("Should add wearableSet automatically if all dependent items are equipped", async function () {
    // Look for wearable 39
    const index = tokenId1EquippedWearables.indexOf(0);
    tokenId1EquippedWearables[index] = 39;

    // Equip new wearables
    await itemFacet.equipWearables({
      tokenId: tokenId1,
      //@ts-ignore
      wearablesToEquip: tokenId1EquippedWearables,
      wearableSetsToEquip: [15],
    });

    //verify that the wearable set was added
    const wearableSets = await wearableSetFacet.getTokenWearableSets(tokenId1);
    expect(wearableSets[0]).to.equal(15);
  });
});

async function useOwner(gotchiId: string): Promise<[any, string]> {
  erc721 = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    maticDiamondAddress
  )) as AavegotchiFacet;

  itemFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    maticDiamondAddress
  )) as ItemsFacet;

  const owner = await erc721.ownerOf(gotchiId);
  return [await impersonate(owner, itemFacet, ethers, network), owner];
}
