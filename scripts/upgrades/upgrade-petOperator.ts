/* global ethers hre */
/* eslint prefer-const: "off" */

import { Signer } from "@ethersproject/abstract-signer";
//@ts-ignore
import { ethers, network } from "hardhat";
import { gasPrice, getSelector, getSelectors } from "../helperFunctions";
import { sendToMultisig } from "../libraries/multisig/multisig";

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

export async function upgradePetOperator() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer: Signer;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.getSigner(owner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  const AavegotchiFacet = await ethers.getContractFactory(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet"
  );
  let facet1 = await AavegotchiFacet.deploy({ gasPrice: gasPrice });
  await facet1.deployed();
  console.log("Deployed AavegotchiFacet:", facet1.address);

  const AavegotchiGameFacet = await ethers.getContractFactory(
    "AavegotchiGameFacet"
  );
  let facet2 = await AavegotchiGameFacet.deploy({ gasPrice: gasPrice });
  await facet2.deployed();
  console.log("Deployed AavegotchiGameFacet:", facet2.address);

  const newFuncs = [
    getSelector(
      "function isPetOperatorForAll(address _owner, address _operator) external view returns (bool approved_)",
      ethers
    ),
    getSelector(
      "function setPetOperatorForAll(address _operator, bool _approved) external",
      ethers
    ),
  ];
  let existingFuncs = getSelectors(facet1);
  let facet2selectors = getSelectors(facet2);
  for (const selector of newFuncs) {
    if (!existingFuncs.includes(selector)) {
      throw Error(`Selector ${selector} not found`);
    }
  }
  existingFuncs = existingFuncs.filter(
    (selector: string) => !newFuncs.includes(selector)
  );

  const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

  const cut = [
    {
      facetAddress: facet1.address,
      action: FacetCutAction.Add,
      functionSelectors: newFuncs,
    },
    {
      facetAddress: facet1.address,
      action: FacetCutAction.Replace,
      functionSelectors: existingFuncs,
    },
    {
      facetAddress: facet2.address,
      action: FacetCutAction.Replace,
      functionSelectors: facet2selectors,
    },
  ];

  console.log(cut);
  const diamondCut = await ethers.getContractAt(
    "IDiamondCut",
    diamondAddress,
    signer
  );
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
    const diamondUpgrader = process.env.DIAMOND_UPGRADER;
    if (diamondUpgrader)
      await sendToMultisig(diamondUpgrader, signer, tx, ethers);
  }
  return diamondAddress;
}

if (require.main === module) {
  upgradePetOperator()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
