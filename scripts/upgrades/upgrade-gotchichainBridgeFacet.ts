import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";
import { DAOFacetInterface } from "../../typechain/DAOFacet";
import { DAOFacet__factory } from "../../typechain";

const gotchichainBridgeAddress = "0xe6517944BbA81e86Bf619DF6D5b549348Bb70446";

export async function upgrade(bridgeAddress: string) {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const aavegotchiTuple = `tuple(uint16[16] equippedWearables, int8[6] temporaryTraitBoosts, int16[6] numericTraits, string name, uint256 randomNumber, uint256 experience, uint256 minimumStake, uint256 usedSkillPoints, uint256 interactionCount, address collateralType, uint40 claimTime, uint40 lastTemporaryBoost, uint16 hauntId, address owner, uint8 status, uint40 lastInteracted, bool locked, address escrow)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGotchichainBridgeFacet",
      addSelectors: [
        `function setAavegotchiMetadata(uint _id, ${aavegotchiTuple} memory _aavegotchi) external`,
        "function mintWithId(address _toAddress, uint _tokenId) external",
        "function removeItemsFromOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external",
        "function addItemsToOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [
        "function getAavegotchiData(uint256 _tokenId) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [
        "function addLayerZeroBridgeAddress(address _newLayerZeroBridge) external",
        "function removeLayerZeroBridgeAddress(address _layerZeroBridgeToRemove) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const calldata = iface.encodeFunctionData("addLayerZeroBridgeAddress", [
    bridgeAddress,
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade(gotchichainBridgeAddress)
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
