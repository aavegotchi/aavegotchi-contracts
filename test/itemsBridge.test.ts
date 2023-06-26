import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AavegotchiFacet, ItemsBridgeGotchichainSide, ItemsBridgePolygonSide, ERC20MintableBurnable, ItemsFacet, PolygonXGotchichainBridgeFacet, ShopFacet } from "../typechain";
const LZEndpointMockCompiled = require("@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json")

import deploySupernets from "../scripts/deploy-supernet";

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

    ; ({ shopFacet: shopFacetPolygonSide, aavegotchiFacet: aavegotchiFacetPolygonSide, polygonXGotchichainBridgeFacet: bridgeFacetPolygonSide, itemsFacet: itemsFacetPolygonSide, ghstToken: ghstTokenPolygonSide } = await deploySupernets())
    ; ({ shopFacet: shopFacetGotchichainSide, aavegotchiFacet: aavegotchiFacetGotchichainSide, polygonXGotchichainBridgeFacet: bridgeFacetGotchichainSide, itemsFacet: itemsFacetGotchichainSide, ghstToken: ghstTokenGotchichainSide } = await deploySupernets())

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
    const tokenId = 80
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
    expect(itemBalancesGotchichain[0].itemId).to.be.equal(ethers.BigNumber.from(80));
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
    expect(itemBalancesPolygon[0].itemId).to.be.equal(ethers.BigNumber.from(80));
    expect(itemBalancesPolygon[0].balance).to.be.equal(ethers.BigNumber.from(1));
  })

  it("sendBatchFrom() - Sending 3 items from Polygon to Gotchichain and then back to Polygon", async function () {
    //Minting Items
    const tokenIds = ['80', '81']
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
    expect(await itemsFacetGotchichainSide.balanceOf(owner.address, 80)).to.be.equal(1);
    expect(await itemsFacetGotchichainSide.balanceOf(owner.address, 81)).to.be.equal(1);

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
    expect(await itemsFacetPolygonSide.balanceOf(owner.address, 80)).to.be.equal(1);
    expect(await itemsFacetPolygonSide.balanceOf(owner.address, 81)).to.be.equal(1);
  })
})
