/* global ethers hre */

import { ethers, run } from "hardhat";
import { deployAndUpgradeWearableDiamond } from "./upgrades/upgrade-deployWearableDiamond";
import { getAllItemTypes, SleeveObject } from "./itemTypeHelpers";
import { itemTypes as allItemTypes } from "../data/itemTypes/itemTypes";
import { wearableSets } from "./wearableSets";
import { DAOFacet, ERC20MintableBurnable, SvgFacet } from "../typechain";
import { BigNumberish } from "@ethersproject/bignumber";
import { uploadSvgs } from "./svgHelperFunctions";
import { getWearables } from "../svgs/allWearables";
import { deployAndUpgradeForgeDiamond } from "./upgrades/forge/upgrade-deployAndUpgradeForgeDiamond";
import { setForgeProperties } from "./upgrades/forge/upgrade-forgeSetters";
import { aavegotchiSvgs as aavegotchiSideSvgs } from "../svgs/aavegotchi-side-typeScript";
import {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs,
} from "../svgs/eyeShapes-sidesOpt";
import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../svgs/wearables-sides";

const diamond = require("../js/diamond-util/src/index.js");

function addCommas(nStr) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? "." + x[1] : "";
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}

function strDisplay(str) {
  return addCommas(str.toString());
}

const txParams = {
  gasPrice: "2243367512"
}

const gasLimit = 12300000;

async function addAllowlist(account: string) {
  const abi = [
    "function setAdmin(address)",
    "function setEnabled(address)",
    "function setNone(address)",
  ];

  const contractAddress = "0x0200000000000000000000000000000000000002";

  const contract = new ethers.Contract(
    contractAddress,
    abi,
    ethers.provider.getSigner()
  );

  console.log(`Adding ${account} to allowlist...`);

  const tx = await contract.setEnabled(account, {
    gasLimit: 100000,
  });

  await tx.wait();

  console.log(`${account} added to allowlist.`);
}

async function deployFacets(...facets: any[]) {
  const instances = [];

  for (let facet of facets) {
    let constructorArgs = [];

    if (Array.isArray(facet)) {
      [facet, constructorArgs] = facet;
    }

    console.log(`Deploying ${facet}...`);
    const factory = await ethers.getContractFactory(facet);
    const facetInstance = await factory.deploy(...constructorArgs);
    await facetInstance.deployed();
    console.log(`${facet} deployed:`, facetInstance.address);

    await addAllowlist(facetInstance.address);

    instances.push(facetInstance);
  }

  return instances;
}

async function getFacetsAsAavegotchiDiamond(aavegotchiDiamond: any) {
  const daoFacet = await ethers.getContractAt("DAOFacet", aavegotchiDiamond.address);
  const aavegotchiGameFacet = await ethers.getContractAt("AavegotchiGameFacet", aavegotchiDiamond.address);
  const erc1155MarketplaceFacet = await ethers.getContractAt("ERC1155MarketplaceFacet", aavegotchiDiamond.address);
  const erc721MarketplaceFacet = await ethers.getContractAt("ERC721MarketplaceFacet", aavegotchiDiamond.address);
  const peripheryFacet = await ethers.getContractAt("PeripheryFacet", aavegotchiDiamond.address);
  const shopFacet = await ethers.getContractAt("ShopFacet", aavegotchiDiamond.address);
  const itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchiDiamond.address);
  const aavegotchiFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchiDiamond.address);
  const polygonXGotchichainBridgeFacet = await ethers.getContractAt("PolygonXGotchichainBridgeFacet", aavegotchiDiamond.address);
  const vrfFacet = await ethers.getContractAt("VrfFacet", aavegotchiDiamond.address);
  const svgFacet = await ethers.getContractAt("SvgFacet", aavegotchiDiamond.address);

  return {
    daoFacet,
    aavegotchiGameFacet,
    erc1155MarketplaceFacet,
    erc721MarketplaceFacet,
    peripheryFacet,
    shopFacet,
    itemsFacet,
    aavegotchiFacet,
    polygonXGotchichainBridgeFacet,
    vrfFacet,
    svgFacet,
  };
}

export default async function main() {
  const ghstDiamondAddress = "0x0000000000000000000000000000000000001010";
  const ghstStakingDiamondAddress = ethers.constants.AddressZero; //todo
  const realmDiamondAddress = ethers.constants.AddressZero; //todo
  const installationDiamondAddress = ethers.constants.AddressZero; //todo
  const tileDiamondAddress = ethers.constants.AddressZero; //todo
  const fakeGotchiArtDiamondAddress = ethers.constants.AddressZero; //todo
  const fakeGotchiCardDiamondAddress = ethers.constants.AddressZero; //todo

  const name = "Aavegotchi";
  const symbol = "GOTCHI";

  const childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6"; // todo
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"; // todo
  const vrfCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9"; // todo
  const keyHash = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4"; // todo
  const fee = ethers.utils.parseEther("0.0001");

  const accounts = await ethers.getSigners();
  const ownerAddress = await accounts[0].getAddress();
  console.log("Owner: " + ownerAddress);

  const dao = ownerAddress; // 'todo'
  const daoTreasury = ownerAddress;
  const rarityFarming = ownerAddress; // 'todo'
  const pixelCraft = ownerAddress; // 'todo'
  const itemManagers = [ownerAddress]; // 'todo'

  let totalGasUsed = ethers.BigNumber.from("0");
  let tx;
  let receipt;

  let [
    diamondCutFacet,
    diamondLoupeFacet,
    ownershipFacet,
    bridgeFacet,
    polygonXGotchichainBridgeFacet,
    aavegotchiFacet,
    aavegotchiGameFacet,
    svgFacet,
    itemsFacet,
    itemsTransferFacet,
    collateralFacet,
    daoFacet,
    vrfFacet,
    shopFacet,
    metaTransactionsFacet,
    erc1155MarketplaceFacet,
    erc721MarketplaceFacet,
    escrowFacet,
    gotchiLendingFacet,
    lendingGetterAndSetterFacet,
    marketplaceGetterFacet,
    svgViewsFacet,
    wearableSetsFacet,
    whitelistFacet,
    peripheryFacet,
    merkleDropFacet,
  ] = await deployFacets(
    "DiamondCutFacet",
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
    "contracts/Aavegotchi/facets/PolygonXGotchichainBridgeFacet.sol:PolygonXGotchichainBridgeFacet",
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "AavegotchiGameFacet",
    "SvgFacet",
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    "ItemsTransferFacet",
    "CollateralFacet",
    "DAOFacet",
    "VrfFacet",
    "ShopFacet",
    "MetaTransactionsFacet",
    "ERC1155MarketplaceFacet",
    "ERC721MarketplaceFacet",
    "EscrowFacet",
    "GotchiLendingFacet",
    "LendingGetterAndSetterFacet",
    "MarketplaceGetterFacet",
    "SvgViewsFacet",
    "WearableSetsFacet",
    "WhitelistFacet",
    "PeripheryFacet",
    "MerkleDropFacet"
  );

  // eslint-disable-next-line no-unused-vars
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: "AavegotchiDiamond",
    initDiamond: "contracts/Aavegotchi/InitDiamond.sol:InitDiamond",
    facets: [
      ["BridgeFacet", bridgeFacet],
      ["PolygonXGotchichainBridgeFacet", polygonXGotchichainBridgeFacet],
      ["AavegotchiFacet", aavegotchiFacet],
      ["AavegotchiGameFacet", aavegotchiGameFacet],
      ["SvgFacet", svgFacet],
      ["ItemsFacet", itemsFacet],
      ["ItemsTransferFacet", itemsTransferFacet],
      ["CollateralFacet", collateralFacet],
      ["DAOFacet", daoFacet],
      ["VrfFacet", vrfFacet],
      ["ShopFacet", shopFacet],
      ["MetaTransactionsFacet", metaTransactionsFacet],
      ["ERC1155MarketplaceFacet", erc1155MarketplaceFacet],
      ["ERC721MarketplaceFacet", erc721MarketplaceFacet],
      ["EscrowFacet", escrowFacet],
      ["GotchiLendingFacet", gotchiLendingFacet],
      ["LendingGetterAndSetterFacet", lendingGetterAndSetterFacet],
      ["MarketplaceGetterFacet", marketplaceGetterFacet],
      ["SvgViewsFacet", svgViewsFacet],
      ["WearableSetsFacet", wearableSetsFacet],
      ["WhitelistFacet", whitelistFacet],
      ["PeripheryFacet", peripheryFacet],
      ["MerkleDropFacet", merkleDropFacet],
    ],
    diamondConstructorFacets: [
      diamondCutFacet.address,
      diamondLoupeFacet.address,
      ownershipFacet.address,
    ],
    owner: ownerAddress,
    args: [
      [
        dao,
        daoTreasury,
        rarityFarming,
        pixelCraft,
        ghstDiamondAddress,
        keyHash,
        fee,
        vrfCoordinator,
        linkAddress,
        childChainManager,
        name,
        symbol,
      ],
    ],
  });
  
  await addAllowlist(aavegotchiDiamond.address);

  // Get facets
  const {
    daoFacet: daoFacetDiamond,
    aavegotchiGameFacet: aavegotchiGameFacetDiamond,
    erc1155MarketplaceFacet: erc1155MarketplaceFacetDiamond,
    erc721MarketplaceFacet: erc721MarketplaceFacetDiamond,
    peripheryFacet: peripheryFacetDiamond,
    shopFacet: shopFacetDiamond,
    itemsFacet: itemsFacetDiamond,
    aavegotchiFacet: aavegotchiFacetDiamond,
    polygonXGotchichainBridgeFacet: polygonXGotchichainBridgeFacetDiamond,
    vrfFacet: vrfFacetDiamond,
    svgFacet: svgFacetDiamond,
  } = await getFacetsAsAavegotchiDiamond(aavegotchiDiamond);

  // Add item managers
  console.log("Adding item managers...");
  tx = await daoFacetDiamond.addItemManagers(itemManagers, { gasLimit: gasLimit });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);

  // Create new haunt and upload payloads
  console.log("Creating new haunt and uploading payloads...")
  const initialHauntSize = "10000";
  const portalPrice = ethers.utils.parseEther("100");
  tx = await daoFacetDiamond.createHaunt(initialHauntSize, portalPrice, "0x000000", { gasLimit: gasLimit });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);

  // Add collateral info for haunt
  console.log("Adding Collateral Types...");
  const { getCollaterals } = require("./testCollateralTypes.js");
  tx = await daoFacetDiamond.addCollateralTypes(1, getCollaterals(hre.network.name, ghstDiamondAddress), { gasLimit: gasLimit });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);

  // Deploy wearable diamond and set to aavegotchi diamond
  console.log("Deploying wearable diamond and set to aavegotchi diamond...")
  const wearableDiamondAddress = await deployAndUpgradeWearableDiamond(
    diamondCutFacet.address,
    diamondLoupeFacet.address,
    ownershipFacet.address,
    aavegotchiDiamond.address
  );

  await addAllowlist(wearableDiamondAddress);

  console.log("Setting wearable diamond address for periphery...");
  tx = await peripheryFacetDiamond.setPeriphery(wearableDiamondAddress);
  await tx.wait();
  console.log("Done. Tx:", tx.hash);

  // Add item types
  console.log("Adding Item Types...");
  const itemTypes = getAllItemTypes(allItemTypes, hre.ethers);

  let step = 20;
  let sliceStep = itemTypes.length / step;

  for (let i = 0; i < step; i++) {
    console.log(`Adding Item Types (${i + 1} / ${step})...`);

    tx = await daoFacet.addItemTypes(
      itemTypes.slice(sliceStep * i, sliceStep * (i + 1)),
      { gasLimit: gasLimit }
    );

    await tx.wait();
    console.log("Done. Tx:", tx.hash);
  }

  // Add wearable types sets
  console.log("Adding Wearable Sets...");
  step = 20;
  sliceStep = wearableSets.length / step;

  for (let i = 0; i < step; i++) {
    console.log(`Adding Wearable Sets (${i + 1} / ${step})`);

    tx = await daoFacet.addWearableSets(
      wearableSets.slice(sliceStep * i, sliceStep * (i + 1)),
      { gasLimit: gasLimit }
    );

    await tx.wait();
    console.log("Done. Tx:", tx.hash);
  }

  // Forge
  console.log("Deploying Forge diamond...")

  let forgeDiamondAddress = await deployAndUpgradeForgeDiamond(
    diamondCutFacet.address,
    diamondLoupeFacet.address,
    ownershipFacet.address,
    aavegotchiDiamond.address,
    wearableDiamondAddress
  );

  await addAllowlist(forgeDiamondAddress);

  await setForgeProperties(forgeDiamondAddress);

  tx = await daoFacet.setForge(forgeDiamondAddress, { gasLimit: gasLimit });
  await tx.wait();
  console.log("Forge diamond deployed and set. Tx:", tx.hash);

  // Adding erc721 and 1155 categories
  console.log("Adding ERC721 categories...");
  const erc721Categories = [
    {
      erc721TokenAddress: realmDiamondAddress,
      category: 4,
    },
    {
      erc721TokenAddress: fakeGotchiArtDiamondAddress,
      category: 5,
    },
  ];

  tx = await erc721MarketplaceFacet.setERC721Categories(erc721Categories, {
    gasLimit: gasLimit,
  });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);
    
  console.log("Adding ERC1155 categories...");
  
  const erc1155Categories = [];
  for (let i = 0; i < 6; i++) {
    erc1155Categories.push({
      erc1155TokenAddress: ghstStakingDiamondAddress,
      erc1155TypeId: i,
      category: 3,
    });
  }

  [
    1, 141, 142, 143, 144, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155,
    156,
  ].forEach((id) => {
    erc1155Categories.push({
      erc1155TokenAddress: installationDiamondAddress,
      erc1155TypeId: id,
      category: 4,
    });
  });
  
  Array.from({ length: 31 }, (_, index) => index + 1).forEach((id) => {
    erc1155Categories.push({
      erc1155TokenAddress: tileDiamondAddress,
      erc1155TypeId: id,
      category: 5,
    });
  });
  
  erc1155Categories.push({
    erc1155TokenAddress: fakeGotchiCardDiamondAddress,
    erc1155TypeId: 0,
    category: 6,
  });

  const offset = 1_000_000_000;
  const alloyCategory = 7;
  const geodesCategory = 9;
  const essenceCategory = 10;
  const coresCategory = 11;
  const alloyIds = [offset];
  const essenceIds = [offset + 1];
  
  const geodeIds = []; //[offset + 2, offset +3, offset+4, offset+5, offset+6, offset+7];
  for (let i = offset + 2; i < offset + 8; i++) {
    geodeIds.push(i);
  }

  const coreIds = [];
  for (let i = offset + 8; i < offset + 44; i++) {
    coreIds.push(i);
  }

  const forgeFinalArray = [
    [alloyCategory, alloyIds],
    [geodesCategory, geodeIds],
    [essenceCategory, essenceIds],
    [coresCategory, coreIds],
  ];

  forgeFinalArray.forEach((el) => {
    const category = el[0];
    const toAdd = el[1] as number[];

    for (let index = 0; index < toAdd.length; index++) {
      erc1155Categories.push({
        erc1155TokenAddress: forgeDiamondAddress,
        erc1155TypeId: toAdd[index],
        category: category,
      });
    }
  });

  tx = await erc1155MarketplaceFacet.setERC1155Categories(erc1155Categories, {
    gasLimit: gasLimit,
  });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);

  // Setting Realm address
  console.log("Setting Realm address...")
  tx = await aavegotchiGameFacet.setRealmAddress(realmDiamondAddress, {
    gasLimit: gasLimit,
  });
  await tx.wait();
  console.log("Done. Tx:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
