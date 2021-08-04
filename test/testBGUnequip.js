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

    //first equip bg
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"],
    });
    let signer = await ethers.provider.getSigner(
      "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"
    );

    const aavegotchiOwnerSigner = await itemsFacet.connect(signer);

    const itemType = await itemsFacet.getItemType(210);
    // console.log("item tpe:", itemType);

    expect(itemType.canBeTransferred).to.equal(false);

    /*
    await aavegotchiOwnerSigner.equipWearables(
      "2575",
      [0, 0, 0, 0, 0, 0, 0, 210, 0, 0, 0, 0, 0, 0, 0, 0]
    );
    */

    owner = await gotchiFacet.ownerOf(2575);
    addressBalanceBefore = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceBefore = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();

    console.log("address balance before:", addressBalanceBefore);
    console.log("gotchi balance before:", GotchiBalanceBefore);
    expect(addressBalanceBefore).to.equal("0");
    expect(GotchiBalanceBefore).to.equal("1");
    impersonate = await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    signer = ethers.provider.getSigner(owner);
    itemsFacet = (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        diamondAddress
      )
    ).connect(signer);
    console.log(owner);

    console.log("unequipping all wearables");
    await itemsFacet.equipWearables(2575, totalUnequip);
    addressBalanceAfter = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceAfter = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();
    console.log("address balance after:", addressBalanceAfter);
    console.log("gotchi balance after:", GotchiBalanceAfter);
    expect(addressBalanceAfter).to.equal("0");
    expect(GotchiBalanceAfter).to.equal("1");
    // console.log("gotchi is now", itemsNow);

    const equippedWearables = await itemsFacet.equippedWearables("2575");
    //const equipped

    expect(equippedWearables.length).to.equal(16);
  });
});
