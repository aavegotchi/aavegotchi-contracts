/* global describe it before ethers */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require("truffle-assertions");

describe("Minting portals", async function () {
  const allPortals = [
    "10000",
    "10001",
    "10002",
    "10003",
    "10004",
    "10005",
    "10006",
    "10007",
    "10008",
    "10009",
  ];
  /** 
    "10010",
    "10011",
    "10012",
    "10013",
    "10014",
    "10015",
    "10016",
    "10017",
    "10018",
    "10019",
    "10020",
    "10021",
    "10022",
    "10023",
    "10024",
    "10025",
    "10026",
    "10027",
    "10028",
    "10029",
    "10030",
    "10031",
    "10032",
    "10033",
    "10034",
    "10035",
    "10036",
    "10037",
    "10038",
    "10039",
    "10040",
    "10041",
    "10042",
    "10043",
    "10044",
    "10045",
    "10046",
    "10047",
    "10048",
    "10049",
  ];*/
  this.timeout(30000000);
  let aavegotchiDiamondAddress,
    gotchiFacet,
    owner,
    testAdd,
    shopFacet,
    vrfFacet,
    aavegotchiGameFacet;
  before(async function () {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    testAdd = "0x18376b013Ff6f238E9cdd9c1e72E2085197E525D";
    owner = await (
      await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)
    ).owner();
    signer = await ethers.provider.getSigner(owner);
    signer2 = await ethers.provider.getSigner(testAdd);
    aavegotchiGameFacet = (
      await ethers.getContractAt(
        "AavegotchiGameFacet",
        aavegotchiDiamondAddress
      )
    ).connect(signer2);

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

  it("Should mint 10 H2 portals to the test address", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    const tx = await shopFacet.mintPortals(testAdd, 10);
    //const newGotchi = await gotchiFacet.getAavegotchi(10000);
    //const gotchiOwner = await gotchiFacet.ownerOf(10000);
    // console.log(newGotchi);
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    //console.log(myPortals[myPortals.length - 1]);
    expect(myPortals.length).to.equal(10);
  });

  it("Should open the portals", async function () {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [testAdd],
    });
    let myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    //expect(myPortals[myPortals.length - 1].status).to.equal(0);
    await vrfFacet.openPortals(allPortals);
    myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    for (let j = 0; j < 10; j++) {
      expect(myPortals[j].status).to.equal(2);
    }
    //  const portalId = myPortals[0].tokenId

    // const randomness = ethers.utils.keccak256(new Date().getMilliseconds())

    // await vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)
  });

  it("Should contain 10 random ghosts in a portal", async function () {
    const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits("10000");
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

  it("Should claim 10 Aavegotchis", async function () {
    //const myPortals = await gotchiFacet.allAavegotchisOfOwner(testAdd);
    //  console.log('my portals:', myPortals)

    for (let k = 0; k < 10; k++) {
      const tokenId = allPortals[k];
      const ghosts = await aavegotchiGameFacet.portalAavegotchiTraits(tokenId);
      const selectedGhost = ghosts[4];
      const minStake = selectedGhost.minimumStake;
      await aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake);
      const kinship = await aavegotchiGameFacet.kinship(tokenId);

      const aavegotchi = await gotchiFacet.getAavegotchi(tokenId);
      console.log(aavegotchi.numericTraits);
      const collateral = aavegotchi.collateral;
      expect(selectedGhost.collateralType).to.equal(collateral);
      expect(aavegotchi.status).to.equal(3);
      expect(aavegotchi.hauntId).to.equal(2);
      expect(aavegotchi.stakedAmount).to.equal(minStake);
      expect(kinship).to.equal(50);
    }
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
    expect(kinship).to.equal(10);
  });
  **/
