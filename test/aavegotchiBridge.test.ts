
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AavegotchiFacet, AavegotchiBridgeGotchichainSide, AavegotchiBridgePolygonSide, ERC20MintableBurnable, ItemsFacet, PolygonXGotchichainBridgeFacet, ShopFacet, AavegotchiGameFacet, VrfFacet, DAOFacet } from "../typechain";
const LZEndpointMockCompiled = require("@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json")

import deploySupernets from "../scripts/deploy-supernet";

describe("Bridge ERC721: ", function () {
  const chainId_A = 1
  const chainId_B = 2
  const minGasToStore = 150000
  const batchSizeLimit = 1
  let polygonAdapterParams: any
  let gotchichainAdapterParams: any

  let LZEndpointMock: any, bridgePolygonSide: AavegotchiBridgePolygonSide, bridgeGotchichainSide: AavegotchiBridgeGotchichainSide
  let owner: SignerWithAddress, alice: SignerWithAddress
  let lzEndpointMockA: any, lzEndpointMockB: any
  let shopFacetPolygonSide: ShopFacet, shopFacetGotchichainSide: ShopFacet
  let aavegotchiFacetPolygonSide: AavegotchiFacet, aavegotchiFacetGotchichainSide: AavegotchiFacet
  let itemsFacetPolygonSide: ItemsFacet, itemsFacetGotchichainSide: ItemsFacet
  let ghstTokenPolygonSide: ERC20MintableBurnable, ghstTokenGotchichainSide: ERC20MintableBurnable
  let bridgeFacetPolygonSide: PolygonXGotchichainBridgeFacet, bridgeFacetGotchichainSide: PolygonXGotchichainBridgeFacet
  let aavegotchiGameFacetPolygonSide: AavegotchiGameFacet, aavegotchiGameFacetGotchichainSide: AavegotchiGameFacet
  let vrfFacetPolygonSide: VrfFacet, vrfFacetGotchichainSide: VrfFacet
  let daoFacetPolygonSide: DAOFacet, daoFacetGotchichainSide: DAOFacet

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    owner = (await ethers.getSigners())[0];
    alice = (await ethers.getSigners())[1];

    ; ({ shopFacet: shopFacetPolygonSide, aavegotchiFacet: aavegotchiFacetPolygonSide, polygonXGotchichainBridgeFacet: bridgeFacetPolygonSide, itemsFacet: itemsFacetPolygonSide, ghstToken: ghstTokenPolygonSide, aavegotchiGameFacet: aavegotchiGameFacetPolygonSide, vrfFacet: vrfFacetPolygonSide, daoFacet: daoFacetPolygonSide } = await deploySupernets())
    ; ({ shopFacet: shopFacetGotchichainSide, aavegotchiFacet: aavegotchiFacetGotchichainSide, polygonXGotchichainBridgeFacet: bridgeFacetGotchichainSide, itemsFacet: itemsFacetGotchichainSide, ghstToken: ghstTokenGotchichainSide, aavegotchiGameFacet: aavegotchiGameFacetGotchichainSide, vrfFacet: vrfFacetGotchichainSide, daoFacet: daoFacetGotchichainSide } = await deploySupernets())

    LZEndpointMock = await ethers.getContractFactory(LZEndpointMockCompiled.abi, LZEndpointMockCompiled.bytecode)
    const BridgePolygonSide = await ethers.getContractFactory("AavegotchiBridgePolygonSide");
    const BridgeGotchichainSide = await ethers.getContractFactory("AavegotchiBridgeGotchichainSide");

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
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 35000)
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 35000)

    await bridgePolygonSide.setDstChainIdToTransferGas(chainId_B, 1950000)
    await bridgeGotchichainSide.setDstChainIdToTransferGas(chainId_A, 1950000)

    //Set layer zero bridge on facet
    await daoFacetPolygonSide.addLayerZeroBridgeAddress(bridgePolygonSide.address)
    await daoFacetGotchichainSide.addLayerZeroBridgeAddress(bridgeGotchichainSide.address)

    return {
      shopFacetPolygonSide, aavegotchiFacetPolygonSide, bridgeFacetPolygonSide, itemsFacetPolygonSide,
      ghstTokenPolygonSide, aavegotchiGameFacetPolygonSide, vrfFacetPolygonSide, shopFacetGotchichainSide,
      aavegotchiFacetGotchichainSide, bridgeFacetGotchichainSide, itemsFacetGotchichainSide, ghstTokenGotchichainSide,
      aavegotchiGameFacetGotchichainSide, vrfFacetGotchichainSide
    }
  }

  beforeEach(async function () {
    ({
      shopFacetPolygonSide, aavegotchiFacetPolygonSide, bridgeFacetPolygonSide, itemsFacetPolygonSide,
      ghstTokenPolygonSide, aavegotchiGameFacetPolygonSide, vrfFacetPolygonSide, shopFacetGotchichainSide,
      aavegotchiFacetGotchichainSide, bridgeFacetGotchichainSide, itemsFacetGotchichainSide, ghstTokenGotchichainSide,
      aavegotchiGameFacetGotchichainSide, vrfFacetGotchichainSide
    } = await loadFixture(deployFixture));

    const minGasToTransferAndStorePolygonSide = await bridgePolygonSide.minDstGasLookup(chainId_B, 1)
    const transferGasPerTokenPolygonSide = await bridgePolygonSide.dstChainIdToTransferGas(chainId_B)

    const minGasToTransferAndStoreGotchichainSide = await bridgeGotchichainSide.minDstGasLookup(chainId_A, 1)
    const transferGasPerTokenGotchichainSide = await bridgeGotchichainSide.dstChainIdToTransferGas(chainId_A)

    polygonAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStorePolygonSide.add(transferGasPerTokenPolygonSide.mul(1))])
    gotchichainAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStoreGotchichainSide.add(transferGasPerTokenGotchichainSide.mul(1))])
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain - without equipped item", async function () {
    const tokenId = await mintPortals(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    const sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
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
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)


    //Swapping token back to Polygon
    nativeFee = (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, gotchichainAdapterParams)).nativeFee
    await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, tokenId)
    sendFromTx = await bridgeGotchichainSide.sendFrom(
      owner.address,
      chainId_A,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      gotchichainAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    //Token is now owned by the proxy contract on origin chain
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    //Token received on the dst chain
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain - with equipped item", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    //Swaping token to Gotchichain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
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

    console.log(await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))
    //Checking items balance after unequipping them
    expect((await itemsFacetGotchichainSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(80))
    expect((await itemsFacetGotchichainSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    const aavegotchiData = await aavegotchiFacetGotchichainSide.getAavegotchiData(tokenId)
    console.log({ aavegotchiData })
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain and back to Polygon - with equipped item", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    //Swaps token to other chain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
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
      gotchichainAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, gotchichainAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    //Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Checking items balance and equipped items before unequipping them
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0)
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    
    //Unequipping items
    await itemsFacetPolygonSide.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    //Checking items balance after unequipping them
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(80))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    const aavegotchiData = await aavegotchiFacetGotchichainSide.getAavegotchiData(tokenId)
    console.log({ aavegotchiData })
  })

  it("sendFrom() - send NFT from Polygon to Gotchichain and back to Polygon - equipping item on gotchichain", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    //Swapping token to gotchichain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
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
      gotchichainAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, gotchichainAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    //Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    //Checking equipped items and owner items balance before unequipping item
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([81, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0)

    //Unequipping items
    await itemsFacetPolygonSide.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    //Checking items balance after unequipping them
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(2)
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[1].itemId).to.be.equal(ethers.BigNumber.from(80))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[1].balance).to.be.equal(ethers.BigNumber.from(1))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].itemId).to.be.equal(ethers.BigNumber.from(81))
    expect((await itemsFacetPolygonSide.itemBalancesWithTypes(owner.address))[0].balance).to.be.equal(ethers.BigNumber.from(1))

    //Checking equipped items after unequipping them
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it("sendFrom() - send equipped NFT from Polygon to Gotchichain - equipping and unequipping on Gotchichain - send back to Polygon", async function () {
    const tokenId = await mintPortalsWithItems(owner.address)

    // Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, owner.address, tokenId, false, polygonAdapterParams)).nativeFee

    // Swapping token to gotchichain
    await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, tokenId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      owner.address,
      chainId_B,
      owner.address,
      tokenId,
      owner.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()

    // Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.equal(bridgePolygonSide.address)
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.be.equal(owner.address)

    // Checking equipped items and balance before purchase items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(0)

    // Purchasing item 2 on gotchichain
    await purchaseItems(ghstTokenGotchichainSide, shopFacetGotchichainSide, [81], [1])

    // Checking equipped items and balance after purchase items but before changing them
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetGotchichainSide.itemBalances(owner.address)).length).to.be.equal(1)

    // Equipping item 2 on slot 0 and removing item 1 from slot 3 on gotchichain
    const tx = await itemsFacetGotchichainSide.equipWearables(tokenId, [81, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    tx.wait()

    // Checking equipped items after changing items
    expect(await itemsFacetGotchichainSide.equippedWearables(tokenId)).to.eql([81, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
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
      gotchichainAdapterParams,
      { value: (await bridgeGotchichainSide.estimateSendFee(chainId_A, owner.address, tokenId, false, gotchichainAdapterParams)).nativeFee }
    )
    await sendFromTx.wait()

    // Checking Aavegotchi ownership in both chains
    expect(await aavegotchiFacetGotchichainSide.ownerOf(tokenId)).to.equal(bridgeGotchichainSide.address)
    expect(await aavegotchiFacetPolygonSide.ownerOf(tokenId)).to.be.equal(owner.address)

    // Checking equipped items
    expect(await itemsFacetPolygonSide.equippedWearables(tokenId)).to.eql([81, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect((await itemsFacetPolygonSide.itemBalances(owner.address)).length).to.be.equal(0) // item 1 from slot 3 were unequipped and sent to owner
  })

  async function mintPortals(to: string) {
    let tx = await shopFacetPolygonSide.mintPortals(to, 1)
    let receipt: any = await tx.wait()

    const tokenId = receipt.events[0].args._tokenId.toString()

    await vrfFacetPolygonSide.openPortals([tokenId]);
    await aavegotchiGameFacetPolygonSide.claimAavegotchi(tokenId, 0, ethers.utils.parseEther("10000"));

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
    await purchaseItems(ghstTokenGotchichainSide, shopFacetGotchichainSide, [81], [1])

    const tx = await itemsFacetGotchichainSide.equipWearables(tokenId, [81, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
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