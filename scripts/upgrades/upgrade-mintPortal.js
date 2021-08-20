const { LedgerSigner } = require("@ethersproject/hardware-wallets");
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
  const gasPrice = 2000000000;
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

  const ShopFacet = await ethers.getContractFactory("ShopFacet");
  let shopFacet = await ShopFacet.deploy({ gasPrice: gasPrice });
  await shopFacet.deployed();
  console.log("Deployed ShopFacet");

  //add the generic mintPortals function
  const newShopFuncs = [
    getSelector("function mintPortals(address _to, uint256 _amount) external"),
  ];

  let existingShopFuncs = getSelectors(shopFacet);
  for (const selector of newShopFuncs) {
    if (!existingShopFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }

  existingShopFuncs = existingShopFuncs.filter(
    (selector) => !newShopFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: shopFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: newShopFuncs,
    },
    {
      facetAddress: shopFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingShopFuncs,
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
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.mintPortal = main;
