const { expect } = require('chai');
const { ethers } = require('hardhat');

const { escrowProject } = require('../scripts/upgrades/upgrade-escrowTransfer.js');


describe('Escrow Transfering', async () => {
  let escrowFacet,
      aavegotchiFacet,
      libAavegotchi,
      erc20TokenConAddress,
      aavegotchiDiamondAddress,
      landTokenHolder,
      tokenOwner,
      escrowOwner,
      owner,
      erc20Standard;

  before(async () => {

      erc20TokenConAddress = '0xAd230ec33ccf849C2bBd8D26C1706DB07b24Db95';
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

      await escrowProject();

      escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamondAddress);
      aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);

      tokenOwner = await aavegotchiFacet.ownerOf(6335);

  });

  it.only('Should deposit erc20 token into escrow', async () => {

    let holderAddress = '0xCCaD6fbEC3814458Ad88734cdc397B075e0D7BA0';

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [holderAddress]
    });

    let holder = await ethers.getSigner(holderAddress);
    const erc20 = await ethers.getContractAt("IERC20",erc20TokenConAddress, holder);

    let connectEscrowFacet = await escrowFacet.connect(holder);

    let tx = await erc20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);

    await connectEscrowFacet.depositERC20(6335, erc20TokenConAddress, 4);

    let balance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
    console.log("Land Balance: ", balance.toNumber());

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [holderAddress]
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [tokenOwner]
    });

    let owner = await ethers.getSigner(tokenOwner);
    let ownerEscrowFacet = await escrowFacet.connect(owner);


    await ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, holderAddress, 3);
    let newBalance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
    
    expect(newBalance.toNumber()).to.equal(1);

  });
})
