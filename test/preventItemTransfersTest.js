/* global describe it before ethers */
/* eslint-disable  prefer-const */

const { expect } = require('chai')

const {preventItemTransfers} = require('../scripts/upgrades/upgrade-preventItemTransfers')

async function impersonate (address, contract) {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  })
  let signer = await ethers.getSigner(address)
  contract = contract.connect(signer)
  return contract
}


describe('Testing prevent item transfers', function () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
 
  let itemsFacet
  let itemsTransferFacet
  let svgFacet
  let raffleContract

  before(async function () {

//First run the upgrade
    await preventItemTransfers()

      //First find a whale
      let itemWhale = "0x51208e5cC9215c6360210C48F81C8270637a5218"

    itemsTransferFacet = await ethers.getContractAt('ItemsTransferFacet', diamondAddress)
    itemsTransferFacet = await impersonate(itemWhale)

  
  })
  it('Can still transfer items that are transferrable', async function () {
    console.log('nice')
     
      await itemsTransferFacet
   })
   
 
})
