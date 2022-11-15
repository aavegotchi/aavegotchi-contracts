import { run, ethers } from "hardhat";
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
        `function setSideViewExceptions(tuple(uint256 itemId,uint256 slotPosition,bytes32 side,bool exceptionBool)[] _sideViewExceptions) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "SvgFacet",
      addSelectors: [
        `function getNextSleeveId() external view returns (uint256)`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: SvgViewsFacetInterface = new ethers.utils.Interface(
    SvgViewsFacet__factory.abi
  ) as SvgViewsFacetInterface;

  const front = ethers.utils.formatBytes32String("wearables-front");
  const back = ethers.utils.formatBytes32String("wearables-back");
  const left = ethers.utils.formatBytes32String("wearables-left");
  const right = ethers.utils.formatBytes32String("wearables-right");

  const payload: Exceptions[] = [
    //body
    {
      itemId: 40,
      slotPosition: 0,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 132,
      slotPosition: 0,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 132,
      slotPosition: 0,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 132,
      slotPosition: 0,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 307,
      slotPosition: 0,
      side: back,
      exceptionBool: true,
    },

    //face
    {
      itemId: 18,
      slotPosition: 1,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 18,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 18,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 18,
      slotPosition: 1,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 55,
      slotPosition: 1,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 55,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 55,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 140,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 140,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 216,
      slotPosition: 1,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 216,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 216,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 240,
      slotPosition: 1,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 240,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 240,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 306,
      slotPosition: 1,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 306,
      slotPosition: 1,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 306,
      slotPosition: 1,
      side: right,
      exceptionBool: true,
    },

    //eyes
    {
      itemId: 301,
      slotPosition: 2,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 301,
      slotPosition: 2,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 301,
      slotPosition: 2,
      side: right,
      exceptionBool: true,
    },

    {
      itemId: 66,
      slotPosition: 2,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 66,
      slotPosition: 2,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 66,
      slotPosition: 2,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 66,
      slotPosition: 2,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 199,
      slotPosition: 2,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 199,
      slotPosition: 2,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 199,
      slotPosition: 2,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 199,
      slotPosition: 2,
      side: front,
      exceptionBool: true,
    },

    //head

    {
      itemId: 27,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 27,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 27,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 27,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 30,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 30,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 30,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 30,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 33,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 33,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 33,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 33,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },

    {
      itemId: 72,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 72,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 72,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 72,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },

    {
      itemId: 144,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 144,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 144,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 144,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 145,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 145,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 145,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 145,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 161,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 161,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 161,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 161,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },

    {
      itemId: 242,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 242,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 242,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },

    {
      itemId: 292,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 292,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 292,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 292,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 302,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 302,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 302,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 302,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 308,
      slotPosition: 3,
      side: front,
      exceptionBool: true,
    },
    {
      itemId: 308,
      slotPosition: 3,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 308,
      slotPosition: 3,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 308,
      slotPosition: 3,
      side: back,
      exceptionBool: true,
    },

    //right hand
    {
      itemId: 23,
      slotPosition: 4,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 23,
      slotPosition: 4,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 4,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 4,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 4,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 4,
      side: right,
      exceptionBool: true,
    },

    //left hand
    {
      itemId: 23,
      slotPosition: 5,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 23,
      slotPosition: 5,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 201,
      slotPosition: 5,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 223,
      slotPosition: 5,
      side: right,
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 5,
      side: left,
      exceptionBool: true,
    },
    {
      itemId: 312,
      slotPosition: 5,
      side: right,
      exceptionBool: true,
    },

    //pet
    {
      itemId: 151,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 152,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 153,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 154,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 155,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 156,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 233,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 236,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 237,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 238,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 261,
      slotPosition: 6,
      side: back,
      exceptionBool: true,
    },
    {
      itemId: 305,
      slotPosition: 6,
      side: back,
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

  await run("deployUpgrade", args);

  console.log("Side view exceptions set");
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
