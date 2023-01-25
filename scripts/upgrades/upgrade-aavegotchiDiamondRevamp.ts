import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { PeripheryFacet__factory } from "../../typechain";
import { PeripheryFacetInterface } from "../../typechain/PeripheryFacet";

import { maticDiamondAddress } from "../helperFunctions";

const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

//deployed address of the periphery diamond
let periphery: string = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";

//includes upgrades for AavegotchiFacet,BridgeFacet and DAOFacet
export async function upgrade1() {
  console.log("executing upgrade 1");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [`function addInterfaces() external`],
    },

    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

//includes upgrades for ERC1155MarketplaceFacet,ItemsFacet, PeripheryFacet and ItemsTransferFacet
//also sets the address periphery address in the aavegotchi diamond
export async function upgrade2() {
  console.log("-------------------------");
  console.log("executing upgrade 2");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [
        "function findWearableSets(uint256[] calldata _wearableIds) external view returns (uint256[] memory wearableSetIds_)",
        "function totalWearableSets() external view returns (uint256)",
        "function getWearableSet(uint256 _index) public view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses) memory wearableSet_)",
        "function getWearableSets() external view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses)[] memory wearableSets_)",
      ],
    },
    {
      facetName: "PeripheryFacet",
      addSelectors: [
        "function peripherySetApprovalForAll(address _operator,bool _approved,address _onBehalfOf) external",
        "function peripherySetBaseURI(string memory _value) external returns (uint256 _itemsLength)",

        "function peripherySafeTransferFrom(address _operator,address _from,address _to,uint256 _id,uint256 _value,bytes calldata _data) external",

        "function peripherySafeBatchTransferFrom(address _operator,address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values,bytes calldata _data) external",
        "function removeInterface() external",
        "function setPeriphery(address _periphery) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ItemsTransferFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  //set the wearable diamond address
  let iface: PeripheryFacetInterface = new ethers.utils.Interface(
    PeripheryFacet__factory.abi
  ) as PeripheryFacetInterface;

  const calldata = iface.encodeFunctionData("setPeriphery", [periphery]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

//includes upgrades for the ShopFacet and VoucherMigrationFacet. Also Removes the unused interfaces.
export async function upgrade3() {
  console.log("-------------------------");
  console.log("executing upgrade 3");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ShopFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "VoucherMigrationFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "WearableSetsFacet",
      addSelectors: [
        "function findWearableSets(uint256[] calldata _wearableIds) external view returns (uint256[] memory wearableSetIds_)",
        "function totalWearableSets() external view returns (uint256)",
        "function getWearableSet(uint256 _index) public view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses) memory wearableSet_)",
        "function getWearableSets() external view returns((string name,uint8[] allowedCollaterals,uint16[] wearableIds,int8[5] traitsBonuses)[] memory wearableSets_)",
      ],
      removeSelectors: [],
    },
  ];

  let iface: PeripheryFacetInterface = new ethers.utils.Interface(
    PeripheryFacet__factory.abi
  ) as PeripheryFacetInterface;

  const calldata = iface.encodeFunctionData("removeInterface");

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

//This adds a new facet called WearableSetsFacet to the aavegotchi diamond

async function upgradeAll() {
  // await upgrade1();
  // await upgrade2();
  await upgrade3();
}

if (require.main === module) {
  upgradeAll()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
