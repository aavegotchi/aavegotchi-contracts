const { expect } = require('chai')
const { ethers } = require('hardhat')
//const { equipUpgrade } = require('../scripts/upgrades/upgrade-equipWearables.js');

describe('Test uneqipping', async function () {
  this.timeout(300000)
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  let owner,
  impersonate,
  itemsFacet,
  gotchiFacet
  

  const fullEquip=[
    105, 55, 49, 104, 107, 106,
      0,  0,  0,   0,   0,   0,
      0,  0,  0,   0
  ]
  const totalUnequip=[
    0, 0, 0, 0, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  const swapEquip=[
    105, 55, 49, 59, 107, 96,
    0,  0,  0,   0,   0,   0,
    0,  0,  0,   0
  ]

  //First equip left hand
  const equipLeftHand = [
    0,0,0,0,96,0, 0,0,0,0,0,0,0,0,0,0
  ]
  //Then equip both hands
  const equipLeftRightHand = [
    0,0,0,0,96,96,0,0,0,0,0,0,
    0,0,0,0
  ]


  


    it('Can equip one item in both hands', async function () {

    //  await equipUpgrade()


      gotchiFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress))
      owner= "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5" //await(gotchiFacet.ownerOf(1484))
  
      impersonate=await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner]
     })
    
      const signer = ethers.provider.getSigner(owner)
      itemsFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)).connect(signer)
      console.log(owner)

       await itemsFacet.equipWearables(1484,equipLeftHand)
      await itemsFacet.equipWearables(1484,equipLeftRightHand)
      const equipped = await itemsFacet.equippedWearables(1484)
      console.log('equipped:',equipped)

      expect(equipped.length).to.equal(16)
    })
   

    /*
   //const signer = ethers.provider.getSigner(owner)

   const bal105=(await(itemsFacet.balanceOf(owner,105))).toString()
   const bal55=(await(itemsFacet.balanceOf(owner,55))).toString()
   const bal49=(await(itemsFacet.balanceOf(owner,49))).toString()
   const bal104=(await(itemsFacet.balanceOf(owner,104))).toString()
   const bal107=(await(itemsFacet.balanceOf(owner,107))).toString()
   const bal106=(await(itemsFacet.balanceOf(owner,106))).toString()
 console.log(bal105,bal55,bal49,bal104,bal107,bal106)

    const currentGotchiBal= await (itemsFacet.equippedWearables(1484))
    console.log('equipped before all tests',currentGotchiBal)
  })

  it('sends all items back after full unequipping', async function () {
    
  //  await equipUpgrade();

   //const signer = ethers.provider.getSigner(owner)

   await itemsFacet.equipWearables(1484,totalUnequip)
   const currentWearables=await (itemsFacet.equippedWearables(1484))
   console.log(currentWearables)
   expect(currentWearables.toString()).to.equal(totalUnequip.toString())
   const bal105=(await(itemsFacet.balanceOf(owner,105))).toString()
   const bal55=(await(itemsFacet.balanceOf(owner,55))).toString()
   const bal49=(await(itemsFacet.balanceOf(owner,49))).toString()
   const bal104=(await(itemsFacet.balanceOf(owner,104))).toString()
   const bal107=(await(itemsFacet.balanceOf(owner,107))).toString()
   const bal106=(await(itemsFacet.balanceOf(owner,106))).toString()
   expect(bal105).to.equal('1')
   expect(bal55).to.equal('1')
   expect(bal49).to.equal('1')
   expect(bal104).to.equal('1')
   expect(bal107).to.equal('1')  
  })
it('should replace equipped items with new items and send them back',async function(){
  //equip them back
 await itemsFacet.equipWearables(1484,fullEquip)

  currentWearables=await (itemsFacet.equippedWearables(1484))
  expect(currentWearables.toString()).to.equal(fullEquip.toString())
  //swap out some wearables
  await itemsFacet.equipWearables(1484,swapEquip)
  currentWearables=await (itemsFacet.equippedWearables(1484))
  expect(currentWearables.toString()).to.equal(swapEquip.toString())

  //the swapped wearables
  const bal96=(await(itemsFacet.balanceOf(owner,105))).toString()
  const bal59=(await(itemsFacet.balanceOf(owner,59))).toString()

   bal105=(await(itemsFacet.balanceOf(owner,105))).toString()
   bal49=(await(itemsFacet.balanceOf(owner,49))).toString()
  bal55=(await(itemsFacet.balanceOf(owner,55))).toString()
  bal104=(await(itemsFacet.balanceOf(owner,104))).toString()
  bal107=(await(itemsFacet.balanceOf(owner,107))).toString()
    bal106=(await(itemsFacet.balanceOf(owner,106))).toString()
   expect(bal105).to.equal('0')
   expect(bal55).to.equal('0')
   expect(bal49).to.equal('0')
   expect(bal104).to.equal('1')
   expect(bal107).to.equal('0') 
   expect(bal96).to.equal('0') 
   expect(bal59).to.equal('0') 
   expect(bal106).to.equal('1') 
  */




})