/* global describe it before ethers */
const { expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { getCollaterals } = require("../scripts/collateralTypes.js");
const {
  modifyWithAavegotchiSets,
} = require("../scripts/offchainProcessing.js");

const { deployProject } = require("../scripts/deployNoSvg");
const { itemTypes } = require("../scripts/itemTypes.js");

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
const testSlot = "3";

describe("Deploying Contracts, SVG and Minting Aavegotchis", async function () {
  this.timeout(100000);
  before(async function () {
    const deployVars = await deployProject("deployTest");
    global.set = true;
    global.account = deployVars.account;
    global.aavegotchiDiamond = deployVars.aavegotchiDiamond;
    global.bridgeFacet = deployVars.bridgeFacet;
    global.aavegotchiFacet = deployVars.aavegotchiFacet;
    global.aavegotchiGameFacet = deployVars.aavegotchiGameFacet;
    global.itemsFacet = deployVars.itemsFacet;
    global.itemsTransferFacet = deployVars.itemsTransferFacet;
    global.collateralFacet = deployVars.collateralFacet;
    global.shopFacet = deployVars.shopFacet;
    global.daoFacet = deployVars.daoFacet;
    global.ghstTokenContract = deployVars.ghstTokenContract;
    global.vrfFacet = deployVars.vrfFacet;
    global.svgFacet = deployVars.svgFacet;
    global.linkAddress = deployVars.linkAddress;
    global.linkContract = deployVars.linkContract;
    global.diamondLoupeFacet = deployVars.diamondLoupeFacet;
    global.metaTransactionsFacet = deployVars.metaTransactionsFacet;
  });
  it("Should mint 10,000,000 GHST tokens", async function () {
    await global.ghstTokenContract.mint();
    const balance = await global.ghstTokenContract.balanceOf(global.account);
    const oneMillion = ethers.utils.parseEther("10000000");
    expect(balance).to.equal(oneMillion);
  });
});

describe("Buying Portals, VRF", function () {
  it("Portal should cost 100 GHST", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = (50 * Math.pow(10, 18)).toFixed(); // 1 portal
    await truffleAssert.reverts(
      shopFacet.buyPortals(account, buyAmount),
      "ShopFacet: Not enough GHST to buy portal"
    );
  });

  it("Should purchase portal", async function () {
    const balance = await ghstTokenContract.balanceOf(account);
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance);
    const buyAmount = ethers.utils.parseEther("500"); // 1 portals
    const tx = await global.shopFacet.buyPortals(account, buyAmount);
    const receipt = await tx.wait();

    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    expect(myPortals.length).to.equal(5);
  });
});

describe("Opening Portals", async function () {
  it("Should open the portal", async function () {
    let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals[0].status).to.equal(0);
    //  const portalId = myPortals[0].tokenId
    await global.vrfFacet.openPortals(["0", "1", "2", "3"]);

    // const randomness = ethers.utils.keccak256(new Date().getMilliseconds())

    // await global.vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)

    myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account);
    expect(myPortals[0].status).to.equal(2);
  });

  it("Should contain 10 random ghosts in the portal", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    const ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(
      myPortals[0].tokenId
    );
    // console.log(JSON.stringify(ghosts, null, 4))
    ghosts.forEach(async (ghost) => {
      const rarityScore = await global.aavegotchiGameFacet.baseRarityScore(
        ghost.numericTraitsUint
      );
      expect(Number(rarityScore)).to.greaterThan(298);
      expect(Number(rarityScore)).to.lessThan(602);
    });
    expect(ghosts.length).to.equal(10);
  });

  it("Can only set name on claimed Aavegotchi", async function () {
    await truffleAssert.reverts(
      aavegotchiGameFacet.setAavegotchiName("1", "Portal"),
      "AavegotchiGameFacet: Must claim Aavegotchi before setting name"
    );
  });

  it("Should claim an Aavegotchi", async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(
      account
    );
    //  console.log('my portals:', myPortals)
    const tokenId = myPortals[0].tokenId;
    const ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(
      tokenId
    );
    const selectedGhost = ghosts[4];
    const minStake = selectedGhost.minimumStake;
    await global.aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake);
    const kinship = await global.aavegotchiGameFacet.kinship(tokenId);

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId);

    const collateral = aavegotchi.collateral;
    expect(selectedGhost.collateralType).to.equal(collateral);
    expect(aavegotchi.status).to.equal(3);
    expect(aavegotchi.hauntId).to.equal(0);
    expect(aavegotchi.stakedAmount).to.equal(minStake);
    expect(kinship).to.equal(50);
  });
});

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

    const result = await global.itemsFacet.itemBalancesWithSlots(account);
    console.log(result);
  });
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
  await global.aavegotchiGameFacet.interact(["0"]);
  ethers.provider.send("evm_increaseTime", [86400 / 2]);
  ethers.provider.send("evm_mine");
}

async function claimGotchis(tokenIds) {
  console.log("token ids:");

  for (let index = 0; index < tokenIds.length; index++) {
    console.log("fucker");

    const id = tokenIds[index];
    const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(id);
    const selectedGhost = ghosts[0];
    const minStake = selectedGhost.minimumStake;
    console.log("min stake:", minStake);
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

function eightBitArrayToUint(array) {
  const uint = [];
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8);
    uint.unshift(value.toHexString().slice(2));
  }
  return ethers.BigNumber.from("0x" + uint.join(""));
}
