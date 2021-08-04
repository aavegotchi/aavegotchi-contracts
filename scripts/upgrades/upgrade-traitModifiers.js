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
  const gasPrice = 20000000000;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let facet;
  const owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  console.log("testing:", testing);

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

  const daoFacet = await ethers.getContractFactory(
    "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet"
  );
  facet1 = await daoFacet.deploy({
    gasPrice: gasPrice,
  });

  await facet1.deployed();

  console.log("Deployed daofacet:", facet1.address);

  const newDaoFuncs = [
    getSelector(
      "function setItemTraitModifiersAndRarityModifier(uint256 _wearableId, int8[6] calldata _traitModifiers, uint8 _rarityScoreModifier) external"
    ),
  ];

  let existingDaoFuncs = getSelectors(facet1);

  existingDaoFuncs = existingDaoFuncs.filter(
    (selector) => !newDaoFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: facet1.address,
      action: FacetCutAction.Add,
      functionSelectors: newDaoFuncs,
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

    //item manager

    const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);

    const itemManagerDAO = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );

    await itemManagerDAO.setItemTraitModifiersAndRarityModifier(
      "210",
      [0, 0, 0, 0, 0, 0],
      0
    );

    const itemsFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    );

    const itemType = await itemsFacet.getItemType("210");

    console.log("item type:", itemType);
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

exports.itemManager = main;
