/* global describe it before ethers */
const { expect } = require("chai");
const {
  getCollaterals: getCollateralsH1,
} = require("../scripts/collateralTypes.js");
const { getH2Collaterals } = require("../scripts/collateralTypesHaunt2.js");

const {
  upgradeHauntCollateralTypes,
} = require("../scripts/upgrades/upgrade-hauntCollateralTypes.js");

const testAavegotchiId = "10000";
const newTestWearableId = "211";
const testWearableId = "1";
const testSlot = "3";
const initialHauntSize = "10000";
let portalPrice = ethers.utils.parseEther("0.00001");
const account = "0x819c3fc356bb319035f9d2886fac9e57df0343f5";
const itemTypes = [
  {
    svgId: 211,
    name: "Camo Hat Test",
    setId: [1],
    author: "Xibot",
    description: "",
    dimensions: { x: 15, y: 2, width: 34, height: 20 },
    allowedCollaterals: [],
    minLevel: 1,
    ghstPrice: ethers.utils.parseEther("0.000001"),
    maxQuantity: "1000",
    rarityScoreModifier: 1,
    traitModifiers: [0, 1, 0, 0, 0, 0],
    canPurchaseWithGhst: false,
    slotPositions: [
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
    category: 0,
    canBeTransferred: true,
    totalQuantity: 0,
    experienceBonus: 0,
    kinshipBonus: 0,
  },
];

describe("Re-deploying Contracts, replacing facet selectors, and uploading H1 collateral types", async function () {
  this.timeout(1000000);
  let diamondAddress, signer;
  let daoFacet,
    collateralFacet,
    bridgeFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    itemsFacet,
    itemsTransferFacet,
    vrfFacet,
    shopFacet,
    metaTransactionsFacet,
    ghstTokenContract;
  let haunt, currentHauntId, buyAmount;
  before(async function () {
    const deployVars = await upgradeHauntCollateralTypes("deployTest");
    diamondAddress = deployVars.diamondAddress;
    signer = await deployVars.signer;
    // Transfer ownership for GHST balance
    await (
      await (
        await ethers.getContractAt("OwnershipFacet", diamondAddress)
      ).connect(signer)
    ).transferOwnership(account);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account],
    });
    signer = await ethers.provider.getSigner(account);
    daoFacet = await (
      await ethers.getContractAt("DAOFacet", diamondAddress)
    ).connect(signer);
    collateralFacet = await (
      await ethers.getContractAt("CollateralFacet", diamondAddress)
    ).connect(signer);
    bridgeFacet = await (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
        diamondAddress
      )
    ).connect(signer);
    aavegotchiFacet = await (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
        diamondAddress
      )
    ).connect(signer);
    aavegotchiGameFacet = await (
      await ethers.getContractAt("AavegotchiGameFacet", diamondAddress)
    ).connect(signer);
    svgFacet = await (
      await ethers.getContractAt("SvgFacet", diamondAddress)
    ).connect(signer);
    itemsFacet = await (
      await ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        diamondAddress
      )
    ).connect(signer);
    itemsTransferFacet = await (
      await ethers.getContractAt("ItemsTransferFacet", diamondAddress)
    ).connect(signer);
    vrfFacet = await (
      await ethers.getContractAt("VrfFacet", diamondAddress)
    ).connect(signer);
    shopFacet = await (
      await ethers.getContractAt("ShopFacet", diamondAddress)
    ).connect(signer);
    metaTransactionsFacet = await (
      await ethers.getContractAt("MetaTransactionsFacet", diamondAddress)
    ).connect(signer);
    ghstTokenContract = await (
      await ethers.getContractAt("GHSTFacet", deployVars.ghstAddress)
    ).connect(signer);

    await (await daoFacet.addItemManagers([account])).wait();
    await (await daoFacet.addGameManagers([account], [3000])).wait();
    await (await daoFacet.addItemTypes(itemTypes)).wait();
  });

  describe("Haunt", function () {
    it("Should get current haunt info", async function () {
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(1);
    });

    it("Should create new haunt", async function () {
      await (
        await daoFacet.createHaunt(initialHauntSize, portalPrice, "0x000000")
      ).wait();
      haunt = await aavegotchiGameFacet.currentHaunt();
      currentHauntId = haunt["hauntId_"].toNumber();
      expect(currentHauntId).to.equal(2);

      await (
        await daoFacet.addCollateralTypes(
          currentHauntId,
          getH2Collaterals("hardhat", ghstTokenContract.address)
        )
      ).wait();
    });

    it("Cannot create new haunt until first is finished", async function () {
      const purchaseNumber = ethers.utils.parseEther("100");
      await expect(
        daoFacet.createHaunt("10000", purchaseNumber, "0x000000")
      ).to.be.revertedWith(
        "AavegotchiFacet: Haunt must be full before creating new"
      );
    });
  });

  describe("Buying Portals, VRF", function () {
    it("Portal should cost 0.00001 GHST", async function () {
      const balance = await ghstTokenContract.balanceOf(account);
      await ghstTokenContract.approve(diamondAddress, balance);
      buyAmount = portalPrice.div(2);
      await expect(shopFacet.buyPortals(account, buyAmount)).to.be.revertedWith(
        "Not enough GHST to buy portals"
      );
    });

    it("Should purchase portal", async function () {
      const balance = await ghstTokenContract.balanceOf(account);
      await ghstTokenContract.approve(diamondAddress, balance);
      buyAmount = portalPrice.mul(5);
      await (await shopFacet.buyPortals(account, buyAmount)).wait();

      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals.length).to.equal(5);
    });
  });

  describe("Opening Portals", async function () {
    it("Should open the portal", async function () {
      let myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(0);
      await vrfFacet.openPortals(["10000", "10001", "10002", "10003"]);
      // const randomness = ethers.utils.keccak256(new Date().getMilliseconds())
      // await vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)
      myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals[0].status).to.equal(2);
    });

    it("Should contain 10 random ghosts in the portal", async function () {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(
        myPortals[0].tokenId
      );
      // console.log(JSON.stringify(ghosts, null, 4))
      ghosts.forEach(async (ghost) => {
        const rarityScore = await aavegotchiGameFacet.baseRarityScore(
          ghost.numericTraits
        );
        expect(Number(rarityScore)).to.greaterThan(298);
        expect(Number(rarityScore)).to.lessThan(602);
      });
      expect(ghosts.length).to.equal(10);
    });

    /*
    it("Can only set name on claimed Aavegotchi", async function() {
      await expect(aavegotchiGameFacet.setAavegotchiName("10001", "Portal")).to.be.revertedWith("AavegotchiGameFacet: Must claim Aavegotchi before setting name");
    });
    */

    it("Should claim an Aavegotchi", async function () {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(tokenId);
      const selectedGhost = ghosts[4];
      const minStake = selectedGhost.minimumStake;
      // console.log(minStake.toString())
      await aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake);
      const kinship = await aavegotchiGameFacet.kinship(tokenId);

      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);

      const collateral = aavegotchi.collateral;
      expect(selectedGhost.collateralType).to.equal(collateral);
      expect(aavegotchi.status).to.equal(3);
      expect(aavegotchi.hauntId).to.equal(2);
      expect(aavegotchi.stakedAmount).to.equal(minStake);
      expect(kinship).to.equal(50);
    });
  });

  describe("Aavegotchi Metadata", async function () {
    /*
    it("Should set a name", async function() {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      await expect(aavegotchiGameFacet.setAavegotchiName(tokenId, "ThisIsLongerThan25CharsSoItWillRevert")).to.be.revertedWith("LibAavegotchi: name can't be greater than 25 characters");
      await aavegotchiGameFacet.setAavegotchiName(tokenId, "Beavis");
      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
      expect(aavegotchi.name).to.equal("Beavis");
    });
    */

    it("Should show correct rarity score", async function () {
      const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      const tokenId = myPortals[0].tokenId;
      const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
      // console.log('collateral:' + aavegotchi.collateral)
      // 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
      // console.log('traits:')
      // for (const trait of aavegotchi.numericTraits) {
      //   console.log(trait.toString())
      // }
      const score = await aavegotchiGameFacet.baseRarityScore([
        0, 0, 0, -1, 0, 0,
      ]);
      expect(score).to.equal(601);

      const multiplier = await aavegotchiGameFacet.rarityMultiplier([
        0, 0, 0, -1, 0, 0,
      ]);
      expect(multiplier).to.equal(1000);
    });
  });

  describe("Collaterals and escrow", async function () {
    it("Should show all whitelisted collaterals", async function () {
      const collaterals = await collateralFacet.getCollateralInfo(
        currentHauntId
      );
      const collateral = collaterals[0].collateralTypeInfo;
      expect(collateral.conversionRate).to.equal(50000);
      expect(collaterals.length).to.equal(1);
      // const modifiers = uintToInt8Array(collateral.modifiers, 6)
      expect(collateral.modifiers[2]).to.equal(-1);
    });

    it("Can increase stake", async function () {
      let aavegotchi = await aavegotchiFacet.getAavegotchi(testAavegotchiId);
      const currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
      const amount2Increase = currentStake.div(4);
      // Let's double the stake
      await collateralFacet.increaseStake(
        testAavegotchiId,
        amount2Increase.toString()
      );
      aavegotchi = await aavegotchiFacet.getAavegotchi(testAavegotchiId);
      const finalStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
      expect(finalStake).to.equal(currentStake.add(amount2Increase));
    });

    it("Can decrease stake, but not below minimum", async function () {
      let aavegotchi = await aavegotchiFacet.getAavegotchi(testAavegotchiId);
      let currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
      const minimumStake = ethers.BigNumber.from(aavegotchi.minimumStake);

      const available = currentStake.sub(minimumStake);
      await expect(
        collateralFacet.decreaseStake(testAavegotchiId, currentStake)
      ).to.be.revertedWith(
        "CollateralFacet: Cannot reduce below minimum stake"
      );
      await collateralFacet.decreaseStake(testAavegotchiId, available);

      aavegotchi = await aavegotchiFacet.getAavegotchi(testAavegotchiId);
      currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount);
      expect(currentStake).to.equal(minimumStake);
    });

    /*
    it("Base rarity score can handle negative numbers", async function() {
      const score = await aavegotchiGameFacet.baseRarityScore([-10, -10, 0, 0, 0, 0]);
      expect(score).to.equal(620);
    });
    */

    /*

    it("Can decrease stake and destroy Aavegotchi", async function() {
      // Open portal
      const initialBalance = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account));
      // await openAndClaim(['1'])

      const id = "10001";
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(id);
      const selectedGhost = ghosts[0];
      const minStake = selectedGhost.minimumStake;

      // Claim ghost and stake
      await aavegotchiGameFacet.claimAavegotchi(id, 0, minStake);
      //  await claimGotchis[id]

      // Burn Aavegotchi and return collateral stake
      await collateralFacet.decreaseAndDestroy(id, id);
      const balanceAfterDestroy = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account));
      expect(balanceAfterDestroy).to.equal(initialBalance);

      // Should only have 1 portal now
      let myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account);
      expect(myPortals.length).to.equal(4);
    });
    */
  });

  /*
  describe("Items & Wearables", async function() {
    it("Shows item URI", async function() {
      const uri = await itemsFacet.uri(testWearableId);
      expect(uri).to.equal("https://aavegotchi.com/metadata/items/1");
    });

    it("Returns item SVG", async function() {
      const svg = await svgFacet.getItemSvg(testWearableId);
      // console.log('svg:', svg)
      expect(svg).not.to.equal("");
    });

    it("Can mint items", async function() {
      let balance = await itemsFacet.balanceOf(account, "0");
      expect(balance).to.equal(0);
      // To do: Get max length of wearables array
      await expect(daoFacet.mintItems(account, ["0"], ["10"])).to.be.revertedWith("DAOFacet: Total item type quantity exceeds max quantity");
      await daoFacet.mintItems(account, [newTestWearableId], ["10"]);
      balance = await itemsFacet.balanceOf(account, newTestWearableId);
      expect(balance).to.equal(10);
    });

    it("Can transfer wearables to Aavegotchi", async function() {
      await itemsTransferFacet.transferToParent(
        account, // address _from,
        aavegotchiFacet.address, // address _toContract,
        testAavegotchiId, // uint256 _toTokenId,
        newTestWearableId, // uint256 _id,
        "10" // uint256 _value
      );
      const balance = await itemsFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, newTestWearableId);
      expect(balance).to.equal(10);
    });

    it("Can transfer wearables from Aavegotchi back to owner", async function() {
      await itemsTransferFacet.transferFromParent(
        aavegotchiFacet.address, // address _fromContract,
        testAavegotchiId, // uint256 _fromTokenId,
        account, // address _to,
        newTestWearableId, // uint256 _id,
        "10" // uint256 _value
      );
      const balance = await itemsFacet.balanceOf(account, newTestWearableId);
      expect(balance).to.equal(10);
    });

    it("Can equip wearables", async function() {
      // First transfer wearables to parent Aavegotchi
      await itemsTransferFacet.transferToParent(
        account, aavegotchiFacet.address, testAavegotchiId, newTestWearableId, "10");
      expect(await itemsFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, newTestWearableId)).to.equal(10);

      const wearableIds = [0, 0, 0, newTestWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      // console.log(wearableIds.toString())
      await itemsFacet.equipWearables(testAavegotchiId, wearableIds);
      const equipped = await itemsFacet.equippedWearables(testAavegotchiId);

      expect(equipped.length).to.equal(16);
      // First item in array is 1 because that wearable has been equipped
      expect(equipped[testSlot].toString()).to.equal(newTestWearableId);
    });

    it("Cannot equip wearables in the wrong slot", async function() {
      // This wearable can't be equipped in the 4th slot
      const wearableIds = [newTestWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // fourth slot, third slot, second slot, first slot

      await expect(itemsFacet.equipWearables(testAavegotchiId, wearableIds)).to.be.revertedWith("ItemsFacet: Wearable can't be equipped in slot");
    });

    it("Can unequip all wearables with empty array", async function() {
      let equipped = await itemsFacet.equippedWearables(testAavegotchiId);
      expect(equipped[3]).to.greaterThan(0);

      // Unequip all wearables
      await itemsFacet.equipWearables(testAavegotchiId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      equipped = await itemsFacet.equippedWearables(testAavegotchiId);
      expect(equipped[0]).to.equal(0);

      // Put wearable back on
      await itemsFacet.equipWearables(testAavegotchiId, [0, 0, 0, newTestWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });
  */

  describe("DAO Functions", async function () {
    it("Check addCollateralTypes", async function () {
      let collaterals = await collateralFacet.getCollateralInfo(
        currentHauntId - 1
      );
      expect(collaterals.length).to.equal(9); // H1 collaterals

      collaterals = await collateralFacet.getCollateralInfo(currentHauntId);
      expect(collaterals.length).to.equal(1); // H2 test collaterals

      let collateralTypes = await collateralFacet.getAllCollateralTypes();
      expect(collateralTypes.length).to.equal(10); // All collateral types

      const h1Collaterals = getCollateralsH1(
        "matic",
        ghstTokenContract.address
      );
      await (
        await daoFacet.addCollateralTypes(currentHauntId, h1Collaterals)
      ).wait();

      collaterals = await collateralFacet.getCollateralInfo(currentHauntId - 1);
      expect(collaterals.length).to.equal(9); // H1 collaterals, not changed

      collateralTypes = await collateralFacet.getAllCollateralTypes();
      expect(collateralTypes.length).to.equal(10); // All collateral types, Not changed

      collaterals = await collateralFacet.getCollateralInfo(currentHauntId + 1);
      expect(collaterals.length).to.equal(0); // H3 collaterals

      await (
        await daoFacet.addCollateralTypes(currentHauntId + 1, h1Collaterals)
      ).wait();

      collaterals = await collateralFacet.getCollateralInfo(currentHauntId + 1);
      expect(collaterals.length).to.equal(9); // H3 collaterals

      collateralTypes = await collateralFacet.getAllCollateralTypes();
      expect(collateralTypes.length).to.equal(10); // All collateral types, Not changed
    });
  });
});
