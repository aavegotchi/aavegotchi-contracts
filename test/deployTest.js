/* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')
const { getCollaterals } = require('../scripts/collateralTypes.js')
const { modifyWithAavegotchiSets } = require('../scripts/offchainProcessing.js')
// const { idText } = require('typescript')

// eslint-disable-next-line no-unused-vars
// const { expect } = require('chai')

// import ERC721 from '../artifacts/ERC721.json'
// import { ethers } from 'ethers'

// const { deployProject } = require('../scripts/deploy-ganache.js')

const { deployProject } = require('../scripts/deploy.js')
const { itemTypes } = require('../scripts/itemTypes.js')

// numBytes is how many bytes of the uint that we care about
function uintToInt8Array (uint, numBytes) {
  uint = ethers.utils.hexZeroPad(uint.toHexString(), numBytes).slice(2)
  const array = []
  for (let i = 0; i < uint.length; i += 2) {
    array.unshift(ethers.BigNumber.from('0x' + uint.substr(i, 2)).fromTwos(8).toNumber())
  }
  return array
}

function sixteenBitArrayToUint (array) {
  const uint = []
  for (let item of array) {
    if (typeof item === 'string') {
      item = parseInt(item)
    }
    uint.push(item.toString(16).padStart(4, '0'))
  }
  if (array.length > 0) return ethers.BigNumber.from('0x' + uint.join(''))
  return ethers.BigNumber.from(0)
}

function sixteenBitIntArrayToUint (array) {
  const uint = []
  for (let item of array) {
    if (typeof item === 'string') {
      item = parseInt(item)
    }
    if (item < 0) {
      item = (1 << 16) + item
    }
    // console.log(item.toString(16))
    uint.push(item.toString(16).padStart(4, '0'))
  }
  if (array.length > 0) return ethers.BigNumber.from('0x' + uint.join(''))
  return ethers.BigNumber.from(0)
}

function uintToItemIds (uint) {
  uint = ethers.utils.hexZeroPad(uint.toHexString(), 32).slice(2)
  const array = []
  for (let i = 0; i < uint.length; i += 4) {
    array.unshift(ethers.BigNumber.from('0x' + uint.substr(i, 4)).fromTwos(16).toNumber())
  }
  return array
}

const testAavegotchiId = '0'
const testWearableId = '1'
const testSlot = '3'

describe('Deploying Contracts, SVG and Minting Aavegotchis', async function () {
  this.timeout(300000)
  before(async function () {
    const deployVars = await deployProject('deployTest')
    global.set = true
    global.account = deployVars.account
    global.aavegotchiDiamond = deployVars.aavegotchiDiamond
    global.bridgeFacet = deployVars.bridgeFacet
    global.aavegotchiFacet = deployVars.aavegotchiFacet
    global.aavegotchiGameFacet = deployVars.aavegotchiGameFacet
    global.itemsFacet = deployVars.itemsFacet
    global.itemsTransferFacet = deployVars.itemsTransferFacet
    global.collateralFacet = deployVars.collateralFacet
    global.shopFacet = deployVars.shopFacet
    global.daoFacet = deployVars.daoFacet
    global.ghstTokenContract = deployVars.ghstTokenContract
    global.vrfFacet = deployVars.vrfFacet
    global.svgFacet = deployVars.svgFacet
    global.linkAddress = deployVars.linkAddress
    global.linkContract = deployVars.linkContract
    global.diamondLoupeFacet = deployVars.diamondLoupeFacet
    global.metaTransactionsFacet = deployVars.metaTransactionsFacet
  })
  it('Should mint 10,000,000 GHST tokens', async function () {
    await global.ghstTokenContract.mint()
    const balance = await global.ghstTokenContract.balanceOf(global.account)
    const oneMillion = ethers.utils.parseEther('10000000')
    expect(balance).to.equal(oneMillion)
  })
})

describe('Buying Portals, VRF', function () {
  it('Portal should cost 100 GHST', async function () {
    const balance = await ghstTokenContract.balanceOf(account)
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance)
    const buyAmount = (50 * Math.pow(10, 18)).toFixed() // 1 portal
    await truffleAssert.reverts(shopFacet.buyPortals(account, buyAmount), 'Not enough GHST to buy portals')
  })

  it('Should purchase portal', async function () {
    const balance = await ghstTokenContract.balanceOf(account)
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance)
    const buyAmount = ethers.utils.parseEther('500') // 1 portals
    const tx = await global.shopFacet.buyPortals(account, buyAmount)
    const receipt = await tx.wait()

    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals.length).to.equal(5)
  })
})

describe('Opening Portals', async function () {
  it('Should open the portal', async function () {
    let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals[0].status).to.equal(0)
    //  const portalId = myPortals[0].tokenId
    await global.vrfFacet.openPortals(['0', '1', '2', '3'])

    // const randomness = ethers.utils.keccak256(new Date().getMilliseconds())

    // await global.vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)

    myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals[0].status).to.equal(2)
  })

  it('Should contain 10 random ghosts in the portal', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    const ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(myPortals[0].tokenId)
    // console.log(JSON.stringify(ghosts, null, 4))
    ghosts.forEach(async (ghost) => {
      const rarityScore = await global.aavegotchiGameFacet.baseRarityScore(ghost.numericTraits)
      expect(Number(rarityScore)).to.greaterThan(298)
      expect(Number(rarityScore)).to.lessThan(602)
    })
    expect(ghosts.length).to.equal(10)
  })

  /*
  it('Should show SVGs', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    const svgs = await global.svgFacet.portalAavegotchisSvg(tokenId)
    console.log('svgs:', svgs[0])
    expect(svgs.length).to.equal(10)
  })
  */

  it('Can only set name on claimed Aavegotchi', async function () {
    await truffleAssert.reverts(aavegotchiGameFacet.setAavegotchiName('1', 'Portal'), 'AavegotchiGameFacet: Must claim Aavegotchi before setting name')
  })

  it('Should claim an Aavegotchi', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    //  console.log('my portals:', myPortals)
    const tokenId = myPortals[0].tokenId
    const ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(tokenId)
    const selectedGhost = ghosts[4]
    const minStake = selectedGhost.minimumStake
    await global.aavegotchiGameFacet.claimAavegotchi(tokenId, 4, minStake)
    const kinship = await global.aavegotchiGameFacet.kinship(tokenId)

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId)

    const collateral = aavegotchi.collateral
    expect(selectedGhost.collateralType).to.equal(collateral)
    expect(aavegotchi.status).to.equal(3)
    expect(aavegotchi.hauntId).to.equal(0)
    expect(aavegotchi.stakedAmount).to.equal(minStake)
    expect(kinship).to.equal(50)
  })
})

describe('Aavegotchi Metadata', async function () {
  it('Should set a name', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    await truffleAssert.reverts(aavegotchiGameFacet.setAavegotchiName(tokenId, 'ThisIsLongerThan25CharsSoItWillRevert'), "LibAavegotchi: name can't be greater than 25 characters")
    await global.aavegotchiGameFacet.setAavegotchiName(tokenId, 'Beavis')
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId)
    expect(aavegotchi.name).to.equal('Beavis')
  })

  it('Should show correct rarity score', async function () {
    const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    const tokenId = myPortals[0].tokenId
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId)
    console.log('collateral:' + aavegotchi.collateral)
    // 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
    // console.log('traits:')
    // for (const trait of aavegotchi.numericTraits) {
    //   console.log(trait.toString())
    // }
    const score = await global.aavegotchiGameFacet.baseRarityScore([0, 0, 0, -1, 0, 0])
    expect(score).to.equal(601)

    const multiplier = await global.aavegotchiGameFacet.rarityMultiplier([0, 0, 0, -1, 0, 0])
    expect(multiplier).to.equal(1000)

    // Todo: Clientside calculate what the rarity score should be
  })
})

describe('Collaterals and escrow', async function () {
  it('Should show all whitelisted collaterals', async function () {
    const collaterals = await global.collateralFacet.getCollateralInfo()
    const collateral = collaterals[0].collateralTypeInfo
    expect(collateral.conversionRate).to.equal(1)
    expect(collaterals.length).to.equal(1)
    // const modifiers = uintToInt8Array(collateral.modifiers, 6)
    expect(collateral.modifiers[2]).to.equal(-1)
  })

  it('Can increase stake', async function () {
    let aavegotchi = await global.aavegotchiFacet.getAavegotchi('0')
    const currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount)
    // Let's double the stake
    await global.collateralFacet.increaseStake('0', currentStake.toString())
    aavegotchi = await global.aavegotchiFacet.getAavegotchi('0')
    const finalStake = ethers.BigNumber.from(aavegotchi.stakedAmount)
    expect(finalStake).to.equal(currentStake.add(currentStake))

    // Todo: Balance check
  })

  it('Can decrease stake, but not below minimum', async function () {
    let aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    let currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount)
    const minimumStake = ethers.BigNumber.from(aavegotchi.minimumStake)

    const available = currentStake.sub(minimumStake)
    await truffleAssert.reverts(collateralFacet.decreaseStake(testAavegotchiId, currentStake), 'CollateralFacet: Cannot reduce below minimum stake')
    await global.collateralFacet.decreaseStake(testAavegotchiId, available)

    aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    currentStake = ethers.BigNumber.from(aavegotchi.stakedAmount)
    expect(currentStake).to.equal(minimumStake)
  })

  it('Base rarity score can handle negative numbers', async function () {
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi('0')
    // console.log(sixteenBitIntArrayToUint([-1, -1, 0, 0, 0, 0]).toHexString())
    const score = await global.aavegotchiGameFacet.baseRarityScore([-10, -10, 0, 0, 0, 0])
    expect(score).to.equal(620)
  })

  it('Can decrease stake and destroy Aavegotchi', async function () {
    // Buy portal
    const buyAmount = (100 * Math.pow(10, 18)).toFixed() // 1 portal
    await global.shopFacet.buyPortals(account, buyAmount)

    let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals.length).to.equal(6)

    console.log('my portals:', myPortals.length)
    // Open portal

    const initialBalance = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account))
    // await openAndClaim(['1'])

    const id = '1'
    const ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(id)
    const selectedGhost = ghosts[0]
    const minStake = selectedGhost.minimumStake
    console.log('min stake:', minStake)

    // Claim ghost and stake
    await global.aavegotchiGameFacet.claimAavegotchi(id, 0, minStake)
    //  await claimGotchis[id]

    // Burn Aavegotchi and return collateral stake
    await global.collateralFacet.decreaseAndDestroy('1', '1')
    const balanceAfterDestroy = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account))
    expect(balanceAfterDestroy).to.equal(initialBalance)

    // Should only have 1 portal now
    myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    expect(myPortals.length).to.equal(5)
  })

  it('Can destroy Aavegotchi and transfer XP to another', async function () {
    const burnId = '2'
    const receiveId = '3'

    let id = '2'
    let ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(id)
    let selectedGhost = ghosts[0]
    let minStake = selectedGhost.minimumStake
    console.log('min stake:', minStake)
    // Claim ghost and stake
    await global.aavegotchiGameFacet.claimAavegotchi(id, 0, minStake)

    id = '3'
    ghosts = await global.aavegotchiGameFacet.portalAavegotchiTraits(id)
    selectedGhost = ghosts[0]
    minStake = selectedGhost.minimumStake
    console.log('min stake:', minStake)
    // Claim ghost and stake
    await global.aavegotchiGameFacet.claimAavegotchi(id, 0, minStake)

    //   await openAndClaim([burnId, receiveId])
    const initialExperience = (await aavegotchiFacet.getAavegotchi(receiveId)).experience
    expect(initialExperience).to.equal(0)

    // Give some experience to the burned one
    await daoFacet.grantExperience([burnId], ['1000'])

    // Perform essence transfer
    await global.collateralFacet.decreaseAndDestroy(burnId, receiveId)
    const finalExperience = (await aavegotchiFacet.getAavegotchi(receiveId)).experience
    expect(finalExperience).to.equal(1000)
  })
})

describe('Items & Wearables', async function () {
  it('Shows item URI', async function () {
    const uri = await global.itemsFacet.uri(testWearableId)
    expect(uri).to.equal('https://aavegotchi.com/metadata/items/1')
  })

  it('Returns item SVG', async function () {
    const svg = await global.svgFacet.getItemSvg(testWearableId)
    // console.log('svg:', svg)
    expect(svg).not.to.equal('')
  })

  it('Can mint items', async function () {
    let balance = await global.itemsFacet.balanceOf(account, '0')
    expect(balance).to.equal(0)
    // To do: Get max length of wearables array

    //  await truffleAssert.reverts(itemsFacet.mintItems(account, ['8'], ['10']), 'itemsFacet: Wearable does not exist')
    await truffleAssert.reverts(daoFacet.mintItems(account, ['0'], ['10']), 'DAOFacet: Total item type quantity exceeds max quantity')
    await global.daoFacet.mintItems(account, [testWearableId], ['10'])
    balance = await global.itemsFacet.balanceOf(account, testWearableId)
    expect(balance).to.equal(10)

    // await global.daoFacet.mintItems(account, [62], ['10'])

    // const result = await global.itemsFacet.itemBalancesWithSlots(account)
    // console.log(result)
  })

  it('Can transfer wearables to Aavegotchi', async function () {
    await global.itemsTransferFacet.transferToParent(
      global.account, // address _from,
      global.aavegotchiFacet.address, // address _toContract,
      testAavegotchiId, // uint256 _toTokenId,
      testWearableId, // uint256 _id,
      '10' // uint256 _value
    )
    const balance = await global.itemsFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, testWearableId)
    expect(balance).to.equal(10)
  })

  it('Can transfer wearables from Aavegotchi back to owner', async function () {
    await global.itemsTransferFacet.transferFromParent(
      global.aavegotchiFacet.address, // address _fromContract,
      testAavegotchiId, // uint256 _fromTokenId,
      global.account, // address _to,
      testWearableId, // uint256 _id,
      '10' // uint256 _value
    )
    const balance = await global.itemsFacet.balanceOf(account, testWearableId)
    expect(balance).to.equal(10)
  })

  it('Can equip wearables', async function () {
    // First transfer wearables to parent Aavegotchi
    await global.itemsTransferFacet.transferToParent(
      global.account, global.aavegotchiFacet.address, testAavegotchiId, testWearableId, '10')
    expect(await global.itemsFacet.balanceOfToken(aavegotchiFacet.address, testAavegotchiId, testWearableId)).to.equal(10)

    const wearableIds = [0, 0, 0, testWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    // console.log(wearableIds.toString())
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds)
    const equipped = await global.itemsFacet.equippedWearables(testAavegotchiId)

    expect(equipped.length).to.equal(16)
    // First item in array is 1 because that wearable has been equipped
    expect(equipped[testSlot].toString()).to.equal(testWearableId)
  })

  it('Can modify aavegotchi traits with wearable sets', async function () {
    // {
    //   name: 'Socialite',
    //   wearableIds: [97, 98, 99, 100],
    //   traitsBonuses: [5, 2, 0, -1, 0],
    //   allowedCollaterals: []
    // },
    await global.daoFacet.mintItems(account, [97, 98, 99, 100], [5, 5, 5, 5])
    // fourth slot, third slot, second slot, first slot
    // const wearableIds = [100, 99, 97, 0, 0, 98, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const wearableIds = [98, 0, 0, 97, 100, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds)

    const sets = await global.itemsFacet.getWearableSets()
    const gotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    // console.log('From numeric traits:' + gotchi.modifiedNumericTraits.map(v => Number(v)))
    // console.log('From traits calc:' + calculateRarityScoreFromTraits(gotchi.modifiedNumericTraits.map(v => Number(v))))
    // console.log('From modifiedRarityScore:' + Number(gotchi.modifiedRarityScore))
    // console.log(gotchi.equippedWearables.map(v => Number(v)))
    // console.log('---')
    // console.log(gotchi.modifiedNumericTraits.map(v => Number(v)))
    // console.log('---')
    // console.log(Number(gotchi.modifiedRarityScore))
    let [setData, traits, rarityScore] = modifyWithAavegotchiSets(sets, gotchi.equippedWearables, gotchi.modifiedNumericTraits, gotchi.modifiedRarityScore)
    // console.log(setData)

    // console.log('--- results:')
    // console.log(traits)
    // console.log(rarityScore)

    const equippedWearables = [98, 0, 0, 97, 99, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const modifiedNumericTraits = [66, 20, 68, 53, 69, 83]
    const modifiedRarityScore = 469

      ;[, traits, rarityScore] = modifyWithAavegotchiSets(sets, equippedWearables, modifiedNumericTraits, modifiedRarityScore)
    expect(rarityScore).to.equal(475)
    expect(traits).to.have.ordered.members([68, 20, 67, 53, 69, 83])
  })

  /*
  it('Cannot equip wearables that require a higher level', async function () {
    // This item requires level 5
    const unequippableItem = '55'
    const wearableIds = sixteenBitArrayToUint([unequippableItem, 0, 0, 0]) // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(itemsFacet.equipWearables(testAavegotchiId, wearableIds), 'ItemsFacet: Aavegotchi level lower than minLevel')
  })
  */

  /*
  it('Can equip wearables that allow this collateral', async function () {
    throw (Error('Not implemented yet'))
  })
  */

  /*
  it('Cannot equip wearables that require a different collateral', async function () {
    // Can only be equipped by collateraltype 8
    const unequippableItem = '60'
    // const wearable = await itemsFacet.getItemType(unequippableItem)
    const wearableIds = sixteenBitArrayToUint([unequippableItem, 0, 0, 0]) // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(itemsFacet.equipWearables(testAavegotchiId, wearableIds), 'ItemsFacet: Wearable cannot be equipped in this collateral type')
  })
  */

  it('Cannot equip wearables in the wrong slot', async function () {
    // This wearable can't be equipped in the 4th slot
    const wearableIds = [testWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // fourth slot, third slot, second slot, first slot
    await truffleAssert.reverts(itemsFacet.equipWearables(testAavegotchiId, wearableIds), 'ItemsFacet: Wearable cannot be equipped in this slot')
  })

  it('Can unequip all wearables with empty array', async function () {
    let equipped = await global.itemsFacet.equippedWearables(testAavegotchiId)
    expect(equipped[3]).to.equal(97)

    // Unequip all wearables
    await itemsFacet.equipWearables(testAavegotchiId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    equipped = await global.itemsFacet.equippedWearables(testAavegotchiId)
    expect(equipped[0]).to.equal(0)

    // Put wearable back on
    await itemsFacet.equipWearables(testAavegotchiId, [0, 0, 0, testWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('Can equip wearables from owners inventory', async function () {

  })

  it('Can display aavegotchi with wearables', async function () {
    const santaHat = '71'

    await global.daoFacet.mintItems(account, [santaHat], ['10'])
    await global.itemsTransferFacet.transferToParent(
      global.account, // address _from,
      global.aavegotchiFacet.address, // address _toContract,
      testAavegotchiId, // uint256 _toTokenId,
      santaHat, // uint256 _id,
      '10' // uint256 _value
    )

    await itemsFacet.equipWearables(testAavegotchiId, [0, 0, 0, santaHat, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const svg = await global.svgFacet.getAavegotchiSvg(testAavegotchiId)
    console.log(svg)
  })

  it('Equipping Wearables alters base rarity score', async function () {
    // Unequip all wearables
    let wearableIds = new Array(16).fill(0)
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds)
    let equipped = await global.itemsFacet.equippedWearables(testAavegotchiId)
    // console.log('equipped:' + equipped)
    expect(equipped[testSlot].toString()).to.equal('0')

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)

    // Equip a wearable
    wearableIds = [0, 0, 0, testWearableId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    await global.itemsFacet.equipWearables(testAavegotchiId, wearableIds)
    equipped = await global.itemsFacet.equippedWearables(testAavegotchiId)
    // console.log('equipped:' + equipped)

    // const [modifiedTraits, augmentedScore] = await global.aavegotchiFacet.modifiedTraitsAndRarityScore(testAavegotchiId)
    // console.log(modifiedTraits)
    // console.log(augmentedScore.toString())

    // Calculate bonuses
    const modifiers = itemTypes[testWearableId].traitModifiers
    const rarityScoreModifier = itemTypes[testWearableId].rarityScoreModifier
    // console.log('Modifiers: ' + modifiers)

    let finalScore = rarityScoreModifier

    modifiers.forEach((val, index) => {
      let traitValue = Number(aavegotchi.numericTraits[index])

      traitValue += val

      if (traitValue >= 50) {
        finalScore += traitValue + 1
      } else {
        finalScore += (100 - traitValue)
      }
    })

    // Retrieve the final score
    const [modifiedTraits, augmentedScore] = await global.aavegotchiGameFacet.modifiedTraitsAndRarityScore(testAavegotchiId)
    // console.log('numericTraits:' + aavegotchi.modifiedNumericTraits)
    // console.log('Modified traits:' + modifiedTraits)

    // Check the math
    expect(Number(augmentedScore).toString()).to.equal(finalScore.toString())
  })
})

describe('Haunts', async function () {
  it('Cannot create new haunt until first is finished', async function () {
    const purchaseNumber = ethers.utils.parseEther('100')
    await truffleAssert.reverts(daoFacet.createHaunt('10000', purchaseNumber, '0x000000'), 'AavegotchiFacet: Haunt must be full before creating new')
  })

  it('Cannot exceed max haunt size', async function () {
    for (let i = 0; i < 399; i++) {
      const purchaseNumber = ethers.utils.parseEther('5500')
      await global.shopFacet.buyPortals(account, purchaseNumber)
    }

    // const totalSupply = await global.aavegotchiFacet.totalSupply()
    const singlePortal = ethers.utils.parseEther('5500')
    await truffleAssert.reverts(global.shopFacet.buyPortals(account, singlePortal), 'ShopFacet: Exceeded max number of aavegotchis for this haunt')

    //  const receipt = await tx.wait()
  })

  it('Can create new Haunt', async function () {
    let currentHaunt = await global.aavegotchiGameFacet.currentHaunt()
    expect(currentHaunt.hauntId_).to.equal(1)
    await daoFacet.createHaunt('10000', ethers.utils.parseEther('100'), '0x000000')
    currentHaunt = await global.aavegotchiGameFacet.currentHaunt()
    expect(currentHaunt.hauntId_).to.equal(2)
  })
})

describe('Revenue transfers', async function () {
  it('Buying portals should send revenue to 4 wallets', async function () {
    // 0 = burn (33%)
    // 1 = dao (10%)
    // 2 = rarity (40%)
    // 3 = pixelcraft (17%)

    let revenueShares = await global.aavegotchiGameFacet.revenueShares()
    const beforeBalances = []
    for (let index = 0; index < 4; index++) {
      const address = revenueShares[index]
      const balance = await global.ghstTokenContract.balanceOf(address)
      beforeBalances[index] = balance
    }

    // Buy 10 Portals
    await global.shopFacet.buyPortals(account, ethers.utils.parseEther('1500'))

    // Calculate shares from 100 Portals
    const burnShare = ethers.utils.parseEther('495')
    const daoShare = ethers.utils.parseEther('150')
    const rarityShare = ethers.utils.parseEther('600')
    const pixelCraftShare = ethers.utils.parseEther('255')
    const shares = [burnShare, daoShare, rarityShare, pixelCraftShare]
    revenueShares = await global.aavegotchiGameFacet.revenueShares()

    // Verify the new balances
    for (let index = 0; index < 4; index++) {
      const address = revenueShares[index]

      const beforeBalance = ethers.BigNumber.from(beforeBalances[index])
      const afterBalance = ethers.BigNumber.from(await global.ghstTokenContract.balanceOf(address))
      expect(afterBalance).to.equal(beforeBalance.add(shares[index]))
    }
  })
})

describe('Shop', async function () {
  it('Should return balances and item types', async function () {
    const itemsAndBalances = await global.itemsFacet.itemBalancesWithTypes(account)
    // console.log('items and balances:', itemsAndBalances.balances)
  })

  it('Should purchase items using GHST', async function () {
    let balances = await global.itemsFacet.itemBalances(account)
    // Start at 1 because 0 is always empty
    // console.log(balances)
    // expect(balances[57]).to.equal(0)

    // Hawaiian Shirt and SantaHat
    await global.shopFacet.purchaseItemsWithGhst(account, ['114', '115', '116', '126', '127', '128', '129'], ['10', '10', '10', '100', '10', '10', '10'])
    balances = await global.itemsFacet.itemBalances(account)
    expect(balances[4].balance).to.equal(10)
    // console.log(balances)
  })
})

/*
describe('Leveling up', async function () {
  it('Aavegotchi should start with 0 XP and Level 1', async function () {
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.level).to.equal(1)
    expect(aavegotchi.experience).to.equal(0)
  })

  it('Can grant experience to Aavegotchi', async function () {
    await truffleAssert.reverts(daoFacet.grantExperience([testAavegotchiId], ['100000']), 'DAOFacet: Cannot grant more than 1000 XP at a time')
    await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.level).to.equal(5)
    expect(aavegotchi.experience).to.equal(1000)
  })

  it('Should have 3 skill points at Level 5', async function () {
    const skillPoints = await global.aavegotchiFacet.availableSkillPoints(testAavegotchiId)
    expect(skillPoints).to.equal(1)
  })

  it('Should spend 3 skill points to modify traits', async function () {
    const oldAavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)

    await truffleAssert.reverts(aavegotchiFacet.spendSkillPoints(testAavegotchiId, [1, 1, 1, 1]), 'AavegotchiFacet: Not enough skill points')
    await global.aavegotchiFacet.spendSkillPoints(testAavegotchiId, [1, 0, 0, 0])
    const skillPoints = await global.aavegotchiFacet.availableSkillPoints(testAavegotchiId)
    expect(skillPoints).to.equal(0)

    const newAavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)

    // Check if numericTraits were modified
    const skillArray = [1, 0, 0, 0, 0, 0]
    for (let index = 0; index < oldAavegotchi.numericTraits.length; index++) {
      const oldTrait = Number(oldAavegotchi.numericTraits[index])
      const newTrait = Number(newAavegotchi.numericTraits[index])
      expect(newTrait).to.equal(oldTrait + skillArray[index])
    }
  })

  it('Should be level 8 with 3000 XP', async function () {
    await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.experience).to.equal(3000)
    expect(aavegotchi.level).to.equal(8)
  })

  it('Experience required to Level 9 should be 200', async function () {
    // Current XP is 3000. Level 9 requires 3200
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.toNextLevel).to.equal(200)
  })

  it('Should be level 9 with 4000 XP ', async function () {
    await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.experience).to.equal(4000)
    expect(aavegotchi.level).to.equal(9)
  })

  it('Should be level 79 with 39999 XP ', async function () {
    // adding 35999 experience
    for (let i = 0; i < 35; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    }
    await daoFacet.grantExperience([testAavegotchiId], ['999'])

    let aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)

    expect(aavegotchi.experience).to.equal(39999)
    expect(aavegotchi.level).to.equal(29)

    await daoFacet.grantExperience([testAavegotchiId], ['1'])
    aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
  })

  it('Should be level 46 with 103500 XP ', async function () {
    for (let i = 0; i < 63; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    }
    await daoFacet.grantExperience([testAavegotchiId], ['500'])

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.experience).to.equal(103500)
    expect(aavegotchi.level).to.equal(46)
  })

  it('Should be level 98 with 474000 XP', async function () {
    for (let i = 0; i < 370; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    }
    await daoFacet.grantExperience([testAavegotchiId], ['500'])

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.experience).to.equal(474000)
    expect(aavegotchi.level).to.equal(98)
  })

  it('Experience required to Level 99 should be 6200', async function () {
    // Current experience is 474000. Level 99 requires 480200.
    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.toNextLevel).to.equal(6200)
  })

  it('Should be level 99 with 500000 XP ', async function () {
    for (let i = 0; i < 26; i++) {
      await daoFacet.grantExperience([testAavegotchiId], ['1000'])
    }

    const aavegotchi = await global.aavegotchiFacet.getAavegotchi(testAavegotchiId)
    expect(aavegotchi.experience).to.equal(500000)
    expect(aavegotchi.level).to.equal(99)
  })
})
*/

describe('Using Consumables', async function () {
  it('Using Kinship Potion increases kinship by 2', async function () {
    const kinshipPotion = await itemsFacet.getItemType('126')
    expect(kinshipPotion.kinshipBonus).to.equal(2)

    const originalScore = await aavegotchiGameFacet.kinship(testAavegotchiId)
    await itemsFacet.useConsumables(testAavegotchiId, ['126'], ['1'])
    const boostedScore = await aavegotchiGameFacet.kinship(testAavegotchiId)
    expect(boostedScore).to.equal(Number(originalScore) + Number(kinshipPotion.kinshipBonus))
  })

  it('Using Experience potion increases XP by 200', async function () {
    const beforeXP = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).experience

    // XP Potion
    const xpPotion = '128'
    await itemsFacet.useConsumables(testAavegotchiId, [xpPotion], ['1'])
    const afterXP = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).experience
    expect(afterXP).to.equal(Number(beforeXP) + 20)
  })

  /* Commented out because we don't have a Trait Potion
  it('Using Trait Potion increases NRG by 1', async function () {
    /*
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    // console.log('before traits:', beforeTraits[0].toString())

    // Trait potion
    const traitPotion = '57'
    await itemsFacet.useConsumables(testAavegotchiId, [traitPotion], ['1'])

    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    // console.log('after traits:', afterTraits[0].toString())
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) + 1)

  })
  */

  /*
  it('Can replace trait bonuses', async function () {
    /*
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    // console.log('before traits:', beforeTraits[0].toString())
    // Trait potion
    const greaterTraitpotion = '61'
    await itemsFacet.useConsumables(testAavegotchiId, [greaterTraitpotion], ['1'])

    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    // console.log('after traits:', afterTraits[0].toString())
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) + 1)

  })
  */

  /*
  it('Trait bonuses should disappear after 24 hours', async function () {
    const beforeTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    ethers.provider.send('evm_increaseTime', [25 * 3600])
    ethers.provider.send('evm_mine')
    const afterTraits = (await aavegotchiFacet.getAavegotchi(testAavegotchiId)).modifiedNumericTraits
    expect(afterTraits[0]).to.equal(Number(beforeTraits[0]) - 1)
  })
  */
})

describe('DAO Functions', async function () {
  it('Only DAO or admin can set game manager', async function () {
    // To do: Check revert using another account
    await daoFacet.setGameManager(account)
    const gameManager = await daoFacet.gameManager()
    expect(gameManager).to.equal(account)
  })

  it('Cannot add the same collateral twice', async function () {
    // console.log(getCollaterals('hardhat', ghstTokenContract.address))
    await truffleAssert.reverts(daoFacet.addCollateralTypes(getCollaterals('hardhat', ghstTokenContract.address)), 'DAOFacet: Collateral already added')
  })

  it('Can add collateral types', async function () {
    let collateralInfo = await collateralFacet.collaterals()
    // console.log('info:', collateralInfo)
    // await daoFacet.addCollateralTypes(getCollaterals('hardhat', ghstTokenContract.address))

    // Deploy an extra TEST contract
    const erc20TokenContract = await ethers.getContractFactory('ERC20Token')
    const testToken = await erc20TokenContract.deploy()
    await testToken.deployed()

    const collateralTypeInfo = [
      testToken.address,
      {
        primaryColor: '0x' + 'FFFFFF',
        secondaryColor: '0x' + 'FFFFFF',
        cheekColor: '0x' + 'FFFFFF',
        svgId: '1',
        eyeShapeSvgId: '2',
        modifiers: [0, 0, -1, 0, 0, 0],
        conversionRate: 10,
        delisted: false
      }
    ]
    await daoFacet.addCollateralTypes([collateralTypeInfo])
    collateralInfo = await collateralFacet.collaterals()
    expect(collateralInfo[1]).to.equal(testToken.address)
  })

  /*
  it('Contract Owner (or DAO) can update collateral modifiers', async function () {
    // const aavegotchi = await global.aavegotchiFacet.getAavegotchi('0')
    // let score = await global.aavegotchiFacet.baseRarityScore(sixteenBitIntArrayToUint([0, 0, 0, -1, 0, 0]))
    // expect(score).to.equal(601)
    // await global.daoFacet.updateCollateralModifiers(aavegotchi.collateral, [2, 0, 0, 0, 0, 0])
    // score = await global.aavegotchiFacet.baseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    // expect(score).to.equal(598)
  })
  */

  /*
  it('Contract owner (or DAO) can add new item types with corresponding SVGs', async function () {
    const items = await itemsFacet.getItemTypes()
    // console.log('length:', items.length)

    const itemsToAdd = [itemTypes[1]]
    const itemSvg = require('../svgs/testItem.js')

    const itemTypeAndSizes = []

    // To do (Nick) add in itemTypeAndSizes
    await daoFacet.addItemTypesAndSvgs(itemsToAdd, itemSvg, itemTypeAndSizes)
  })
  */
})

describe('Kinship', async function () {
  it('Can calculate kinship according to formula', async function () {
    ethers.provider.send('evm_increaseTime', [86400])
    ethers.provider.send('evm_mine')

    let kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* Initial Kinship:', kinship.toString())

    // Use a kinship potion earlier then waited 24hrs
    expect(kinship).to.equal(52)

    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()
    await interactAndUpdateTime()

    kinship = await global.aavegotchiGameFacet.kinship('0')
    expect(kinship).to.equal(57)
    console.log('* After 5 Interactions, kinship is:', kinship.toString())
    // 5 interactions + 1 streak bonus

    // Go 3 days without interacting
    ethers.provider.send('evm_increaseTime', [4 * 86400])
    ethers.provider.send('evm_mine')

    kinship = await global.aavegotchiGameFacet.kinship('0')
    // Took three days off and lost streak bonus
    console.log('* 4 days w/ no interaction, kinship is:', kinship.toString())
    expect(kinship).to.equal(53)

    // Take a longggg break

    ethers.provider.send('evm_increaseTime', [14 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* Another 14 days since last interaction, total 17 days. Kinship is', kinship.toString())
    expect(kinship).to.equal(39)

    ethers.provider.send('evm_increaseTime', [20 * 86400])
    ethers.provider.send('evm_mine')
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* 37 days since last interaction, kinship is:', kinship.toString())
    expect(kinship).to.equal(19)

    for (let index = 1; index < 4; index++) {
      await interactAndUpdateTime()
      kinship = await global.aavegotchiGameFacet.kinship('0')
      console.log(`* Kinship after interaction ${index} is:`, kinship.toString())
      expect(kinship).to.equal(19 + (3 * index))
    }
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* Kinship is:', kinship.toString())

    console.log('* Interact 120 times')

    for (let index = 0; index < 120; index++) {
      await interactAndUpdateTime()
    }

    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* Kinship is:', kinship.toString())
    // 37 + 3, +119
    expect(kinship).to.equal(156)

    // Neglect for 120 days
    neglectAavegotchi(120)
    kinship = await global.aavegotchiGameFacet.kinship('0')
    expect(kinship).to.equal(36)

    await interactAndUpdateTime()
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('* Interact after 120 days. Kinship should be 42')
    expect(kinship).to.equal(39)

    // Neglect for another 120 days
    neglectAavegotchi(120)
    console.log('* Neglect for another 120 days. Kinship should be 0')
    kinship = await global.aavegotchiGameFacet.kinship('0')
    expect(kinship).to.equal(0)

    console.log('* Interact 2 times')
    await interactAndUpdateTime()
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('kinship:', kinship.toString())
    expect(kinship).to.equal(3)

    await interactAndUpdateTime()
    kinship = await global.aavegotchiGameFacet.kinship('0')
    console.log('kinship:', kinship.toString())
    expect(kinship).to.equal(6)

    // Seems to be an issue when the interactionCount is much lower than 0. It takes two interactions to set it from negative to zero.

    console.log('* Kinship should be 6:', kinship.toString())
  })
})

async function neglectAavegotchi (days) {
  ethers.provider.send('evm_increaseTime', [86400 * days])
  ethers.provider.send('evm_mine')
  // daysSinceInteraction = 0
  // for (let index = 0; index < days; index++) {
  //   daysSinceInteraction += days
  //   ethers.provider.send('evm_increaseTime', [86400])
  //   ethers.provider.send('evm_mine')
  // }

  console.log(`* Neglect Gotchi for ${days} days`)
}

async function interactAndUpdateTime () {
  await global.aavegotchiGameFacet.interact(['0'])
  ethers.provider.send('evm_increaseTime', [86400 / 2])
  ethers.provider.send('evm_mine')
}

async function claimGotchis (tokenIds) {
  console.log('token ids:')

  for (let index = 0; index < tokenIds.length; index++) {
    console.log('fucker')

    const id = tokenIds[index]
    const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(id)
    const selectedGhost = ghosts[0]
    const minStake = selectedGhost.minimumStake
    console.log('min stake:', minStake)
    const initialBalance = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account))

    // Claim ghost and stake
    await global.aavegotchiFacet.claimAavegotchi(id, 0, minStake)
    const balanceAfterClaim = ethers.BigNumber.from(await ghstTokenContract.balanceOf(account))
    expect(balanceAfterClaim).to.equal(initialBalance.sub(minStake))
  }
}

function eightBitArrayToUint (array) {
  const uint = []
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8)
    uint.unshift(value.toHexString().slice(2))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}
