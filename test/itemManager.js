const { expect } = require('chai')
const { ethers } = require('hardhat')
const truffleAsserts = require('truffle-assertions')
//const { itemManager } = require('../scripts/upgrades/upgrade-itemManager.js');
const { itemTypes } = require('../scripts/addItemTypes/miamiShirtItemType')


describe('Test progressive instances of onlyItemManager modifier', async function () {
  
  const svg = '<g class="gotchi-eyeColor"><path d="M35,20h1v1h-1V20z" fill="#fff"/><path d="M37 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M37 24h1v1h-1z" /><g fill="#ff3085"><path d="M36 20v-1h-1v-1h-1v3h1v-1z"/><path d="M36 20h1v1h-1z"/><path d="M37 21h1v1h-1z"/><path d="M40 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M35 21h1v2h-1z"/></g><path d="M22,20h1v1h-1V20z" fill="#fff"/><path d="M24 22v-1h-1v2h2v-1zm0" fill="#ffdeec"/><path d="M24 24h1v1h-1z" /><g fill="#ff3085"><path d="M23 20v-1h-1v-1h-1v3h1v-1z"/><path d="M23 20h1v1h-1z"/><path d="M24 21h1v1h-1z"/><path d="M27 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3 0h1v1h-1v-1z"/><path d="M22 21h1v2h-1z"/></g></g>'
  const _typesAndIdsAndSizes = [{ svgType: ethers.utils.formatBytes32String('eyeShapes'), ids: [22], sizes: [svg.length] }]

  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let txData,
     owner, 
     signer,
     daoFacet,
     svgFacet
    
 

 // const svg= ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 23"  xmlns:v="https://vecta.io/nano"><path d="M3,0H1v1h1v1H1v1H0v7h2V9h1V0z"/></svg>']

  
  before(async function () {
    this.timeout(1000000)
     owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
     signer = await ethers.provider.getSigner(owner)
     daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)
     svgFacet = (await ethers.getContractAt('SvgFacet', diamondAddress)).connect(signer)
    // await itemManager();
  })

  it('allows the dao or Owner to add an ItemManager', async function () {
    let addTx = await daoFacet.addItemManager(owner)
    txData=await addTx.wait()
    const events= txData.events
    const addedAddr=((events[events.length-1].args).newItemManager_)
    expect(addedAddr).to.equal(owner)    
  })

  it('only allows ItemManagers to add an item', async function(){
  let removeTx= await daoFacet.removeItemManager(owner)//remove the existing itemmanager
 await  truffleAsserts.reverts( daoFacet.addItemTypes(itemTypes),"LibAppStorage: only an ItemManager can call this function");

  })

  it('only allows ItemManagers to update an svg', async function(){
   await  truffleAsserts.reverts( svgFacet.updateSvg(svg, _typesAndIdsAndSizes),"LibAppStorage: only an ItemManager can call this function");

})
it('only allows ItemManagers to add an item type and svg', async function(){
  await  truffleAsserts.reverts( daoFacet.addItemTypesAndSvgs(itemTypes,svg, _typesAndIdsAndSizes),"LibAppStorage: only an ItemManager can call this function");

})


})