import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgrade() {

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [
        "function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable",
        "function setMetadata(uint _tokenId, bytes memory _metadata) external",
        "function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external payable",
      ],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [
        "function updateGotchiGeistBridge(address _newBridge) external",
        "function updateItemGeistBridge(address _newBridge) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    // diamondOwner: '0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668',
    // diamondAddress: '0x87C969d083189927049f8fF3747703FB9f7a8AEd', // base-sepolia
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
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
