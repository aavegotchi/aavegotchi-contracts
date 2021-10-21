/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-batchUpdateItemPrice";
import { impersonate } from "../scripts/helperFunctions";
import {DAOFacet, ItemsFacet } from "../typechain";
import { expect } from "chai";

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

  it("Make sure prices are updated", async function () {
    console.log('updating prices')
    daoFacet = await impersonate(itemManager, daoFacet, ethers, network);
await daoFacet.batchUpdateItemsPrice([60,61],[1000,9000])
const wizardHatPrice= await (await itemsFacet.getItemType(60)).ghstPrice
expect(wizardHatPrice.toString()).to.equal("1000")
const LegendaryWizardHatPrice=await (await itemsFacet.getItemType(61)).ghstPrice
expect(LegendaryWizardHatPrice.toString()).to.equal("9000")
   
  });
});
