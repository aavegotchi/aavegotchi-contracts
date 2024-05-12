/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { impersonate } from "../scripts/helperFunctions";
import {
  ERC20Token,
  EscrowFacet
} from "../typechain";
import {
  ghstAddress,
} from "../helpers/constants";
import { upgradeBatchEscrow } from "../scripts/upgrades/upgrade-batchEscrow";

const { expect } = chai;

describe("Testing batch escrow", async function () {
  this.timeout(300000);

  const revenueTokens: string[] = [ghstAddress];
  const batchLength = revenueTokens.length;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const tokenHolderAddress = "0x10B989914A478Ed7DE2d2C4CC4e835bbd3de229b";
  const gotchiId = 8062;
  const testAmount = ethers.utils.parseEther("10")
  const receiverAddress = "0x3721546e51258065bfdb9746b2e442C7671B0298";
  let ghst: ERC20Token;
  let escrowFacet: EscrowFacet;

  before(async function () {
    await upgradeBatchEscrow();

    escrowFacet = (await ethers.getContractAt(
      "EscrowFacet",
      diamondAddress
    )) as EscrowFacet;
    ghst = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    escrowFacet = await impersonate(
      tokenHolderAddress,
      escrowFacet,
      ethers,
      network
    );
  });

  describe("Testing batch escrow", async function () {
    it("Should revert if length are not match", async function () {
      await expect(
        escrowFacet.batchTransferEscrow(Array(batchLength + 1).fill(gotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and ERC20Contracts length must match"
      );
      await expect(
        escrowFacet.batchTransferEscrow(Array(batchLength).fill(gotchiId), revenueTokens, Array(batchLength + 1).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and Recipients length must match"
      );
      await expect(
        escrowFacet.batchTransferEscrow(Array(batchLength).fill(gotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength + 1).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and TransferAmounts length must match"
      );
    });
    it("Should succeed", async function () {
      const gotchiEscrow = await escrowFacet.gotchiEscrow(gotchiId);
      const escrowBalanceBefore = await ghst.balanceOf(gotchiEscrow);
      const receiverBalanceBefore = await ghst.balanceOf(receiverAddress);
      const receipt = await (await escrowFacet.batchTransferEscrow(Array(batchLength).fill(gotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))).wait();
      const event = receipt!.events!.find((e) => e.event === "TransferEscrow")
      expect(event!.args!._tokenId).to.equal(gotchiId);
      expect(event!.args!._erc20Contract.toLowerCase()).to.equal(ghstAddress);
      expect(event!.args!._from).to.equal(gotchiEscrow);
      expect(event!.args!._to).to.equal(receiverAddress);
      const escrowBalanceAfter = await ghst.balanceOf(gotchiEscrow);
      const receiverBalanceAfter = await ghst.balanceOf(receiverAddress);
      expect(escrowBalanceBefore.sub(escrowBalanceAfter)).to.equal(testAmount);
      expect(receiverBalanceAfter.sub(receiverBalanceBefore)).to.equal(testAmount);
    });
  });
});
