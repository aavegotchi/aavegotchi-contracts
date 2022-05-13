/* global ethers */

// Here are the details for Polygon mainnet (let's see if we can make this name stick):
// VRF Coordinator: 0x3d2341ADb2D31f1c5530cDC622016af293177AE0
// LINK: 0xb0897686c545045aFc77CF20eC7A532E3120E0F1
// KeyHash: 0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da
// Fee: 100000000000000 (0.0001 LINK)
// You can start using them now. Official announcement will be in 1-2 weeks.

import { ethers, network } from "hardhat";

import * as diamond from "../js/diamond-util/src/index";
import { getCollaterals as getCollateralsTest } from "./testCollateralTypes";
import { getCollaterals } from "../data/airdrops/collaterals/collateralTypes";

import {
  AavegotchiGameFacet,
  BridgeFacet,
  CollateralFacet,
  DAOFacet,
  ERC1155MarketplaceFacet,
  ERC721MarketplaceFacet,
  ShopFacet,
  VrfFacet,
} from "../typechain";
import { itemTypes as itemTypesTest } from "./testItemTypes";
import { getItemTypes, ItemTypeOutput } from "./itemTypeHelpers";

function addCommas(nStr: string) {
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

function strDisplay(str: string) {
  return addCommas(str.toString());
}

async function main(scriptName?: string) {
  console.log("SCRIPT NAME:", scriptName);

  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  console.log("Account: " + account);
  console.log("---");
  let tx;
  let totalGasUsed = ethers.BigNumber.from("0");
  let receipt;
  let vrfCoordinator;
  let linkAddress;
  let linkContract;
  let keyHash;
  let fee;
  let initialHauntSize;
  let ghstTokenContract;
  let dao;
  let daoTreasury;
  let rarityFarming;
  let pixelCraft;
  let childChainManager;

  // const portalPrice = ethers.utils.parseEther("100");
  if (network.name === "hardhat") {
    childChainManager = account;
    const LinkTokenMock = await ethers.getContractFactory("LinkTokenMock");
    linkContract = await LinkTokenMock.deploy();
    await linkContract.deployed();
    linkAddress = linkContract.address;
    vrfCoordinator = account;
    keyHash =
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    fee = ethers.utils.parseEther("0.0001");
    initialHauntSize = "100";

    // ghstTokenContract = set below
    dao = await accounts[1].getAddress();
    daoTreasury = await accounts[1].getAddress();
    rarityFarming = await accounts[2].getAddress();
    pixelCraft = await accounts[3].getAddress();
  } else if (network.name === "matic") {
    childChainManager = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
    vrfCoordinator = "0x3d2341ADb2D31f1c5530cDC622016af293177AE0";
    linkAddress = "0xb0897686c545045aFc77CF20eC7A532E3120E0F1";
    keyHash =
      "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da";
    fee = ethers.utils.parseEther("0.0001");
    initialHauntSize = "10000";

    //Matic ghst token address
    ghstTokenContract = await ethers.getContractAt(
      "GHSTFacet",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7"
    );

    dao = "todo"; // await accounts[1].getAddress()
    daoTreasury = "todo";
    rarityFarming = "todo"; // await accounts[2].getAddress()
    pixelCraft = "todo"; // await accounts[3].getAddress()
  } else if (network.name === "kovan") {
    childChainManager = account;
    vrfCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
    linkAddress = "0xa36085F69e2889c224210F603D836748e7dC0088";
    keyHash =
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    fee = ethers.utils.parseEther("0.1");
    initialHauntSize = "10000";

    ghstTokenContract = await ethers.getContractAt(
      "GHSTFacet",
      "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5"
    );
    // console.log('GHST diamond address:' + ghstDiamond.address)

    dao = account; // 'todo' // await accounts[1].getAddress()
    daoTreasury = account;
    rarityFarming = account; // 'todo' // await accounts[2].getAddress()
    pixelCraft = account; // 'todo' // await accounts[3].getAddress()
  } else if (network.name === "mumbai") {
    console.log("Deploying on Mumbai");
    // childChainManager = '0xb5505a6d998549090530911180f38aC5130101c6'
    childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6";
    vrfCoordinator = "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255"; // wrong one
    linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
    keyHash =
      "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4"; // wrong one
    fee = ethers.utils.parseEther("0.0001");

    initialHauntSize = "10000";

    // ghstTokenContract = await ethers.getContractAt('GHSTFacet', '0x658809Bb08595D15a59991d640Ed5f2c658eA284')
    ghstTokenContract = await ethers.getContractAt(
      "GHSTFacet",
      "0x20d0A1ce31f8e8A77b291f25c5fbED007Adde932"
    );
    // const GhstTokenContract = await ethers.getContractFactory('GHSTFacet')
    // ghstTokenContract = await GhstTokenContract.deploy()
    // await ghstTokenContract.deployed()
    // await ghstTokenContract.mintTo('0x0b22380B7c423470979AC3eD7d3c07696773dEa1')
    // console.log('GHSTToken:' + ghstTokenContract.address)
    // throw 'done here'

    dao = account; // 'todo' // await accounts[1].getAddress()
    daoTreasury = account;
    rarityFarming = account; // 'todo' // await accounts[2].getAddress()
    pixelCraft = account; // 'todo' // await accounts[3].getAddress()

    // console.log('GHST diamond address:' + ghstDiamond.address)
  } else {
    throw Error("No network settings for " + network.name);
  }

  async function deployFacets(facets: string[]) {
    const instances = [];
    for (let facet of facets) {
      console.log("Deploying facet:", facet);
      let constructorArgs = [];
      if (Array.isArray(facet)) {
        [facet, constructorArgs] = facet;
      }
      const factory = await ethers.getContractFactory(facet);

      const facetInstance = await factory.deploy(...constructorArgs);
      await facetInstance.deployed();
      const tx = facetInstance.deployTransaction;
      const receipt = await tx.wait();
      console.log(
        `${facet} deploy gas used:` + strDisplay(receipt.gasUsed.toString())
      );
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
    gotchiLendingFacet,
    whitelistFacet,
  ] = await deployFacets([
    // "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
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
    "GotchiLendingFacet",
    "WhitelistFacet",
  ]);

  if (network.name === "hardhat") {
    ghstTokenContract = await diamond.deploy({
      diamondName: "GHSTDiamond",
      initDiamond: "contracts/GHST/InitDiamond.sol:InitDiamond",
      facets: ["GHSTFacet"],
      owner: account,
      txArgs: {},
      args: [],
    });
    ghstTokenContract = await ethers.getContractAt(
      "GHSTFacet",
      ghstTokenContract.address
    );
    console.log("GHST diamond address:" + ghstTokenContract.address);
  }

  console.log("Deploy Diamond");
  const aavegotchiDiamond = await diamond.deploy({
    diamondName: "AavegotchiDiamond",
    initDiamond: "contracts/Aavegotchi/InitDiamond.sol:InitDiamond",
    facets: [
      // ["BridgeFacet", bridgeFacet],
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
      ["GotchiLendingFacet", gotchiLendingFacet],
      ["WhitelistFacet", whitelistFacet],
    ],
    owner: account,
    args: [
      dao,
      daoTreasury,
      pixelCraft,
      rarityFarming,
      ghstTokenContract?.address,
      keyHash,
      fee.toString(),
      vrfCoordinator,
      linkAddress,
      childChainManager,
    ],
    txArgs: {},
  });
  console.log("Aavegotchi diamond address:" + aavegotchiDiamond.address);

  tx = aavegotchiDiamond.deployTransaction;
  receipt = await tx.wait();
  console.log(
    "Aavegotchi diamond deploy gas used:" +
      strDisplay(receipt.gasUsed.toString())
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  const diamondLoupeFacet = await ethers.getContractAt(
    "DiamondLoupeFacet",
    aavegotchiDiamond.address
  );
  vrfFacet = await ethers.getContractAt("VrfFacet", aavegotchiDiamond.address);
  aavegotchiFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    aavegotchiDiamond.address
  )) as VrfFacet;
  aavegotchiGameFacet = (await ethers.getContractAt(
    "AavegotchiGameFacet",
    aavegotchiDiamond.address
  )) as AavegotchiGameFacet;
  collateralFacet = (await ethers.getContractAt(
    "CollateralFacet",
    aavegotchiDiamond.address
  )) as CollateralFacet;
  shopFacet = (await ethers.getContractAt(
    "ShopFacet",
    aavegotchiDiamond.address
  )) as ShopFacet;
  daoFacet = await ethers.getContractAt("DAOFacet", aavegotchiDiamond.address);
  erc1155MarketplaceFacet = (await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    aavegotchiDiamond.address
  )) as ERC1155MarketplaceFacet;
  erc721MarketplaceFacet = (await ethers.getContractAt(
    "ERC721MarketplaceFacet",
    aavegotchiDiamond.address
  )) as ERC721MarketplaceFacet;
  // bridgeFacet = (await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
  //   aavegotchiDiamond.address
  // )) as BridgeFacet;

  let daoContract = (await ethers.getContractAt(
    "DAOFacet",
    aavegotchiDiamond.address
  )) as DAOFacet;

  // add collateral info

  console.log("Adding Collateral Types");

  if (network.name === "hardhat") {
    const collaterals = getCollateralsTest(
      network.name,
      ghstTokenContract?.address
    );

    console.log("collaterals:", collaterals);

    tx = await daoContract.addCollateralTypes("1", collaterals);
  } else if (network.name === "mumbai") {
    const collaterals = getCollaterals(
      network.name,
      ghstTokenContract?.address
    );
    tx = await daoContract.addCollateralTypes("1", collaterals);
  } else {
    const collaterals = getCollaterals(
      network.name,
      ghstTokenContract?.address
    );
    tx = await daoContract.addCollateralTypes("1", collaterals);
  }
  receipt = await tx.wait();
  console.log(
    "Adding Collateral Types gas used::" +
      strDisplay(receipt.gasUsed.toString())
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  console.log("Adding Item Types");
  itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    aavegotchiDiamond.address
  );
  itemsTransferFacet = await ethers.getContractAt(
    "ItemsTransferFacet",
    aavegotchiDiamond.address
  );

  const itemTypes: ItemTypeOutput[] = getItemTypes(itemTypesTest, ethers);

  //@ts-ignore
  tx = await daoContract.addItemTypes(itemTypes.slice(0, itemTypes.length / 2));
  receipt = await tx.wait();
  console.log(
    "Adding Item Types gas used::" + strDisplay(receipt.gasUsed.toString())
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  //@ts-ignore
  tx = await daoContract.addItemTypes(itemTypes.slice(itemTypes.length / 2));
  receipt = await tx.wait();
  console.log(
    "Adding Item Types gas used::" + strDisplay(receipt.gasUsed.toString())
  );
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  //Create Haunt
  tx = await daoContract.createHaunt(initialHauntSize, "0", "0x000000");
  receipt = await tx.wait();
  totalGasUsed = totalGasUsed.add(receipt.gasUsed);

  const currentHaunt = await aavegotchiGameFacet.currentHaunt();
  console.log("current haunt:", currentHaunt);

  await shopFacet.buyPortals(account, "25");

  const balance = await aavegotchiFacet.balanceOf(account);
  console.log("balance:", balance.toString());

  if (network.name === "matic") {
    /*
    // transfer ownership
    const newOwner = '0x94cb5C277FCC64C274Bd30847f0821077B231022'
    console.log('Transferring ownership of diamond: ' + aavegotchiDiamond.address)
    const diamond = await ethers.getContractAt('OwnershipFacet', aavegotchiDiamond.address)
    const tx = await diamond.transferOwnership(newOwner)
    console.log('Transaction hash: ' + tx.hash)
    receipt = await tx.wait()
    console.log('Transfer Transaction complete')
    console.log('Gas used:' + strDisplay(receipt.gasUsed))
    totalGasUsed = totalGasUsed.add(receipt.gasUsed)
    */
  }

  console.log("Total gas used: " + strDisplay(totalGasUsed.toString()));
  return {
    account: account,
    aavegotchiDiamond: aavegotchiDiamond,
    diamondLoupeFacet: diamondLoupeFacet,
    bridgeFacet: bridgeFacet,
    ghstTokenContract: ghstTokenContract,
    itemsFacet: itemsFacet,
    itemsTransferFacet: itemsTransferFacet,
    aavegotchiFacet: aavegotchiFacet,
    aavegotchiGameFacet: aavegotchiGameFacet,
    collateralFacet: collateralFacet,
    vrfFacet: vrfFacet,
    daoFacet: daoFacet,
    svgFacet: svgFacet,
    erc1155MarketplaceFacet: erc1155MarketplaceFacet,
    erc721MarketplaceFacet: erc721MarketplaceFacet,
    shopFacet: shopFacet,
    linkAddress: linkAddress,
    linkContract: linkContract,
  };
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

// diamond address: 0x7560d1282A3316DE155452Af3ec248d05b8A8044
