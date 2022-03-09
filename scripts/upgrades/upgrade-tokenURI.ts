import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import {
  AavegotchiFacet,
  ItemsFacet,
  ItemsFacet__factory,
} from "../../typechain";
import { ItemsFacetInterface } from "../../typechain/ItemsFacet";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: ItemsFacetInterface = new ethers.utils.Interface(
    ItemsFacet__factory.abi
  ) as ItemsFacetInterface;

  const calldata = iface.encodeFunctionData("setBaseURI", [
    "https://app.aavegotchi.com/metadata/items/",
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  // let gotchifacet = (await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
  //   maticDiamondAddress
  // )) as AavegotchiFacet;

  // let itemsFacet = (await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
  //   maticDiamondAddress
  // )) as ItemsFacet;

  // let tokenURI = await gotchifacet.tokenURI("0");
  // console.log("b token uri:", tokenURI);

  // let itemsURI = await itemsFacet.uri("1");
  // console.log("b item uri:", itemsURI);

  await run("deployUpgrade", args);

  // gotchifacet = (await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
  //   maticDiamondAddress
  // )) as AavegotchiFacet;

  // itemsFacet = (await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
  //   maticDiamondAddress
  // )) as ItemsFacet;

  // tokenURI = await gotchifacet.tokenURI("0");
  // console.log("token uri:", tokenURI);

  // itemsURI = await itemsFacet.uri("1");
  // console.log("item uri:", itemsURI);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
