/* global describe it before ethers network */
/* eslint prefer-const: "off" */

const { upgradePetOperator } = require('../scripts/upgrades/upgrade-petOperator.js')
const { expect } = require('chai')

async function impersonate (address, contract) {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  })
  let signer = await ethers.getSigner(address)
  contract = contract.connect(signer)
  return contract
}

describe('Testing Pet Operator Upgrade', async function () {
  this.timeout(300000)
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let aavegotchiFacet
  let aavegotchiGameFacet
  let bridgeFacet
  let petOperator
  let firstOwner
  let secondOwner
  let thirdOwner
  let tokenIdOne
  let tokenIdTwo
  let tokenIdThree
  let ghst

  // this.timeout(300000)
  before(async function () {

    await hre.network.provider.request({
      method: 'hardhat_reset',
      params: [{
        forking: {
          jsonRpcUrl: process.env.MATIC_URL
        }
      }]
    })

    await upgradePetOperator()
    // await network.provider.request({
    //   method: 'hardhat_reset',
    //   params: [{
    //     forking: {
    //       jsonRpcUrl: process.env.MATIC_URL
    //       // blockNumber: 11095000
    //     }
    //   }]
    // })
    ghst = await ethers.getContractAt('IERC20', '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7')
    aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress)
    aavegotchiGameFacet = await ethers.getContractAt('AavegotchiGameFacet', diamondAddress)
    bridgeFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet', diamondAddress)
    tokenIdOne = 6335
    firstOwner = await aavegotchiFacet.ownerOf(tokenIdOne)
    petOperator = firstOwner
    tokenIdTwo = 5535
    secondOwner = await aavegotchiFacet.ownerOf(tokenIdTwo)
    tokenIdThree = 5790
    thirdOwner = await aavegotchiFacet.ownerOf(tokenIdThree)
  })
  it('Transfer Aavegotchi', async function () {
    aavegotchiFacet = await impersonate(firstOwner, aavegotchiFacet)

    console.log('First owner:', firstOwner)
    console.log('Second owner:', secondOwner)
    expect(firstOwner).to.not.equal(secondOwner)
    const tx = await aavegotchiFacet.transferFrom(firstOwner, secondOwner, tokenIdOne)
    console.log('Transfer aavegotchi tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`)
    }
    console.log('Transfer completed:', tx.hash)
    expect(await aavegotchiFacet.ownerOf(tokenIdOne)).to.equal(secondOwner)
  })

  it('Set Pet Operator', async function () {
    aavegotchiGameFacet = await impersonate(secondOwner, aavegotchiGameFacet)

    const tx = await aavegotchiGameFacet.setPetOperator(petOperator, [tokenIdOne, tokenIdTwo])
    console.log('Set pet operator')
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    console.log('Transaction completed')
    const tokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(petOperator)).map(x => x.toNumber())
    expect(tokenIds).to.have.members([tokenIdOne, tokenIdTwo])
  })

  it('Petting aavegotchis', async function () {
    aavegotchiGameFacet = await impersonate(petOperator, aavegotchiGameFacet)

    let petOperatorShare = ethers.BigNumber.from(ethers.utils.parseEther("0.2"))
    let pixelcraftShare = ethers.BigNumber.from(ethers.utils.parseEther("0.1"))

    let operatorOldBal = ethers.BigNumber.from(await ghst.balanceOf(petOperator))
    let ownerOldBal = ethers.BigNumber.from(await ghst.balanceOf(secondOwner))
 
    
    console.log('PO Balance:', ethers.utils.formatEther(operatorOldBal))
    console.log('Owner Balance:', ethers.utils.formatEther(ownerOldBal))

    const tx = await aavegotchiGameFacet.pet()
    console.log('Pet aavegotchi')
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    console.log('Transaction completed:', tx.hash)
    let operatorNewBal = ethers.BigNumber.from(await ghst.balanceOf(firstOwner))
    let ownerNewBal = ethers.BigNumber.from(await ghst.balanceOf(secondOwner))

    //The operator earns 0.2 GHST per Pet
    expect(operatorNewBal).to.equal(operatorOldBal.add(petOperatorShare))

    //The Owner spends 0.3 GHST per pet
    expect(ownerNewBal).to.equal(ownerOldBal.sub(petOperatorShare).sub(pixelcraftShare))
    
    console.log('PO Balance:', ethers.utils.formatEther(operatorNewBal))
    console.log('Owner Balance:', ethers.utils.formatEther(ownerNewBal))
  })

  it('Remove pet operator by transfer', async function () {
    const tokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(tokenIds).to.have.members([tokenIdOne, tokenIdTwo])

    const petOperator = await aavegotchiGameFacet.petOperator(tokenIdOne)

    expect(petOperator).to.equal(firstOwner)

    aavegotchiFacet = await impersonate(secondOwner, aavegotchiFacet)

    const tx = await aavegotchiFacet.transferFrom(secondOwner, thirdOwner, tokenIdOne)
    console.log('Transfer aavegotchi tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    const newTokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(newTokenIds).to.have.members([tokenIdTwo])

    const newPetOperator = await aavegotchiGameFacet.petOperator(tokenIdOne)

    expect(newPetOperator).to.equal(ethers.constants.AddressZero)
  })

  it('Bridge Aavegotchi', async function () {
    const petOperator = await aavegotchiGameFacet.petOperator(tokenIdTwo)

    expect(petOperator).to.equal(firstOwner)

    bridgeFacet = await impersonate(secondOwner, bridgeFacet)

    const tx = await bridgeFacet.withdrawAavegotchiBatch([tokenIdTwo])
    console.log('Bridge aavegotchi')
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    const newPetOperator = await aavegotchiGameFacet.petOperator(tokenIdTwo)

    expect(newPetOperator).to.equal(firstOwner)

    expect(await aavegotchiFacet.ownerOf(tokenIdTwo)).to.equal(diamondAddress)
  })
})
