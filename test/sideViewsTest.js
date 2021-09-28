const { expect } = require('chai');
const { sideViewDimensionsUpdate } = require('../scripts/changes/update-sideViewsDimensions.js');

describe("Side Views", async function () {
  this.timeout(1000000);

  let svgViewsFacet,
      aavegotchiFacet,
      aavegotchiDiamondAddress,


  before(async function(){
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

    await sideViewDimensionsUpdate();

    svgViewsFacet = await ethers.getContractAt('SvgViewsFacet', aavegotchiDiamondAddress);
    svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamondAddress);
  });

  it.only("Should render particular gotchi side view", async function() {

    // let aavegotchiMarine = await aavegotchiFacet.getAavegotchi(7623);
    // let aavegotchiMess = await aavegotchiFacet.getAavegotchi(7624);

    // uint8 internal constant WEARABLE_SLOT_BODY = 0;
    // uint8 internal constant WEARABLE_SLOT_FACE = 1;
    // uint8 internal constant WEARABLE_SLOT_EYES = 2;
    // uint8 internal constant WEARABLE_SLOT_HEAD = 3;
    // RIGHT = 4;
    // LEFT = 5;
    // uint8 internal constant WEARABLE_SLOT_PET = 6;
    // uint8 internal constant WEARABLE_SLOT_BG = 7;

    // back x:12, y:32
    // side x:20, y:33

    // const svgs = await svgViewsFacet.getAavegotchiSideSvgs(7623);
    // console.log('svgs:',svgs);
    const numTraits1 = [99, 99, 99, 99, 1, 1];
    const wearables1 = [81, 0, 0, 80, 82, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const sidePreview = await svgViewsFacet.previewSideAavegotchi("1", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
    console.log("Side Preview: ", sidePreview);
  });
});
