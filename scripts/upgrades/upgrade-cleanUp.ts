import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { DiamondLoupeFacet, AavegotchiFacet } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "",
      addSelectors: [],
      removeSelectors: ["0xb7127e41", "0xc6b05266", "0xefdbb74b", "0xa6655766"],
    },
  ];
  const loupe = (await ethers.getContractAt(
    "DiamondLoupeFacet",
    maticDiamondAddress
  )) as DiamondLoupeFacet;
  let allFacets = await loupe.facetAddresses();

  console.log(`length before`, allFacets.length);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    rawSigs: true,
  };

  console.log("Removing all deprecated facets!");

  await run("deployUpgrade", args);

  allFacets = await loupe.facetAddresses();

  console.log(`length after`, allFacets.length);

  //do some function calls
  const afacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    maticDiamondAddress
  );
  console.log(await afacet.name());
  console.log(await afacet.totalSupply());
  console.log(
    await afacet.balanceOf("0x1087597337ddeb75c5d7aaddeb871036fde4b28c")
  );
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
