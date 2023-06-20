import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AavegotchiFacet, BridgeGotchichainSide, BridgePolygonSide, DAOFacet, ERC20MintableBurnable, ItemsFacet, PolygonXGotchichainBridgeFacet, ShopFacet, SvgFacet, AavegotchiGameFacet, VrfFacet } from "../typechain";
import { getAllItemTypes, SleeveObject } from "../scripts/itemTypeHelpers";
import { itemTypes as allItemTypes } from "../data/itemTypes/itemTypes";
import { wearableSets } from "../scripts/wearableSets";
const LZEndpointMockCompiled = require("@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json")
const diamond = require("../js/diamond-util/src/index.js");
import { deployAndUpgradeWearableDiamond } from "../scripts/upgrades/upgrade-deployWearableDiamond";
import { deployAndUpgradeForgeDiamond } from "../scripts/upgrades/forge/upgrade-deployAndUpgradeForgeDiamond";
import { setForgeProperties } from "../scripts/upgrades/forge/upgrade-forgeSetters";

import deploySupernets from "../scripts/deploy-supernet";

describe("Bridge ERC721: ", function () {
  const chainId_A = 1
  const chainId_B = 2
  const minGasToStore = 100000
  const batchSizeLimit = 1
  const defaultAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, "350000"])

  let LZEndpointMock: any, bridgePolygonSide: BridgePolygonSide, bridgeGotchichainSide: BridgeGotchichainSide
  let owner: SignerWithAddress, alice: SignerWithAddress
  let lzEndpointMockA: any, lzEndpointMockB: any
  let shopFacetPolygonSide: ShopFacet, shopFacetGotchichainSide: ShopFacet
  let aavegotchiFacetPolygonSide: AavegotchiFacet, aavegotchiFacetGotchichainSide: AavegotchiFacet
  let itemsFacetPolygonSide: ItemsFacet, itemsFacetGotchichainSide: ItemsFacet
  let ghstTokenPolygonSide: ERC20MintableBurnable, ghstTokenGotchichainSide: ERC20MintableBurnable
  let bridgeFacetPolygonSide: PolygonXGotchichainBridgeFacet, bridgeFacetGotchichainSide: PolygonXGotchichainBridgeFacet
  let aavegotchiGameFacetPolygonSide: AavegotchiGameFacet, aavegotchiGameFacetGotchichainSide: AavegotchiGameFacet
  let vrfFacetPolygonSide: VrfFacet, vrfFacetGotchichainSide: VrfFacet

  beforeEach(async function () {
    owner = (await ethers.getSigners())[0];
    alice = (await ethers.getSigners())[1];

    ; ({ shopFacet: shopFacetPolygonSide, aavegotchiFacet: aavegotchiFacetPolygonSide, polygonXGotchichainBridgeFacet: bridgeFacetPolygonSide, itemsFacet: itemsFacetPolygonSide, ghstToken: ghstTokenPolygonSide, aavegotchiGameFacet: aavegotchiGameFacetPolygonSide, vrfFacet: vrfFacetPolygonSide } = await deployAavegotchiContracts(owner.address))
    ; ({ shopFacet: shopFacetGotchichainSide, aavegotchiFacet: aavegotchiFacetGotchichainSide, polygonXGotchichainBridgeFacet: bridgeFacetGotchichainSide, itemsFacet: itemsFacetGotchichainSide, ghstToken: ghstTokenGotchichainSide, aavegotchiGameFacet: aavegotchiGameFacetGotchichainSide, vrfFacet: vrfFacetGotchichainSide } = await deployAavegotchiContracts(owner.address))

    LZEndpointMock = await ethers.getContractFactory(LZEndpointMockCompiled.abi, LZEndpointMockCompiled.bytecode)
    const BridgePolygonSide = await ethers.getContractFactory("BridgePolygonSide");
    const BridgeGotchichainSide = await ethers.getContractFactory("BridgeGotchichainSide");
    
    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A)
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B)
    
    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(minGasToStore, lzEndpointMockA.address, aavegotchiFacetPolygonSide.address)
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(minGasToStore, lzEndpointMockB.address, aavegotchiFacetGotchichainSide.address)
    
    //Wire the lz endpoints to guide msgs back and forth
    lzEndpointMockA.setDestLzEndpoint(bridgeGotchichainSide.address, lzEndpointMockB.address)
    lzEndpointMockB.setDestLzEndpoint(bridgePolygonSide.address, lzEndpointMockA.address)
    
    //Set each contracts source address so it can send to each other
    await bridgePolygonSide.setTrustedRemote(chainId_B, ethers.utils.solidityPack(["address", "address"], [bridgeGotchichainSide.address, bridgePolygonSide.address]))
    await bridgeGotchichainSide.setTrustedRemote(chainId_A, ethers.utils.solidityPack(["address", "address"], [bridgePolygonSide.address, bridgeGotchichainSide.address]))
    
    //Set batch size limit
    await bridgePolygonSide.setDstChainIdToBatchLimit(chainId_B, batchSizeLimit)
    await bridgeGotchichainSide.setDstChainIdToBatchLimit(chainId_A, batchSizeLimit)
    
    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 150000)
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000)
    
    //Set layer zero bridge on facet
    await bridgeFacetPolygonSide.setLayerZeroBridge(bridgePolygonSide.address)
    await bridgeFacetGotchichainSide.setLayerZeroBridge(bridgeGotchichainSide.address)
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain - without equipped item", async function () {
    const tokenId = await mintPortals(owner.address)
    // await claimPortal(tokenId)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    const sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    //Token is now owned by the proxy contract, because this is the original nft chain
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)

    //Token received on the dst chain
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain and back to Polygon - without equipped item", async function () {
    const tokenId = await mintPortals(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    
    //Swapping token back to Polygon
    await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, tokenId)
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    //Token is now owned by the proxy contract on origin chain
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    //Token received on the dst chain
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)
  })

  it.only("sendFrom() - send NFT from Polygon to Gotchichain - with equipped item", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    //Swaping token to Gotchichain
    console.log('Swaping token to Gotchichain')
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    //Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Checking items balance before unequipping them
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(0)

    //Unequipping items
    await itemsFacetGotchichainSide.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    //Checking items balance after unequipping them
    expect((await itemsFacetGotchichainSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(80))
    expect((await itemsFacetGotchichainSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    const aavegotchiData = await bridgeFacetGotchichainSide.getAavegotchiData(tokenId)
    console.log({ aavegotchiData })
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain and back to Polygon - with equipped item", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, tokenId)

    //Swapping token back to Polygon
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    //Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Checking items balance before unequipping them
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0)

    //Unequipping items
    await itemsFacetPolygonSide.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    //Checking items balance after unequipping them
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(1))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    const aavegotchiData = await bridgeFacetGotchichainSide.getAavegotchiData(tokenId)
    console.log({ aavegotchiData })
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain and back to Polygon - equipping item on gotchichain", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    //Swapping token to gotchichain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Equipping item on gotchichain
    await equipItemOnGotchichain(tokenId)

    //Swapping token back to Polygon
    await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, tokenId)
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    //Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Checking equipped items and owner items balance before unequipping item
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0)
    
    //Unequipping items
    await itemsFacetPolygonSide.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    
    //Checking items balance after unequipping them
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(2)
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[1].itemId).to.be.equal(ethers.BigNumber.from(1))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[1].balance).to.be.equal(ethers.BigNumber.from(1))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(2))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items after unequipping them
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it("sendFrom() - send equipped NFT from Polygon to Gotchichain - equipping and unequipping on Gotchichain - send back to Polygon", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    // Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, defaultAdapterParams)).nativeFee

    // Swapping token to gotchichain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    // Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    // Checking equipped items and balance before purchase items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(0)

    // Purchasing item 2 on gotchichain
    await purchaseItems(ghstTokenGotchichainSide, shopFacetGotchichainSide, [2], [1])
    
    // Checking equipped items and balance after purchase items but before changing them
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(1)

    // Equipping item 2 on slot 0 and removing item 1 from slot 3 on gotchichain
    const tx = await itemsFacetGotchichainSide.equipWearables(tokenId, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    tx.wait()

    // Checking equipped items after changing items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(1) // item 1 from slot 3 were unequipped and sent to owner

    // Swapping token back to Polygon
    await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, tokenId)
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, defaultAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    // Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    // Checking equipped items
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0) // item 1 from slot 3 were unequipped and sent to owner
  })

  async function mintPortals(to: string) {
    let tx = await shopFacetPolygonSide.mintPortals(to, 1)
    let receipt: any = await tx.wait()

    const tokenId = receipt.events[0].args._tokenId.toString()

    // await vrfFacetPolygonSide.openPortals([tokenId]);
    // await aavegotchiGameFacetPolygonSide.claimAavegotchi(tokenId, 0, ethers.utils.parseEther("10000"));

    return tokenId
  }
  
  async function mintPortalsWithItems(to: string) {
    const tokenId = await mintPortals(to)

    await purchaseItems(ghstTokenPolygonSide, shopFacetPolygonSide, [80], [1])

    const tx = await itemsFacetPolygonSide.equipWearables(tokenId, [0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    await tx.wait()

    return tokenId
  }

  async function equipItemOnGotchichain(tokenId: string) {
    await purchaseItems(ghstTokenGotchichainSide, shopFacetGotchichainSide, [2], [1])
    
    const tx = await itemsFacetGotchichainSide.equipWearables(tokenId, [2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    await tx.wait()
  }

  async function purchaseItems(ghstToken: ERC20MintableBurnable, shopFacet: ShopFacet, itemIds: number[], quantities: number[]) {
    let tx = await ghstToken.mint(owner.address, ethers.utils.parseEther('100000000000000000000000'))
    await tx.wait()
    
    tx = await ghstToken.approve(shopFacet.address, ethers.utils.parseEther('100000000000000000000000'))
    await tx.wait()

    tx = await shopFacet.purchaseItemsWithGhst(owner.address, itemIds, quantities)
    await tx.wait()
  }
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
  aavegotchiGameFacet = await ethers.getContractAt("AavegotchiGameFacet", aavegotchiDiamond.address);
  vrfFacet = await ethers.getContractAt("VrfFacet", aavegotchiDiamond.address);


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
    aavegotchiGameFacet,
    vrfFacet,
    ghstToken: ghstTokenContract,
  }
}