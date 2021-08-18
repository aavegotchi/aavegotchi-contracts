/* global describe it before ethers */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require("truffle-assertions");

describe("Minting portals", async function () {
  this.timeout(300000);
  let aavegotchiDiamondAddress,
    gotchiFacet,
    owner,
    testAdd,
    shopFacet,
    vrfFacet,
    aavegotchiGameFacet;
  before(async function () {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    testAdd = "0x088b74CF887f3bc980d1ed512Dcac58138c04E37";
    owner = await (
      await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)
    ).owner();
    signer = await ethers.provider.getSigner(owner);
    signer2 = await ethers.provider.getSigner(testAdd);
    aavegotchiGameFacet = await ethers.getContractAt(
      "AavegotchiGameFacet",
      aavegotchiDiamondAddress
    );

    shopFacet = (
      await ethers.getContractAt("ShopFacet", aavegotchiDiamondAddress)
    ).connect(signer);
    vrfFacet = (
      await ethers.getContractAt("VrfFacet", aavegotchiDiamondAddress)
    ).connect(signer2);
    gotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );
  });

  it("Should mint 5 H2 portals to the test address", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    //const tx = await shopFacet.mintPortals(testAdd, 5);
    //const newGotchi = await gotchiFacet.getAavegotchi(10000);
    //const gotchiOwner = await gotchiFacet.ownerOf(10000);
    // console.log(newGotchi);
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    console.log(myPortals);
    expect(myPortals.length).to.equal(20);
  });

  it("Should open the portal", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [testAdd],
    });
    let myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    expect(myPortals[myPortals.length - 1].status).to.equal(0);
    //  const portalId = myPortals[0].tokenId
    await vrfFacet.openPortals(["10018"]);

    // const randomness = ethers.utils.keccak256(new Date().getMilliseconds())

    // await vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)

    myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    expect(myPortals[myPortals.length - 2].status).to.equal(2);
  });

  it("Should contain 10 random ghosts in the portal", async function () {
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits("10018");
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
});
/*
  it('Should show SVGs', async function () {
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd)
    const tokenId = myPortals[0].tokenId
    const svgs = await svgFacet.portalAavegotchisSvg(tokenId)
    console.log('svgs:', svgs[0])
    expect(svgs.length).to.equal(10)
  })
  

  it("Can only set name on claimed Aavegotchi", async function () {
    await truffleAssert.reverts(
      aavegotchiGameFacet.setAavegotchiName("1", "Portal"),
      "AavegotchiGameFacet: Must claim Aavegotchi before setting name"
    );
  });

  it("Should claim an Aavegotchi", async function () {
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(
      testAdd
    );
    //  console.log('my portals:', myPortals)
    const tokenId = myPortals[0].tokenId;
    const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(
      tokenId
    );
    const selectedGhost = ghosts[4];
    const minStake = selectedGhost.minimumStake;
    await aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake);
    const kinship = await aavegotchiGameFacet.kinship(tokenId);

    const aavegotchi = await gotchiFacet.getAavegotchi(tokenId);

    const collateral = aavegotchi.collateral;
    expect(selectedGhost.collateralType).to.equal(collateral);
    expect(aavegotchi.status).to.equal(3);
    expect(aavegotchi.hauntId).to.equal(0);
    expect(aavegotchi.stakedAmount).to.equal(minStake);
    expect(kinship).to.equal(50);
  });
  **/
