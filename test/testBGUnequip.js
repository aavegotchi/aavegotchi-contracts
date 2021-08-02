const { expect } = require("chai");
const { ethers } = require("hardhat");
//const { addH1 } = require("../scripts/addItemTypes/addH1Bg.js");
//

describe("Test uneqipping", async function () {
  //addH1();
  this.timeout(30000000);
  //await equipUpgrade();
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  let owner,
    impersonate,
    itemsFacet,
    gotchiFacet,
    addressBalanceBefore,
    addressBalanceAfter,
    GotchiBalanceBefore,
    GotchiBalanceAfter;

  const totalUnequip = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  it("Unequips bg wearable without transferring", async function () {
    gotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    );
    itemsFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    );
    owner = await gotchiFacet.ownerOf(2575);
    addressBalanceBefore = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceBefore = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();
    expect(addressBalanceBefore).to.equal("1");
    expect(GotchiBalanceBefore).to.equal("1");
    impersonate = await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    const signer = ethers.provider.getSigner(owner);
    itemsFacet = (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        diamondAddress
      )
    ).connect(signer);
    console.log(owner);

    const itemsNow = await itemsFacet.equipWearables(2575, totalUnequip);
    addressBalanceAfter = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceAfter = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();
    expect(addressBalanceAfter).to.equal(1);
    expect(GotchiBalanceAfter).to.equal(1);
    console.log("gotchi is now", itemsNow);

    expect(equipped.length).to.equal(16);
  });
});
