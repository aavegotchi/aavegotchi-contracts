const { expect } = require('chai');
const { sideViewsUpgrade } = require('../scripts/upgrades/upgrade-sideViews.js');

describe("Side Views", async function () {
  this.timeout(1000000);

  let svgViewsFacet,
      aavegotchiFacet,
      aavegotchiDiamondAddress,
      maticGhstAddress,
      owner,
      aavegotchiOwner

  before(async function(){
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    // maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
    // aavegotchiOwner = '0x0628FF854C191D4b80D2F07B3f1a39D878CD2e3A';
    // owner = await ethers.getSigner(aavegotchiOwner);

    await sideViewsUpgrade();

    svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', aavegotchiDiamondAddress);
    aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);
  });

  it.only("Should render particular gotchi side view", async function() {

    // let aavegotchiMarine = await aavegotchiFacet.getAavegotchi(7623);
    // let aavegotchiMess = await aavegotchiFacet.getAavegotchi(7624);
    //
    // console.log("Marine Items Array Length: ", aavegotchiMarine.items.length);
    // console.log("Mess Items Array Length: ", aavegotchiMess.items.length);


    const svgs = await svgViewsFacet.getAavegotchiSideSvgs(7623);
    console.log('svgs:',svgs);
    const numTraits1 = [99, 99, 99, 99, 0, 0];
    const wearables1 = [11, 0, 0, 3, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // const left = ethers.utils.formatBytes32String("aavegotchi-left");
    // const right = ethers.utils.formatBytes32String("aavegotchi-right");
    // const back = ethers.utils.formatBytes32String("aavegotchi-back");

    // const preview = await svgViewsFacet.previewSideAavegotchi("1", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
    // console.log("PREVIEW: ", preview);
  });
});
