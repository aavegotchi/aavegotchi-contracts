import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";
import { InitItemsRolesRegistryFacet__factory } from "../../typechain";
import { InitItemsRolesRegistryFacetInterface } from "../../typechain/InitItemsRolesRegistryFacet";
import { ethers, run } from "hardhat";

const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

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
    diamondUpgrader: diamondUpgrader,
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
    diamondUpgrader: diamondUpgrader,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}


async function main() {
  await deployItemsRolesRegistryFacet()
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main