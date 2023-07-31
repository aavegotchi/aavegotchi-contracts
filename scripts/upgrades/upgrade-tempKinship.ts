import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { AavegotchiFacet__factory } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";
export const tokenIds = [
  "17810",
  "1808",
  "6735",
  "15612",
  "20228",
  "6459",
  "15037",
  "22599",
  "17960",
  "6827",
  "23007",
  "6036",
  "10852",
  "1246",
  "2567",
  "21485",
  "11478",
  "18248",
  "7200",
  "6939",
  "9286",
  "12765",
  "8823",
  "13212",
  "23816",
  "12920",
  "11290",
  "19810",
  "20100",
  "2851",
  "24420",
  "13420",
  "1485",
  "8061",
  "4996",
  "4344",
  "7178",
  "10708",
  "13226",
  "16695",
  "20829",
  "3736",
  "22661",
  "11014",
  "5036",
  "2890",
  "19313",
  "13979",
  "6854",
  "24870",
  "24686",
  "17542",
  "17701",
  "21403",
  "9892",
  "1246",
  "7246",
  "12551",
  "12501",
  "20021",
  "5390",
  "15237",
  "24589",
  "9639",
  "20913",
  "5247",
  "4701",
  "6538",
  "7973",
  "10715",
  "4471",
  "19608",
  "7458",
  "22271",
  "23986",
  "23470",
  "10244",
  "16650",
  "4232",
  "20924",
  "8470",
  "93",
  "1838",
  "14753",
  "22462",
  "23133",
  "14814",
  "16664",
  "16785",
  "11030",
  "20248",
  "4481",
  "18091",
  "13580",
  "10800",
  "9862",
  "12467",
  "16012",
  "10268",
  "5877",
];

export const tokenIds2 = ["4230", "8588", "6853", "2290"];

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [
        "function tempBuffKinship(uint256[] calldata _tokenIds) external",
      ],
      removeSelectors: [],
    },
  ];

  const facetsRemove: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [
        "function tempBuffKinship(uint256[] calldata _tokenIds) external",
      ],
    },
  ];
  let iface = new ethers.utils.Interface(AavegotchiFacet__factory.abi);
  const joined = convertFacetAndSelectorsToString(facets);
  const payload = iface.encodeFunctionData("tempBuffKinship", [tokenIds2]);
  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: payload,
  };

  console.log("Adding tempBuffKinship function and executing !");

  await run("deployUpgrade", args);

  console.log("Removing tempBuffKinship function !");

  const joinedRemove = convertFacetAndSelectorsToString(facetsRemove);
  //update relevant args for removal
  args.facetsAndAddSelectors = joinedRemove;
  args.initCalldata = "0x";
  args.initAddress = ethers.constants.AddressZero;
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
