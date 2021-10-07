/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-erc1155CategoriesAndSlots";
import { impersonate } from "../scripts/helperFunctions";
import { DAOFacet, ItemsFacet } from "../typechain";

describe("Testing Slot Change", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let daoFacet: DAOFacet;

  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let itemsFacet: ItemsFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    daoFacet = (await ethers.getContractAt(
      "DAOFacet",
      diamondAddress
    )) as DAOFacet;

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;
  });

  it("Change slot", async function () {
    daoFacet = await impersonate(itemManager, daoFacet, ethers, network);

    const face: [
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean,
      boolean
    ] = [
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];

    let itemType = await itemsFacet.getItemType("263");
    console.log("item type:", itemType);

    const tx = await daoFacet.setWearableSlotPositions("263", face);

    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`);
    }

    itemType = await itemsFacet.getItemType("263");
    console.log("item type:", itemType);
  });
});
