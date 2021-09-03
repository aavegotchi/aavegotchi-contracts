const { expect } = require('chai');
const { sideViewsUpdate } = require('../scripts/upgrades/upgrade-sideViewsUpdate.js');

describe("Side Views", async function () {
  this.timeout(1000000);

  let svgViewsFacet,
      aavegotchiDiamondAddress,
      owner,
      aavegotchiOwner

  before(async function(){
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

    await sideViewsUpdate();

    svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', aavegotchiDiamondAddress);
  });

  it.only("Should update particular gotchi side view", async function(){
    const numTraits1 = [99, 99, 99, 99, 1, 1];
    const wearables1 = [5, 0, 0, 48, 12, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const sidePreview = await svgViewsFacet.previewSideAavegotchi("1", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
    console.log("Side Preview: ", sidePreview);
  });
});
