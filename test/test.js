/* global describe it before ethers */
const { expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { getCollaterals } = require("../scripts/collateralTypes.js");

const { deployProject } = require("../scripts/deploy.js");
const { itemTypes } = require("../scripts/testItemTypes.js");

// numBytes is how many bytes of the uint that we care about
function uintToInt8Array(uint, numBytes) {
  uint = ethers.utils.hexZeroPad(uint.toHexString(), numBytes).slice(2);
  const array = [];
  for (let i = 0; i < uint.length; i += 2) {
    array.unshift(
      ethers.BigNumber.from("0x" + uint.substr(i, 2))
        .fromTwos(8)
        .toNumber()
    );
  }
  return array;
}

function sixteenBitArrayToUint(array) {
  const uint = [];
  for (let item of array) {
    if (typeof item === "string") {
      item = parseInt(item);
    }
    uint.push(item.toString(16).padStart(4, "0"));
  }
  if (array.length > 0) return ethers.BigNumber.from("0x" + uint.join(""));
  return ethers.BigNumber.from(0);
}

function sixteenBitIntArrayToUint(array) {
  const uint = [];
  for (let item of array) {
    if (typeof item === "string") {
      item = parseInt(item);
    }
    if (item < 0) {
      item = (1 << 16) + item;
    }
    // console.log(item.toString(16))
    uint.push(item.toString(16).padStart(4, "0"));
  }
  if (array.length > 0) return ethers.BigNumber.from("0x" + uint.join(""));
  return ethers.BigNumber.from(0);
}

function uintToItemIds(uint) {
  uint = ethers.utils.hexZeroPad(uint.toHexString(), 32).slice(2);
  const array = [];
  for (let i = 0; i < uint.length; i += 4) {
    array.unshift(
      ethers.BigNumber.from("0x" + uint.substr(i, 4))
        .fromTwos(16)
        .toNumber()
    );
  }
  return array;
}

const testAavegotchiId = "0";
const testWearableId = "1";
const test2WearableId = "36";
const testSlot = "0";

describe("Deploying Contracts, SVG and Minting Aavegotchis", async function () {
  before(async function () {
    const deployVars = await deployProject("test");
    global.set = true;
    global.account = deployVars.account;
    global.aavegotchiDiamond = deployVars.aavegotchiDiamond;
    global.aavegotchiFacet = deployVars.aavegotchiFacet;
    global.itemsFacet = deployVars.itemsFacet;
    global.collateralFacet = deployVars.collateralFacet;
    global.shopFacet = deployVars.shopFacet;
    global.daoFacet = deployVars.daoFacet;
    global.ghstTokenContract = deployVars.ghstTokenContract;
    global.vrfFacet = deployVars.vrfFacet;
    global.svgFacet = deployVars.svgFacet;
    global.linkAddress = deployVars.linkAddress;
    global.linkContract = deployVars.linkContract;
    global.vouchersContract = deployVars.vouchersContract;
    global.diamondLoupeFacet = deployVars.diamondLoupeFacet;
  });
  it("Should mint 10,000,000 GHST tokens", async function () {
    await global.ghstTokenContract.mint();
    const balance = await global.ghstTokenContract.balanceOf(global.account);
    const oneMillion = ethers.utils.parseEther("10000000");
    expect(balance).to.equal(oneMillion);
  });
});

describe("Buying Portals, VRF", function () {
  it("Should not fire VRF if there are no portals in batch", async function () {
    await truffleAssert.reverts(
      vrfFacet.drawRandomNumber(),
      "VrfFacet: Can't call VRF with none in batch"
    );
  });

  it("Portal should cost 100 GHST", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (50 * Math.pow(10, 18)).toFixed(); // 1 portal
    await truffleAssert.reverts(
      shopFacet.buyPortals(account, buyAmount, true),
      "AavegotchiFacet: Not enough GHST to buy portal"
    );
  });

  it("Should purchase one portal", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (100 * Math.pow(10, 18)).toFixed(); // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount, true);

    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    expect(myPortals.length).to.equal(1);
  });

  it("Batch count should be 1", async function () {
    const vrfInfo = await global.vrfFacet.vrfInfo();
    expect(vrfInfo.batchCount_).to.equal(1);
  });

  it("Should allow opting out of VRF batch", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (100 * Math.pow(10, 18)).toFixed(); // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount, false);
  });

  // it('Only owner can set batch id', async function () {
  //  await bobAavegotchi.setBatchId(["0"])
  // })

  it("Should opt into next batch", async function () {
    await truffleAssert.reverts(
      aavegotchiFacet.setBatchId(["0"]),
      "AavegotchiFacet: batchId already set"
    );
    await global.aavegotchiFacet.setBatchId(["1"]);

    const vrfInfo = await global.vrfFacet.vrfInfo();
    expect(vrfInfo.batchCount_).to.equal(2);
  });

  it("Cannot open portal without first calling VRF", async function () {
    await truffleAssert.reverts(
      aavegotchiFacet.openPortals(["0"]),
      "AavegotchiFacet: No random number for this portal"
    );
  });

  it("Should receive VRF call", async function () {
    await global.vrfFacet.drawRandomNumber();
    const randomness = ethers.utils.keccak256(new Date().getMilliseconds());
    await global.vrfFacet.rawFulfillRandomness(
      ethers.constants.HashZero,
      randomness
    );
  });

  it("Should reset batch to 0 after calling VRF", async function () {
    await truffleAssert.reverts(
      vrfFacet.drawRandomNumber(),
      "VrfFacet: Can't call VRF with none in batch"
    );
    const vrfInfo = await global.vrfFacet.vrfInfo();
    expect(vrfInfo.batchCount_).to.equal(0);
  });

  it("Should wait 18 hours before next VRF call", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (100 * Math.pow(10, 18)).toFixed(); // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount, true);
    await truffleAssert.reverts(
      vrfFacet.drawRandomNumber(),
      "VrfFacet: Waiting period to call VRF not over yet"
    );

    ethers.provider.send("evm_increaseTime", [18 * 3600]);
    ethers.provider.send("evm_mine");
    await global.vrfFacet.drawRandomNumber();

    const randomness = ethers.utils.keccak256(new Date().getMilliseconds());
    await global.vrfFacet.rawFulfillRandomness(
      ethers.constants.HashZero,
      randomness
    );
    const vrfInfo = await global.vrfFacet.vrfInfo();
    expect(vrfInfo.batchCount_).to.equal(0);
  });

  it("Cannot call VRF before it is ready", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (100 * Math.pow(10, 18)).toFixed(); // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount, true);
    await truffleAssert.reverts(
      vrfFacet.drawRandomNumber(),
      "VrfFacet: Waiting period to call VRF not over yet"
    );
  });
});

describe("Opening Portals", async function () {
  it("Should open the portal", async function () {
    let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals[0].status).to.equal(0);
    const portalId = myPortals[0].tokenId;
    await global.aavegotchiFacet.openPortals([portalId]);
    myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals[0].status).to.equal(1);
  });

  it("Should contain 10 random ghosts in the portal", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(
      myPortals[0].tokenId
    );
    // console.log(JSON.stringify(ghosts, null, 4))
    ghosts.forEach(async (ghost) => {
      const rarityScore = await global.aavegotchiFacet.baseRarityScore(
        ghost.numericTraits,
        ghost.collateralType
      );
      expect(Number(rarityScore)).to.greaterThan(298);
      expect(Number(rarityScore)).to.lessThan(602);
    });
    expect(ghosts.length).to.equal(10);
  });

  /*
  it('Should show SVGs', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    const svgs = await global.aavegotchiFacet.portalAavegotchisSvg(tokenId)
    // console.log('svgs:', svgs[0])
    expect(svgs.length).to.equal(10)
  })
  */

  it("Should claim an Aavegotchi", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    //  console.log('my portals:', myPortals)
    const tokenId = myPortals[0].tokenId;
    const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(tokenId);
    const selectedGhost = ghosts[4];
    const minStake = selectedGhost.minimumStake;
    await global.aavegotchiFacet.claimAavegotchi(tokenId, 4, minStake);
    const kinship = await global.aavegotchiFacet.kinship(tokenId);

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId);

    const collateral = aavegotchi.collateral;
    expect(selectedGhost.collateralType).to.equal(collateral);
    expect(aavegotchi.status).to.equal(2);
    expect(aavegotchi.hauntId).to.equal(0);
    expect(aavegotchi.stakedAmount).to.equal(minStake);
    expect(kinship).to.equal(50);
  });
});

describe("Aavegotchi Metadata", async function () {
  it("Should set a name", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    const tokenId = myPortals[0].tokenId;
    await truffleAssert.reverts(
      aavegotchiFacet.setAavegotchiName(
        tokenId,
        "ThisIsLongerThan25CharsSoItWillRevert"
      ),
      "AavegotchiFacet: _name can't be greater than 25 characters"
    );
    await global.aavegotchiFacet.setAavegotchiName(tokenId, "Beavis");
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId);
    expect(aavegotchi.name).to.equal("Beavis");
  });

  it("Can only set name on claimed Aavegotchi", async function () {
    await truffleAssert.reverts(
      aavegotchiFacet.setAavegotchiName("1", "Portal"),
      "AavegotchiFacet: Must choose Aavegotchi before setting name"
    );
  });

  it("Should show correct rarity score", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    const tokenId = myPortals[0].tokenId;
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId);
    console.log("collateral:" + aavegotchi.collateral);
    const score = await global.aavegotchiFacet.baseRarityScore(
      [0, 0, 0, 0, 0, 0],
      aavegotchi.collateral
    );
    expect(score).to.equal(601);

    const multiplier = await global.aavegotchiFacet.rarityMultiplier(
      [0, 0, 0, 0, 0, 0],
      aavegotchi.collateral
    );
    expect(multiplier).to.equal(1000);

    // Todo: Clientside calculate what the rarity score should be
  });
});

describe("Collaterals and escrow", async function () {
  it("Should show all whitelisted collaterals", async function () {
    const collaterals = await global.collateralFacet.getCollateralInfo();
    const collateral = collaterals[0].collateralTypeInfo;
    expect(collateral.conversionRate).to.equal(1);
    expect(collaterals.length).to.equal(1);
    const modifiers = uintToInt8Array(collateral.modifiers, 6);
    expect(modifiers[2]).to.equal(-1);
  });

  it("Can increase stake", async function () {
    let aavegotchi = await global.aavegotchiFacet.getAavegotchi("0");
    const currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
    // Let's double the stake
    await global.collateralFacet.increaseStake("0", currentStake.toString());
    aavegotchi = await global.aavegotchiFacet.getAavegotchi("0");
    const finalStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
    expect(finalStake).to.equal(currentStake.add(currentStake));

    // Todo: Balance check
  });

  it("Can decrease stake, but not below minimum", async function () {
    let aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    let currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
    const minimumStake = ethers.BigNumber.from(aavegotchi.minimumStake);

    const available = currentStake.sub(minimumStake);
    await truffleAssert.reverts(
      collateralFacet.decreaseStake(testAavegotchiId, currentStake),
      "CollateralFacet: Cannot reduce below minimum stake"
    );
    await global.collateralFacet.decreaseStake(testAavegotchiId, available);

    aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId);
    currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
    expect(currentStake).to.equal(minimumStake);
  });

  it("Base rarity score can handle negative numbers", async function () {
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi("0");
    // console.log(sixteenBitIntArrayToUint([-1, -1, 0, 0, 0, 0]).toHexString())
    const score = await global.aavegotchiFacet.baseRarityScore(
      sixteenBitIntArrayToUint([-10, -10, 0, 0, 0, 0]),
      aavegotchi.collateral
    );
    expect(score).to.equal(621);
  });

  it("Can decrease stake and destroy Aavegotchi", async function () {
    // Buy portal
    const buyAmount = (100 * Math.pow(10, 18)).toFixed(); // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount, true);
    ethers.provider.send("evm_increaseTime", [18 * 3600]);
    ethers.provider.send("evm_mine");

    // Call VRF
    await global.vrfFacet.drawRandomNumber();
    const randomness = ethers.utils.keccak256(new Date().getMilliseconds());
    await global.vrfFacet.rawFulfillRandomness(
      ethers.constants.HashZero,
      randomness
    );

    let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals.length).to.equal(5);
    // Open portal

    const initialBalance = ethers.BigNumber.from(
      await ghstTokenContract.balanceOf(account)
    );
    await openAndClaim(["1"]);

    // Burn Aavegotchi and return collateral stake
    await global.collateralFacet.decreaseAndDestroy("1", "1");
    const balanceAfterDestroy = ethers.BigNumber.from(
      await ghstTokenContract.balanceOf(account)
    );
    expect(balanceAfterDestroy).to.equal(initialBalance);

    // Should only have 1 portal now
    myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals.length).to.equal(4);
  });

  it("Can destroy Aavegotchi and transfer XP to another", async function () {
    const burnId = "2";
    const receiveId = "3";

    await openAndClaim([burnId, receiveId]);
    const initialExperience = (await aavegotchiFacet.getAavegotchi(receiveId))
      .experience;
    expect(initialExperience).to.equal(0);

    // Give some experience to the burned one
    await daoFacet.grantExperience([burnId], ["1000"]);

    // Perform essence transfer
    await global.collateralFacet.decreaseAndDestroy(burnId, receiveId);
    const finalExperience = (await aavegotchiFacet.getAavegotchi(receiveId))
      .experience;
    expect(finalExperience).to.equal(1000);
  });
});

async function openAndClaim(tokenIds) {
  for (let index = 0; index < tokenIds.length; index++) {
    const id = tokenIds[index];

    await global.aavegotchiFacet.openPortals([id]);
    const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(id);
    const selectedGhost = ghosts[0];
    const minStake = selectedGhost.minimumStake;
    const initialBalance = ethers.BigNumber.from(
      await ghstTokenContract.balanceOf(account)
    );

    // Claim ghost and stake
    await global.aavegotchiFacet.claimAavegotchi(id, 0, minStake);
    const balanceAfterClaim = ethers.BigNumber.from(
      await ghstTokenContract.balanceOf(account)
    );
    expect(balanceAfterClaim).to.equal(initialBalance.sub(minStake));
  }
}

describe("Items & Wearables", async function () {
  it("Can mint items", async function () {
    let balance = await global.itemsFacet.balanceOf(account, "0");
    expect(balance).to.equal(0);
    // To do: Get max length of wearables array

    //  await truffleAssert.reverts(itemsFacet.mintItems(account, ['8'], ['10']), 'itemsFacet: Wearable does not exist')
    await truffleAssert.reverts(
      daoFacet.mintItems(account, ["0"], ["10"]),
      "DAOFacet: Total item type quantity exceeds max quantity"
    );
    await global.daoFacet.mintItems(account, [testWearableId], ["10"]);
    balance = await global.itemsFacet.balanceOf(account, testWearableId);
    expect(balance).to.equal(10);
  });

  it("Can transfer wearables to Aavegotchi", async function () {
    await global.itemsFacet.transferToParent(
      global.account, // address _from,
      global.aavegotchiFacet.address, // address _toContract,
      testAavegotchiId, // uint256 _toTokenId,
      testWearableId, // uint256 _id,
      "10" // uint256 _value
    );
    const balance = await global.itemsFacet.balanceOfToken(
      aavegotchiFacet.address,
      testAavegotchiId,
      testWearableId
    );
    expect(balance).to.equal(10);
  });

  it("Can transfer wearables from Aavegotchi back to owner", async function () {
    await global.itemsFacet.transferFromParent(
      global.aavegotchiFacet.address, // address _fromContract,
      testAavegotchiId, // uint256 _fromTokenId,
      global.account, // address _to,
      testWearableId, // uint256 _id,
      "10" // uint256 _value
    );
    const balance = await global.itemsFacet.balanceOf(account, testWearableId);
    expect(balance).to.equal(10);
  });

  it("Can equip wearables", async function () {
    // First transfer wearables to parent Aavegotchi
    await global.itemsFacet.transferToParent(
      global.account,
      global.aavegotchiFacet.address,
      testAavegotchiId,
      testWearableId,
      "10"
    );
    expect(
      await global.itemsFacet.balanceOfToken(
        aavegotchiFacet.address,
        testAavegotchiId,
        testWearableId
      )
    ).to.equal(10);

    const wearableIds = sixteenBitArrayToUint([testWearableId]);
    console.log(wearableIds.toString());
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds);
    const equipped = await global.itemsFacet.equippedWearables(
      testAavegotchiId
    );

    expect(equipped.length).to.equal(16);
    // First item in array is 1 because that wearable has been equipped
    expect(equipped[testSlot]).to.equal(testWearableId);
  });

  it("Cannot equip wearables that require a higher level", async function () {
    // This item requires level 5
    const unequippableItem = "2";
    const wearableIds = sixteenBitArrayToUint([unequippableItem, 0, 0, 0]); // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(
      itemsFacet.equipWearables(testAavegotchiId, wearableIds),
      "ItemsFacet: Aavegotchi level lower than minLevel"
    );
  });

  it("Can equip wearables that allow this collateral", async function () {});

  it("Cannot equip wearables that require a different collateral", async function () {
    // Can only be equipped by collateraltype 8
    const unequippableItem = "3";
    // const wearable = await itemsFacet.getItemType(unequippableItem)
    const wearableIds = sixteenBitArrayToUint([unequippableItem, 0, 0, 0]); // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(
      itemsFacet.equipWearables(testAavegotchiId, wearableIds),
      "ItemsFacet: Wearable cannot be equipped in this collateral type"
    );
  });

  it("Cannot equip wearables in the wrong slot", async function () {
    // This wearable can't be equipped in the 4th slot
    const wearableIds = sixteenBitArrayToUint([testWearableId, 0, 0, 0]); // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(
      itemsFacet.equipWearables(testAavegotchiId, wearableIds),
      "ItemsFacet: Wearable cannot be equipped in this slot"
    );
  });

  it("Can unequip all wearables with empty array", async function () {
    let equipped = await global.itemsFacet.equippedWearables(testAavegotchiId);
    expect(equipped[0]).to.equal(1);

    // Unequip all wearables
    await itemsFacet.equipWearables(
      testAavegotchiId,
      sixteenBitArrayToUint([])
    );
    equipped = await global.itemsFacet.equippedWearables(testAavegotchiId);
    expect(equipped[0]).to.equal(0);

    // Put wearable back on
    await itemsFacet.equipWearables(
      testAavegotchiId,
      sixteenBitArrayToUint([testWearableId])
    );
  });

  it("Can equip wearables from owners inventory", async function () {});

  it("Can display aavegotchi with wearables", async function () {
    // await itemsFacet.equipWearables(testAavegotchiId, sixteenBitArrayToUint([test2WearableId]))
    const svg = await global.svgFacet.getAavegotchiSvg(testAavegotchiId);
    console.log(svg);
  });

  it("Equipping Wearables alters base rarity score", async function () {
    // Unequip all wearables
    let wearableIds = sixteenBitArrayToUint([0]);
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds);
    const equipped = await global.itemsFacet.equippedWearables(
      testAavegotchiId
    );
    expect(equipped[testSlot]).to.equal("0");

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );

    // Equip a wearable
    wearableIds = sixteenBitArrayToUint([testWearableId]);
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds);

    // Calculate bonuses
    const modifiers = uintToInt8Array(
      itemTypes[testWearableId].traitModifiers,
      6
    );

    const collateral = (await global.collateralFacet.getCollateralInfo())[0]
      .collateralTypeInfo;
    const collateralModifiers = uintToInt8Array(collateral.modifiers);

    let finalScore = 0;

    modifiers.forEach((val, index) => {
      let traitValue = Number(aavegotchi.numericTraits[index]);
      const collateralMod = collateralModifiers[index];

      // Collateral modifiers array only has 3 entries but there are 6 traits
      if (index < collateralModifiers.length) {
        traitValue += collateralMod;
      }
      traitValue += val;

      if (traitValue >= 50) {
        finalScore += traitValue;
      } else {
        finalScore += 100 - traitValue;
      }
    });

    // Retrieve the final score
    const augmentedScore = (
      await global.aavegotchiFacet.modifiedRarityScore(testAavegotchiId)
    ).rarityScore_.toString();

    // Check the math
    expect(Number(augmentedScore)).to.equal(finalScore);
  });
});

describe("Haunts", async function () {
  it("Cannot create new haunt until first is finished", async function () {
    const oneHundred = "100000000000000000000";
    await truffleAssert.reverts(
      daoFacet.createHaunt("10000", oneHundred, "0x000000"),
      "AavegotchiFacet: Haunt must be full before creating new"
    );
  });

  it("Cannot exceed max haunt size", async function () {
    const fiftyPortals = ethers.utils.parseEther("5000");
    await global.shopFacet.buyPortals(account, fiftyPortals, true);
    const fortyFivePortals = ethers.utils.parseEther("4500");
    await global.shopFacet.buyPortals(account, fortyFivePortals, true);

    const singlePortal = ethers.utils.parseEther("100");
    await truffleAssert.reverts(
      global.shopFacet.buyPortals(account, singlePortal, true),
      "AavegotchiFacet: Exceeded max number of aavegotchis for this haunt"
    );

    //  const receipt = await tx.wait()
  });

  it("Can create new Haunt", async function () {
    let currentHaunt = await global.aavegotchiFacet.currentHaunt();
    expect(currentHaunt.hauntId_).to.equal(0);
    await daoFacet.createHaunt(
      "10000",
      ethers.utils.parseEther("100"),
      "0x000000"
    );
    currentHaunt = await global.aavegotchiFacet.currentHaunt();
    expect(currentHaunt.hauntId_).to.equal(1);
  });
});

describe("Revenue transfers", async function () {
  it("Buying portals should send revenue to 4 wallets", async function () {
    // 0 = burn (33%)
    // 1 = dao (10%)
    // 2 = rarity (40%)
    // 3 = pixelcraft (17%)

    let revenueShares = await global.aavegotchiFacet.revenueShares();
    const beforeBalances = [];
    for (let index = 0; index < 4; index++) {
      const address = revenueShares[index];
      const balance = await global.ghstTokenContract.balanceOf(address);
      beforeBalances[index] = balance;
    }

    // Buy 10 Portals
    await global.shopFacet.buyPortals(
      account,
      ethers.utils.parseEther("1000"),
      true
    );

    // Calculate shares from 100 Portals
    const burnShare = ethers.utils.parseEther("330");
    const daoShare = ethers.utils.parseEther("100");
    const rarityShare = ethers.utils.parseEther("400");
    const pixelCraftShare = ethers.utils.parseEther("170");
    const shares = [burnShare, daoShare, rarityShare, pixelCraftShare];
    revenueShares = await global.aavegotchiFacet.revenueShares();

    // Verify the new balances
    for (let index = 0; index < 4; index++) {
      const address = revenueShares[index];

      const beforeBalance = ethers.BigNumber.from(beforeBalances[index]);
      const afterBalance = ethers.BigNumber.from(
        await global.ghstTokenContract.balanceOf(address)
      );
      expect(afterBalance).to.equal(beforeBalance.add(shares[index]));
    }
  });
});

describe("Shop and Vouchers", async function () {
  it("Should create vouchers", async function () {
    await global.vouchersContract.createVoucherTypes(
      account,
      ["10", "20", "30", "40", "50", "60", "70"],
      []
    );
    const supply = await global.vouchersContract.totalSupplies();
    expect(supply[5]).to.equal(60);
  });

  it("Should convert vouchers into wearables", async function () {
    await global.vouchersContract.setApprovalForAll(shopFacet.address, true);
    await global.shopFacet.purchaseItemsWithVouchers(
      account,
      [0, 1, 2, 3, 4, 5, 6],
      [10, 10, 10, 10, 10, 60, 70]
    );
    const itemsBalance = await global.itemsFacet.itemBalances(account);
    expect(itemsBalance[6]).to.equal(60);
  });

  it("Should purchase items using GHST", async function () {
    let balances = await global.itemsFacet.itemBalances(account);
    // Start at 1 because 0 is always empty
    expect(balances[1]).to.equal(10);
    await global.shopFacet.purchaseItemsWithGhst(account, ["1"], ["10"]);
    balances = await global.itemsFacet.itemBalances(account);
    expect(balances[1]).to.equal(20);
  });
});

describe("Leveling up", async function () {
  it("Aavegotchi should start with 0 XP and Level 0", async function () {
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.level).to.equal(1);
    expect(aavegotchi.experience).to.equal(0);
  });

  it("Can grant experience to Aavegotchi", async function () {
    await truffleAssert.reverts(
      daoFacet.grantExperience([testAavegotchiId], ["100000"]),
      "DAOFacet: Cannot grant more than 1000 XP at a time"
    );
    await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.level).to.equal(5);
    expect(aavegotchi.experience).to.equal(1000);
  });

  it("Should have 1 skill point at Level 5", async function () {
    const skillPoints = await global.aavegotchiFacet.availableSkillPoints(
      testAavegotchiId
    );
    expect(skillPoints).to.equal(1);
  });

  it("Should spend 3 skill points to modify traits", async function () {
    const oldAavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );

    await truffleAssert.reverts(
      aavegotchiFacet.spendSkillPoints(testAavegotchiId, [1, 1, 1, 1]),
      "AavegotchiFacet: Not enough skill points"
    );
    await global.aavegotchiFacet.spendSkillPoints(
      testAavegotchiId,
      [1, 0, 0, 0]
    );
    const skillPoints = await global.aavegotchiFacet.availableSkillPoints(
      testAavegotchiId
    );
    expect(skillPoints).to.equal(0);

    const newAavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );

    // Check if numericTraits were modified
    const skillArray = [1, 0, 0, 0, 0, 0];
    for (let index = 0; index < oldAavegotchi.numericTraits.length; index++) {
      const oldTrait = Number(oldAavegotchi.numericTraits[index]);
      const newTrait = Number(newAavegotchi.numericTraits[index]);
      expect(newTrait).to.equal(oldTrait + skillArray[index]);
    }
  });

  it("Should be level 8 with 3000 XP", async function () {
    await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.experience).to.equal(3000);
    expect(aavegotchi.level).to.equal(8);
  });

  it("Experience required to Level 9 should be 200", async function () {
    //Current XP is 3000. Level 9 requires 3200
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.toNextLevel).to.equal(200);
  });

  it("Should be level 9 with 4000 XP ", async function () {
    await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.experience).to.equal(4000);
    expect(aavegotchi.level).to.equal(9);
  });

  it("Should be level 29 with 39999 XP ", async function () {
    // adding 35999 experience
    for (let i = 0; i < 35; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    }
    await daoFacet.grantExperience([testAavegotchiId], ["999"]);

    let aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );

    expect(aavegotchi.experience).to.equal(39999);
    expect(aavegotchi.level).to.equal(29);

    await daoFacet.grantExperience([testAavegotchiId], ["1"]);
    aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId);
  });

  it("Should be level 46 with 103500 XP ", async function () {
    for (let i = 0; i < 63; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    }
    await daoFacet.grantExperience([testAavegotchiId], ["500"]);

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.experience).to.equal(103500);
    expect(aavegotchi.level).to.equal(46);
  });

  it("Should be level 98 with 474000 XP", async function () {
    for (let i = 0; i < 370; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    }
    await daoFacet.grantExperience([testAavegotchiId], ["500"]);

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.experience).to.equal(474000);
    expect(aavegotchi.level).to.equal(98);
  });

  it("Experience required to Level 99 should be 6200", async function () {
    //Current experience is 474000. Level 99 requires 480200.
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.toNextLevel).to.equal(6200);
  });

  it("Should be level 99 with 500000 XP ", async function () {
    for (let i = 0; i < 26; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ["1000"]);
    }

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(
      testAavegotchiId
    );
    expect(aavegotchi.experience).to.equal(500000);
    expect(aavegotchi.level).to.equal(99);
  });
});

describe("Using Consumables", async function () {
  it("Using Kinship Potion increases kinship by 10", async function () {
    const kinshipPotion = await itemsFacet.getItemType("6");
    expect(kinshipPotion.kinshipBonus).to.equal(10);
    const originalScore = await aavegotchiFacet.kinship(testAavegotchiId);
    await itemsFacet.useConsumable(testAavegotchiId, "6");
    const boostedScore = await aavegotchiFacet.kinship(testAavegotchiId);
    expect(boostedScore).to.equal(
      Number(originalScore) + Number(kinshipPotion.kinshipBonus)
    );
  });

  it("Using Experience potion increases XP by 200", async function () {
    const beforeXP = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .experience;

    // XP Potion
    await itemsFacet.useConsumable(testAavegotchiId, "5");
    const afterXP = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .experience;
    expect(afterXP).to.equal(Number(beforeXP) + 200);
  });

  it("Using Trait Potion increases NRG by 1", async function () {
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    // console.log('before traits:', beforeTraits[0].toString())

    // Trait potion
    await itemsFacet.useConsumable(testAavegotchiId, "4");

    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    // console.log('after traits:', afterTraits[0].toString())
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) + 1);
  });

  it("Can replace trait bonuses", async function () {
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    // console.log('before traits:', beforeTraits[0].toString())
    // Trait potion
    await itemsFacet.useConsumable(testAavegotchiId, "7");

    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    // console.log('after traits:', afterTraits[0].toString())
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) + 1);
  });

  it("Trait bonuses should disappear after 24 hours", async function () {
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    ethers.provider.send("evm_increaseTime", [25 * 3600]);
    ethers.provider.send("evm_mine");
    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId))
      .numericTraits;
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) - 1);
  });
});

describe("DAO Functions", async function () {
  it("Only DAO or admin can set game manager", async function () {
    // To do: Check revert using another account
    await daoFacet.setGameManager(account);
    const gameManager = await daoFacet.gameManager();
    expect(gameManager).to.equal(account);
  });

  it("Cannot add the same collateral twice", async function () {
    await truffleAssert.reverts(
      daoFacet.addCollateralTypes(
        getCollaterals("hardhat", ghstTokenContract.address)
      ),
      "DAOFacet: Collateral already added"
    );
  });

  it("Can add collateral types", async function () {
    let collateralInfo = await collateralFacet.collaterals();
    // console.log('info:', collateralInfo)
    // await daoFacet.addCollateralTypes(getCollaterals('hardhat', ghstTokenContract.address))

    // Deploy an extra TEST contract
    const erc20TokenContract = await ethers.getContractFactory("ERC20Token");
    const testToken = await erc20TokenContract.deploy();
    await testToken.deployed();

    const collateralTypeInfo = [
      testToken.address,
      {
        primaryColor: "0x" + "FFFFFF",
        secondaryColor: "0x" + "FFFFFF",
        cheekColor: "0x" + "FFFFFF",
        svgId: "1",
        eyeShapeSvgId: "2",
        modifiers: eightBitArrayToUint([0, 0, -1, 0, 0, 0]),
        conversionRate: 10,
        delisted: false,
      },
    ];
    await daoFacet.addCollateralTypes([collateralTypeInfo]);
    collateralInfo = await collateralFacet.collaterals();
    expect(collateralInfo[1]).to.equal(testToken.address);
  });

  it("Contract Owner (or DAO) can update collateral modifiers", async function () {
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi("0");
    let score = await global.aavegotchiFacet.baseRarityScore(
      [0, 0, 0, 0, 0, 0],
      aavegotchi.collateral
    );
    expect(score).to.equal(601);
    await global.daoFacet.updateCollateralModifiers(
      aavegotchi.collateral,
      [2, 0, 0, 0, 0, 0]
    );
    score = await global.aavegotchiFacet.baseRarityScore(
      [0, 0, 0, 0, 0, 0],
      aavegotchi.collateral
    );
    expect(score).to.equal(598);
  });

  it("Contract owner (or DAO) can add new item types with corresponding SVGs", async function () {
    const items = await itemsFacet.getItemTypes();
    console.log("length:", items.length);

    const itemsToAdd = [itemTypes[1]];
    const itemSvg = require("../svgs/testItem.js");

    const itemTypeAndSizes = [];

    // To do (Nick) add in itemTypeAndSizes
    await daoFacet.addItemTypesAndSvgs(itemsToAdd, itemSvg, itemTypeAndSizes);
  });
});

describe("Kinship", async function () {
  /*
  it('Can calculate kinship according to formula', async function () {
    let kinship = await global.aavegotchiFacet.kinship('0')
    console.log('* Initial Kinship:', kinship.toString())
    // Use a kinship potion earlier then waited 24hrs
    expect(kinship).to.equal(60)

    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()

    kinship = await global.aavegotchiFacet.kinship('0')
    expect(kinship).to.equal(65)
    console.log('* After 5 Interactions, kinship is:', kinship.toString())
    // 5 interactions + 1 streak bonus

    // Go 3 days without interacting
    ethers.provider.send('evm_increaseTime', [3 * 86400])
    ethers.provider.send('evm_mine')

    kinship = await global.aavegotchiFacet.kinship('0')
    // Took three days off and lost streak bonus
    console.log('* 3 days w/ no interaction, kinship is:', kinship.toString())
    expect(kinship).to.equal(62)

    // Take a longggg break

    ethers.provider.send('evm_increaseTime', [14 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('* Another 14 days since last interaction, total 17 days. Kinship is', kinship.toString())
    expect(kinship).to.equal(48)

    ethers.provider.send('evm_increaseTime', [20 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('* 37 days since last interaction, kinship is:', kinship.toString())
    expect(kinship).to.equal(28)

    for (let index = 1; index < 4; index++) {
      await interactAndUpdateTime()
      kinship = await global.aavegotchiFacet.kinship('0')
      console.log(`* Kinship after interaction ${index} is:`, kinship.toString())
      expect(kinship).to.equal(28 + (3 * index))
    }

    console.log('* Interact 120 times')

    for (let index = 0; index < 120; index++) {
      await interactAndUpdateTime()
    }

    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('* Kinship is:', kinship.toString())
    // 37 + 3, +119
    expect(kinship).to.equal(159)

    // Neglect for 120 days
    neglectAavegotchi(120)
    kinship = await global.aavegotchiFacet.kinship('0')
    expect(kinship).to.equal(39)

    await interactAndUpdateTime()
    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('* Interact after 120 days. Kinship should be 42')
    expect(kinship).to.equal(42)

    // Neglect for another 120 days
    neglectAavegotchi(120)
    console.log('* Neglect for another 120 days. Kinship should be 0')
    kinship = await global.aavegotchiFacet.kinship('0')
    expect(kinship).to.equal(0)

    console.log('* Interact 2 times')
    await interactAndUpdateTime()
    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('kinship:', kinship.toString())
    expect(kinship).to.equal(3)

    await interactAndUpdateTime()
    kinship = await global.aavegotchiFacet.kinship('0')
    console.log('kinship:', kinship.toString())
    expect(kinship).to.equal(6)

    // Seems to be an issue when the interactionCount is much lower than 0. It takes two interactions to set it from negative to zero.

    console.log('* Kinship should be 6:', kinship.toString())
  })
  */
});

async function neglectAavegotchi(days) {
  ethers.provider.send("evm_increaseTime", [86400 * days]);
  ethers.provider.send("evm_mine");
  // daysSinceInteraction = 0
  // for (let index = 0; index < days; index++) {
  //   daysSinceInteraction += days
  //   ethers.provider.send('evm_increaseTime', [86400])
  //   ethers.provider.send('evm_mine')
  // }

  console.log(`* Neglect Gotchi for ${days} days`);
}

async function interactAndUpdateTime() {
  await global.aavegotchiFacet.interact("0");
  ethers.provider.send("evm_increaseTime", [86400 / 2]);
  ethers.provider.send("evm_mine");
}

function eightBitArrayToUint(array) {
  const uint = [];
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8);
    uint.unshift(value.toHexString().slice(2));
  }
  return ethers.BigNumber.from("0x" + uint.join(""));
}
