/* global describe it before */
const { expect } = require('chai')
const { BigNumber } = require('ethers')
// const { idText } = require('typescript')

// eslint-disable-next-line no-unused-vars
// const { expect } = require('chai')

// import ERC721 from '../artifacts/ERC721.json'
// import { ethers } from 'ethers'

// const { deployProject } = require('../scripts/deploy-ganache.js')

const { deployProject } = require('../scripts/deploy.js')

describe('Deploying Contracts, SVG and Minting Aavegotchis', function () {
  // let svgStorage
  // let ghstDiamond
  let aavegotchiDiamond
  let ghstDiamond
  let aavegotchiFacet
  let account
  // let erc721
  // let account

  before(async function () {
    const deployVars = await deployProject()
    account = deployVars.account
    aavegotchiDiamond = deployVars.aavegotchiDiamond
    aavegotchiFacet = deployVars.aavegotchiFacet
    ghstDiamond = deployVars.ghstDiamond
  })

  it('Should mint 10,000 GHST tokens', async function () {
    await ghstDiamond.mint()
    const balance = await ghstDiamond.balanceOf(account)
    expect(balance).to.equal('10000000000000000000000')
  })

  it('Should show all whitelisted collaterals', async function () {
    const collaterals = await aavegotchiFacet.getCollateralInfo()
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
    });
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
    let score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(599)

    const multiplier = await aavegotchiFacet.calculateRarityMultiplier([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(multiplier).to.equal(1000)

    //Todo: Clientside calculate what the rarity score should be
  })

  it('Can increase stake', async function () {
    let aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    let currentStake = BigNumber.from(aavegotchi.stakedAmount)

    //Let's double the stake
    await aavegotchiFacet.increaseStake("0", currentStake.toString())
    aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    const finalStake = BigNumber.from(aavegotchi.stakedAmount)
    expect(finalStake).to.equal(currentStake.add(currentStake))

    //Todo: Balance check

  })

  it('Can decrease stake, but not below minimum', async function () {
    let aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    let currentStake = BigNumber.from(aavegotchi.stakedAmount)
    let minimumStake = BigNumber.from(aavegotchi.minimumStake)

    let available = currentStake.sub(minimumStake)
    await aavegotchiFacet.decreaseStake("0", available)

    aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    currentStake = BigNumber.from(aavegotchi.stakedAmount)

    expect(currentStake).to.equal(minimumStake)

    //Todo: Below min stake Revert check
    //Todo: Balance check

  })

  it('Contract Owner (Later DAO) can update collateral modifiers', async function () {
    const aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    let score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(599)
    await aavegotchiFacet.updateCollateralModifiers(aavegotchi.collateral, [2, 0, 0, 0, 0, 0])
    score = await aavegotchiFacet.calculateBaseRarityScore([0, 0, 0, 0, 0, 0], aavegotchi.collateral)
    expect(score).to.equal(602)
  })

  it('Can decrease stake and destroy Aavegotchi', async function () {
    //To do: burn Aavegotchi
  })

  it('Can equip/de-equip wearables', async function () {

  })

  it('Wearables can alter traits and increase base rarity score', async function () {

  })


  it('Can calculate kinship according to formula', async function () {

    //First interact 

    await aavegotchiFacet.interact("0")
    await aavegotchiFacet.interact("0")
    await aavegotchiFacet.interact("0")
    await aavegotchiFacet.interact("0")
    await aavegotchiFacet.interact("0")
    let kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* 5 initial Interactions, kinship is:', kinship.toString())
    //5 interactions + 1 streak bonus
    //expect(kinship).to.equal(55)


    //Go 3 days without interacting
    ethers.provider.send('evm_increaseTime', [3 * 86400])
    ethers.provider.send("evm_mine")

    kinship = await aavegotchiFacet.calculateKinship("0")
    //Took three days off and lost streak bonus
    console.log('* 3 days w/ no interaction, kinship is:', kinship.toString())

    //  expect(kinship).to.equal(49)

    //await aavegotchiFacet.interact("0")
    // kinship = await aavegotchiFacet.calculateKinship("0")
    //expect(kinship).to.equal(53)

    //Take a longggg break

    ethers.provider.send('evm_increaseTime', [14 * 86400])
    ethers.provider.send("evm_mine")

    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Another 14 days since last interaction, total 17 days. Kinship is', kinship.toString())



    ethers.provider.send('evm_increaseTime', [20 * 86400])
    ethers.provider.send("evm_mine")
    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* 37 days since last interaction, kinship is:', kinship.toString())
    // expect(kinship).to.equal(13)

    await aavegotchiFacet.interact("0")
    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Kinship after first interaction is:', kinship.toString())


    await aavegotchiFacet.interact("0")
    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Kinship after second interaction is:', kinship.toString())


    await aavegotchiFacet.interact("0")
    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Kinship after third interaction is:', kinship.toString())


    console.log('* Interact 120 times')

    for (let index = 0; index < 120; index++) {
      await aavegotchiFacet.interact("0")
    }

    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Kinship is:', kinship.toString())

    ethers.provider.send('evm_increaseTime', [80 * 86400])
    ethers.provider.send("evm_mine")
    kinship = await aavegotchiFacet.calculateKinship("0")

    let aavegotchi = await aavegotchiFacet.getAavegotchi("0")

    console.log('* Go away for 80 days. Kinship is: ', kinship.toString())
    console.log('Interaction count is:', aavegotchi.interactionCount.toString())

    await aavegotchiFacet.interact("0")
    kinship = await aavegotchiFacet.calculateKinship("0")
    console.log('* Interact after 80 days. Kinship is: ', kinship.toString())
    aavegotchi = await aavegotchiFacet.getAavegotchi("0")
    console.log('Interaction count is:', aavegotchi.interactionCount.toString())


    // expect(aavegotchi.interactionCount).to.equal(4)
  })


  // Add a test to check if we can name another Aavegotchi Beavis
  // Add some tests to check different svg layers

  // it('Add SVG Layers', async function () {
  //   let svgs = [
  //     // background eth
  //     '<defs fill="#fff"><pattern id="a" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 0h1v1H0zm2 2h1v1H2z"/></pattern><pattern id="b" patternUnits="userSpaceOnUse" x="0" y="0" width="2" height="2"><path d="M0 0h1v1H0z"/></pattern><pattern id="c" patternUnits="userSpaceOnUse" x="-2" y="0" width="8" height="1"><path d="M0 0h1v1H0zm2 0h1v1H2zm2 0h1v1H4z"/></pattern><pattern id="d" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><path d="M0 0h1v1H0zm0 2h1v1H0zm1 0V1h1v1zm1 0h1v1H2zm0-1h1V0H2zm1 2h1v1H3z"/></pattern><pattern id="e" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M4 4h1v1H4zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1zm7 0h1v1h-1z"/><path fill="url(#a)" d="M0 8h64v7H0z"/><path fill="url(#b)" d="M0 16h64v1H0z"/><path fill="url(#c)" d="M0 18h64v1H0z"/><path fill="url(#b)" d="M22 18h15v1H22zM0 20h64v3H0z"/><path fill="url(#d)" d="M0 24h64v8H0z"/></pattern><mask id="f"><path fill="url(#e)" d="M0 0h64v32H0z"/></mask></defs><path fill="#c260ff" d="M0 0h64v32H0z"/><path fill="#dea8ff" mask="url(#f)" d="M0 0h64v32H0z"/><path fill="#dea8ff" d="M0 32h64v32H0z"/><path mask="url(#f)" fill="#c260ff" transform="matrix(1 0 0 -1 0 64)" d="M0 0h64v32H0z"/>',
  //     // body eth
  //     '<g fill="#64438e"><path d="M21 12h2v-2h-4v2h1z"/><path d="M19 14v-2h-2v2h1zm6-4h2V8h-4v2h1z"/><path d="M29 8h8V6H27v2h1zm16 6h2v-2h-2v1z"/><path d="M48 14h-1v39h-2v2h4V14zm-11-4h4V8h-4v1z"/><path d="M41 12h4v-2h-4v1zM17 53V14h-2v41h4v-2h-1z"/><path d="M24 51h-5v2h5v-1z"/><path d="M27 53h-3v2h5v-2h-1zm18-2h-5v2h5v-1z"/><path d="M35 51h-6v2h6v-1z"/><path d="M38 53h-3v2h5v-2h-1z"/></g><g fill="#edd3fd"><path d="M18 43v6h2v-1h2v1h2v2h-5v2h-2V14h2v1h-1v26z"/><path d="M27 51h-3v2h5v-2h-1zm11 0h-3v2h5v-2h-1z"/><path d="M35 49h-2v-1h-2v1h-2v2h6v-1zM25 11h2v-1h-4v1h1zm-4 2h2v-1h-4v1h1zm24 31v5h-1v-1h-2v1h-2v2h5v2h2V14h-2v29z"/><path d="M37 8H27v1h5v1h5V9zm8 4h-4v2h4v-1z"/><path d="M41 10h-4v2h4v-1z"/></g><path d="M44 14h-3v-2h-4v-2h-5V9h-5v2h-4v2h-4v2h-1v34h2v-1h2v1h2v2h5v-2h2v-1h2v1h2v2h5v-2h2v-1h2v1h1V14z" fill="#fff"/>',
  //     // eyes
  //     '<g fill="#64438e"><path d="M23 28v2h4v-2h2v-4h-2v-2h-4v2h-2v4h1zm12-4v4h2v2h4v-2h2v-4h-2v-2h-4v2h-1z"/></g>',
  //     // mouth
  //     '<g fill="#64438e"><path d="M29 32h-2v2h2v-1z"/><path d="M33 34h-4v2h6v-2h-1z"/><path d="M36 32h-1v2h2v-2z"/></g>'
  //   ]
  //   const sizes = svgs.map(value => value.length)
  //   svgs = svgs.join('')
  //   await svgStorage.createSVGContract(svgs, sizes)
  // })

  // it('Mint New Aavegotchi', async function () {
  //   // const erc721 = new ethers.Contract(aavegotchiDiamond.address, ERC721.abi)
  //   const ERC721 = await ethers.getContractFactory('ERC721')
  //   erc721 = ERC721.attach(aavegotchiDiamond.address)
  //   let svgLayers = [1, 2, 3, 4]
  //   svgLayers = svgLayers.map(value => {
  //     value = ethers.utils.hexlify(value)
  //     value = value.slice(2)
  //     if (value.length === 2) {
  //       value = '00' + value
  //     }
  //     return value
  //   })
  //   svgLayers = '0x' + svgLayers.join('').padEnd(64, '0')
  //   erc721.mintAavegotchi(svgLayers)
  // })

  // it('Mint New Aavegotchi', async function () {
  //   const svg = await erc721.getAavegotchi(0)
  //   console.log(svg)
  // })
})
