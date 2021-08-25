/* global ethers hre */
const { getCollaterals } = require("./collateralTypesHaunt2.js");
const { collateralsSvgs } = require("../svgs/collateralsH2.js");
const { eyeShapeSvgs } = require("../svgs/eyeShapesH2.js");

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

let signer, daoFacet, collateralTypesAndSizes, eyeShapeTypesAndSizes;

async function main() {
  const gasPrice = 30000000000;
  const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });

    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  function setupSvg(...svgData) {
    const svgTypesAndSizes = [];
    const svgItems = [];
    for (const [svgType, svg] of svgData) {
      svgItems.push(svg.join(""));
      svgTypesAndSizes.push([
        ethers.utils.formatBytes32String(svgType),
        svg.map((value) => value.length),
      ]);
    }
    return [svgItems.join(""), svgTypesAndSizes];
  }

  const _hauntMaxSize = 15000;
  const portalPrice = 0; //GBM
  const _bodyColor = "0x000000"; //test color
  const _collateralTypes = getCollaterals("matic");

  [collateralSvg, collateralTypesAndSizes] = setupSvg([
    "collaterals",
    collateralsSvgs,
  ]);

  //eyeshapes
  [eyeShapeSvg, eyeShapeTypesAndSizes] = setupSvg([
    "eyeShapesH2",
    eyeShapeSvgs,
  ]);

  let totalPayload = {
    _hauntMaxSize: _hauntMaxSize,
    _portalPrice: portalPrice,
    _bodyColor: _bodyColor,
    _collateralTypes: _collateralTypes,
    _collateralSvg: collateralSvg,
    _collateralTypesAndSizes: collateralTypesAndSizes,
    _eyeShapeSvg: eyeShapeSvg,
    _eyeShapeTypesAndSizes: eyeShapeTypesAndSizes,
  };
  daoFacet = (
    await ethers.getContractAt("DAOFacet", aavegotchiDiamondAddress)
  ).connect(signer);

  const svgFacet = await ethers.getContractAt(
    "SvgFacet",
    aavegotchiDiamondAddress,
    signer
  );

  console.log("Creating Haunt");
  const tx = await daoFacet.createHauntWithPayload(totalPayload, {
    gasPrice: gasPrice,
  });
  console.log("hx:", tx.hash);

  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error creating haunt: ${tx.hash}`);
  }
  console.log("Haunt created:", tx.hash);

  const preview = await svgFacet.previewAavegotchi(
    "2",
    "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4",
    [0, 0, 0, 0, 99, 99],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  );

  console.log("preview:", preview);

  if (testing) {
    //can't buy portals
    const shopFacet = await ethers.getContractAt(
      "ShopFacet",
      aavegotchiDiamondAddress,
      signer
    );

    await shopFacet.mintPortals(itemManager, 10);

    const gotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );
    const balanceOf = await gotchiFacet.balanceOf(itemManager);
    console.log("balance:", balanceOf.toString());

    const svg = await svgFacet.getAavegotchiSvg("10000");

    console.log("svg:", svg);

    const gameFacet = await ethers.getContractAt(
      "AavegotchiGameFacet",
      aavegotchiDiamondAddress
    );
    const currentHaunt = await gameFacet.currentHaunt();
    console.log("current haunt:", currentHaunt);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
