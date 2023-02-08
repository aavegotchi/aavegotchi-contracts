import { run, ethers, network } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { ForgeDiamond__factory } from "../../../typechain/factories/ForgeDiamond__factory";

import { gasPrice, maticDiamondUpgrader } from "../../helperFunctions";

//these already deployed facets(in the aavegotchi diamond) are added to the forgeDiamond directly
const aavegotchiCutFacet = "0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6";
const aavegotchiLoupeFacet = "0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9";
const aavegotchiOwnerShipFacet = "0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef";

export async function deployAndUpgradeForgeDiamond() {
  console.log("Deploying forge diamond");

  const Diamond = (await ethers.getContractFactory(
    "ForgeDiamond"
  )) as ForgeDiamond__factory;

  if (network.name === "tenderly") {
    await ethers.provider.send("tenderly_setBalance", [
      [await (await ethers.getSigners())[0].getAddress()],
      ethers.utils.hexValue(
        ethers.utils.parseUnits("10000", "ether").toHexString()
      ),
    ]);
  }

  const deployer = await (await ethers.getSigners())[0].address;

  const diamond = await Diamond.deploy(
    deployer,
    aavegotchiCutFacet,
    aavegotchiLoupeFacet,
    aavegotchiOwnerShipFacet,
    { gasPrice: gasPrice }
  );
  await diamond.deployed();
  console.log("Forge Diamond deployed to:", diamond.address);

  //upgrade with custom facets
  console.log("-------------------------");
  console.log("executing upgrade");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeFacet",
      addSelectors: [
        "function getAavegotchiSmithingLevel(uint256 gotchiId) public view returns (uint256)",
        "function getSmithingLevelMultiplierBips(uint256 gotchiId) public view returns (uint256)",
        "function getAavegotchiSmithingSkillPts(uint256 gotchiId) public view returns (uint256)",
        "function getCoreTokenId(uint8 rarityScoreModifier, bool[16] memory slotPositions) public pure returns (uint256 tokenId)",
        "function geodeTokenIdFromRsm(uint8 rarityScoreModifier) public pure returns (uint256 tokenId)",
        // "function smeltAlloyMintAmount (uint8 rarityScoreModifier) public view returns (uint256 alloy)",
        "function smeltWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds) external",
        "function claimForgeQueueItems(uint256[] calldata gotchiIds) external",
        "function reduceQueueTime(uint256[] calldata _gotchiIds, uint40[] calldata _amounts) external",
        "function getForgeQueueItem(uint256 gotchiId) external view returns (tuple(uint256 itemId,uint256 gotchiId,bool claimed,uint40 readyBlock,uint256 id) memory)",
        "function getForgeQueueItemsByOwner(address _owner) external view returns (tuple(uint256 itemId,uint256 gotchiId,bool claimed,uint40 readyBlock,uint256 id)[] memory output)",
        "function getForgeQueue() external view returns (tuple(uint256 itemId,uint256 gotchiId,bool claimed,uint40 readyBlock,uint256 id)[] memory queue)",
        "function forgeWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds, uint40[] calldata _gltr) external",
        "function forgeTime(uint256 gotchiId, uint8 rsm) public view returns (uint256 forgeTime)",
        "function isForgeable(uint256 itemId) public view returns(bool available)",
        "function isGotchiForging(uint256 gotchiId) public view returns(bool)",
        // "function mintEssence(address owner, uint256 gotchiId) external",
        "function mintEssence(address owner) external",
        "function adminMint(address account, uint256 id, uint256 amount) external",
      ],
      removeSelectors: [],
    },

    {
      facetName: "ForgeDAOFacet",
      addSelectors: [
        "function setAavegotchiDaoAddress(address daoAddress) external",
        "function setGltrAddress(address gltr) external",
        "function getAlloyDaoFeeInBips() external view returns (uint256)",
        "function setAlloyDaoFeeInBips(uint256 alloyDaoFeeInBips) external",
        "function getAlloyBurnFeeInBips() external view returns (uint256)",
        "function setAlloyBurnFeeInBips(uint256 alloyBurnFeeInBips) external",
        "function setForgeAlloyCost (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
        "function setForgeEssenceCost (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
        "function setForgeTimeCostInBlocks (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
        "function setSkillPointsEarnedFromForge (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata points) external",
        // "function setGeodeWinChance (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata chances) external",
        // "function setGeodePrizes(uint256[] calldata ids, uint256[] calldata quantities) external",
        "function setSmeltingSkillPointReductionFactorBips(uint256 bips) external",
        "function pauseContract() external",
        "function unpauseContract() external",
        // "function setMaxSupplyPerToken(uint256[] calldata tokenIDs, uint256[] calldata supplyAmts) external"
      ],
      removeSelectors: [],
    },
    {
      facetName: "ForgeTokenFacet",
      addSelectors: [
        "function name() external pure returns (string memory)",
        "function symbol() external pure returns (string memory)",
        "function uri(uint256 _id) external view returns (string memory)",
        "function setBaseURI(string memory _value) external",
        "function totalSupply(uint256 id) public view virtual returns (uint256)",
        "function balanceOf(address account, uint256 id) public view returns (uint256)",
        "function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory)",
        "function balanceOfOwner(address account) public view returns (tuple(uint256 tokenId, uint256 balance)[] memory output_)",
        "function setApprovalForAll(address operator, bool approved) public",
        "function isApprovedForAll(address account, address operator) public view returns (bool)",
        "function safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes memory data) public",
        "function safeBatchTransferFrom(address from,address to,uint256[] memory ids,uint256[] memory amounts,bytes memory data) public",
        "function onERC1155Received(address,address,uint256,uint256,bytes memory) external",
        "function onERC1155BatchReceived(address,address,uint256[] memory,uint256[] memory,bytes memory) external returns (bytes4)",
      ],
      removeSelectors: [],
    },
    // {
    //     facetName: "ForgeVRFFacet",
    //     addSelectors: [
    //         "function areGeodePrizesAvailable() public view returns (bool)",
    //         "function openGeodes(uint256[] calldata _geodeTokenIds) external",
    //         "function changeVrf(uint256 _newFee,bytes32 _keyHash,address _vrfCoordinator,address _link) external"
    //     ],
    //     removeSelectors: [],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: diamond.address,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: true,
  };

  await run("deployUpgrade", args);

  return diamond.address;
}

if (require.main === module) {
  deployAndUpgradeForgeDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
