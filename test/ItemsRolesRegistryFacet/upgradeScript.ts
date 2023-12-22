import { Contract, ContractFactory, Signer } from "ethers";
import { ethers } from "hardhat";
import { getSelectors } from "../../scripts/helperFunctions";

interface Props {
  diamondAddress: string;
  facetNames: string[];
  signer: Signer;
  selectorsToRemove?: string[];
  initFacetName?: string;
  initArgs?: any[];
}

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

function inFacets(selector: any, facets: any) {
  for (const facet of facets) {
    if (facet.functionSelectors.includes(selector)) {
      return true;
    }
  }
  return false;
}

export async function upgradeWithNewFacets({
  diamondAddress,
  facetNames,
  signer,
  selectorsToRemove = [],
  initFacetName = undefined,
  initArgs = [],
}: Props) {

  const diamondCutFacet = await ethers.getContractAt(
    "DiamondCutFacet",
    diamondAddress,
    signer
  );
  const diamondLoupeFacet = await ethers.getContractAt(
    "DiamondLoupeFacet",
    diamondAddress,
    signer
  );

  const diamondCut = [];
  const existingFacets = await diamondLoupeFacet.facets();
  const undeployed = [];
  const deployed = [];
  for (const name of facetNames) {
    console.log(name);
    const facetFactory = await ethers.getContractFactory(name);
    undeployed.push([name, facetFactory]);
  }

  if (selectorsToRemove.length > 0) {
    // check if any selectorsToRemove are already gone
    for (const selector of selectorsToRemove) {
      if (!inFacets(selector, existingFacets)) {
        throw Error("Function selector to remove is already gone.");
      }
    }
    diamondCut.push(
      {
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectorsToRemove,
      },
    );
  }

  for (const [name, facetFactory] of undeployed) {
    console.log(`Deploying ${name}`);
    const factory = facetFactory as ContractFactory;
    deployed.push([name, await factory.deploy()]);
  }

  for (const [name, deployedFactory_] of deployed) {
    let deployedFactory = deployedFactory_ as Contract;
    await deployedFactory.deployed();
    console.log("--");
    console.log(`${name} deployed: ${deployedFactory.address}`);
    const add = [];
    const replace = [];
    for (const selector of getSelectors(deployedFactory)) {
      if (!inFacets(selector, existingFacets)) {
        add.push(selector);
      } else {
        replace.push(selector);
      }
    }
    if (add.length > 0) {
      diamondCut.push(
        {
          facetAddress: deployedFactory.address,
          action: FacetCutAction.Add,
          functionSelectors: add,
        },
      );
    }
    if (replace.length > 0) {
      diamondCut.push(
        {
          facetAddress: deployedFactory.address,
          action: FacetCutAction.Replace,
          functionSelectors: replace,
        },
      );
    }
  }
  console.log("diamondCut arg:");
  console.log(diamondCut);
  console.log("------");

  let initFacetAddress = ethers.constants.AddressZero;
  let functionCall = "0x";
  if (initFacetName !== undefined) {
    let initFacet;
    for (const [name, deployedFactory] of deployed) {
      if (name === initFacetName) {
        initFacet = deployedFactory;
        break;
      }
    }
    if (!initFacet) {
      const InitFacet = await ethers.getContractFactory(initFacetName);
      initFacet = await InitFacet.deploy();
      await initFacet.deployed();
      console.log("Deployed init facet: " + initFacet.address);
    } else {
      initFacet = initFacet as Contract;
      console.log("Using init facet: " + initFacet.address);
    }
    initFacet = initFacet as Contract;
    functionCall = initFacet.interface.encodeFunctionData("init", initArgs);
    console.log("Function call: ");
    console.log(functionCall);
    initFacetAddress = initFacet.address;
  }

  const result = await diamondCutFacet.diamondCut(
    diamondCut,
    initFacetAddress,
    functionCall
  );
  console.log("------");
  console.log("Upgrade transaction hash: " + result.hash);
  return diamondCut;
}
