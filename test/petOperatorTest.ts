/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgradePetOperator } from "../scripts/upgrades/upgrade-petOperator";
import { truffleAssert } from "truffle-assertions";
import { expect } from "chai";

/*
const {
  upgradePetOperator,
} = require("../scripts/upgrades/upgrade-petOperator.js");
const truffleAssert = require("truffle-assertions");
const { expect } = require("chai");
*/

async function impersonate(address, contract) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

describe("Testing Pet Operator Upgrade", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let aavegotchiFacet;
  let aavegotchiGameFacet;
  let bridgeFacet;
  let petOperator;
  let firstOwner;
  let secondOwner;
  let thirdOwner;
  let tokenIdOne;
  let tokenIdTwo;
  let tokenIdThree;
  // let ghst;

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
    // await network.provider.request({
    //   method: 'hardhat_reset',
    //   params: [{
    //     forking: {
    //       jsonRpcUrl: process.env.MATIC_URL
    //       // blockNumber: 11095000
    //     }
    //   }]
    // })

    /*
    ghst = await ethers.getContractAt(
      "IERC20",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7"
    );
    */
    aavegotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    );
    aavegotchiGameFacet = await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    );
    bridgeFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      diamondAddress
    );
    tokenIdOne = 9512;
    firstOwner = await aavegotchiFacet.ownerOf(tokenIdOne);
    petOperator = firstOwner;
    tokenIdTwo = 8020;
    secondOwner = await aavegotchiFacet.ownerOf(tokenIdTwo);
    tokenIdThree = 7331;
    thirdOwner = await aavegotchiFacet.ownerOf(tokenIdThree);
  });

  /*
  it("Register Pet Operator", async function () {
    aavegotchiFacet = await impersonate(firstOwner, aavegotchiFacet);
    aavegotchiGameFacet = await impersonate(firstOwner, aavegotchiGameFacet);

    await aavegotchiGameFacet.registerAsPetOperator(
      "Coder Dan's Pet Shop",
      "The best petting shop in town"
    );
  });
  */

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

  it("Reject if no owner and pet operator when try to set Pet Operator", async function () {
    aavegotchiGameFacet = await impersonate(thirdOwner, aavegotchiGameFacet);

    await truffleAssert.reverts(
      aavegotchiGameFacet.setPetOperators([petOperator], [tokenIdOne]),
      "AavegotchiGameFacet: Must be owner to set petter"
    );
  });

  it("Should set Pet Operator when owner try to set Pet Operator", async function () {
    aavegotchiGameFacet = await impersonate(secondOwner, aavegotchiGameFacet);

    const tx = await aavegotchiGameFacet.setPetOperators(
      [petOperator],
      [tokenIdOne /*tokenIdTwo*/]
    );
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`);
    }

    const tokenIds = (
      await aavegotchiGameFacet.petOperatorTokenIds(petOperator)
    ).map((x) => x.toNumber());
    expect(tokenIds).to.have.members([tokenIdOne /*, tokenIdTwo*/]);
  });

  it("Should set Pet Operator when pet operator try to set another Pet Operator", async function () {
    aavegotchiGameFacet = await impersonate(petOperator, aavegotchiGameFacet);

    const tx = await aavegotchiGameFacet.setPetOperators(
      [thirdOwner],
      [tokenIdOne /*tokenIdTwo*/]
    );
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`);
    }

    const tokenIds = (
      await aavegotchiGameFacet.petOperatorTokenIds(thirdOwner)
    ).map((x) => x.toNumber());
    expect(tokenIds).to.have.members([tokenIdOne /*, tokenIdTwo*/]);

    // set new pet operator
    petOperator = thirdOwner;
  });

  it("Remove pet operator by transfer", async function () {
    const tokenIds = (
      await aavegotchiGameFacet.petOperatorTokenIds(petOperator)
    ).map((x) => x.toNumber());
    expect(tokenIds).to.have.members([tokenIdOne /*tokenIdTwo*/]);

    const currentPetOperators = await aavegotchiGameFacet.petOperators(
      tokenIdOne
    );

    expect(currentPetOperators[0]).to.equal(petOperator);

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
    const newTokenIds = (
      await aavegotchiGameFacet.petOperatorTokenIds(petOperator)
    ).map((x) => x.toNumber());
    expect(newTokenIds).to.have.members([
      /*tokenIdTwo*/
    ]);

    const newPetOperators = await aavegotchiGameFacet.petOperators(tokenIdOne);

    expect(newPetOperators.length).to.equal(0);
  });

  /*
  it('Bridging Aavegotchi does not change the pet operator ', async function () {
    const currentPetOperator = await aavegotchiGameFacet.petOperator(tokenIdTwo)

    expect(currentPetOperator).to.equal(petOperator)

    bridgeFacet = await impersonate(secondOwner, bridgeFacet)

    const tx = await bridgeFacet.withdrawAavegotchiBatch([tokenIdTwo])
 
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    const newPetOperator = await aavegotchiGameFacet.petOperator(tokenIdTwo)

    expect(newPetOperator).to.equal(petOperator)

    expect(await aavegotchiFacet.ownerOf(tokenIdTwo)).to.equal(diamondAddress)
  })
  */

  /*
  it('Remove pet operator', async function () {
    aavegotchiGameFacet = await impersonate(firstOwner, aavegotchiGameFacet)

    const tokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(tokenIds).to.have.members([tokenIdOne])

    expect(await aavegotchiGameFacet.petOperator(tokenIdOne)).to.equal(firstOwner)

    const tx = await aavegotchiGameFacet.removePetOperator([tokenIdOne])

    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }

    const newTokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(newTokenIds).to.have.members([])

    expect(await aavegotchiGameFacet.petOperator(tokenIdOne)).to.equal(ethers.constants.AddressZero)
  })
  */
});
