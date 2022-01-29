import { run, ethers, network } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { SvgViewsFacetInterface } from "../../typechain/SvgViewsFacet";
import { SvgViewsFacet__factory } from "../../typechain";
import { Exceptions } from "../../scripts/itemTypeHelpers";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "SvgViewsFacet",
      addSelectors: [
        `function setSideViewExceptions(tuple(uint256 itemId,uint256 slotPosition,bool exceptionBool)[] _sideViewExceptions) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "SvgFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: SvgViewsFacetInterface = new ethers.utils.Interface(
    SvgViewsFacet__factory.abi
  ) as SvgViewsFacetInterface;

  // await network.provider.send("hardhat_setBalance", [
  //   "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  //   "0x0de0b6b3a7640000",
  // ]);

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
      itemId: 312,
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
      itemId: 312,
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
    {
      itemId: 305,
      slotPosition: 6,
      exceptionBool: true,
    },
    {
      itemId: 132,
      slotPosition: 0,
      exceptionBool: true,
    },
    {
      itemId: 307,
      slotPosition: 0,
      exceptionBool: true,
    },
    {
      itemId: 39,
      slotPosition: 3,
      exceptionBool: true,
    },
    {
      itemId: 45,
      slotPosition: 3,
      exceptionBool: true,
    },
    {
      itemId: 216,
      slotPosition: 1,
      exceptionBool: true,
    },
  ];

  const calldata = iface.encodeFunctionData("setSideViewExceptions", [payload]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
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
