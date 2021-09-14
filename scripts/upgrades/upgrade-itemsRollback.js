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

async function main() {
  const gasPrice = 2000000000;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let facet;
  let tx;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    const owner = await (
      await ethers.getContractAt("OwnershipFacet", diamondAddress)
    ).owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Deploying facets");

  const itemsTransferFacet = await ethers.getContractFactory(
    "ItemsTransferFacet"
  );
  facet = await itemsTransferFacet.deploy({ gasPrice: 10000000000 });
  await facet.deployed();
  console.log("Deployed facet:", facet.address);

  const newFuncs = [
    getSelector(
      "function extractItemsFromSacrificedGotchi(address _to, uint256 _tokenId, uint256[] calldata _itemIds, uint256[] calldata _values) external"
    ),
    getSelector(
      "function extractItemsFromDiamond(address_ to, uint256[] calldata _itemIds, uint256[] calldata _values) external"
    ),
  ];
  let existingFuncs = getSelectors(facet);
  for (const selector of newFuncs) {
    if (!existingFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }
  existingFuncs = existingFuncs.filter(
    (selector) => !newFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: newFuncs,
    },
    {
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingFuncs,
    },
  ];
  console.log(cut);

  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);

  if (testing) {
    const tx = await diamondCut.diamondCut(
      cut,
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 20000000 }
    );
    console.log("Diamond cut tx:", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
  } else {
    tx = await diamondCut.populateTransaction.diamondCut(
      cut,
      ethers.constants.AddressZero,
      "0x",
      {
        gasLimit: 800000,
        gasPrice: 5000000000,
      }
    );
    console.log("tx:", tx);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, {
      gasPrice: 5000000000,
    });
    console.log("Sent to multisig");
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeItemsRollback = main;
