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

    //first equip bg
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"],
    });
    let signer = await ethers.provider.getSigner(
      "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"
    );

    const itemsFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress,
      signer
    );

    itemsTransferFacet = await ethers.getContractAt(
      "ItemsTransferFacet",
      diamondAddress,
      signer
    );

    /*
    let balance = await itemsFacet.balanceOf(
      "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
      "210"
    );
    console.log("bal:", balance.toString());

    balance = await itemsFacet.balanceOf(
      "0x75C8866f47293636F1C32eCBcD9168857dBEfc56",
      "210"
    );

    console.log("bal:", balance.toString());

    await itemsTransferFacet.safeTransferFrom(
      "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c",
      "0x75C8866f47293636F1C32eCBcD9168857dBEfc56",
      "210",
      "5000",
      []
    );

    balance = await itemsFacet.balanceOf(
      "0x75C8866f47293636F1C32eCBcD9168857dBEfc56",
      "210"
    );

    console.log("bal:", balance.toString());

    */

    const itemType = await itemsFacet.getItemType(210);
    // console.log("item tpe:", itemType);

    expect(itemType.canBeTransferred).to.equal(false);

    await itemsFacet.equipWearables(
      "2575",
      [0, 0, 0, 0, 0, 0, 0, 210, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    owner = await gotchiFacet.ownerOf(2575);
    addressBalanceBefore = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceBefore = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();

    console.log("address balance before:", addressBalanceBefore);
    console.log("gotchi balance before:", GotchiBalanceBefore);
    // expect(addressBalanceBefore).to.equal("0");
    // expect(GotchiBalanceBefore).to.equal("1");
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

    /*  console.log("unequipping all wearables");
    await itemsFacet.equipWearables(2575, totalUnequip);
    
    addressBalanceAfter = (await itemsFacet.balanceOf(owner, 210)).toString();
    GotchiBalanceAfter = (
      await itemsFacet.balanceOfToken(diamondAddress, 2575, 210)
    ).toString();
    console.log("address balance after:", addressBalanceAfter);
    console.log("gotchi balance after:", GotchiBalanceAfter);
    //   expect(addressBalanceAfter).to.equal("0");
    // expect(GotchiBalanceAfter).to.equal("1");
    // console.log("gotchi is now", itemsNow);
    */
  });
});
