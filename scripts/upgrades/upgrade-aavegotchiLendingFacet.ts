import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";
import { DAOFacet__factory } from "../../typechain";
import { DAOFacetInterface } from "../../typechain/DAOFacet";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AavegotchiLendingFacet",
      addSelectors: [
        "function getAavegotchiRentalInfo(uint256 _rentalId) external view",
        "function getAavegotchiRental(uint256 _rentalId) external view",
        "function getAavegotchiRentalFromToken(uint256 _erc721TokenId) external view",
        "function addAavegotchiRental(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _amountPerDay, uint256 _period, uint256[3] memory _revenueSplit, address _receiver) external",
        "function cancelAavegotchiRentalByToken(uint256 _erc721TokenId) external",
        "function cancelAavegotchiRental(uint256 _rentalId) external",
        "function agreeAavegotchiRental(uint256 _rentalId) external",
        "function claimAavegotchiRental(uint256 _rentalId) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [
        "function addRevenueTokens(address[] memory _revenueTokens) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "VrfFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const revenueTokens = [
    '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7' // GHST
  ];

  const calldata = iface.encodeFunctionData("addRevenueTokens", [
    revenueTokens,
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
