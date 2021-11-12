import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";
import { SvgViewsFacetInterface } from "../../typechain/SvgViewsFacet";
import { SvgViewsFacet, SvgViewsFacet__factory } from "../../typechain";
import { Exceptions } from "../../scripts/itemTypeHelpers";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "SvgViewsFacet",
      addSelectors: [
        `function setSideViewExceptions(tuple(uint256 _itemId,uint256 _slotPosition,bool _exceptionBool)[] _sideViewExceptions) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: SvgViewsFacetInterface = new ethers.utils.Interface(
    SvgViewsFacet__factory.abi
  ) as SvgViewsFacetInterface;

  const payload: Exceptions[] = [
    {
      itemId: 201,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 261,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 151,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 152,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 153,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 154,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 155,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 156,
      slotPosition: 6,
      exceptionBool: true,
    },
  ];

  const calldata = iface.encodeFunctionData("setSideViewExceptions", [payload]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  console.log("Running remove experience upgrade!");

  await run("deployUpgrade", args);
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
