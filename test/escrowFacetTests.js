const { expect } = require('chai');
const { ethers } = require('hardhat');

const { escrowProject } = require('../scripts/upgrades/upgrade-escrowTransfer.js');


describe('Escrow Transfering', async () => {
  let escrowFacet,
      aavegotchiFacet,
      erc20TokenConAddress,
      aavegotchiDiamondAddress,
      erc20TokenAddress,
      tokenOwner;

  before(async () => {

      erc20TokenConAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

      await escrowProject();

      // global.account = '0xF3a57FAbea6e198403864640061E3abc168cee80';
      // global.signer = ethers.provider.getSigner(global.account).connect(global.signer);

      escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamondAddress);
      aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);

      tokenOwner = await aavegotchiFacet.ownerOf(6335);

      console.log("Token Owner: ", tokenOwner);
  });

  it.only('Should deposit erc20 token into escrow', async () => {
      // console.log("escrowProject: ", escrowProject);
      // await escrowFacet.depositERC20(6335, erc20TokenConAddress, 4);

      let balance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
      console.log("UniSwap Balance: ", balance);
      // console.log("Escrow Facet: ", escrowFacet);
  });
})
