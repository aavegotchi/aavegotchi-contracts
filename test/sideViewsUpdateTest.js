const { expect } = require('chai');
const { h2eyesSideViews } = require('../scripts/upgrades/upgrade-h2eyesSideViews.js');
const { sideViewsUpdate } = require('../scripts/changes/update-eyeShapesH2sides.js');

describe("Side Views", async function () {
  this.timeout(1000000);

  let svgViewsFacet,
      aavegotchiDiamondAddress,
      owner,
      aavegotchiOwner

  before(async function(){
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

    await h2eyesSideViews();
    await sideViewsUpdate();

    svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', aavegotchiDiamondAddress);
  });

  it.only("Should update particular gotchi side view", async function(){
    // uint8 internal constant WEARABLE_SLOT_BODY = 0;
    // uint8 internal constant WEARABLE_SLOT_FACE = 1;
    // uint8 internal constant WEARABLE_SLOT_EYES = 2;
    // uint8 internal constant WEARABLE_SLOT_HEAD = 3;
    // RIGHT = 4;
    // LEFT = 5;
    // uint8 internal constant WEARABLE_SLOT_PET = 6;
    // uint8 internal constant WEARABLE_SLOT_BG = 7;

    const numTraits1 = [99, 99, 99, 99, 12, 9];
    const wearables1 = [91, 0, 0, 48, 76, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const sidePreview = await svgViewsFacet.previewSideAavegotchi("1", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
    console.log("Side Preview: ", sidePreview);
  });
});
