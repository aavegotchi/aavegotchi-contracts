const { expect } = require('chai');

describe('ERC20 Escrow', () => {
  let collateralFacet,
      aavegotchiFacet,
      maticGhstAddress,
      aavegotchiDiamondAddress,
      erc20TokenAddress

  before(async () => {
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    //contract address for uniswap
    erc20TokenAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';

    const opsWallet = '0xd0F9F536AA6332a6fe3BFB3522D549FbB3a1b0AE';

    collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamondAddress);
    aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress);
  });

  it.only('Should deposit erc20 token into users escrow', async() => {
    await collateralFacet.depositERC20('44', erc20TokenAddress, '10');
  });


});
