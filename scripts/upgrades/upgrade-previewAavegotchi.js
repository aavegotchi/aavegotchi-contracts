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
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let facet;
  const owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    const Loupe = await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    );
    const oldSvgFacet = await Loupe.facetFunctionSelectors(
      "0xEA849a2B683Fed2BbE49610b7A01607fb386DE0A"
    );
    console.log("current selectors", oldSvgFacet);

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

  const svgFacet = await ethers.getContractFactory("SvgFacet");
  facet = await svgFacet.deploy();
  await facet.deployed();
  console.log("Deployed svgFacet:", facet.address);

  const newSvgFuncs = [
    getSelector(
      "function previewAavegotchi(uint256 _hauntId, address _collateralType, int16[6] memory _numericTraits,uint16[16] memory equippedWearables) external"
    ),
  ];

  let existingFuncs = getSelectors(facet);
  for (const selector of newSvgFuncs) {
    if (!existingFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }

  console.log("func:", newSvgFuncs);

  let existingSvgFuncs = getSelectors(facet);

  console.log("existing:", existingSvgFuncs);

  existingSvgFuncs = existingSvgFuncs.filter(
    (selector) => !newSvgFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: newSvgFuncs,
    },
    {
      facetAddress: facet.address,
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

    //Preview some Aavegotchis
    const svgContract = await ethers.getContractAt("SvgFacet", diamondAddress);

    //haunt 1, adai,
    const numTraits1 = [99, 99, 99, 99, 0, 0];
    const wearables1 = [11, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const preview1 = await svgContract.previewAavegotchi(
      "1",
      "0xE0b22E0037B130A9F56bBb537684E6fA18192341",
      numTraits1,
      wearables1
    );

    // console.log("preview1:", preview1);

    const normalGotchi = await svgContract.getAavegotchiSvg("2912");
    console.log("normal gotchi:", normalGotchi);

    const openPortalGotchis = await svgContract.portalAavegotchisSvg("8447");
    console.log("open portal:", openPortalGotchis[0]);
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
