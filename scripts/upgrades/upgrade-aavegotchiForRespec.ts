import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { DAOFacet, DAOFacetInterface } from "../../typechain/DAOFacet";
import { DAOFacet__factory } from "../../typechain";

export async function upgradeAavegotchiForRepec() {
  console.log("Upgrading Aavegotchi facets for Respec potion.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      addSelectors: [
        "function setDaoDirectorTreasury(address treasuryAddr) external",
        "function getDaoDirectorTreasury() public view returns (address)",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      addSelectors: [
        "function resetSkillPoints(uint32 _tokenId) public",
        "function getGotchiBaseNumericTraits(uint32 _tokenId) public view returns (int16[6] memory numericTraits_)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  //set the wearable diamond address
  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const daoDirectorTreasuryAddr = "0x939b67F6F6BE63E09B0258621c5A24eecB92631c";

  const calldata = iface.encodeFunctionData("setDaoDirectorTreasury", [
    daoDirectorTreasuryAddr,
  ]);

  const args: DeployUpgradeTaskArgs = {
    // diamondUpgrader: maticDiamondUpgrader,
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Aavegotchi facets for Forge.");

  const daoFacet = (await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress
  )) as DAOFacet;

  const director = await daoFacet.getDaoDirectorTreasury();
  console.log("director:", director);
}

if (require.main === module) {
  upgradeAavegotchiForRepec()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
