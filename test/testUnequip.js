const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Test uneqipping', async function () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const totalUnequip=[
    0, 0, 0, 0, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  let headequip=[
    0, 0, 0, 39, 0, 0,
    0, 0, 0,  0, 0, 0,
    0, 0, 0,  0
  ]

  before(async function () {
    global.account="0xF3a57FAbea6e198403864640061E3abc168cee80"
    global.signer=ethers.provider.getSigner(global.account)
    itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
  

    //let currentGotchiBal= await (itemsFacet.equippedWearables(6845))
   
   let equippedBal='39'
  })
  it('sends item back after unequipping', async function () {

    let owner="0xF3a57FAbea6e198403864640061E3abc168cee80"

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [global.account]
   })

   const signer = ethers.provider.getSigner(global.account)
   
   

   await global.itemsFacet.equipWearables(6847,totalUnequip)

   let currentSlotBal=await(itemsFacet.balanceOf(owner,39))

    expect(currentSlotBal.toString()).to.equal(equippedBal)
     
  })

})