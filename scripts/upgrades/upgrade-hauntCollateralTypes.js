/* global ethers */
const { sendToMultisig } = require("../libraries/multisig/multisig.js");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

function getSelectors(contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc, val) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

function getSelector(func) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

function addCommas(nStr) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? "." + x[1] : "";
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}

function strDisplay(str) {
  return addCommas(str.toString());
}

async function deployFacets(...facets) {
  const instances = [];
  for (let facet of facets) {
    let constructorArgs = [];
    if (Array.isArray(facet)) {
      ;[facet, constructorArgs] = facet;
    }
    const factory = await ethers.getContractFactory(facet);
    const facetInstance = await factory.deploy(...constructorArgs, { gasPrice: 5000000000 });
    await facetInstance.deployed();
    const tx = facetInstance.deployTransaction;
    const receipt = await tx.wait();
    console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed));
    instances.push(facetInstance);
  }
  return instances;
}

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  let signer;
  let tx;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    const owner = await (await ethers.getContractAt("OwnershipFacet", diamondAddress)).owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner]
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  const diamondCut = await (await ethers.getContractAt("IDiamondCut", diamondAddress)).connect(signer);
  let [collateralFacet, daoFacet, ...facets] = await deployFacets(
    "CollateralFacet",
    "DAOFacet",
    "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "AavegotchiGameFacet",
    "SvgFacet",
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    "ItemsTransferFacet",
    "VrfFacet",
    "ShopFacet",
    "MetaTransactionsFacet",
    "ERC1155MarketplaceFacet",
    "ERC721MarketplaceFacet",
    "EscrowFacet"
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };
  let cut = [];

  const newCollateralFacetFuncs = [
    getSelector("function collaterals(uint256 _hauntId) external view returns (address[] collateralTypes_)"),
    getSelector("function collateralInfo(uint256 _hauntId, uint256 _collateralId) external view returns (AavegotchiCollateralTypeIO collateralInfo_)"),
    getSelector("function getCollateralInfo(uint256 _hauntId) external view returns (AavegotchiCollateralTypeIO[] collateralInfo_)")
  ];
  let existingCollateralFacetFuncs = getSelectors(collateralFacet);
  for (const selector of newCollateralFacetFuncs) {
    if (!existingCollateralFacetFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }
  existingCollateralFacetFuncs = existingCollateralFacetFuncs.filter(selector => !newCollateralFacetFuncs.includes(selector));

  const newDaoFacetFuncs = [
    getSelector("function addCollateralTypes(uint256 _hauntId, tuple(address collateralType, tuple(int16[6] modifiers, bytes3 primaryColor, bytes3 secondaryColor, bytes3 cheekColor, uint8 svgId, uint8 eyeShapeSvgId, uint16 conversionRate, bool delisted) collateralTypeInfo)[] _collateralTypes) external")
  ];
  let existingDaoFacetFuncs = getSelectors(daoFacet);
  for (const selector of newDaoFacetFuncs) {
    if (!existingDaoFacetFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }
  existingDaoFacetFuncs = existingDaoFacetFuncs.filter(selector => !newDaoFacetFuncs.includes(selector));

  cut = [
    {
      facetAddress: collateralFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newCollateralFacetFuncs
    }, {
      facetAddress: collateralFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingCollateralFacetFuncs
    },
    {
      facetAddress: daoFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newDaoFacetFuncs
    },
    {
      facetAddress: daoFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingDaoFacetFuncs
    }
  ];
  for (let facet of facets) {
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: getSelectors(facet)
    });
  }
  // console.log(cut);

  if (testing) {
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x", { gasLimit: 20000000 });
    console.log("Diamond cut tx:", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
  } else {
    tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, "0x", {
      gasLimit: 800000,
      gasPrice: 5000000000
    });
    console.log("tx:", tx);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, { gasPrice: 5000000000 });
    console.log("Sent to multisig");
  }

  // Add collateral types for H1
  daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
  if (testing) {
    const { getCollaterals } = require("../testCollateralTypes.js");
    tx = await daoFacet.addCollateralTypes(1, getCollaterals(hre.network.name, ghstAddress));
  } else {
    const { getCollaterals } = require("../collateralTypes.js");
    tx = await daoFacet.addCollateralTypes(1, getCollaterals(hre.network.name, ghstAddress));
  }
  console.log("Adding Collateral Types tx:", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding Collateral Types failed: ${tx.hash}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

exports.upgradeHauntCollateralTypes = main;
