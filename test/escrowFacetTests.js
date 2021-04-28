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
    let otherHolderAddress = '0x4C45c499FEd9B7d01C6CB45E5cD04bd1122eD0D5';


    //let depoWei = ethers.utils.bigNumberify("4000000000000000000000");
    let depositAmount = ethers.utils.parseEther("4");
    console.log("Depo Amount: ", depositAmount.toString());
    //let transWei = ethers.utils.bigNumberify("3000000000000000000000");
    let transferAmount = ethers.utils.parseEther("3");
    console.log("Trans Amount: ", transferAmount.toString());
    let failTransferAmount = ethers.utils.parseEther("5");
    console.log("Trans Amount: ", failTransferAmount.toString());


    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [holderAddress]
    });


    let holder = await ethers.getSigner(holderAddress);
    const erc20 = await ethers.getContractAt("IERC20",erc20TokenConAddress, holder);
    const collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamondAddress, holder);


    collateralAddresses = await collateralFacet.collaterals();
    console.log("Collateral Info: ", collateralAddresses);
    collateralType = await collateralFacet.collateralBalance(6335);
    console.log("Collateral Type: ", collateralType.collateralType_);


    let connectEscrowFacet = await escrowFacet.connect(holder);
    await expect(
      connectEscrowFacet.depositERC20(6335, collateralType.collateralType_, depositAmount)
    ).to.be.revertedWith("EscrowFacet: Depositing ERC20 token CANNOT be same as collateral ERC20 token");


    let tx = await erc20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);


    await connectEscrowFacet.depositERC20(6335, erc20TokenConAddress, depositAmount);
    let balance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
    console.log("Balance: ", balance.toString());


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
    await expect(
      ownerEscrowFacet.transferEscrow(6335, collateralType.collateralType_, holderAddress, transferAmount)
    ).to.be.revertedWith("EscrowFacet: Transferring ERC20 token CANNOT be same as collateral ERC20 token");
    await expect(
      ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, holderAddress, failTransferAmount)
    ).to.be.revertedWith("EscrowFacet: Cannot transfer more than current ERC20 escrow balance");


    await ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, holderAddress, transferAmount);
    let newBalance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
    expect(newBalance.toString()).to.equal("1000000000000000000");
    console.log("New Balance: ", newBalance.toString());


    await ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, otherHolderAddress, ethers.utils.parseEther("1"));
    let emptyBalance = await escrowFacet.escrowBalance(6335, erc20TokenConAddress);
    expect(emptyBalance.toString()).to.equal("0");
    console.log("Empty Balance: ", emptyBalance.toString());
    await expect(
      ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, otherHolderAddress, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("EscrowFacet: Cannot transfer more than current ERC20 escrow balance");
  });
})
