/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-erc721BuyOrderFacet";
import { impersonate } from "../scripts/helperFunctions";
import { ERC20Token, ERC721BuyOrderFacet } from "../typechain";

const { expect } = chai;

describe("Testing ERC721 Buy Order Cancel", async function () {
  this.timeout(30000000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const ghstHolderAddress = "0x8CbF96319b3C56d50a7C82EFb6d3c46bD6f889Ba";
  let erc721BuyOrderFacet: ERC721BuyOrderFacet;
  let ghstERC20: ERC20Token;
  let ghstHolder: any;
  const buyOrderId = 67;

  before(async function () {
    await upgrade();

    erc721BuyOrderFacet = (await ethers.getContractAt(
      "ERC721BuyOrderFacet",
      diamondAddress
    )) as ERC721BuyOrderFacet;
    ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstHolderAddress],
    });
    ghstHolder = await ethers.getSigner(ghstHolderAddress);

    erc721BuyOrderFacet = await impersonate(
      ghstHolderAddress,
      erc721BuyOrderFacet,
      ethers,
      network
    );
  });

  describe("Testing cancelERC721BuyOrder", async function () {
    it("Should succeed if cancel valid buy order", async function () {
      const receipt = await (
        await erc721BuyOrderFacet.cancelERC721BuyOrder(buyOrderId)
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC721BuyOrderCanceled"
      );
      expect(event!.args!.buyOrderId).to.equal(buyOrderId);
    });
  });
});
