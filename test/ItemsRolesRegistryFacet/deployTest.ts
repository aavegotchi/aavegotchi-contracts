import { diamondOwner } from "../../scripts/helperFunctions";
import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";
import { InitItemsRolesRegistryFacet__factory, OwnershipFacet } from "../../typechain";
import { InitItemsRolesRegistryFacetInterface } from "../../typechain/InitItemsRolesRegistryFacet";
import { aavegotchiDiamondAddress, diamondUpgrader , } from "./helpers";
import { ethers, run } from "hardhat";
const owner = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

export async function deployItemsRolesRegistryFacet() {



  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [
        "function commitTokens(address _grantor, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) external returns (uint256 commitmentId_)",
        "function grantRole(uint256 _commitmentId,bytes32 _role,address _grantee,uint64 _expirationDate,bool _revocable,bytes calldata _data) external",
        "function revokeRole(uint256 _commitmentId, bytes32 _role, address _grantee) external",
        "function releaseTokens(uint256 _commitmentId) external",
        "function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external",
        "function grantorOf(uint256 _commitmentId) external view returns (address grantor_)",
        "function tokenAddressOf(uint256 _commitmentId) external view returns (address tokenAddress_)",
        "function tokenIdOf(uint256 _commitmentId) external view returns (uint256 tokenId_)",
        "function tokenAmountOf(uint256 _commitmentId) external view returns (uint256 tokenAmount_)",
        "function roleData(uint256 _commitmentId, bytes32 _role, address _grantee) external view returns (bytes memory data_)",
        "function roleExpirationDate(uint256 _commitmentId, bytes32 _role, address _grantee) external view returns (uint64 expirationDate_)",
        "function isRoleRevocable(uint256 _commitmentId, bytes32 _role, address _grantee) external view returns (bool revocable_)",
        "function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) external view returns (bool isApproved_)",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/init/InitItemsRolesRegistryFacet.sol:InitItemsRolesRegistryFacet",
      addSelectors: [
        "function init() external",
      ],
      removeSelectors: [],
    },
  ];

  let iface: InitItemsRolesRegistryFacetInterface = new ethers.utils.Interface(
    InitItemsRolesRegistryFacet__factory.abi
  ) as InitItemsRolesRegistryFacetInterface;
  //@ts-ignore
  const payload = iface.encodeFunctionData("init", []);
  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: true,
    initAddress: aavegotchiDiamondAddress,
    initCalldata: payload,
  };



  await run("deployUpgrade", args);

  await removeInitItemsRolesRegistryFacet();
}

async function removeInitItemsRolesRegistryFacet() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/init/InitItemsRolesRegistryFacet.sol:InitItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [
        "function init() external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}

export async function upgradeItemsFacet() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [
        "function equipDelegatedWearables(uint256 _tokenId,uint16[16] calldata _wearablesToEquip,uint256[16] calldata _commitmentIds) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    }, 
    {
      facetName: 'contracts/Aavegotchi/facets/ERC721MarketplaceFacet.sol:ERC721MarketplaceFacet',
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}

export async function upgradeItemsRolesRegistryFacet() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  //@ts-ignore
  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}

export async function upgradeItemsFacetOnly() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  //@ts-ignore
  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}

export async function RolesRegistryUnlistedBazaarTest() {
  
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  //@ts-ignore
  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}