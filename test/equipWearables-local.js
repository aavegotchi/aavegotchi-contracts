
  /* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')

//This is a simple version of the deploy script without any of the Wearable Sets or SVGs. If you need to do SVG tests, you'll need to use /scripts/deploy.js instead of /deplyLight.js!

const { deployProject } = require('../scripts/deployLight.js')

describe('Deploying Contracts, SVG and Minting Items', async function () {
  before(async function () {
    this.timeout(10000000)
    const deployVars = await deployProject('deployTest')
    global.set = true
    global.account = deployVars.account
    global.aavegotchiDiamond = deployVars.aavegotchiDiamond
    global.aavegotchiFacet = deployVars.aavegotchiFacet
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
    global.vouchersContract = deployVars.vouchersContract
    global.diamondLoupeFacet = deployVars.diamondLoupeFacet
    global.metaTransactionsFacet = deployVars.metaTransactionsFacet
    global.erc1155MarketplaceFacet = deployVars.erc1155MarketplaceFacet
  })

  const totalUnequip=[
    0, 0, 0, 0, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let blueEquip=[
    114, 0, 0, 0, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let redEquip=[
    115, 0, 0, 0, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let staff1= [
    0, 0, 0, 0, 0, 64,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]
  let staff2= [
    0, 0, 0, 0, 64, 64,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let multipleEquip=[
    114, 0, 0, 97, 99, 100,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let multipleEquip2=[
    115, 0, 0, 87, 99, 100,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  it('Should mint 10,000,000 GHST tokens', async function () {
    await global.ghstTokenContract.mint()
    const balance = await global.ghstTokenContract.balanceOf(global.account)
    const oneMillion = ethers.utils.parseEther('10000000')
    expect(balance).to.equal(oneMillion)
  })
  it('Should purchase items using GHST', async function () {
    const balance = await ghstTokenContract.balanceOf(account)
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance)

    let balances = await global.itemsFacet.itemBalances(account)

  //  console.log('balances:',balances)
    // Start at 1 because 0 is always empty
    expect(balances.length).to.equal(0)

    // Hawaiian Shirt and SantaHat
    await global.shopFacet.purchaseItemsWithGhst(account, ['114', '115', '97', '99', '100', '128', '129','64','87'], ['10', '10', '10', '10', '10', '10', '10','2','3'])
    balances = await global.itemsFacet.itemBalances(account)

   // console.log('balances:',balances)

    const item114 = balances.find((item) => {
      return item.itemId.toString() === "114"
    })

    expect(item114.balance).to.equal(10)
   // console.log('balances:', balances[129].toString())
   // expect(balances[129]).to.equal(10)
  })

  it('Should purchase portal', async function () {
    const balance = await ghstTokenContract.balanceOf(account)
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance)
    const buyAmount = ethers.utils.parseEther('500') // 1 portals
    const tx = await global.shopFacet.buyPortals(account, buyAmount)
    const receipt = await tx.wait()
    const myGotchis = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
    //console.log(myGotchis)
   // const currentWearables=await (global.itemsFacet.equippedWearables(1))
   // console.log(currentWearables)
    expect(myGotchis.length).to.equal(5)
  })

  it('should reduce balance to 9 while equipping', async function(){
    
    await global.itemsFacet.equipWearables(1,redEquip)
    const currentWearables = await global.itemsFacet.equippedWearables(1)
    //console.log('current:',currentWearables)

    expect(currentWearables[0]).to.equal(115)
    
    let currentItemBal = await(global.itemsFacet.balanceOf(global.account,115))
   // console.log('balance:',currentItemBal.toString())
    expect(currentItemBal.toString()).to.equal('9')
    //console.log('equipped',currentWearables)

  
  })
  it('should increase item balance after unequipping', async function(){
    
    await global.itemsFacet.equipWearables(1,totalUnequip)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
    //console.log(currentWearables)
    expect(currentWearables[0]).to.equal(0)
    let currentItemBal = await(global.itemsFacet.balanceOf(global.account,115))
    //console.log('balance:',currentItemBal.toString())
    expect(currentItemBal.toString()).to.equal('10')
  })

  it('should equip a new item', async function(){
    
    await global.itemsFacet.equipWearables(1,blueEquip)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
 //  console.log(currentWearables)
    expect(currentWearables[0].toString()).to.equal('114')
  })
  it('should replace an equipped item with a new item', async function(){
    const curretWears1=await (global.itemsFacet.equippedWearables(1))
   // console.log('before unequip/equip:',curretWears1)
    await global.itemsFacet.equipWearables(1,redEquip)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
    //console.log('after unequip:', currentWearables)
    expect(currentWearables[0].toString()).to.equal('115')
  })
 
  it('should have sent the previous item back while replacing', async function() {
    let item114balance = await(global.itemsFacet.balanceOf(global.account,114))
    let item115balance = await(global.itemsFacet.balanceOf(global.account,115))
    expect(item114balance.toString()).to.equal('10')
    expect(item115balance.toString()).to.equal('9')
    await global.itemsFacet.equipWearables(1,totalUnequip)//reset inventory
 })

  //necessary tests
  
  it('should equip multiple items', async function(){
    
    await global.itemsFacet.equipWearables(1,multipleEquip)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
    //console.log(currentWearables)
    expect(currentWearables.toString()).to.equal(multipleEquip.toString())
    let item114balance = await(global.itemsFacet.balanceOf(global.account,114))
    let item97balance = await(global.itemsFacet.balanceOf(global.account,97))
    let item99balance = await(global.itemsFacet.balanceOf(global.account,99))
    let item100balance = await(global.itemsFacet.balanceOf(global.account,100))
    expect(item114balance.toString()).to.equal('9')
    expect(item97balance.toString()).to.equal('9')
    expect(item99balance.toString()).to.equal('9')
    expect(item100balance.toString()).to.equal('9')
  })

  it('should unequip multiple items and send them back', async function(){
    
    await global.itemsFacet.equipWearables(1,totalUnequip)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
    //console.log(currentWearables)
    expect(currentWearables.toString()).to.equal(totalUnequip.toString())
    let item114balance = await(global.itemsFacet.balanceOf(global.account,114))
    let item97balance = await(global.itemsFacet.balanceOf(global.account,97))
    let item99balance = await(global.itemsFacet.balanceOf(global.account,99))
    let item100balance = await(global.itemsFacet.balanceOf(global.account,100))
    expect(item114balance.toString()).to.equal('10')
    expect(item97balance.toString()).to.equal('10')
    expect(item99balance.toString()).to.equal('10')
    expect(item100balance.toString()).to.equal('10')
  })

  it('should replace multiple items with new items and send them back', async function(){
    await global.itemsFacet.equipWearables(1,multipleEquip2)
    const currentWearables=await (global.itemsFacet.equippedWearables(1))
    expect(currentWearables.toString()).to.equal(multipleEquip2.toString())
    let item114balance = await(global.itemsFacet.balanceOf(global.account,114))
    let item115balance = await(global.itemsFacet.balanceOf(global.account,115))
    let item97balance = await(global.itemsFacet.balanceOf(global.account,97))
    let item99balance = await(global.itemsFacet.balanceOf(global.account,99))
    let item100balance = await(global.itemsFacet.balanceOf(global.account,100))
    let item87balance = await(global.itemsFacet.balanceOf(global.account,87))
    expect(item114balance.toString()).to.equal('10')
    expect(item97balance.toString()).to.equal('10')
    expect(item99balance.toString()).to.equal('9')
    expect(item100balance.toString()).to.equal('9')
    expect(item115balance.toString()).to.equal('9')
    expect(item87balance.toString()).to.equal('2')
    

  })

})
