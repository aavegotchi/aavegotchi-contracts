import { ethers, network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { bridgeConfig } from "../geistBridge/bridgeConfig";
import { ItemsFacet } from "../../typechain";

const gasLimit = 500_000;

function getPayloadSize(address: string) {
  const payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256"],
    [address, gasLimit]
  );

  return payload.length;
}

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [
        // "function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable",
        // "function setMetadata(uint _tokenId, bytes memory _metadata) external",
        // "function bridgeGotchis(tuple(address receiver, uint256 tokenId, uint256 msgGasLimit)[] calldata bridgingParams, address _connector) external payable",
        // "function bridgeItems(tuple(address receiver, uint256 tokenId, uint256 amount, uint256 msgGasLimit)[] calldata bridgingParams, address _connector) external payable",
        // "function setBridges(address _gotchiBridge, address _itemBridge) external",
        // "function getGotchiBridge() external view returns (address)",
        // "function getItemBridge() external view returns (address)",
        // "function getMinFees(address connector_, uint256 msgGasLimit_, uint256 payloadSize_) external view returns (uint256)",
      ],
      removeSelectors: [
        // "function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external payable",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  // let iface = new ethers.utils.Interface(PolygonXGeistBridgeFacet__factory.abi);
  // const payload = iface.encodeFunctionData("setBridges", [
  //   bridgeConfig[137].GOTCHI.Vault,
  //   bridgeConfig[137].GOTCHI_ITEM.Vault,
  // ]);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    // diamondOwner: '0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668',
    // diamondAddress: '0x87C969d083189927049f8fF3747703FB9f7a8AEd', // base-sepolia
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);

  // await setBridges();

  if (network.name === "hardhat") {
    //try to bridge a gotchi
    const tokenId = 1463;
    const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
    const connector = bridgeConfig[137].GOTCHI.connectors[63157].FAST;

    const signer = await ethers.getImpersonatedSigner(owner);

    console.log("signer:", signer.address);

    const bridge = await ethers.getContractAt(
      "PolygonXGeistBridgeFacet",
      maticDiamondAddress,
      signer
    );

    const erc721Facet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress,
      signer
    );

    let tx = await erc721Facet.setApprovalForAll(
      bridgeConfig[137].GOTCHI.Vault,
      true
    );
    await tx.wait();

    tx = await bridge.bridgeGotchi(owner, tokenId, gasLimit, connector, {
      value: ethers.utils.parseEther("0.3"),
    });

    await tx.wait();
    console.log("Gotchis bridged");
  }
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
