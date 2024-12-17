/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import {
  CollateralFacet,
  ERC20,
  IERC20,
  PolygonXGeistBridgeFacet,
} from "../typechain";
import { upgradeWithdrawCollateral } from "../scripts/upgrades/upgrade-withdrawCollateral";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { bridgeConfig } from "../scripts/geistBridge/bridgeConfig";
import { expect } from "chai";

describe("Testing Geist Bridge Collateral and GHST Auto-Withdraw", async function () {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  const escrowAddress = "0x449eb8b3f95fafa49f2f666f7f144126465d20db";
  let bridgeFacet: PolygonXGeistBridgeFacet;
  let collateralFacet: CollateralFacet;
  const tokenId = 6018;
  let signer: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let ghstContract: ERC20;
  let ghstToken = "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7";

  // this.timeout(300000)
  before(async function () {
    await upgradeWithdrawCollateral();

    signer = await ethers.getImpersonatedSigner(
      "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"
    );
    nonOwner = await ethers.getImpersonatedSigner(
      "0xaA5150a579e91DFc14a6Af0c2B665B190a03E89f"
    );

    bridgeFacet = (await ethers.getContractAt(
      "PolygonXGeistBridgeFacet",
      diamondAddress,
      signer
    )) as PolygonXGeistBridgeFacet;

    ghstContract = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      ghstToken,
      signer
    )) as IERC20;

    collateralFacet = (await ethers.getContractAt(
      "CollateralFacet",
      diamondAddress,
      signer
    )) as CollateralFacet;
  });

  it("Non-owner should not be able to withdraw collateral", async function () {
    await expect(
      collateralFacet
        .connect(nonOwner)
        .decreaseStake(tokenId, ethers.utils.parseEther("0.1"))
    ).to.be.revertedWith(
      "LibAppStorage: Only aavegotchi owner can call this function"
    );
  });

  it("Test GHST Auto-Withdraw", async function () {
    const userGhstBalanceBefore = await ghstContract.balanceOf(signer.address);

    const escrowGhstBalanceBefore = await ghstContract.balanceOf(escrowAddress);

    expect(escrowGhstBalanceBefore).to.be.eq(ethers.utils.parseEther("1"));

    const tx = await bridgeFacet
      .connect(signer)
      .bridgeGotchi(
        signer.address,
        tokenId,
        500_000,
        bridgeConfig[137].GOTCHI.connectors["63157"].FAST,
        { value: ethers.utils.parseEther("0.3") }
      );
    await tx.wait();

    const userGhstBalanceAfter = await ghstContract.balanceOf(signer.address);
    const collateralBalanceAfter = (
      await collateralFacet.collateralBalance(tokenId)
    ).balance_;
    const escrowGhstBalanceAfter = await ghstContract.balanceOf(escrowAddress);

    expect(collateralBalanceAfter).to.be.eq(0);
    expect(userGhstBalanceAfter).to.be.eq(
      userGhstBalanceBefore.add(ethers.utils.parseEther("1"))
    );
    expect(escrowGhstBalanceAfter).to.be.eq("0");
  });
});
