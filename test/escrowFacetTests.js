const { expect } = require('chai');

const { itemTypes } = require('../scripts/upgrades/upgrade-escrowTransfer.js');
const { deployProject } = require('../scripts/deploy.js');


describe('Escrow Transfering', () => {
  let escrowFacet,
      aavegotchiFacet,
      maticGhstAddress,
      aavegotchiDiamondAddress,
      erc20TokenAddress,
      account;


  before(async () => {
      const deployVars = await deployProject('deployTest');

      maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

      account = deployVars.account;
      console.log("Account 1: ");
      console.log("Account 2: ");
      console.log("Account 3: ");

  });

  it.only('Should depsoit erc20 token into escrow', async () => {
    escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamondAddress);

    console.log("Account 1: ", account[1]);
    console.log("Account 2: ", account[2]);
    console.log("Account 3: ", account[3]);

  });
})
