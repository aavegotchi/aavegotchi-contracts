const { expect } = require('chai');
const { ethers } = require('hardhat')
const truffleAsserts = require('truffle-assertions')
const { interactUpgrade } = require('../scripts/upgrades/upgrade-disablePortalPet.js');


describe('Testing interaction on portals', async function ()  {

  this.timeout(300000)

  let escrowFacet,
      aavegotchiGameFacet,
      aavegotchiDiamondAddress,
      tokenOwner;

  before(async () => {
      
      await interactUpgrade();

     // aavegotchiGameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress);
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
      aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);
      tokenOwner = await aavegotchiFacet.ownerOf(8089);
      console.log('Portal owner:',tokenOwner)

  });

  it('Should revert while trying to pet a portal', async () => {

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [tokenOwner]
    });

    let holder = await ethers.getSigner(tokenOwner);
    const gameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress, holder);
    await  truffleAsserts.reverts( gameFacet.interact([8089]),"LibAavegotchi: Only valid for Aavegotchi");
  })

    
  
})
