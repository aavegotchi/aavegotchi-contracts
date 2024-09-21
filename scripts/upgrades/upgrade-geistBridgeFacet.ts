import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondOwner = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [
        "function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable",
        "function setMetadata(uint _tokenId, bytes memory _metadata) external",
        "function mint(address _to, uint _tokenId) external",
        "function burn(address _from, uint _tokenId) external",
        "function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external payable",
        "function mint(address _to, uint _tokenId, uint _quantity) external",
        "function burn(address _from, uint _tokenId, uint _quantity) external",
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
    diamondOwner: diamondOwner,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
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
