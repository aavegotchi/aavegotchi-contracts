const { LedgerSigner } = require("@ethersproject/hardware-wallets");
//const { ethers } = require("ethers");
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
  console.log("Github Xingyun functions", getSelectors(xingYunFacet));
  //using an on-chain source of truth as opposed to getSelectors
  const Loupe = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress);
  const shopFacetFunctions = await Loupe.facetFunctionSelectors(
    "0x0BfA0cfC88ff56C37e2AfA32af9BeE77f6f970ED"
  );

  /*
  console.log("Onchain ShopFacet functions", shopFacetFunctions);

  const originalXingFunc = [
    getSelector("function buyPortals(address _to, uint256 _ghst) external"),
  ];
  console.log("buy portals function:", originalXingFunc);

  const purchaseitemsWithGhst = [
    getSelector(
      "function purchaseItemsWithGhst(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external"
    ),
  ];
  console.log("purchase items selector:", purchaseitemsWithGhst);

  const purchaseTransferItemsWithGhst = [
    getSelector(
      " function purchaseTransferItemsWithGhst(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external"
    ),
  ];
  console.log(
    "purchase transfer items with ghst selector:",
    purchaseTransferItemsWithGhst
  );
  */

  const xingyunFunction = [
    getSelector(
      "function xingyun(address _to, uint256 _ghst, bytes32 _hash) external"
    ),
  ];

  console.log("xingyun func:", xingyunFunction);

  const xingyunFacet = await Loupe.facetFunctionSelectors(
    "0x433484AAfDa3820A851cf560F23026c375E76194"
  );
  console.log("Xingyun Facet functions:", xingyunFacet);

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: xingyunFunction,
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

//main();
// .then(() => console.log("upgrade completed") /* process.exit(0) */)
// .catch((error) => {
// console.error(error);
// });

exports.removeXingYun = main;
