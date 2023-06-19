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

async function main() {
  let ghstDiamondAddress = ethers.constants.AddressZero;
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
  const keyHash =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4"; // todo
  const fee = ethers.utils.parseEther("0.0001");

  const accounts = await ethers.getSigners();
  const ownerAddress = await accounts[0].getAddress();
  console.log("Owner: " + ownerAddress);

  const dao = ownerAddress; // 'todo'
  const daoTreasury = ownerAddress;
  const rarityFarming = ownerAddress; // 'todo'
  const pixelCraft = ownerAddress; // 'todo'
  const itemManagers = [ownerAddress]; // 'todo'
  const gasLimit = 12300000;

  const ghstTokenContract = (await (
    await ethers.getContractFactory("ERC20MintableBurnable")
  ).deploy()) as ERC20MintableBurnable;
  ghstDiamondAddress = ghstTokenContract.address;
  console.log("GHST address:" + ghstDiamondAddress);

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy({
    gasLimit: gasLimit,
  });
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy DiamondLoupeFacet
  const DiamondLoupeFacet = await ethers.getContractFactory(
    "DiamondLoupeFacet"
  );
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy({
    gasLimit: gasLimit,
  });
  await diamondLoupeFacet.deployed();
  console.log("DiamondLoupeFacet deployed:", diamondLoupeFacet.address);

  // deploy OwnershipFacet
  const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
  const ownershipFacet = await OwnershipFacet.deploy({
    gasLimit: gasLimit,
  });
  await ownershipFacet.deployed();
  console.log("OwnershipFacet deployed:", ownershipFacet.address);

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
      const factory = await ethers.getContractFactory(facet);
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
    "MerkleDropFacet"
  );

  // eslint-disable-next-line no-unused-vars
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
  console.log("Aavegotchi diamond address:" + aavegotchiDiamond.address);

  tx = aavegotchiDiamond.deployTransaction;
  receipt = await tx.wait();
  console.log(
    "Aavegotchi diamond deploy gas used:" + strDisplay(receipt.gasUsed)
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
  peripheryFacet = await ethers.getContractAt(
    "PeripheryFacet",
    aavegotchiDiamond.address
  );
  shopFacet = await ethers.getContractAt(
    "ShopFacet",
    aavegotchiDiamond.address
  );
  aavegotchiFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    aavegotchiDiamond.address
  );
  aavegotchiGameFacet = await ethers.getContractAt("AavegotchiGameFacet", aavegotchiDiamond.address);
  vrfFacet = await ethers.getContractAt("VrfFacet", aavegotchiDiamond.address);
  svgFacet = await ethers.getContractAt("SvgFacet", aavegotchiDiamond.address);

  // add item managers
  console.log("Adding item managers");
  tx = await daoFacet.addItemManagers(itemManagers, { gasLimit: gasLimit });
  console.log("Adding item managers tx:", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding item manager failed: ${tx.hash}`);
  }

  // create new haunt and upload payloads
  let initialHauntSize = "10000";
  let portalPrice = ethers.utils.parseEther("100");
  tx = await daoFacet.createHaunt(initialHauntSize, portalPrice, "0x000000", {
    gasLimit: gasLimit,
  });
  receipt = await tx.wait();
  console.log("Haunt created:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // add collateral info for haunt
  console.log("Adding Collateral Types");
  const { getCollaterals } = require("./testCollateralTypes.js");
  tx = await daoFacet.addCollateralTypes(
    1,
    getCollaterals(hre.network.name, ghstDiamondAddress),
    { gasLimit: gasLimit }
  );
  receipt = await tx.wait();
  console.log(
    "Adding Collateral Types gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // deploy wearable diamond and set to aavegotchi diamond
  const wearableDiamondAddress = await deployAndUpgradeWearableDiamond(
    diamondCutFacet.address,
    diamondLoupeFacet.address,
    ownershipFacet.address,
    aavegotchiDiamond.address
  );
  tx = await peripheryFacet.setPeriphery(wearableDiamondAddress);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log(
    "Setting wearable diamond gas used::" + strDisplay(receipt.gasUsed)
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  // add item types
  console.log("Adding Item Types");
  const itemTypes = getAllItemTypes(allItemTypes, hre.ethers);

  let step = 20;
  let sliceStep = itemTypes.length / step;
  for (let i = 0; i < step; i++) {
    tx = await daoFacet.addItemTypes(
      itemTypes.slice(sliceStep * i, sliceStep * (i + 1)),
      { gasLimit: gasLimit }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log(
      `Adding Item Types (${i + 1} / ${step}) gas used:: ${strDisplay(
        receipt.gasUsed
      )}`
    );
    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }

  // add wearable types sets
  console.log("Adding Wearable Sets");
  step = 2;
  sliceStep = wearableSets.length / step;
  for (let i = 0; i < step; i++) {
    tx = await daoFacet.addWearableSets(
      wearableSets.slice(sliceStep * i, sliceStep * (i + 1)),
      { gasLimit: gasLimit }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log(
      `Adding Wearable Sets (${i + 1} / ${step}) gas used:: ${strDisplay(
        receipt.gasUsed
      )}`
    );
    totalGasUsed = totalGasUsed.add(receipt.gasUsed);
  }

  console.log("Upload SVGs");

  const { aavegotchiSvgs } = require("../svgs/aavegotchi.js");
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

  await uploadSvgs(svgFacet, aavegotchiSvgs, "aavegotchi", hre.ethers);
  await uploadSvgs(svgFacet, collateralsSvgs, "collaterals", hre.ethers);
  await uploadSvgs(svgFacet, eyeShapeSvgs, "eyeShapes", hre.ethers);
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.left,
    "aavegotchi-left",
    hre.ethers
  );
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.right,
    "aavegotchi-right",
    hre.ethers
  );
  await uploadSvgs(
    svgFacet,
    aavegotchiSideSvgs.back,
    "aavegotchi-back",
    hre.ethers
  );
  await uploadSvgs(
    svgFacet,
    collateralsLeftSvgs,
    "collaterals-left",
    hre.ethers
  );
  await uploadSvgs(
    svgFacet,
    collateralsRightSvgs,
    "collaterals-right",
    hre.ethers
  );
  await uploadSvgs(svgFacet, [""], "collaterals-back", hre.ethers);
  await uploadSvgs(svgFacet, eyeShapesLeftSvgs, "eyeShapes-left", hre.ethers);
  await uploadSvgs(svgFacet, eyeShapesRightSvgs, "eyeShapes-right", hre.ethers);
  await uploadSvgs(
    svgFacet,
    Array(eyeShapeSvgs.length).fill(""),
    "eyeShapes-back",
    hre.ethers
  );

  const { sleeves, wearables } = getWearables();
  const svgsArray: string[] = wearables;
  const sleeveSvgsArray: SleeveObject[] = sleeves;

  await uploadSvgs(svgFacet, svgsArray, "wearables", hre.ethers);
  await uploadSvgs(
    svgFacet,
    sleeveSvgsArray.map((value) => value.svg),
    "sleeves",
    hre.ethers
  );
  await uploadSvgs(svgFacet, wearablesLeftSvgs, "wearables-left", ethers);
  await uploadSvgs(svgFacet, wearablesRightSvgs, "wearables-right", ethers);
  await uploadSvgs(svgFacet, wearablesBackSvgs, "wearables-back", ethers);
  await uploadSvgs(svgFacet, wearablesLeftSleeveSvgs, "sleeves-left", ethers);
  await uploadSvgs(svgFacet, wearablesRightSleeveSvgs, "sleeves-right", ethers);
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

  // console.log(`Mint prize items to target address: ${ownerAddress}`);
  // const itemIds: number[] = itemTypes.map((value) =>
  //   Number(value.svgId)
  // );
  // const quantities: BigNumberish[] = itemTypes.map((value) =>
  //   Number(value.maxQuantity)
  // );
  // console.log("final quantities:", itemIds, quantities);
  // tx = await daoFacet.mintItems(ownerAddress, itemIds, quantities);
  // console.log("tx hash:", tx.hash);
  // receipt = await tx.wait();
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`);
  // }
  // console.log("Prize items minted:", tx.hash);

  // forge
  let forgeDiamondAddress = await deployAndUpgradeForgeDiamond(
    diamondCutFacet.address,
    diamondLoupeFacet.address,
    ownershipFacet.address,
    aavegotchiDiamond.address,
    wearableDiamondAddress
  );
  await setForgeProperties(forgeDiamondAddress);
  tx = await daoFacet.setForge(forgeDiamondAddress, { gasLimit: gasLimit });
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
        erc1155TokenAddress: forgeDiamondAddress,
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

  let numberPerMint = 5;
  tx = await shopFacet.mintPortals(ownerAddress, numberPerMint);
  receipt = await tx.wait();
  console.log("Mint portals:" + strDisplay(receipt.gasUsed));
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  const gotchiIds = []
  for (let i = 0; i < numberPerMint; i++) {
    const gotchi = await aavegotchiFacet.getAavegotchi(i);
    gotchiIds.push(gotchi.tokenId)
    console.log(`Aavegotchi ID: ${i} owner is ${gotchi.owner} and status is closed portal (${gotchi.status == 0}) `);
  }

  await vrfFacet.openPortals(gotchiIds);
  for (let i = 0; i < numberPerMint; i++) {
    const gotchi = await aavegotchiFacet.getAavegotchi(i);
    console.log(`Aavegotchi ID: ${i} status is open portal (${gotchi.status == 2}) `);
  }

  for (let i = 0; i < numberPerMint; i++) {
    await aavegotchiGameFacet.claimAavegotchi(i, 0, ethers.utils.parseEther("10000"));
    const gotchi = await aavegotchiFacet.getAavegotchi(i);
    console.log(`Aavegotchi ID: ${i} status is claimed (${gotchi.status == 3}) `);
  }

  // TODO: allow revenue tokens?

  // // if (hre.network.name === 'mumbai') {
  //   // transfer ownership
  //   const newOwner = '0x94cb5C277FCC64C274Bd30847f0821077B231022'
  //   console.log('Transferring ownership of diamond: ' + aavegotchiDiamond.address)
  //   const diamond = await ethers.getContractAt('OwnershipFacet', aavegotchiDiamond.address)
  //   const tx = await diamond.transferOwnership(newOwner)
  //   console.log('Transaction hash: ' + tx.hash)
  //   receipt = await tx.wait()
  //   console.log('Transfer Transaction complete')
  //   console.log('Gas used:' + strDisplay(receipt.gasUsed))
  //   totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  // // }

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
