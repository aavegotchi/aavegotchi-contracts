const { LedgerSigner } = require("@ethersproject/hardware-wallets");
//const { ethers } = require("ethers");
const { sendToMultisig } = require("../libraries/multisig/multisig.js");

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

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let facet;
  const owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  const xingYunFacet = await ethers.getContractAt(
    "XingyunFacet",
    diamondAddress
  );

  const ShopFacet = await ethers.getContractFactory("ShopFacet");
  let shopFacet = await ShopFacet.deploy();
  await shopFacet.deployed();
  console.log("Deployed ShopFacet");

  const SvgFacet = await ethers.getContractFactory(
    "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet"
  );

  let svgFacet = await SvgFacet.deploy();
  await svgFacet.deployed();
  console.log("Deployed Svgfacet:", svgFacet.address);

  //const xingAddress = "0x68B7BF18184E0cC160f046E567Cc5cdbbf0d89d6";
  //let allExistingXingYunFuncs = getSelectors(xingYunFacet);

  //add the generic mintPortals function
  let existingShopFuncs = getSelectors(shopFacet);

  let existingSvgFuncs = getSelectors(svgFacet);
  //remove the buyPortals function
  const toRemove = [
    getSelector("function buyPortals(address _to, uint256 _ghst) external"),
  ];

  const newShopFuncs = [
    getSelector("function mintPortals(address _to, uint256 _ghst) external"),
  ];
  //existingDaoFuncs = existingDaoFuncs.filter(selector => !newDaoFuncs.includes(selector))

  //let existingShopFuncs = getSelectors(shopFacet);

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: ["0xebdc3b58", "0x432788ec"], //excluding '0xf83023af' which appears to not be in the diamond
    },
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: toRemove,
    },
    {
      facetAddress: shopFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newShopFuncs,
    },
    {
      facetAddress: svgFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingSvgFuncs,
    },
  ];

  console.log(cut);

  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);
  let tx;
  let receipt;

  if (testing) {
    console.log("Diamond cut");
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x", {
      gasLimit: 8000000,
    });
    console.log("Diamond cut tx:", tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    console.log("Completed diamond cut: ", tx.hash);
  } else {
    console.log("Diamond cut");
    tx = await diamondCut.populateTransaction.diamondCut(
      cut,
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }
}

main()
  .then(() => console.log("upgrade completed") /* process.exit(0) */)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
