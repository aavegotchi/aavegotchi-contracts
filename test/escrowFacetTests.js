const { expect } = require('chai');
const { ethers } = require('hardhat');

const { escrowProject } = require('../scripts/upgrades/upgrade-escrowTransfer.js');


describe('Escrow Transfering', async () => {
  let escrowFacet,
      aavegotchiFacet,
      erc20TokenConAddress,
      aavegotchiDiamondAddress,
      landTokenHolder,
      tokenOwner,
      owner,
      erc20Standard;

  before(async () => {

      erc20TokenConAddress = '0xAd230ec33ccf849C2bBd8D26C1706DB07b24Db95';
      aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';

      await escrowProject();

      // global.account = '0xF3a57FAbea6e198403864640061E3abc168cee80';
      // global.signer = ethers.provider.getSigner(global.account).connect(global.signer);

      // landTokenHolder = '0xCCaD6fbEC3814458Ad88734cdc397B075e0D7BA0';

      // owner = await ethers.getSigner(landTokenHolder);

      escrowFacet = await ethers.getContractAt('EscrowFacet', aavegotchiDiamondAddress);
      aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);
      // erc20Standard = await ethers.getContractAt('IERC20', erc20TokenConAddress);

      tokenOwner = await aavegotchiFacet.ownerOf(6335);

      console.log("Token Owner: ", tokenOwner);
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

    // await hre.network.provider.request({
    //   method: 'hardhat_stopImpersonatingAccount',
    //   params: [holderAddress]
    // });
    //
    // await hre.network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: [erc20TokenConAddress]
    // });

    let owner = await ethers.getSigner(tokenOwner);
    let ownerEscrowFacet = await escrowFacet.connect(owner);
    const erc20Aavegotchi = await ethers.getContractAt("IERC20", aavegotchiDiamondAddress, owner);
    //
    // console.log("Token Owner: ", tokenOwner);
    // console.log("Sender Address: ", owner);
    await erc20Aavegotchi.approve(holderAddress, ethers.constants.MaxUint256);

    await ownerEscrowFacet.transferEscrow(6335, erc20TokenConAddress, holderAddress, 3);
    // console.log("Land Balance: ", balance.toNumber());

  });
})
