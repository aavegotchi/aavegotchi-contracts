/* global ethers hre */

import { ethers, network } from "hardhat";

import {
  getItemTypes,
  ItemTypeInputNew,
  SleeveObject,
  toItemTypeInputNew,
} from "./itemTypeHelpers";
import { itemTypes as allItemTypes } from "../data/itemTypes/itemTypes";
import { wearableSetArrays } from "./wearableSets";

import { DAOFacet, SvgFacet } from "../typechain";
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
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../svgs/wearables-sides";

import { aavegotchiSvgs } from "../svgs/aavegotchi-typescript";
import { run } from "hardhat";
import { allSideViewDimensions } from "../svgs/sideViewDimensions";
import { convertSideDimensionsToTaskFormat } from "../tasks/updateItemSideDimensions";
import { allExceptions } from "../svgs/allExceptions";
import { convertExceptionsToTaskFormat } from "../tasks/updateWearableExceptions";

const diamond = require("../js/diamond-util/src/index.js");
const { collaterals } = require("./testCollateralTypes.js");

function addCommas(nStr: any) {
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

function strDisplay(str: any) {
  return addCommas(str.toString());
}

async function main() {
  if (!["hardhat", "localhost"].includes(network.name)) {
    throw Error("No network settings for " + network.name);
  }

  //amoy
  const ghstContract = "0xF679b8D109b2d23931237Ce948a7D784727c0897";
  const ghstStakingDiamondAddress =
    "0xae83d5fc564Ef58224e934ba4Df72a100d5082a0";
  const realmDiamondAddress = "0x5a4faEb79951bAAa0866B72fD6517E693c8E4620";
  const installationDiamondAddress =
    "0x514b7c55FB3DFf3533B58D85CD25Ba04bb30612D";
  const tileDiamondAddress = "0xCa6F4Ef19a1Beb9BeF12f64b395087E5680bcB22";
  const fakeGotchiArtDiamondAddress =
    "0x330088c3372f4F78cF023DF16E1e1564109191dc"; //todo
  const fakeGotchiCardDiamondAddress =
    "0x9E282FE4a0be6A0C4B9f7d9fEF10547da35c52EA"; //todo

  const name = "Aavegotchi";
  const symbol = "GOTCHI";

  const childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6";
  const vrfCoordinatorAmoy = "0x7E10652Cb79Ba97bC1D0F38a1e8FaD8464a8a908"; // todo
  const keyHash =
    "0x3f631d5ec60a0ce16203bcd6aff7ffbc423e22e452786288e172d467354304c8"; // todo
  const subscriptionIdAmoy = BigNumber.from(4534367);

  const fee = ethers.utils.parseEther("0.0001");

  const accounts = await ethers.getSigners();
  const ownerAddress = await accounts[0].getAddress();

  console.log("Owner: " + ownerAddress);

  const dao = ownerAddress; // 'todo'
  const daoTreasury = ownerAddress;
  const rarityFarming = ownerAddress; // 'todo'
  const pixelCraft = ownerAddress; // 'todo'
  const itemManagers = [ownerAddress]; // 'todo'

  const initArgs = [
    [
      dao,
      daoTreasury,
      pixelCraft,
      rarityFarming,
      ghstContract,
      keyHash,
      subscriptionIdAmoy,
      vrfCoordinatorAmoy,
      childChainManager,
      name,
      symbol,
    ],
  ];

  const ghstTokenContract = await ethers.getContractAt(
    "GHSTFacet",
    ghstContract
  );

  const gasLimit = 12300000;
  let totalGasUsed = ethers.BigNumber.from("0");
  let tx;
  let receipt;

  async function deployFacets(...facets: any[]) {
    const instances = [];
    for (let facet of facets) {
      let constructorArgs = [];
      if (Array.isArray(facet)) {
        [facet, constructorArgs] = facet;
      }
      const factory: any = await ethers.getContractFactory(facet);
      const facetInstance = await factory.deploy(...constructorArgs);
      await facetInstance.deployed();
      const tx = facetInstance.deployTransaction;
      const receipt = await tx.wait();
      console.log(`${facet} deploy gas used:` + strDisplay(receipt.gasUsed));
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);
      instances.push(facetInstance);
    }
    return instances;
  }
  let [
    bridgeFacet,
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
    erc721BuyorderFacet,
    itemsRolesRegistryFacet,
    voucherMigrationFacet,
  ] = await deployFacets(
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
    "VoucherMigrationFacet"
  );

  const aavegotchiDiamond = await diamond.deploy({
    diamondName: "AavegotchiDiamond",
    initDiamond: "contracts/Aavegotchi/InitDiamond.sol:InitDiamond",
    facets: [
      ["BridgeFacet", bridgeFacet],
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
      ["ERC721BuyOrderFacet", erc721BuyorderFacet],
      ["ItemsRolesRegistryFacet", itemsRolesRegistryFacet],
      ["VoucherMigrationFacet", voucherMigrationFacet],
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

  const deets = await vrfFacet.getVrfInfo();
  console.log("Vrf info:", deets);

  // wearable diamond

  let [eventhandlerFacet, wearablesFacet] = await deployFacets(
    "contracts/Aavegotchi/WearableDiamond/facets/EventHandlerFacet.sol:EventHandlerFacet",
    "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet"
  );

  //get constructor args from aavegotchi diamond
  const [cutAddress, loupeAddress, ownershipAddress] =
    await aavegotchiDiamond.getDefaultFacetAddresses();

  const wearableDiamond = await diamond.deployWithoutInit({
    diamondName: "WearableDiamond",
    facets: [
      ["EventHandlerFacet", eventhandlerFacet],
      ["WearablesFacet", wearablesFacet],
    ],
    args: [
      ownerAddress,
      cutAddress,
      loupeAddress,
      ownershipAddress,
      aavegotchiDiamond.address,
    ],
  });

  console.log("Wearable diamond address:" + wearableDiamond.address);

  tx = wearableDiamond.deployTransaction;
  receipt = await tx.wait();
  console.log(
    "Wearable diamond deploy gas used:" + strDisplay(receipt.gasUsed)
  );

  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  peripheryFacet = await ethers.getContractAt(
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

  // forge diamond
  let [forgeFacet, forgeDaoFacet, forgeTokenFacet, forgeVrfFacet] =
    await deployFacets(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet"
    );

  const forgeDiamond = await diamond.deployWithoutInit({
    diamondName: "ForgeDiamond",
    facets: [
      ["ForgeFacet", forgeFacet],
      ["ForgeDAOFacet", forgeDaoFacet],
      ["ForgeTokenFacet", forgeTokenFacet],
      ["ForgeVRFFacet", forgeVrfFacet],
    ],
    args: [
      ownerAddress,
      cutAddress,
      loupeAddress,
      ownershipAddress,
      aavegotchiDiamond.address,
      wearableDiamond.address,
    ],
  });

  console.log("Forge diamond address:" + forgeDiamond.address);
  tx = wearableDiamond.deployTransaction;
  receipt = await tx.wait();
  console.log(
    "Wearable diamond deploy gas used:" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // get facets
  daoFacet = await ethers.getContractAt("DAOFacet", aavegotchiDiamond.address);
  aavegotchiGameFacet = await ethers.getContractAt(
    "AavegotchiGameFacet",
    aavegotchiDiamond.address
  );
  erc1155MarketplaceFacet = await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    aavegotchiDiamond.address
  );
  erc721MarketplaceFacet = await ethers.getContractAt(
    "ERC721MarketplaceFacet",
    aavegotchiDiamond.address
  );

  svgFacet = await ethers.getContractAt("SvgFacet", aavegotchiDiamond.address);
  peripheryFacet = await ethers.getContractAt(
    "PeripheryFacet",
    aavegotchiDiamond.address
  );

  // add item managers
  console.log("Adding item managers");
  tx = await daoFacet.addItemManagers(itemManagers, { gasLimit: gasLimit });
  console.log("Adding item managers tx:", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding item manager failed: ${tx.hash}`);
  }

  // // create new haunt and upload payloads
  let initialHauntSize = "10000";
  let portalPrice = ethers.utils.parseEther("0.1"); //0.1ghst/portal
  tx = await daoFacet.createHaunt(initialHauntSize, portalPrice, "0x000000", {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  console.log("Haunt created:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // add collateral info for haunt
  console.log("Adding Collateral Types");

  tx = await daoFacet.addCollateralTypes(1, collaterals, {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  console.log(
    "Adding Collateral Types gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // add item types

  //convert all itemtypes to itemTypeNew
  let itemTypes2: ItemTypeInputNew[] = [];
  for (let i = 0; i < allItemTypes.length; i++) {
    itemTypes2.push(toItemTypeInputNew(allItemTypes[i]));
  }
  const itemTypes = getItemTypes(itemTypes2, ethers);
  console.log("Adding", itemTypes2.length, "Item Types");
  let step = 20;
  let totalItems = itemTypes.length;
  let totalBatches = Math.ceil(totalItems / step);

  for (let i = 0; i < totalBatches; i++) {
    const start = step * i;
    const end = start + step;
    const batch = itemTypes.slice(start, end); // Get current batch

    const tx = await daoFacet.addItemTypes(batch, { gasLimit: gasLimit });
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

    console.log(
      `Adding Item Types Batch ${
        i + 1
      } of ${totalBatches}, gas used:: ${strDisplay(receipt.gasUsed)}`
    );
    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }
  console.log("Finished adding itemTypes");

  // add wearable types sets
  console.log("Adding ", wearableSetArrays.length, "Wearable Sets");
  step = 50;
  totalBatches = Math.ceil(wearableSetArrays.length / step);

  for (let i = 0; i < totalBatches; i++) {
    const start = step * i;
    const end = start + step;
    const batch = wearableSetArrays.slice(start, end);

    const tx = await daoFacet.addWearableSets(batch, { gasLimit: gasLimit });

    const receipt = await tx.wait();
    console.log(
      `Adding Wearable Sets Batch ${
        i + 1
      } of ${totalBatches}, gas used:: ${strDisplay(receipt.gasUsed)}`
    );

    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }

  //add sideview dimensions in batches of 700
  step = 700;
  console.log("adding", allSideViewDimensions.length, "sideviews");
  let sliceStep = Math.ceil(allSideViewDimensions.length / step);

  for (let i = 0; i < sliceStep; i++) {
    const start = step * i;
    const end = start + step;
    const batch = allSideViewDimensions.slice(start, end);
    console.log(`Adding Sideview Dimensions (${i + 1} / ${sliceStep})`);
    await run(
      "updateItemSideDimensions",
      convertSideDimensionsToTaskFormat(batch)
    );
  }

  //add sideview exceptions in batches of 100
  step = 100;
  console.log("adding", allExceptions.length, "exceptions");
  sliceStep = Math.ceil(allExceptions.length / step);

  for (let i = 0; i < sliceStep; i++) {
    const start = sliceStep * i;
    const end = start + sliceStep;
    const slice = allExceptions.slice(
      start,
      Math.min(end, allExceptions.length)
    );
    console.log(`Adding Sideview Exceptions (${i + 1} / ${sliceStep}) `);
    const tx = await run(
      "updateWearableExceptions",
      convertExceptionsToTaskFormat(slice)
    );
  }

  console.log("Upload SVGs");

  const { eyeShapeSvgs } = require("../svgs/eyeShapes.js");
  const collateralsSvgs = [
    '<g class="gotchi-collateral"><path d="M36 15v-1h-1v-1h-1v-1h-4v1h-1v1h-1v1h-1v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4h-1z" fill="#ac15f9"/><path d="M33 21h-3v1h4v-1h-1z" fill="#7e18f8"/><path d="M35 14v-1h-1v-1h-4v1h-1v1h-1v1h8v-1h-1z" fill="#fa34f3"/><path d="M36 15h-9v2h10v-2h-1z" fill="#cf15f9"/><path d="M35 19h-7v1h1v1h6v-1h1v-1h-1z" fill="#8f17f9"/></g>',
  ];
  const collateralsLeftSvgs = [
    '<g class="gotchi-collateral"><path d="M23 15v-1h-2v7h1v-1h1v-1h1v-4z" fill="#7e18f8"/></g>',
  ];
  const collateralsRightSvgs = [
    '<g class="gotchi-collateral"><path d="M41 14v1h-1v4h1v1h1v1h1v-7z" fill="#7e18f8"/></g>',
  ];

  console.log("uploading portal svgs");
  await uploadSvgs(svgFacet, openedPortals, "portal-open", ethers);
  await uploadSvgs(svgFacet, closedPortals, "portal-closed", ethers);

  console.log("uploading aavegotchiSvgs");
  await uploadSvgs(svgFacet, aavegotchiSvgs, "aavegotchi", ethers);
  console.log("uploading collaterals");
  await uploadSvgs(svgFacet, collateralsSvgs, "collaterals", ethers);
  console.log("uploading eyeShapes");
  await uploadSvgs(svgFacet, eyeShapeSvgs, "eyeShapes", ethers);
  console.log("uploading aavegotchiSideSvgsLeft");
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.left,
    "aavegotchi-left",
    ethers
  );
  console.log("uploading aavegotchiSideSvgsRight");
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.right,
    "aavegotchi-right",
    ethers
  );
  console.log("uploading aavegotchiSideSvgsBack");
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.back,
    "aavegotchi-back",
    ethers
  );
  console.log("uploading collateral-side svgs");
  await uploadSvgs(svgFacet, collateralsLeftSvgs, "collaterals-left", ethers);
  await uploadSvgs(svgFacet, collateralsRightSvgs, "collaterals-right", ethers);
  await uploadSvgs(svgFacet, [""], "collaterals-back", ethers);
  await uploadSvgs(svgFacet, eyeShapesLeftSvgs, "eyeShapes-left", ethers);
  await uploadSvgs(svgFacet, eyeShapesRightSvgs, "eyeShapes-right", ethers);
  await uploadSvgs(
    svgFacet,
    Array(eyeShapeSvgs.length).fill(""),
    "eyeShapes-back",
    ethers
  );

  const { sleeves, wearables } = getWearables();

  const svgsArray: string[] = wearables;
  const sleeveSvgsArray: SleeveObject[] = sleeves;

  console.log("Uploading wearables");
  await uploadSvgs(svgFacet, svgsArray, "wearables", ethers);
  console.log("Uploading sleeves");
  await uploadSvgs(
    svgFacet,
    sleeveSvgsArray.map((value) => value.svg),
    "sleeves",
    ethers
  );
  console.log("Uploading wearablesleft");
  await uploadSvgs(
    svgFacet,
    wearablesLeftSvgs as string[],
    "wearables-left",
    ethers
  );
  console.log("Uploading wearablesRight");
  await uploadSvgs(
    svgFacet,
    wearablesRightSvgs as string[],
    "wearables-right",
    ethers
  );
  console.log("Uploading wearablesBack");
  await uploadSvgs(
    svgFacet,
    wearablesBackSvgs as string[],
    "wearables-back",
    ethers
  );
  console.log("Uploading wearablesLeftSleeve");
  await uploadSvgs(svgFacet, wearablesLeftSleeveSvgs, "sleeves-left", ethers);
  console.log("Uploading wearablesRightSleeve");
  await uploadSvgs(svgFacet, wearablesRightSleeveSvgs, "sleeves-right", ethers);
  console.log("Uploading wearablesBackSleeve");
  await uploadSvgs(svgFacet, wearablesBackSleeveSvgs, "sleeves-back", ethers);
  console.log("Upload Done");

  interface SleeveInput {
    sleeveId: BigNumberish;
    wearableId: BigNumberish;
  }
  let sleevesSvgId: number = 0; // TODO
  let sleevesInput: SleeveInput[] = [];
  for (const sleeve of sleeveSvgsArray) {
    sleevesInput.push({
      sleeveId: sleevesSvgId,
      wearableId: sleeve.id,
    });
    sleevesSvgId++;
  }

  console.log("Associating sleeves svgs with body wearable svgs.");
  tx = await svgFacet.setSleeves(sleevesInput);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Sleeves associating gas used::" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  await setForgeProperties(forgeDiamond.address);
  tx = await daoFacet.setForge(forgeDiamond.address, { gasLimit: gasLimit });
  receipt = await tx.wait();
  console.log("Forge diamond set:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // add erc721 and 1155 categories
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
  tx = await erc721MarketplaceFacet.setERC721Categories(erc721Categories, {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log(
    "Adding ERC721 categories gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

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
        erc1155TokenAddress: forgeDiamond.address,
        erc1155TypeId: toAdd[index],
        category: category,
      });
    }
  });

  tx = await erc1155MarketplaceFacet.setERC1155Categories(erc1155Categories, {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log(
    "Adding ERC1155 categories gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // set realm address
  tx = await aavegotchiGameFacet.setRealmAddress(realmDiamondAddress, {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  console.log("Realm diamond set:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  console.log("Total gas used: " + strDisplay(totalGasUsed));
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
