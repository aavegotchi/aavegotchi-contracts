import { ethers, network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondUpgrader } from "../helperFunctions";
import { bridgeConfig } from "../geistBridge/bridgeConfig";
import { WearablesFacet__factory } from "../../typechain";

export async function upgrade() {
  // await upgradeDiamondCutFacet(bridgeConfig[137].GOTCHI_ITEM.NonMintableToken);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "WearablesFacet",
      addSelectors: [
        // "function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external payable",
        // "function setItemGeistBridge(address _itemBridge) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface = new ethers.utils.Interface(WearablesFacet__factory.abi);
  const payload = iface.encodeFunctionData("setItemGeistBridge", [
    bridgeConfig[137].GOTCHI_ITEM.Vault,
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: bridgeConfig[137].GOTCHI_ITEM.NonMintableToken,
    // diamondOwner: '0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668',
    // diamondAddress: '0x87C969d083189927049f8fF3747703FB9f7a8AEd', // base-sepolia
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: bridgeConfig[137].GOTCHI_ITEM.NonMintableToken,
    initCalldata: payload,
  };

  await run("deployUpgrade", args);

  // await setBridges();

  if (network.name === "hardhat") {
    //try to bridge a gotchi
    const tokenId = 228;
    const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
    const connector = bridgeConfig[137].GOTCHI_ITEM.connectors[63157].FAST;

    const signer = await ethers.getImpersonatedSigner(owner);

    console.log("signer:", signer.address);

    const bridge = await ethers.getContractAt(
      "WearablesFacet",
      bridgeConfig[137].GOTCHI_ITEM.NonMintableToken,
      signer
    );

    // const erc721Facet = await ethers.getContractAt(
    //   "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
    //   bridgeConfig[137].GOTCHI_ITEM.Vault,
    //   signer
    // );

    // let tx = await erc721Facet.setApprovalForAll(
    //   bridgeConfig[137].GOTCHI_ITEM.Vault,
    //   true
    // );
    // await tx.wait();

    // const minFees = await bridge.getMinFees(
    //   connector,
    //   5000000,
    //   getPayloadSize(connector)
    // );

    // console.log("Min fees:", minFees);

    const tx = await bridge.bridgeItem(owner, tokenId, 1, 500_000, connector, {
      value: ethers.utils.parseEther("0.1"),
    });

    await tx.wait();
    console.log("Gotchi bridged");
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
