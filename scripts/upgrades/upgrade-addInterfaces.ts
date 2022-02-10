import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { AavegotchiFacet__factory, DiamondLoupeFacet } from "../../typechain";
import { AavegotchiFacetInterface } from "../../typechain/AavegotchiFacet";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgrade() {
  const func = "function addInterfaces() external";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [func],
      removeSelectors: [],
    },
  ];
  let iface: AavegotchiFacetInterface = new ethers.utils.Interface(
    AavegotchiFacet__factory.abi
  ) as AavegotchiFacetInterface;
  //@ts-ignore
  const payload = iface.encodeFunctionData("addInterfaces", []);
  const joined = convertFacetAndSelectorsToString(facets);

  let args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: payload,
  };

  await run("deployUpgrade", args);

  //remove function
  const facets2: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [func],
    },
  ];

  const joined2 = convertFacetAndSelectorsToString(facets2);

  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined2,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args2);

  //confirm interfaces
  const loupe = (await ethers.getContractAt(
    "DiamondLoupeFacet",
    maticDiamondAddress
  )) as DiamondLoupeFacet;
  console.log(await loupe.supportsInterface("0xd9b67a26"));
  console.log(await loupe.supportsInterface("0x80ac58cd"));
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
