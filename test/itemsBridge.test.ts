import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AavegotchiFacet, ItemsBridgeGotchichainSide, ItemsBridgePolygonSide, DAOFacet, ERC20MintableBurnable, ItemsFacet, PolygonXGotchichainBridgeFacet, ShopFacet, SvgFacet } from "../typechain";
import { getAllItemTypes, SleeveObject } from "../scripts/itemTypeHelpers";
import { itemTypes as allItemTypes } from "../data/itemTypes/itemTypes";
import { wearableSets } from "../scripts/wearableSets";
const LZEndpointMockCompiled = require("@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json")
const diamond = require("../js/diamond-util/src/index.js");
import { deployAndUpgradeWearableDiamond } from "../scripts/upgrades/upgrade-deployWearableDiamond";
import { deployAndUpgradeForgeDiamond } from "../scripts/upgrades/forge/upgrade-deployAndUpgradeForgeDiamond";
import { setForgeProperties } from "../scripts/upgrades/forge/upgrade-forgeSetters";

describe("Items Bridge: ", function () {
  const chainId_A = 1
  const chainId_B = 2
  const minGasToStore = 100000
  const batchSizeLimit = 1
  const defaultAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, "350000"])

  let LZEndpointMock: any, bridgePolygonSide: ItemsBridgePolygonSide, bridgeGotchichainSide: ItemsBridgeGotchichainSide
  let owner: SignerWithAddress
  let lzEndpointMockA: any, lzEndpointMockB: any
  let shopFacetPolygonSide: ShopFacet, shopFacetGotchichainSide: ShopFacet
  let aavegotchiFacetPolygonSide: AavegotchiFacet, aavegotchiFacetGotchichainSide: AavegotchiFacet
  let itemsFacetPolygonSide: ItemsFacet, itemsFacetGotchichainSide: ItemsFacet
  let ghstTokenPolygonSide: ERC20MintableBurnable, ghstTokenGotchichainSide: ERC20MintableBurnable
  let bridgeFacetPolygonSide: PolygonXGotchichainBridgeFacet, bridgeFacetGotchichainSide: PolygonXGotchichainBridgeFacet

  beforeEach(async function () {
    owner = (await ethers.getSigners())[0];

    ; ({ shopFacet: shopFacetPolygonSide, aavegotchiFacet: aavegotchiFacetPolygonSide, polygonXGotchichainBridgeFacet: bridgeFacetPolygonSide, itemsFacet: itemsFacetPolygonSide, ghstToken: ghstTokenPolygonSide } = await deployAavegotchiContracts(owner.address))
    ; ({ shopFacet: shopFacetGotchichainSide, aavegotchiFacet: aavegotchiFacetGotchichainSide, polygonXGotchichainBridgeFacet: bridgeFacetGotchichainSide, itemsFacet: itemsFacetGotchichainSide, ghstToken: ghstTokenGotchichainSide } = await deployAavegotchiContracts(owner.address))

    LZEndpointMock = await ethers.getContractFactory(LZEndpointMockCompiled.abi, LZEndpointMockCompiled.bytecode)
    const BridgePolygonSide = await ethers.getContractFactory("ItemsBridgePolygonSide");
    const BridgeGotchichainSide = await ethers.getContractFactory("ItemsBridgeGotchichainSide");
    
    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A)
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B)
    
    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(lzEndpointMockA.address, itemsFacetPolygonSide.address)
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(lzEndpointMockB.address, itemsFacetGotchichainSide.address)
    
    //Wire the lz endpoints to guide msgs back and forth
    lzEndpointMockA.setDestLzEndpoint(bridgeGotchichainSide.address, lzEndpointMockB.address)
    lzEndpointMockB.setDestLzEndpoint(bridgePolygonSide.address, lzEndpointMockA.address)
    
    //
    await bridgePolygonSide.setUseCustomAdapterParams(true)
    await bridgeGotchichainSide.setUseCustomAdapterParams(true)
    
    //Set each contracts source address so it can send to each other
    await bridgePolygonSide.setTrustedRemote(chainId_B, ethers.utils.solidityPack(["address", "address"], [bridgeGotchichainSide.address, bridgePolygonSide.address]))
    await bridgeGotchichainSide.setTrustedRemote(chainId_A, ethers.utils.solidityPack(["address", "address"], [bridgePolygonSide.address, bridgeGotchichainSide.address]))
    
    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 150000)
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000)
    await bridgePolygonSide.setMinDstGas(chainId_B, 2, 150000)
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 2, 150000)
    
    //Set layer zero bridge on facet
    await bridgeFacetPolygonSide.setLayerZeroBridge(bridgePolygonSide.address)
    await bridgeFacetGotchichainSide.setLayerZeroBridge(bridgeGotchichainSide.address)

    await ghstTokenPolygonSide.mint(owner.address, ethers.utils.parseEther('100000000000000000000000'))
    await ghstTokenPolygonSide.approve(shopFacetPolygonSide.address, ethers.utils.parseEther('100000000000000000000000'))
  })

  it("sendFrom() - Sending 1 item from Polygon to Gotchichain and then back to Polygon", async function () {
    //Minting Items
    const tokenId = 1
    const tokenAmount = 1
    
    await shopFacetPolygonSide.purchaseItemsWithGhst(owner.address, [tokenId], [tokenAmount])

    //Swapping item to gotchichain
    await aavegotchiFacetPolygonSide.setApprovalForAll(bridgePolygonSide.address, true)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      tokenAmount,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, tokenAmount, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    expect(await itemsFacetPolygonSide.itemBalances(owner.address)).to.eql([]);
    
    const itemBalancesGotchichain = await itemsFacetGotchichainSide.itemBalances(owner.address)
    expect(itemBalancesGotchichain.length).to.be.equal(1);
    expect(itemBalancesGotchichain[0].itemId).to.be.equal(ethers.BigNumber.from(1));
    expect(itemBalancesGotchichain[0].balance).to.be.equal(ethers.BigNumber.from(1));

    //Swaps item to gotchichain
    await aavegotchiFacetGotchichainSide.setApprovalForAll(bridgeGotchichainSide.address, true)
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      tokenAmount,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgePolygonSide.estimateSendFee(chainId_A, owner.address, tokenId, tokenAmount, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    expect(await itemsFacetGotchichainSide.itemBalances(owner.address)).to.eql([]);
    
    const itemBalancesPolygon = await itemsFacetPolygonSide.itemBalances(owner.address)
    expect(itemBalancesPolygon.length).to.be.equal(1);
    expect(itemBalancesPolygon[0].itemId).to.be.equal(ethers.BigNumber.from(1));
    expect(itemBalancesPolygon[0].balance).to.be.equal(ethers.BigNumber.from(1));
  })

  it("sendBatchFrom() - Sending 3 items from Polygon to Gotchichain and then back to Polygon", async function () {
    //Minting Items
    const tokenIds = ['1', '2']
    const tokenAmounts = ['1', '1']
    
    //Purchasing items
    await shopFacetPolygonSide.purchaseItemsWithGhst(owner.address, tokenIds, tokenAmounts)

    //Swapping item to Gotchichain
    await aavegotchiFacetPolygonSide.setApprovalForAll(bridgePolygonSide.address, true)
    let sendFromTx = await bridgePolygonSide.sendBatchFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenIds,
      tokenAmounts,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgePolygonSide.estimateSendBatchFee(chainId_B, owner.address, tokenIds, tokenAmounts, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    expect(await itemsFacetPolygonSide.itemBalances(owner.address)).to.eql([]);
    
    const itemBalancesGotchichain = await itemsFacetGotchichainSide.itemBalances(owner.address)
    expect(itemBalancesGotchichain.length).to.be.equal(2);
    expect(await itemsFacetGotchichainSide.balanceOf(owner.address, 1)).to.be.equal(1);
    expect(await itemsFacetGotchichainSide.balanceOf(owner.address, 2)).to.be.equal(1);

    //Swaps back items to Polygon
    await aavegotchiFacetGotchichainSide.setApprovalForAll(bridgeGotchichainSide.address, true)
    sendFromTx = await bridgeGotchichainSide.sendBatchFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenIds,
      tokenAmounts,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendBatchFee(chainId_A, owner.address, tokenIds, tokenAmounts, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    expect(await itemsFacetGotchichainSide.itemBalances(owner.address)).to.eql([]);
    
    const itemBalancesPolygon = await itemsFacetPolygonSide.itemBalances(owner.address)
    expect(itemBalancesPolygon.length).to.be.equal(2);
    expect(await itemsFacetPolygonSide.balanceOf(owner.address, 1)).to.be.equal(1);
    expect(await itemsFacetPolygonSide.balanceOf(owner.address, 2)).to.be.equal(1);
  })
})


async function deployAavegotchiContracts(ownerAddress: string) {
  const name = "Aavegotchi";
  const symbol = "GOTCHI";

  const realmDiamondAddress = ethers.constants.AddressZero; //todo
  const fakeGotchiArtDiamondAddress = ethers.constants.AddressZero
  const ghstStakingDiamondAddress = ethers.constants.AddressZero
  const installationDiamondAddress = ethers.constants.AddressZero
  const tileDiamondAddress = ethers.constants.AddressZero
  const fakeGotchiCardDiamondAddress = ethers.constants.AddressZero

  const childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6"; // todo
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"; // todo
  const vrfCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9"; // todo
  const keyHash =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4"; // todo
  const fee = ethers.utils.parseEther("0.0001");

  const dao = ownerAddress; // 'todo'
  const daoTreasury = ownerAddress;
  const rarityFarming = ownerAddress; // 'todo'
  const pixelCraft = ownerAddress; // 'todo'
  const itemManagers = [ownerAddress]; // 'todo'

  const ghstTokenContract = (await (
    await ethers.getContractFactory("ERC20MintableBurnable")
  ).deploy()) as ERC20MintableBurnable;
  const ghstDiamondAddress = ghstTokenContract.address;

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy DiamondLoupeFacet
  const DiamondLoupeFacet = await ethers.getContractFactory(
    "DiamondLoupeFacet"
  );
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.deployed();
  console.log("DiamondLoupeFacet deployed:", diamondLoupeFacet.address);

  // deploy OwnershipFacet
  const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
  const ownershipFacet = await OwnershipFacet.deploy();
  await ownershipFacet.deployed();
  console.log("OwnershipFacet deployed:", ownershipFacet.address);


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
      await tx.wait();
      instances.push(facetInstance);
    }
    return instances;
  }

  let [
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

  let tx;
  let receipt;

  const gasLimit = 12300000;

  // get facets
  daoFacet = await ethers.getContractAt("DAOFacet", aavegotchiDiamond.address);
  shopFacet = await ethers.getContractAt(
    "ShopFacet",
    aavegotchiDiamond.address
  );
  itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    aavegotchiDiamond.address
  );
  aavegotchiFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    aavegotchiDiamond.address
  );
  polygonXGotchichainBridgeFacet = await ethers.getContractAt(
    "PolygonXGotchichainBridgeFacet",
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
  svgFacet = await ethers.getContractAt("SvgFacet", aavegotchiDiamond.address);


  // add item managers
  tx = await daoFacet.addItemManagers(itemManagers, { gasLimit: gasLimit });
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

  // deploy wearable diamond and set to aavegotchi diamond
  console.log('Deploying Wearable Diamond')
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

  // add item types
  const itemTypes = getAllItemTypes(allItemTypes, ethers);

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
    };
  }






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

  console.log('Finished setting up Aavegotchi contracts')

  return {
    shopFacet,
    aavegotchiFacet,
    polygonXGotchichainBridgeFacet,
    itemsFacet,
    ghstToken: ghstTokenContract,
  }
}