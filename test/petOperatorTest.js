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
  let firstOwner
  let secondOwner
  let tokenIdOne
  let tokenIdTwo
  let ghst

  // this.timeout(300000)
  before(async function () {
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
    tokenIdOne = 6335
    firstOwner = await aavegotchiFacet.ownerOf(tokenIdOne)
    tokenIdTwo = 5535
    secondOwner = await aavegotchiFacet.ownerOf(tokenIdTwo)
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

  it('Add Petter', async function () {
    aavegotchiGameFacet = await impersonate(secondOwner, aavegotchiGameFacet)

    const tx = await aavegotchiGameFacet.addPetOperator(firstOwner, [tokenIdOne, tokenIdTwo])
    console.log('Transfer aavegotchi tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`)
    }
    console.log('Transfer completed:', tx.hash)
    const tokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(tokenIds).to.have.members([tokenIdOne, tokenIdTwo])
  })

  it('Petting aavegotchis', async function () {
    aavegotchiGameFacet = await impersonate(firstOwner, aavegotchiGameFacet)

    let bal = await ghst.balanceOf(firstOwner)
    console.log('firstOwner Balance:', ethers.utils.formatEther(bal))
    const tx = await aavegotchiGameFacet.pet()
    console.log('Transfer aavegotchi tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`)
    }
    console.log('Transfer completed:', tx.hash)
    bal = await ghst.balanceOf(firstOwner)
    console.log('firstOwner Balance:', ethers.utils.formatEther(bal))
  })

  it('Remove pet operator by transfer', async function () {
    const tokenIds = (await aavegotchiGameFacet.petOperatorTokenIds(firstOwner)).map(x => x.toNumber())
    expect(tokenIds).to.have.members([tokenIdOne, tokenIdTwo])

    aavegotchiFacet = await impersonate(secondOwner, aavegotchiFacet)

    let bal = await ghst.balanceOf(firstOwner)
    console.log('firstOwner Balance:', ethers.utils.formatEther(bal))
    const tx = await aavegotchiGameFacet.pet()
    console.log('Transfer aavegotchi tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transfer failed: ${tx.hash}`)
    }
    console.log('Transfer completed:', tx.hash)
    bal = await ghst.balanceOf(firstOwner)
    console.log('firstOwner Balance:', ethers.utils.formatEther(bal))
  })
})
