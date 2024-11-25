/* global ethers hre */

import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

import {
  getItemTypes,
  ItemTypeInputNew,
  SleeveObject,
  toItemTypeInputNew,
} from "./itemTypeHelpers";
import { itemTypes as allItemTypes } from "../data/itemTypes/itemTypes";
import { wearableSetArrays } from "./wearableSets";

import {
  AavegotchiGameFacet,
  SvgFacet,
  DAOFacet,
  ERC721MarketplaceFacet,
  ERC1155MarketplaceFacet,
} from "../typechain";
import { BigNumberish, BigNumber } from "@ethersproject/bignumber";
import { uploadSvgs } from "./svgHelperFunctions";
import { getWearables } from "../svgs/allWearables";
import { closedPortals, openedPortals } from "../svgs/portals";

import { setForgeProperties } from "./upgrades/forge/upgrade-forgeSetters";
import { aavegotchiSvgs as aavegotchiSideSvgs } from "../svgs/aavegotchi-side-typeScript";

import {
  eyeShapesLeftSvgs,
  eyeShapesRightSvgs,
} from "../svgs/eyeShapes-sidesOpt";

import {
  eyeShapesLeftSvgs as eyeShapesH2LeftSvgs,
  eyeShapesRightSvgs as eyeShapesH2RightSvgs,
} from "../svgs/eyeShapesH2-sidesOpt";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../svgs/wearables-sides";

import { aavegotchiSvgs } from "../svgs/aavegotchi-typescript";
import { allSideViewDimensions } from "../svgs/sideViewDimensions";
import { convertSideDimensionsToTaskFormat } from "../tasks/updateItemSideDimensions";
import { allExceptions } from "../svgs/allExceptions";
import { convertExceptionsToTaskFormat } from "../tasks/updateWearableExceptions";
import { xpRelayerAddress } from "./helperFunctions";

import { deploy, deployWithoutInit } from "../js/diamond-util/src";

import { getCollaterals } from "../data/airdrops/collaterals/collateralTypes";
import { getCollaterals as getCollateralsHaunt2 } from "../data/airdrops/collaterals/collateralTypesHaunt2";
import { networkAddresses } from "../helpers/constants";

// Import fs and path for file operations
import * as os from "os";
import { Contract } from "ethers";

// Define the interface for the deployment configuration
export interface DeploymentConfig {
  chainId: number;
  aavegotchiDiamond: string | undefined;
  wearableDiamond: string | undefined;
  forgeDiamond: string | undefined;
  haunts: Record<number, boolean>;
  itemTypes: Record<number, boolean>;
  wearableSetsAdded: boolean;
  sideViewDimensionsAdded: boolean;
  sideViewExceptionsAdded: boolean;
  forgePropertiesSet: boolean;
  forgeDiamondSet: boolean;
  svgsUploaded: {
    [key: string]: {
      [id: string]: boolean;
    };
  };
  erc721CategoriesAdded: boolean;
  erc1155CategoriesAdded: boolean;
  realmAddressSet: boolean;
  wearableSets: Record<string, boolean>;
  sideViewDimensions: Record<string, string>;
  sideViewExceptions: Record<string, boolean>;
  [key: string]: any; //other addresses
  itemManagers: string[] | undefined;
}

// Define the path to the deployment configuration file
const CONFIG_PATH = path.join(__dirname, "../deployment-config.json");

// Load the deployment configuration specific to the current chainId
function loadDeploymentConfig(
  chainId: number,
  useFreshDeploy: boolean = false
): DeploymentConfig {
  if (useFreshDeploy) {
    return {
      chainId: chainId,
      aavegotchiDiamond: undefined,
      wearableDiamond: undefined,
      forgeDiamond: undefined,
      haunts: {},
      itemTypes: {},
      wearableSets: {},
      sideViewDimensions: {},
      sideViewExceptions: {},
      forgePropertiesSet: false,
      forgeDiamondSet: false,
      wearableSetsAdded: false,
      sideViewDimensionsAdded: false,
      sideViewExceptionsAdded: false,
      svgsUploaded: {},
      erc721CategoriesAdded: false,
      erc1155CategoriesAdded: false,
      realmAddressSet: false,
      itemManagers: undefined,
    };
  }

  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf8");
    const allConfigs = JSON.parse(data);
    console.log("Loading deployment config for chainId", chainId);
    return allConfigs[chainId] || { chainId };
  } catch (error) {
    console.log("No existing deployment config found for chainId", chainId);
    return {
      chainId: chainId,
      aavegotchiDiamond: undefined,
      wearableDiamond: undefined,
      forgeDiamond: undefined,
      haunts: {},
      itemTypes: {},
      wearableSets: {},
      sideViewDimensions: {},
      sideViewExceptions: {},
      itemManagers: undefined,
      erc721CategoriesAdded: false,
      erc1155CategoriesAdded: false,
      realmAddressSet: false,
      svgsUploaded: {},
      sideViewDimensionsAdded: false,
      sideViewExceptionsAdded: false,
      forgePropertiesSet: false,
      forgeDiamondSet: false,
      wearableSetsAdded: false,
    };
  }
}

// Save the deployment configuration specific to the current chainId
function saveDeploymentConfig(config: DeploymentConfig) {
  let allConfigs: Record<number, DeploymentConfig> = {};
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf8");
    allConfigs = JSON.parse(data);
  } catch (error) {
    // No existing configs; start fresh
  }
  allConfigs[config.chainId] = config;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(allConfigs, null, 2) + os.EOL);
}

function addCommas(nStr: any) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? "." + x[1] : "";
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}

function strDisplay(str: any) {
  return addCommas(str.toString());
}

async function deployForgeDiamond(
  ownerAddress: string,
  aavegotchiDiamondAddress: string,
  wearableDiamondAddress: string
) {
  // Deploy forge facets

  const forgeDiamond = await deployWithoutInit({
    diamondName: "ForgeDiamond",
    facetNames: [
      "ForgeFacet",
      "ForgeTokenFacet",
      "ForgeVRFFacet",
      "ForgeDAOFacet",
    ],
    args: [ownerAddress, aavegotchiDiamondAddress, wearableDiamondAddress],
  });

  return forgeDiamond;
}

async function createHauntWithCollaterals(
  hauntId: number,
  daoFacet: DAOFacet,
  initialHauntSize: string,
  portalPrice: BigNumberish,
  collaterals: any[],
  totalGasUsed: BigNumber
) {
  let tx = await daoFacet.createHaunt(
    initialHauntSize,
    portalPrice,
    "0x000000"
  );

  let receipt = await tx.wait();
  console.log("Haunt created:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // Add collateral info for haunt
  console.log("Adding Collateral Types", collaterals);

  tx = await daoFacet.addCollateralTypes(hauntId, collaterals);
  receipt = await tx.wait();
  console.log("Add Collateral Types gas used::" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);
}

async function addItemTypes(
  daoFacet: DAOFacet,
  totalGasUsed: BigNumber,
  deploymentConfig: DeploymentConfig
) {
  // Initialize itemTypes in config if not exists
  deploymentConfig.itemTypes = deploymentConfig.itemTypes || {};

  console.log("Adding item types");

  // Add item types
  const itemTypes2: ItemTypeInputNew[] = [];
  for (let i = 0; i < allItemTypes.length; i++) {
    // Skip if this item type is already added
    if (deploymentConfig.itemTypes[Number(allItemTypes[i].svgId)]) {
      console.log(`Item type ${allItemTypes[i].svgId} already added, skipping`);
      continue;
    }
    itemTypes2.push(toItemTypeInputNew(allItemTypes[i]));
  }

  if (itemTypes2.length === 0) {
    console.log("All item types already added.");
    return;
  }

  const itemTypes = getItemTypes(itemTypes2, ethers);
  console.log("Adding", itemTypes2.length, "Item Types");
  const batchSize = 20;
  const totalItems = itemTypes.length;
  const totalBatches = Math.ceil(totalItems / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = batchSize * i;
    const end = start + batchSize;
    const batch = itemTypes.slice(start, end);

    const tx = await daoFacet.addItemTypes(batch);
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

    // Mark these items as added in the config
    batch.forEach((item, index) => {
      const originalItem = itemTypes2[start + index];
      deploymentConfig.itemTypes![Number(originalItem.svgId)] = true;
    });

    // Save after each batch
    saveDeploymentConfig(deploymentConfig);

    console.log(
      `Adding Item Types Batch ${
        i + 1
      } of ${totalBatches}, gas used:: ${strDisplay(receipt.gasUsed)}`
    );
    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }
  console.log("Finished adding itemTypes");
}

async function addWearableSets(
  daoFacet: DAOFacet,
  totalGasUsed: BigNumber,
  deploymentConfig: DeploymentConfig
) {
  // Initialize wearableSets in config if not exists
  deploymentConfig.wearableSets = deploymentConfig.wearableSets || {};

  // Filter only unprocessed wearable sets
  const setsToAdd = wearableSetArrays.filter(
    (set) => !deploymentConfig.wearableSets![set.name]
  );

  if (setsToAdd.length === 0) {
    console.log("All wearable sets already added.");
    return;
  }

  // Add wearable sets in batches
  console.log("Adding", setsToAdd.length, "Wearable Sets");
  const batchSize = 50;
  const totalBatches = Math.ceil(setsToAdd.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = batchSize * i;
    const end = start + batchSize;
    const batch = setsToAdd.slice(start, end);

    const tx = await daoFacet.addWearableSets(batch);
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

    // Mark these sets as added in the config
    batch.forEach((set) => {
      deploymentConfig.wearableSets![set.name] = true;
    });

    // Save after each batch
    saveDeploymentConfig(deploymentConfig);

    console.log(
      `Adding Wearable Sets Batch ${
        i + 1
      } of ${totalBatches}, gas used:: ${strDisplay(receipt.gasUsed)}`
    );
    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }
}

async function addSideViewDimensions(
  aavegotchiDiamondAddress: string,
  deploymentConfig: DeploymentConfig
) {
  // Initialize sideViewDimensions in config if not exists
  deploymentConfig.sideViewDimensions =
    deploymentConfig.sideViewDimensions || {};

  // Filter only unprocessed dimensions
  const dimensionsToAdd = allSideViewDimensions.filter(
    (dim) => !deploymentConfig.sideViewDimensions![Number(dim.itemId)]
  );

  if (dimensionsToAdd.length === 0) {
    console.log("All side view dimensions already added.");
    return;
  }

  // Add side view dimensions in batches
  const batchSize = 200;
  console.log("adding", dimensionsToAdd.length, "sideviews");
  const totalBatches = Math.ceil(dimensionsToAdd.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = batchSize * i;
    const end = Math.min(start + batchSize, dimensionsToAdd.length);
    const batch = dimensionsToAdd.slice(start, end);

    console.log(`Adding Sideview Dimensions (${i + 1} / ${totalBatches})`);
    await run(
      "updateItemSideDimensions",
      convertSideDimensionsToTaskFormat(batch, aavegotchiDiamondAddress)
    );

    // Mark these dimensions as added in the config
    batch.forEach((dim) => {
      deploymentConfig.sideViewDimensions![
        Number(dim.itemId)
      ] = `${dim.dimensions.x}_${dim.dimensions.y}`;
    });

    // Save after each batch
    saveDeploymentConfig(deploymentConfig);
  }
}

async function addSideviewExceptions(
  aavegotchiDiamondAddress: string,
  deploymentConfig: DeploymentConfig
) {
  // Initialize sideViewExceptions in config if not exists
  deploymentConfig.sideViewExceptions =
    deploymentConfig.sideViewExceptions || {};

  // Filter only unprocessed exceptions
  const exceptionsToAdd = allExceptions.filter(
    (exception) =>
      !deploymentConfig.sideViewExceptions![
        `${exception.slotPosition}_${exception.itemId}`
      ]
  );

  if (exceptionsToAdd.length === 0) {
    console.log("All side view exceptions already added.");
    return;
  }

  // Add side view exceptions in batches
  const batchSize = 100;
  console.log("adding", exceptionsToAdd.length, "exceptions");
  const totalBatches = Math.ceil(exceptionsToAdd.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = batchSize * i;
    const end = Math.min(start + batchSize, exceptionsToAdd.length);
    const batch = exceptionsToAdd.slice(start, end);

    console.log(`Adding Sideview Exceptions (${i + 1} / ${totalBatches})`);
    await run(
      "updateWearableExceptions",
      convertExceptionsToTaskFormat(batch, aavegotchiDiamondAddress)
    );

    // Mark these exceptions as added in the config
    batch.forEach((exception) => {
      deploymentConfig.sideViewExceptions![
        `${exception.slotPosition}_${exception.itemId}`
      ] = true;
    });

    // Save after each batch
    saveDeploymentConfig(deploymentConfig);
  }
}

async function uploadAllSvgs(
  svgFacet: SvgFacet,
  totalGasUsed: BigNumber,
  deploymentConfig: DeploymentConfig
) {
  console.log("Upload SVGs");

  const { eyeShapeSvgs } = require("../svgs/eyeShapes.js");
  const { eyeShapeSvgs: eyeShapeH2Svgs } = require("../svgs/eyeShapesH2.js");

  const collateralsSvgs = [
    '<g class="gotchi-collateral"><path d="M36 15v-1h-1v-1h-1v-1h-4v1h-1v1h-1v1h-1v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4h-1z" fill="#ac15f9"/><path d="M33 21h-3v1h4v-1h-1z" fill="#7e18f8"/><path d="M35 14v-1h-1v-1h-4v1h-1v1h-1v1h8v-1h-1z" fill="#fa34f3"/><path d="M36 15h-9v2h10v-2h-1z" fill="#cf15f9"/><path d="M35 19h-7v1h1v1h6v-1h1v-1h-1z" fill="#8f17f9"/></g>',
  ];
  const collateralsLeftSvgs = [
    '<g class="gotchi-collateral"><path d="M23 15v-1h-2v7h1v-1h1v-1h1v-4z" fill="#7e18f8"/></g>',
  ];
  const collateralsRightSvgs = [
    '<g class="gotchi-collateral"><path d="M41 14v1h-1v4h1v1h1v1h1v-7z" fill="#7e18f8"/></g>',
  ];
  const collateralsBackSvgs = [""];

  deploymentConfig.svgsUploaded = deploymentConfig.svgsUploaded || {};

  const { sleeves, wearables } = getWearables();
  const sleeveSvgsArray: SleeveObject[] = sleeves;

  const svgGroups = {
    "portal-open": openedPortals,
    "portal-closed": closedPortals,
    aavegotchi: aavegotchiSvgs,
    collaterals: collateralsSvgs,

    eyeShapes: eyeShapeSvgs,
    "aavegotchi-left": aavegotchiSideSvgs.left,
    "aavegotchi-right": aavegotchiSideSvgs.right,
    "aavegotchi-back": aavegotchiSideSvgs.back,
    "collaterals-left": collateralsLeftSvgs,
    "collaterals-right": collateralsRightSvgs,
    "collaterals-back": collateralsBackSvgs,
    "eyeShapes-left": eyeShapesLeftSvgs,
    "eyeShapes-right": eyeShapesRightSvgs,
    "eyeShapes-back": eyeShapesLeftSvgs.map(() => ``),
    eyeShapesH2: eyeShapeH2Svgs,
    "eyeShapesH2-left": eyeShapesH2LeftSvgs,
    "eyeShapesH2-right": eyeShapesH2RightSvgs,
    "eyeShapesH2-back": eyeShapesH2RightSvgs.map(() => ``),
    wearables: wearables,
    sleeves: sleeveSvgsArray.map((value) => value.svg),
    "wearables-left": wearablesLeftSvgs,
    "wearables-right": wearablesRightSvgs,
    "wearables-back": wearablesBackSvgs,
    "sleeves-left": wearablesLeftSleeveSvgs,
    "sleeves-right": wearablesRightSleeveSvgs,
    "sleeves-back": wearablesBackSleeveSvgs,
  };

  for (const svgGroup of Object.entries(svgGroups)) {
    const svg = svgGroup[1];
    const svgType = svgGroup[0];

    await uploadSvgs(svgFacet, svg, svgType, ethers, deploymentConfig);
  }

  console.log("Upload Done");

  interface SleeveInput {
    sleeveId: BigNumberish;
    wearableId: BigNumberish;
  }
  let sleevesSvgId = 0;
  const sleevesInput: SleeveInput[] = [];
  for (const sleeve of sleeveSvgsArray) {
    sleevesInput.push({
      sleeveId: sleevesSvgId,
      wearableId: sleeve.id,
    });
    sleevesSvgId++;
  }

  console.log("Associating sleeves svgs with body wearable svgs.");
  const tx = await svgFacet.setSleeves(sleevesInput);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Sleeves associating gas used::" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);
}

async function addERC721Categories(
  erc721MarketplaceFacet: ERC721MarketplaceFacet,
  totalGasUsed: BigNumber,
  realmDiamondAddress: string,
  fakeGotchiArtDiamondAddress: string
) {
  console.log("Adding ERC721 categories");
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
  const tx = await erc721MarketplaceFacet.setERC721Categories(erc721Categories);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log(
    "Adding ERC721 categories gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);
}

async function addERC1155Categories(
  erc1155MarketplaceFacet: ERC1155MarketplaceFacet,
  totalGasUsed: BigNumber,
  ghstStakingDiamondAddress: string,
  installationDiamondAddress: string,
  tileDiamondAddress: string,
  forgeDiamondAddress: string,
  fakeGotchiCardDiamondAddress: string
) {
  console.log("Adding ERC1155 categories");
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
  const geodeIds = [];
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

  const tx = await erc1155MarketplaceFacet.setERC1155Categories(
    erc1155Categories
  );
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log(
    "Adding ERC1155 categories gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);
}

async function setRealmAddress(
  aavegotchiGameFacet: AavegotchiGameFacet,
  totalGasUsed: BigNumber,
  realmDiamondAddress: string
) {
  const tx = await aavegotchiGameFacet.setRealmAddress(realmDiamondAddress);
  const receipt = await tx.wait();
  console.log("Realm diamond set:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);
}

export async function deployFullDiamond(useFreshDeploy: boolean = false) {
  if (
    !["hardhat", "localhost", "amoy", "polter", "base-sepolia"].includes(
      network.name
    )
  ) {
    throw Error("No network settings for " + network.name);
  }

  // Get deployed wGHST address
  let chainId = network.config.chainId as number;

  if (network.name === "polter") {
    chainId = 631571;
  }

  // Load existing deployment configuration
  const deploymentConfig = loadDeploymentConfig(chainId, useFreshDeploy);

  if (deploymentConfig.chainId === undefined) {
    deploymentConfig.chainId = chainId;
  }

  // Variables (Update based on your network configurations)
  const ghstStakingDiamondAddress =
    deploymentConfig.ghstStakingDiamondAddress ||
    "0xae83d5fc564Ef58224e934ba4Df72a100d5082a0";
  const realmDiamondAddress =
    deploymentConfig.realmDiamondAddress ||
    "0x5a4faEb79951bAAa0866B72fD6517E693c8E4620";
  const installationDiamondAddress =
    deploymentConfig.installationDiamondAddress ||
    "0x514b7c55FB3DFf3533B58D85CD25Ba04bb30612D";
  const tileDiamondAddress =
    deploymentConfig.tileDiamondAddress ||
    "0xCa6F4Ef19a1Beb9BeF12f64b395087E5680bcB22";
  const fakeGotchiArtDiamondAddress =
    deploymentConfig.fakeGotchiArtDiamondAddress ||
    "0x330088c3372f4F78cF023DF16E1e1564109191dc";
  const fakeGotchiCardDiamondAddress =
    deploymentConfig.fakeGotchiCardDiamondAddress ||
    "0x9E282FE4a0be6A0C4B9f7d9fEF10547da35c52EA";

  const name = "Aavegotchi";
  const symbol = "GOTCHI";

  const accounts = await ethers.getSigners();
  const ownerAddress = await accounts[0].getAddress();

  console.log("Owner: " + ownerAddress);

  const dao = ownerAddress; // 'todo'
  const daoTreasury = ownerAddress;
  const rarityFarming = ownerAddress; // 'todo'
  const pixelCraft = ownerAddress; // 'todo'
  const itemManagers = [ownerAddress, xpRelayerAddress]; // 'todo'
  let ghstContractAddress = "";

  const addresses = networkAddresses[chainId];

  if (chainId === 31337) {
    //deploy fake ghst token
    //deploy ERC20.sol
    const ERC20Factory = await ethers.getContractFactory("ERC20Token");
    const erc20 = await ERC20Factory.deploy();
    await erc20.deployed();
    ghstContractAddress = erc20.address;
  } else {
    ghstContractAddress = addresses.ghst;
  }

  const childChainManager = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const vrfCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
  const linkAddress = "0xa36085F69e2889c224210F603D836748e7dC0088";
  const keyHash =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
  const fee = ethers.utils.parseEther("0");

  const initArgs = [
    [
      dao,
      daoTreasury,
      pixelCraft,
      rarityFarming,
      ghstContractAddress,
      keyHash,
      fee,
      vrfCoordinator,
      linkAddress,
      childChainManager,
      name,
      symbol,
    ],
  ];

  let totalGasUsed = ethers.BigNumber.from("0");
  let tx;
  let receipt;

  async function deployAavegotchiDiamond(): Promise<Contract> {
    let aavegotchiDiamond: any;
    if (!deploymentConfig.aavegotchiDiamond) {
      // Deploy Aavegotchi Diamond
      aavegotchiDiamond = await deploy({
        diamondName: "AavegotchiDiamond",
        initDiamond: "contracts/Aavegotchi/InitDiamond.sol:InitDiamond",
        facetNames: [
          "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
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
          "MerkleDropFacet",
          "ERC721BuyOrderFacet",
          "ItemsRolesRegistryFacet",
          "ERC1155BuyOrderFacet",
          "PolygonXGeistBridgeFacet",
        ],
        owner: ownerAddress,
        args: initArgs,
      });

      console.log("Aavegotchi diamond address:" + aavegotchiDiamond.address);

      tx = aavegotchiDiamond.deployTransaction;
      receipt = await tx.wait();
      console.log(
        "Aavegotchi diamond deploy gas used:" + strDisplay(receipt.gasUsed)
      );
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);

      // Save the deployment address
      deploymentConfig.aavegotchiDiamond = aavegotchiDiamond.address;
      saveDeploymentConfig(deploymentConfig);

      return aavegotchiDiamond;
    } else {
      // Use existing deployment
      aavegotchiDiamond = await ethers.getContractAt(
        "Diamond",
        deploymentConfig.aavegotchiDiamond
      );

      console.log(
        "Using existing Aavegotchi Diamond at " + aavegotchiDiamond.address
      );
      return aavegotchiDiamond;
    }
  }

  async function deployWearableDiamond(): Promise<Contract> {
    // Deployment of Wearable Diamond
    let wearableDiamond: any;
    if (!deploymentConfig.wearableDiamond) {
      // Deploy facets

      wearableDiamond = await deployWithoutInit({
        diamondName: "WearableDiamond",
        args: [ownerAddress, aavegotchiDiamond.address],
        facetNames: ["EventHandlerFacet", "WearablesFacet"],
      });

      console.log("Wearable diamond address:" + wearableDiamond.address);

      tx = wearableDiamond.deployTransaction;
      receipt = await tx.wait();
      console.log(
        "Wearable diamond deploy gas used:" + strDisplay(receipt.gasUsed)
      );

      totalGasUsed = totalGasUsed.add(receipt.gasUsed);

      // Set periphery
      const peripheryFacet = await ethers.getContractAt(
        "PeripheryFacet",
        aavegotchiDiamond.address
      );
      tx = await peripheryFacet.setPeriphery(wearableDiamond.address);
      receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log(
        "Setting wearable diamond gas used::" + strDisplay(receipt.gasUsed)
      );
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);

      // Save the deployment address
      deploymentConfig.wearableDiamond = wearableDiamond.address;
      saveDeploymentConfig(deploymentConfig);

      return wearableDiamond;
    } else {
      wearableDiamond = await ethers.getContractAt(
        "WearableDiamond",
        deploymentConfig.wearableDiamond
      );
      console.log(
        "Using existing Wearable Diamond at " + wearableDiamond.address
      );
      return wearableDiamond;
    }
  }

  async function deployNewForgeDiamond(): Promise<Contract> {
    let forgeDiamond: any;
    if (!deploymentConfig.forgeDiamond) {
      forgeDiamond = await deployForgeDiamond(
        ownerAddress,
        aavegotchiDiamond.address,
        wearableDiamond.address
      );
      console.log("Forge diamond address:" + forgeDiamond.address);

      // Save the deployment address
      deploymentConfig.forgeDiamond = forgeDiamond.address;
      saveDeploymentConfig(deploymentConfig);

      return forgeDiamond;
    } else {
      forgeDiamond = await ethers.getContractAt(
        "ForgeDiamond",
        deploymentConfig.forgeDiamond
      );
      console.log("Using existing Forge Diamond at " + forgeDiamond.address);
      return forgeDiamond;
    }
  }

  async function deployHaunts() {
    // Add Haunt 1 if not already added
    if (!deploymentConfig.haunts || !deploymentConfig.haunts[1]) {
      await createHauntWithCollaterals(
        1,
        daoFacet,
        "10000",
        ethers.utils.parseEther("0.1"),
        getCollaterals(network.name, ghstContractAddress),
        totalGasUsed
      );

      // Update config
      deploymentConfig.haunts = deploymentConfig.haunts || {};
      deploymentConfig.haunts[1] = true;
      saveDeploymentConfig(deploymentConfig);
    } else {
      console.log("Haunt 1 already created.");
    }

    // Similar for Haunt 2
    if (!deploymentConfig.haunts[2]) {
      await createHauntWithCollaterals(
        2,
        daoFacet,
        "15000",
        ethers.utils.parseEther("0.1"),
        getCollateralsHaunt2(network.name, ghstContractAddress),
        totalGasUsed
      );

      // Update config
      deploymentConfig.haunts[2] = true;
      saveDeploymentConfig(deploymentConfig);
    } else {
      console.log("Haunt 2 already created.");
    }
  }

  const aavegotchiDiamond = await deployAavegotchiDiamond();
  const wearableDiamond = await deployWearableDiamond();
  const forgeDiamond = await deployNewForgeDiamond();

  const daoFacet = await ethers.getContractAt(
    "DAOFacet",
    aavegotchiDiamond.address
  );

  console.log("Item Managers:", itemManagers);

  if (!deploymentConfig.itemManagers) {
    await daoFacet.addItemManagers(itemManagers);
    deploymentConfig.itemManagers = itemManagers;
  }

  // Now, for adding haunts, item types, wearable sets, etc., we can check in the config whether they've been added
  await deployHaunts();

  //first set itemManagers

  //Add Item Managers

  // Add Item Types
  if (
    !deploymentConfig.itemTypes ||
    Object.keys(deploymentConfig.itemTypes).length < allItemTypes.length
  ) {
    await addItemTypes(daoFacet, totalGasUsed, deploymentConfig);
  } else {
    console.log("All Item Types already added.");
  }

  // Add Wearable Sets (updated check)
  if (
    !deploymentConfig.wearableSets ||
    Object.keys(deploymentConfig.wearableSets).length < wearableSetArrays.length
  ) {
    await addWearableSets(daoFacet, totalGasUsed, deploymentConfig);
  } else {
    console.log("All Wearable Sets already added.");
  }

  // Add Side View Dimensions (updated check)
  if (
    !deploymentConfig.sideViewDimensions ||
    Object.keys(deploymentConfig.sideViewDimensions).length <
      allSideViewDimensions.length
  ) {
    await addSideViewDimensions(aavegotchiDiamond.address, deploymentConfig);
  } else {
    console.log("All Side View Dimensions already added.");
  }

  // Add Side View Exceptions
  if (
    !deploymentConfig.sideViewExceptions ||
    Object.keys(deploymentConfig.sideViewExceptions).length <
      allExceptions.length
  ) {
    await addSideviewExceptions(aavegotchiDiamond.address, deploymentConfig);
  } else {
    console.log("All Side View Exceptions already added.");
  }

  // Upload all SVGs

  const svgFacet = await ethers.getContractAt(
    "SvgFacet",
    aavegotchiDiamond.address
  );
  await uploadAllSvgs(svgFacet, totalGasUsed, deploymentConfig);
  saveDeploymentConfig(deploymentConfig);

  if (!deploymentConfig.setForgeDiamond) {
    await daoFacet.setForge(forgeDiamond.address);
    deploymentConfig.setForgeDiamond = true;
    saveDeploymentConfig(deploymentConfig);
  } else {
    console.log("Forge diamond already set.");
  }

  if (!deploymentConfig.forgePropertiesSet) {
    //Set forge properties
    await setForgeProperties(forgeDiamond.address);
    deploymentConfig.forgePropertiesSet = true;
    saveDeploymentConfig(deploymentConfig);
  } else {
    console.log("Forge properties already set.");
  }

  // Add ERC721 Categories
  const erc721MarketplaceFacet = await ethers.getContractAt(
    "ERC721MarketplaceFacet",
    aavegotchiDiamond.address
  );
  if (!deploymentConfig.erc721CategoriesAdded) {
    await addERC721Categories(
      erc721MarketplaceFacet,
      totalGasUsed,
      realmDiamondAddress,
      fakeGotchiArtDiamondAddress
    );

    deploymentConfig.erc721CategoriesAdded = true;
    saveDeploymentConfig(deploymentConfig);
  } else {
    console.log("ERC721 Categories already added.");
  }

  // Add ERC1155 Categories
  const erc1155MarketplaceFacet = await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    aavegotchiDiamond.address
  );
  if (!deploymentConfig.erc1155CategoriesAdded) {
    await addERC1155Categories(
      erc1155MarketplaceFacet,
      totalGasUsed,
      ghstStakingDiamondAddress,
      installationDiamondAddress,
      tileDiamondAddress,
      forgeDiamond.address,
      fakeGotchiCardDiamondAddress
    );

    deploymentConfig.erc1155CategoriesAdded = true;
    saveDeploymentConfig(deploymentConfig);
  } else {
    console.log("ERC1155 Categories already added.");
  }

  // Set Realm Address
  const aavegotchiGameFacet = await ethers.getContractAt(
    "AavegotchiGameFacet",
    aavegotchiDiamond.address
  );
  if (!deploymentConfig.realmAddressSet) {
    await setRealmAddress(
      aavegotchiGameFacet,
      totalGasUsed,
      realmDiamondAddress
    );

    deploymentConfig.realmAddressSet = true;
    saveDeploymentConfig(deploymentConfig);
  } else {
    console.log("Realm address already set.");
  }

  // Continue with any other steps...

  console.log("Total gas used: " + strDisplay(totalGasUsed));

  return {
    aavegotchiDiamond: aavegotchiDiamond,
    forgeDiamond: forgeDiamond,
    wearableDiamond: wearableDiamond,
    testGhstContractAddress: ghstContractAddress, //testing only
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployFullDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = deployFullDiamond;
