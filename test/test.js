/* global describe it before */
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const truffleAssert = require('truffle-assertions')
// const { idText } = require('typescript')

// eslint-disable-next-line no-unused-vars
// const { expect } = require('chai')

// import ERC721 from '../artifacts/ERC721.json'
// import { ethers } from 'ethers'

// const { deployProject } = require('../scripts/deploy-ganache.js')

const { deployProject } = require('../scripts/deploy.js')
const { wearableTypes } = require('../scripts/wearableTypes.js')

describe('Deploying Contracts, SVG and Minting Aavegotchis', function () {
  // let svgStorage
  // let ghstDiamond
  let aavegotchiDiamond
  let ghstDiamond
  let aavegotchiFacet
  let wearablesFacet
  let escrowFacet
  let account

  let testAavegotchiId = "0"
  let testWearableId = "1"
  let testSlot = "3"
  // let erc721
  // let account

  before(async function () {
    const deployVars = await deployProject()
    account = deployVars.account
    aavegotchiDiamond = deployVars.aavegotchiDiamond
    aavegotchiFacet = deployVars.aavegotchiFacet
    wearablesFacet = deployVars.wearablesFacet
    escrowFacet = deployVars.escrowFacet
    ghstDiamond = deployVars.ghstDiamond
  })

  it('Should mint 10,000 GHST tokens', async function () {
    await ghstDiamond.mint()
    const balance = await ghstDiamond.balanceOf(account)
    expect(balance).to.equal('10000000000000000000000')
  })

  it('Should show all whitelisted collaterals', async function () {
    const collaterals = await escrowFacet.getCollateralInfo()
    const collateral = collaterals[0]
    expect(collateral.conversionRate).to.equal(500)
    expect(collaterals.length).to.equal(7)
    expect(collateral.modifiers[2]).to.equal(-1)
  })

  it('Should purchase one portal', async function () {
    const balance = await ghstDiamond.balanceOf(account)
    await ghstDiamond.approve(aavegotchiDiamond.address, balance)
    const buyAmount = (100 * Math.pow(10, 18)).toFixed() // 1 portal
    await aavegotchiFacet.buyPortals(buyAmount)
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals.length).to.equal(1)
  })

  it('Should open the portal', async function () {
    let myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals[0].status).to.equal(0)
    const portalId = myPortals[0].tokenId
    await aavegotchiFacet.openPortal(portalId)
    myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals[0].status).to.equal(1)
  })

  it('Should contain 10 random ghosts in the portal', async function () {
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    const ghosts = await aavegotchiFacet.portalAavegotchiTraits(myPortals[0].tokenId)
    ghosts.forEach(async (ghost) => {
      const rarityScore = await aavegotchiFacet.calculateBaseRarityScore(ghost.numericTraits, ghost.collateralType)
      expect(Number(rarityScore)).to.greaterThan(298)
      expect(Number(rarityScore)).to.lessThan(602)
    })
    expect(ghosts.length).to.equal(10)
  })

  /*
  it('Should show SVGs', async function () {
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    const svgs = await aavegotchiFacet.portalAavegotchisSvg(tokenId)
    console.log('svgs:', svgs[0])
    expect(svgs.length).to.equal(10)
  })
  */

  it('Should claim an Aavegotchi', async function () {
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    //  console.log('my portals:', myPortals)
    const tokenId = myPortals[0].tokenId
    const ghosts = await aavegotchiFacet.portalAavegotchiTraits(tokenId)
    const selectedGhost = ghosts[4]
    const minStake = selectedGhost.minimumStake
    await aavegotchiFacet.claimAavegotchiFromPortal(tokenId, 4, minStake)

    const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId)
    const collateral = aavegotchi.collateral
    expect(selectedGhost.collateralType).to.equal(collateral)
    expect(aavegotchi.status).to.equal(2)
    expect(aavegotchi.stakedAmount).to.equal(minStake)
  })

  it('Should set a name', async function () {
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    await aavegotchiFacet.setAavegotchiName(tokenId, 'Beavis')
    const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId)
    expect(aavegotchi.name).to.equal('Beavis')
  })

  it('Should show correct rarity score', async function () {
    const myPortals = await aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId)
    const score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(599)

    const multiplier = await aavegotchiFacet.calculateRarityMultiplier([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(multiplier).to.equal(1000)

    // Todo: Clientside calculate what the rarity score should be
  })

  it('Can increase stake', async function () {
    let aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    const currentStake = BigNumber.from(aavegotchi.stakedAmount)

    // Let's double the stake
    await escrowFacet.increaseStake('0', currentStake.toString())
    aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    const finalStake = BigNumber.from(aavegotchi.stakedAmount)
    expect(finalStake).to.equal(currentStake.add(currentStake))

    // Todo: Balance check
  })

  it('Can decrease stake, but not below minimum', async function () {
    let aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    let currentStake = BigNumber.from(aavegotchi.stakedAmount)
    const minimumStake = BigNumber.from(aavegotchi.minimumStake)

    const available = currentStake.sub(minimumStake)
    await escrowFacet.decreaseStake('0', available)

    aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    currentStake = BigNumber.from(aavegotchi.stakedAmount)

    expect(currentStake).to.equal(minimumStake)

    // Todo: Below min stake Revert check
    // Todo: Balance check
  })

  it('Contract Owner (Later DAO) can update collateral modifiers', async function () {
    const aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    let score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(599)
    await escrowFacet.updateCollateralModifiers(aavegotchi.collateral, [2, 0, 0, 0, 0, 0])
    score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(602)
  })

  /*
  it('Can decrease stake and destroy Aavegotchi', async function () {
    // To do: burn Aavegotchi
  })
  */

  it('Can mint wearables', async function () {

    let balance = await wearablesFacet.balanceOf(account, "0")
    expect(balance).to.equal(0)
    await truffleAssert.reverts(wearablesFacet.mintWearables(["3"], ["10"]), "WearablesFacet: Wearable does not exist")
    await truffleAssert.reverts(wearablesFacet.mintWearables(["0"], ["10"]), "WearablesFacet: Total quantity exceeds max quantity")
    await wearablesFacet.mintWearables([testWearableId], ["10"])
    balance = await wearablesFacet.balanceOf(account, testWearableId)
    expect(balance).to.equal(10)
  })

  it('Can transfer wearables to Aavegotchi', async function () {
    await wearablesFacet.transferToParent(
      account,  //address _from,
      aavegotchiFacet.address, // address _toContract,
      testAavegotchiId,  //uint256 _toTokenId,
      testWearableId, // uint256 _id,
      "10" // uint256 _value
    )
    const balance = await wearablesFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, testWearableId)
    expect(balance).to.equal(10)
  })

  it('Can transfer wearables from Aavegotchi back to owner', async function () {
    await wearablesFacet.transferFromParent(
      aavegotchiFacet.address, //address _fromContract,
      testAavegotchiId, //uint256 _fromTokenId,
      account, //address _to,
      testWearableId, //uint256 _id,
      "10" //uint256 _value
    )
    const balance = await wearablesFacet.balanceOf(account, testWearableId)
    expect(balance).to.equal(10)
  })

  it('Can equip wearables', async function () {
    //First transfer wearables to parent Aavegotchi
    await wearablesFacet.transferToParent(
      account, aavegotchiFacet.address, testAavegotchiId, testWearableId, "10")
    expect(await wearablesFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, testWearableId)).to.equal(10)

    //Now let's equip
    await wearablesFacet.equipWearables(testAavegotchiId, [testWearableId], [testSlot])
    const equipped = await wearablesFacet.equippedWearables(testAavegotchiId)

    expect(equipped.length).to.equal(11)
    //First item in array is 1 because that wearable has been equipped
    expect(equipped[testSlot]).to.equal(testWearableId)
  })

  it('Cannot equip wearables in the wrong slot', async function () {
    await truffleAssert.reverts(wearablesFacet.equipWearables(testAavegotchiId, [testWearableId], ["4"]), "WearablesFacet: Cannot be equipped in this slot")
  })

  it('Can de-equip wearables', async function () {
    await wearablesFacet.unequipWearables(testAavegotchiId, [testSlot])
    const equipped = await wearablesFacet.equippedWearables(testAavegotchiId)

    expect(equipped.length).to.equal(11)
    expect(equipped[testSlot]).to.equal(0)
  })

  it('Equipping Wearables alters base rarity score', async function () {

    //Wearables sanity check
    let equipped = await wearablesFacet.equippedWearables(testAavegotchiId)
    expect(equipped[testSlot]).to.equal(0)
    let originalScore = await aavegotchiFacet.calculateModifiedRarityScore(testAavegotchiId)

    //Equip a wearable
    await wearablesFacet.equipWearables(testAavegotchiId, [testWearableId], [testSlot])

    //Calculate bonuses
    const modifiers = wearableTypes[testWearableId].traitModifiers
    let wearableTraitsBonus = 0
    const rarityScoreModifier = wearableTypes[testWearableId].rarityScoreModifier
    modifiers.forEach((val) => { wearableTraitsBonus += val });

    //Retrieve the final score
    let augmentedScore = await aavegotchiFacet.calculateModifiedRarityScore(testAavegotchiId)
    expect(augmentedScore).to.equal(Number(originalScore) + rarityScoreModifier + wearableTraitsBonus)
  })

  it('Can equip multi-slot wearables', async function () {
    const multiSlotWearableId = "2"
    await wearablesFacet.mintWearables([multiSlotWearableId], ["10"])

    await wearablesFacet.transferToParent(
      account, aavegotchiFacet.address, testAavegotchiId, multiSlotWearableId, "10")
    await wearablesFacet.equipWearables(testAavegotchiId, [multiSlotWearableId], ["9"])
    const equipped = await wearablesFacet.equippedWearables(testAavegotchiId)

    //This wearable gets equipped in the ninth slot, which takes up 0&1 slots
    expect(equipped[9]).to.equal("2")

  })

  /*

  it('Can calculate kinship according to formula', async function () {
    // First interact

    await aavegotchiFacet.interact('0')
    await aavegotchiFacet.interact('0')
    await aavegotchiFacet.interact('0')
    await aavegotchiFacet.interact('0')
    await aavegotchiFacet.interact('0')
    let kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* 5 initial Interactions, kinship is:', kinship.toString())
    // 5 interactions + 1 streak bonus
    // expect(kinship).to.equal(55)

    // Go 3 days without interacting
    ethers.provider.send('evm_increaseTime', [3 * 86400])
    ethers.provider.send('evm_mine')

    kinship = await aavegotchiFacet.calculateKinship('0')
    // Took three days off and lost streak bonus
    console.log('* 3 days w/ no interaction, kinship is:', kinship.toString())

    //  expect(kinship).to.equal(49)

    // await aavegotchiFacet.interact("0")
    // kinship = await aavegotchiFacet.calculateKinship("0")
    // expect(kinship).to.equal(53)

    // Take a longggg break

    ethers.provider.send('evm_increaseTime', [14 * 86400])
    ethers.provider.send('evm_mine')

    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Another 14 days since last interaction, total 17 days. Kinship is', kinship.toString())

    ethers.provider.send('evm_increaseTime', [20 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* 37 days since last interaction, kinship is:', kinship.toString())
    // expect(kinship).to.equal(13)

    await aavegotchiFacet.interact('0')
    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Kinship after first interaction is:', kinship.toString())

    await aavegotchiFacet.interact('0')
    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Kinship after second interaction is:', kinship.toString())

    await aavegotchiFacet.interact('0')
    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Kinship after third interaction is:', kinship.toString())

    console.log('* Interact 120 times')

    for (let index = 0; index < 120; index++) {
      await aavegotchiFacet.interact('0')
    }

    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Kinship is:', kinship.toString())

    ethers.provider.send('evm_increaseTime', [80 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await aavegotchiFacet.calculateKinship('0')

    let aavegotchi = await aavegotchiFacet.getAavegotchi('0')

    console.log('* Go away for 80 days. Kinship is: ', kinship.toString())
    console.log('Interaction count is:', aavegotchi.interactionCount.toString())

    await aavegotchiFacet.interact('0')
    kinship = await aavegotchiFacet.calculateKinship('0')
    console.log('* Interact after 80 days. Kinship is: ', kinship.toString())
    aavegotchi = await aavegotchiFacet.getAavegotchi('0')
    console.log('Interaction count is:', aavegotchi.interactionCount.toString())

    // expect(aavegotchi.interactionCount).to.equal(4)
  })


  */
})
