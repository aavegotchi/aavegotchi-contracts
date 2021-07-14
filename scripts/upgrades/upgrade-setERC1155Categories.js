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
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let owner = await (await ethers.getContractAt("OwnershipFacet", diamondAddress)).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.MATIC_URL
        }
      }]
    });

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

  const erc1155MarketplaceFacetFactory = await ethers.getContractFactory("ERC1155MarketplaceFacet");
  let erc1155MarketplaceFacet = await erc1155MarketplaceFacetFactory.deploy();
  await erc1155MarketplaceFacet.deployed();
  console.log("Deployed ERC1155MarketplaceFacet:", erc1155MarketplaceFacet.address);

  let existingFuncs = getSelectors(erc1155MarketplaceFacet);

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: erc1155MarketplaceFacet.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingFuncs
    }
  ];
  console.log(cut);

  const diamondCut = (await ethers.getContractAt("IDiamondCut", diamondAddress)).connect(signer);

  console.log("Diamond cut");
  if(testing) {
    const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, "0x", { gasLimit: 20000000 });
    console.log("Diamond cut tx:", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
  } else {
    let tx = await diamondCut.populateTransaction.diamondCut(cut, ethers.constants.AddressZero, "0x", {
      gasLimit: 800000,
      gasPrice: 5000000000
    });
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, { gasPrice: 5000000000 });
    console.log("sent to multisig tx:", tx.hash);
  }

  console.log("Completed diamond cut");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
