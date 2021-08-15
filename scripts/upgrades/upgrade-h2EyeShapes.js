/* global ethers */
const { sendToMultisig } = require("../libraries/multisig/multisig.js");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");
// const { uploadH2EyeShapeSVG } = require("./uploadH2EyeShapeSVG.js");

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

  const facetFactory = await ethers.getContractFactory("SvgFacet");
  facet = await facetFactory.deploy({
    gasPrice: gasPrice,
  });
  await facet.deployed();
  console.log("New SvgFacet deployed:", facet.address);

  let existingFacetFuncs = getSelectors(facet);

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };
  let cut = [
    {
      facetAddress: facet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingFacetFuncs,
    },
  ];

  if (testing) {
    const ShopFacet = await ethers.getContractFactory("ShopFacet");
    let shopFacet = await ShopFacet.deploy({
      gasPrice: gasPrice,
    });
    await shopFacet.deployed();
    let existingShopFuncs = getSelectors(shopFacet);

    const VRFFacet = await ethers.getContractFactory("VrfFacet");
    let vrfFacet = await VRFFacet.deploy();
    await vrfFacet.deployed();
    let existingVRFFuncs = getSelectors(vrfFacet);
    cut.push({
      facetAddress: shopFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingShopFuncs,
    });
    cut.push({
      facetAddress: vrfFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingVRFFuncs,
    });
  }
  console.log(cut);

  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);
  if (testing) {
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x", {
      gasLimit: 20000000,
    });
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
      }
    );
    console.log("tx:", tx);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
    console.log("Sent to multisig");
  }

  // await uploadH2EyeShapeSVG();

  return {
    signer,
    diamondAddress,
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeH2EyeShapes = main;
