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
  const unlockedGotchiOwnerAddress = "0xBfe09443556773958bae1699b786d8E9680B5571";
  const unlockedGotchiId = 17344;
  const lockedGotchiOwnerAddress = "0xBfe09443556773958bae1699b786d8E9680B5571";
  const lockedGotchiId = 13700;
  const testAmount = ethers.utils.parseEther("10")
  const receiverAddress = "0x3721546e51258065bfdb9746b2e442C7671B0298";
  let ghst: ERC20Token;
  let escrowFacetWithUnlockedGotchiOwner: EscrowFacet;
  let escrowFacetWithLockedGotchiOwner: EscrowFacet;
  let escrowFacetWithNonOwner: EscrowFacet;

  before(async function () {
    await upgradeBatchEscrow();

    const escrowFacet = (await ethers.getContractAt(
      "EscrowFacet",
      diamondAddress
    )) as EscrowFacet;
    ghst = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    escrowFacetWithUnlockedGotchiOwner = await impersonate(
      unlockedGotchiOwnerAddress,
      escrowFacet,
      ethers,
      network
    );
    escrowFacetWithLockedGotchiOwner = await impersonate(
      lockedGotchiOwnerAddress,
      escrowFacet,
      ethers,
      network
    );
    escrowFacetWithNonOwner = await impersonate(
      receiverAddress,
      escrowFacet,
      ethers,
      network
    );
  });

  describe("Testing batch escrow", async function () {
    it("Should revert if length are not match", async function () {
      await expect(
        escrowFacetWithUnlockedGotchiOwner.batchTransferEscrow(Array(batchLength + 1).fill(unlockedGotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and ERC20Contracts length must match"
      );
      await expect(
        escrowFacetWithUnlockedGotchiOwner.batchTransferEscrow(Array(batchLength).fill(unlockedGotchiId), revenueTokens, Array(batchLength + 1).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and Recipients length must match"
      );
      await expect(
        escrowFacetWithUnlockedGotchiOwner.batchTransferEscrow(Array(batchLength).fill(unlockedGotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength + 1).fill(testAmount))
      ).to.be.revertedWith(
        "EscrowFacet: TokenIDs and TransferAmounts length must match"
      );
    });
    it("Should revert if don't have gotchi", async function () {
      await expect(
        escrowFacetWithNonOwner.batchTransferEscrow(Array(batchLength).fill(unlockedGotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "LibAppStorage: Only aavegotchi owner can call this function"
      );
    });
    it("Should revert if locked gotchi", async function () {
      await expect(
        escrowFacetWithLockedGotchiOwner.batchTransferEscrow(Array(batchLength).fill(lockedGotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))
      ).to.be.revertedWith(
        "LibAppStorage: Only callable on unlocked Aavegotchis"
      );
    });
    it("Should succeed", async function () {
      const gotchiEscrow = await escrowFacetWithUnlockedGotchiOwner.gotchiEscrow(unlockedGotchiId);
      const escrowBalanceBefore = await ghst.balanceOf(gotchiEscrow);
      const receiverBalanceBefore = await ghst.balanceOf(receiverAddress);
      const receipt = await (await escrowFacetWithUnlockedGotchiOwner.batchTransferEscrow(Array(batchLength).fill(unlockedGotchiId), revenueTokens, Array(batchLength).fill(receiverAddress), Array(batchLength).fill(testAmount))).wait();
      const event = receipt!.events!.find((e) => e.event === "TransferEscrow")
      expect(event!.args!._tokenId).to.equal(unlockedGotchiId);
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
