import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { sendToMultisig } from "../scripts/libraries/multisig/multisig";
import { AddressZero } from "@ethersproject/constants";
import { task } from "hardhat/config";
import {
  Contract,
  ContractFactory,
  ContractReceipt,
  ContractTransaction,
  PopulatedTransaction,
} from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { OwnershipFacet } from "../typechain/OwnershipFacet";
import { IDiamondCut } from "../typechain/IDiamondCut";
import { getSelectors } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface FacetsAndAddSelectors {
  facetName: string;
  addSelectors: string[];
}

type FacetCutType = { Add: 0; Replace: 1; Remove: 2 };
const FacetCutAction: FacetCutType = { Add: 0, Replace: 1, Remove: 2 };

interface TaskArgs {
  diamondUpgrader: string;
  diamondAddress: string;
  facetsAndAddSelectors: string;
  removeSelectors: string;
}

interface Cut {
  facetAddress: string;
  action: 0 | 1 | 2;
  functionSelectors: string[];
}

export function convertFacetAndSelectorsToString(
  facets: FacetsAndAddSelectors[]
): string {
  let outputString = "";

  facets.forEach((facet) => {
    outputString = outputString.concat(
      `#${facet.facetName}$$$${facet.addSelectors.join("*")}`
    );
  });

  return outputString;
}

export function convertStringToFacetAndSelectors(
  facets: string
): FacetsAndAddSelectors[] {
  const facetArrays: string[] = facets.split("#").filter((string) => {
    return string.length > 0;
  });

  let output: FacetsAndAddSelectors[] = [];

  facetArrays.forEach((string) => {
    const facetsAndAddSelectors = string.split("$$$");
    output.push({
      facetName: facetsAndAddSelectors[0],
      addSelectors: facetsAndAddSelectors[1].split("*"),
    });
  });

  return output;
}

task(
  "deployUpgrade",
  "Deploys a Diamond Cut, given an address, facets, and addSelectors"
)
  .addParam("diamondUpgrader", "Address of the multisig signer")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam(
    "facetsAndAddSelectors",
    "Stringified array of facet names to upgrade, along with an array of add Selectors"
  )
  .addParam(
    "removeSelectors",
    "Stringifed array of selectors to remove from the Diamond, or empty"
  )

  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const facets: string = taskArgs.facetsAndAddSelectors;
    const facetsAndAddSelectors: FacetsAndAddSelectors[] =
      convertStringToFacetAndSelectors(facets);
    const diamondUpgrader: string = taskArgs.diamondUpgrader;
    const removeSelectors: string = taskArgs.removeSelectors;
    const diamondAddress: string = taskArgs.diamondAddress;

    //Instantiate the Signer
    let signer: Signer;
    const owner = await (
      (await hre.ethers.getContractAt(
        "OwnershipFacet",
        diamondAddress
      )) as OwnershipFacet
    ).owner();
    const testing = ["hardhat", "localhost"].includes(hre.network.name);

    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });
      signer = await hre.ethers.getSigner(owner);
    } else if (hre.network.name === "matic") {
      signer = new LedgerSigner(hre.ethers.provider);
    } else {
      throw Error("Incorrect network selected");
    }

    //Create the cut
    let deployedFacets = [];
    let cut: Cut[] = [];

    for (let index = 0; index < facetsAndAddSelectors.length; index++) {
      const facet = facetsAndAddSelectors[index];

      console.log("facet:", facet);
      let factory = (await hre.ethers.getContractFactory(
        facet.facetName
      )) as ContractFactory;
      let deployedFacet: Contract = await factory.deploy();
      await deployedFacet.deployed();
      console.log(
        `Deployed Facet Address for ${facet}:`,
        deployedFacet.address
      );
      deployedFacets.push(deployedFacet);

      const newSelectors = facet.addSelectors;

      console.log("new selectors:", newSelectors);

      let existingSelectors = getSelectors(deployedFacet);
      existingSelectors = existingSelectors.filter(
        (selector) => !newSelectors.includes(selector)
      );

      if (newSelectors.length > 0) {
        cut.push({
          facetAddress: deployedFacet.address,
          action: FacetCutAction.Add,
          functionSelectors: newSelectors,
        });
      }

      //Always replace the existing selectors to prevent duplications
      cut.push({
        facetAddress: deployedFacet.address,
        action: FacetCutAction.Replace,
        functionSelectors: existingSelectors,
      });
    }

    if (JSON.parse(removeSelectors).length > 0) {
      console.log("Removing selectors:", removeSelectors);
      cut.push({
        facetAddress: hre.ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: JSON.parse(removeSelectors),
      });
    }

    console.log(cut);

    //Execute the Cut
    const diamondCut = (await hre.ethers.getContractAt(
      "IDiamondCut",
      diamondAddress,
      signer
    )) as IDiamondCut;

    if (testing) {
      console.log("Diamond cut");
      const tx: ContractTransaction = await diamondCut.diamondCut(
        cut,
        AddressZero,
        "0x",
        { gasLimit: 8000000 }
      );
      console.log("Diamond cut tx:", tx.hash);
      let receipt: ContractReceipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`);
      }
      console.log("Completed diamond cut: ", tx.hash);
    } else {
      console.log("Diamond cut");
      const tx: PopulatedTransaction =
        await diamondCut.populateTransaction.diamondCut(
          cut,
          hre.ethers.constants.AddressZero,
          "0x",
          { gasLimit: 800000 }
        );
      await sendToMultisig(diamondUpgrader, signer, tx, hre.ethers);
    }
  });
