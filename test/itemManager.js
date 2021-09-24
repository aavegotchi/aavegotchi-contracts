const { expect } = require('chai')
const { ethers } = require('hardhat')
const truffleAsserts = require('truffle-assertions')
const { itemManager } = require('../scripts/upgrades/upgrade-itemManager.js');
const { itemTypes } = require('../scripts/addItemTypes/itemTypes/miamiShirtItemType.js')


describe('Test progressive instances of onlyItemManager modifier', async function () {



  const svg = 'hey'
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

  })

  it('allows the dao or Owner to add an ItemManager', async function () {

    await itemManager();

    let addTx = await daoFacet.addItemManagers([owner])
    txData=await addTx.wait()
    const events= txData.events
    const addedAddr=((events[events.length-1].args).newItemManager_)
    expect(addedAddr).to.equal(owner)
  })

  it('only allows ItemManagers to add an item', async function(){
  let removeTx= await daoFacet.removeItemManagers([owner])//remove the existing itemmanager
 await  truffleAsserts.reverts( daoFacet.addItemTypes(itemTypes),"LibAppStorage: only an ItemManager can call this function");

  })

  it('only allows ItemManagers to update an svg', async function(){
   await  truffleAsserts.reverts( svgFacet.updateSvg(svg, _typesAndIdsAndSizes),"LibAppStorage: only an ItemManager can call this function");

})
it('only allows ItemManagers to add an item type and svg', async function(){
  await  truffleAsserts.reverts( daoFacet.addItemTypesAndSvgs(itemTypes,svg, _typesAndIdsAndSizes),"LibAppStorage: only an ItemManager can call this function");
})

it('Item Manager can add an item type and svg', async function () {
  let addTx = await daoFacet.addItemManagers([owner])
  txData=await addTx.wait()
  const events= txData.events
  const addedAddr=((events[events.length-1].args).newItemManager_)
  expect(addedAddr).to.equal(owner)

  await svgFacet.updateSvg(svg, _typesAndIdsAndSizes)

  const itemSvg = await svgFacet.getSvg(ethers.utils.formatBytes32String("eyeShapes"),22)



  console.log('svg:',itemSvg)
  expect(itemSvg).to.equal(svg)

})


})
