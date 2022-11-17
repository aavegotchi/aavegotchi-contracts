import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { WearableDiamond__factory } from "../../typechain/factories/WearableDiamond__factory";

import { gasPrice } from "../helperFunctions";
// const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

//these already deployed facets(in the aavegotchi diamond) are added to the wearableDiamond directly
const aavegotchiCutFacet = "0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6";
const aavegotchiLoupeFacet = "0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9";
const aavegotchiOwnerShipFacet = "0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef";

async function deployAndUpgradeWearableDiamond() {
  console.log("Deploying wearable diamond");
  // deploy Wearable Diamond
  const Diamond = (await ethers.getContractFactory(
    "WearableDiamond"
  )) as WearableDiamond__factory;

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const diamond = await Diamond.deploy(
    signerAddress,
    aavegotchiCutFacet,
    aavegotchiLoupeFacet,
    aavegotchiOwnerShipFacet,
    { gasPrice: gasPrice }
  );
  await diamond.deployed();
  console.log("Wearable Diamond deployed to:", diamond.address);

  //upgrade with custom facets
  //adds the WearableFacet and EventHandlerFacet
  console.log("-------------------------");
  console.log("executing upgrade 3");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "WearablesFacet",
      addSelectors: [
        "function balanceOf(address _owner, uint256 _id) external view returns (uint256 balance_)",
        "function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals)",
        "function uri(uint256 _id) external view returns (string memory)",
        "function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_)",
        "function setApprovalForAll(address _operator, bool _approved) external",
        "function setBaseURI(string memory _value) external",
        "function safeTransferFrom(address _from,address _to,uint256 _id,uint256 _value,bytes calldata _data) external",
        "function safeBatchTransferFrom(address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values,bytes calldata _data) external",
      ],
      removeSelectors: [],
    },

    {
      facetName: "EventHandlerFacet",
      addSelectors: [
        "function emitApprovalEvent(address _account,address _operator,bool _approved) external",
        "function emitUriEvent(string memory _value, uint256 _id) external",
        "function emitTransferSingleEvent(address _operator,address _from,address _to,uint256 _id,uint256 _value) external",
        "function emitTransferBatchEvent(address _operator,address _from,address _to,uint256[] calldata _ids,uint256[] calldata _values) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: signerAddress,
    diamondAddress: diamond.address,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: true,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  deployAndUpgradeWearableDiamond()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
