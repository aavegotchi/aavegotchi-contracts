const { expect } = require('chai');
const { escrowProject } = require('../scripts/upgrades/upgrade-escrowTransfer.js');


describe('Escrow Transfering', async function ()  {

  this.timeout(300000)

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
    
  

    //GHST
      erc20TokenConAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

      await escrowProject();

      escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamondAddress);
      aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);

      tokenOwner = await aavegotchiFacet.ownerOf(6335);

  });

  it.only('Should deposit erc20 token into escrow', async () => {

    let holderAddress = '0x27DF5C6dcd360f372e23d5e63645eC0072D0C098';
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
  /*  await expect(
      connectEscrowFacet.batchDepositERC20([6335], [collateralType.collateralType_], [depositAmount])
    ).to.be.revertedWith("EscrowFacet: Depositing ERC20 token CANNOT be same as collateral ERC20 token");
    */


    await erc20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);

    let length = 500
    let tokenIds = new Array(length).fill(6335)
    let contractAddresses = new Array(length).fill(erc20TokenConAddress)
    let depositAmounts = new Array(length).fill(depositAmount.div(length)) 


    let tx = await connectEscrowFacet.batchDepositERC20(tokenIds,contractAddresses, depositAmounts);
    console.log('gas used:',tx.gasLimit.toString())

     tx = await connectEscrowFacet.batchDepositGHST(tokenIds, depositAmounts);
    console.log('gas used:',tx.gasLimit.toString())
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
