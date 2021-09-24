/* global ethers hre */
/* eslint prefer-const: "off" */

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
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MATIC_URL,
          },
        },
      ],
    });

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

  const itemsFacetFactory = await ethers.getContractFactory(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet"
  );
  let itemsFacet = await itemsFacetFactory.deploy({
    gasPrice: gasPrice,
  });
  await itemsFacet.deployed();
  console.log("Deployed ItemsFacet:", itemsFacet.address);

  const daoFacetFactory = await ethers.getContractFactory(
    "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet"
  );
  let daoFacet = await daoFacetFactory.deploy({
    gasPrice: gasPrice,
  });
  await daoFacet.deployed();
  console.log("Deployed DAOFacet:", daoFacet.address);

  const movingFuncs = [
    getSelector(
      "function setWearableSlotPositions(uint256 _wearableId, bool[16] calldata _slotPositions) external"
    ),
  ];
  let existingItemsFuncs = getSelectors(itemsFacet);
  for (const selector of movingFuncs) {
    if (existingItemsFuncs.includes(selector)) {
      throw Error("Selector", selector, "found in ItemsFacet");
    }
  }

  let existingDaoFuncs = getSelectors(daoFacet);
  for (const selector of movingFuncs) {
    if (!existingDaoFuncs.includes(selector)) {
      throw Error("Selector", selector, "not found in DAOFacet");
    }
  }
  existingDaoFuncs = existingDaoFuncs.filter(
    (selector) => !movingFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: movingFuncs,
    },
    {
      facetAddress: itemsFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingItemsFuncs,
    },
    {
      facetAddress: daoFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: movingFuncs,
    },
    {
      facetAddress: daoFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingDaoFuncs,
    },
  ];
  console.log(cut);

  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);

  console.log("Diamond cut");
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
    let tx = await diamondCut.populateTransaction.diamondCut(
      cut,
      ethers.constants.AddressZero,
      "0x",
      {
        gasLimit: 800000,
      }
    );
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
    console.log("sent to multisig tx:", tx.hash);
  }

  console.log("Completed diamond cut");

  /*
  const daoContract = await ethers.getContractAt("DAOFacet",diamondAddress, signer)

  const itemContract = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",diamondAddress)

  let itemType = await itemContract.getItemType("100")

  console.log('before:',itemType)



  console.log('testing upgrade')
  await daoContract.setWearableSlotPositions("100", [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false])

   itemType = await itemContract.getItemType("100")

  console.log('after:',itemType)
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
