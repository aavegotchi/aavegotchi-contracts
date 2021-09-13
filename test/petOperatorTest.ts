/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgradePetOperator } from "../scripts/upgrades/upgrade-petOperator";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { impersonate } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain/AavegotchiFacet";
import { AavegotchiGameFacet } from "../typechain/AavegotchiGameFacet";

describe("Testing Pet Operator Upgrade", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let aavegotchiFacet: AavegotchiFacet;
  let aavegotchiGameFacet: Contract;
  let petOperator: string;
  let firstOwner: string;
  let secondOwner: string;
  let thirdOwner: string;
  let tokenIdOne: string;
  let tokenIdTwo: string;
  let tokenIdThree: string;

  // this.timeout(300000)
  before(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MATIC_URL,
          },
        },
      ],
    });

    await upgradePetOperator();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;

    tokenIdOne = "9512";
    firstOwner = await aavegotchiFacet.ownerOf(tokenIdOne);
    petOperator = firstOwner;
    tokenIdTwo = "8020";
    secondOwner = await aavegotchiFacet.ownerOf(tokenIdTwo);
    tokenIdThree = "7331";
    thirdOwner = await aavegotchiFacet.ownerOf(tokenIdThree);
  });

  it("Transfer Aavegotchi", async function () {
    aavegotchiFacet = await impersonate(firstOwner, aavegotchiFacet);

    expect(firstOwner).to.not.equal(secondOwner);
    const tx = await aavegotchiFacet.transferFrom(
      firstOwner,
      secondOwner,
      tokenIdOne
    );

    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`);
    }

    expect(await aavegotchiFacet.ownerOf(tokenIdOne)).to.equal(secondOwner);
  });

  it("Owner should set Pet Operator", async function () {
    aavegotchiFacet = await impersonate(secondOwner, aavegotchiFacet);

    const tx = await aavegotchiFacet.setPetOperatorForAll(petOperator, true);

    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`);
    }

    const approved = await aavegotchiFacet.isPetOperatorForAll(
      secondOwner,
      petOperator
    );

    expect(approved).to.equal(true);
  });

  it("Address without permission does not have approval ", async function () {
    aavegotchiFacet = await impersonate(secondOwner, aavegotchiFacet);

    const tx = await aavegotchiFacet.transferFrom(
      secondOwner,
      thirdOwner,
      tokenIdOne
    );
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`);
    }

    const approved = await aavegotchiFacet.isPetOperatorForAll(
      thirdOwner,
      petOperator
    );

    expect(approved).to.equal(false);
  });

  it("Can't pet Aavegotchis not owned by you", async function () {
    aavegotchiFacet = await impersonate(thirdOwner, aavegotchiFacet);
    await expect(aavegotchiGameFacet.interact([tokenIdOne])).to.be.revertedWith(
      "AavegotchiGameFacet: Not owner of token or approved"
    );
  });

  it("Bridged gotchis can be pet by anyone", async function () {
    aavegotchiFacet = await impersonate(thirdOwner, aavegotchiFacet);

    let tx = await aavegotchiFacet.transferFrom(
      thirdOwner,
      diamondAddress,
      tokenIdOne
    );

    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`);
    }

    aavegotchiGameFacet = await impersonate(secondOwner, aavegotchiGameFacet);
    tx = await aavegotchiGameFacet.interact([tokenIdTwo]);
    await tx.wait();
  });
});
