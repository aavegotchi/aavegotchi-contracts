import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "SvgFacet",
      addSelectors: [
        `function storeSvg(string[] calldata _svg, LibSvg.SvgTypeAndSizes[][] calldata _typesAndSizes) external`,
        `function updateSvg(string[] calldata _svg, LibSvg.SvgTypeAndIdsAndSizes[][] calldata _typesAndIdsAndSizes) external`,
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

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
