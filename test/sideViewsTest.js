const { expect } = require('chai');
const { sideViewsUpgrade } = require('../scripts/upgrades/upgrade-sideViews.js');

describe("Side Views", async function () {
  this.timeout(300000);

  let svgViewsFacet,
      aavegotchiFacet,
      aavegotchiDiamondAddress,
      maticGhstAddress,
      owner,
      aavegotchiOwner

  before(async function(){
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    // maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
    aavegotchiOwner = '0x0628FF854C191D4b80D2F07B3f1a39D878CD2e3A';
    owner = await ethers.getSigner(aavegotchiOwner);

    await sideViewsUpgrade();

    svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', aavegotchiDiamondAddress, owner);
    aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);
  });

  it.only("Should render particular gotchi side view", async function() {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [aavegotchiOwner]
    });

    let aavegotchiMarine = await aavegotchiFacet.getAavegotchi(7623);
    let aavegotchiMess = await aavegotchiFacet.getAavegotchi(7624);

    console.log("Marine Items Array Length: ", aavegotchiMarine.items.length);
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[0].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[1].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[2].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[3].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[4].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMarine.items[5].itemId.toString());

    console.log("Mess Items Array Length: ", aavegotchiMess.items.length);
    console.log("Aavegotchi Items: ", aavegotchiMess.items[0].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMess.items[1].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMess.items[2].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMess.items[3].itemId.toString());
    console.log("Aavegotchi Items: ", aavegotchiMess.items[4].itemId.toString());

    await svgViewsFacet.getAavegotchiSideSvgs(7623);
  });
});
