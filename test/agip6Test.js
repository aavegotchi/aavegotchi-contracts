/* global describe it before ethers */
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');

const { agip6Project } = require('../scripts/upgrades/upgrade-agip6.js');

describe("Fees", async function(){
  this.timeout(300000);

  let aavegotchiDiamondAddress,
      maticGhstAddress,
      erc721Facet,
      erc1155Facet,
      owner,
      aavegotchiOwner,
      ghstWhale;

  before(async function() {
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    ghstWhale = '0xA02d547512Bb90002807499F05495Fe9C4C3943f';
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';

    await agip6Project();

    erc721Facet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress);
    erc1155Facet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress);

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    });

  });

  it.only("Should check fees amount", async function(){

    const ghstContract = await ethers.getContractAt('ERC20Token', maticGhstAddress);

    buyer = await ethers.getSigner(ghstWhale);
    const connectedGhstContract = await ghstContract.connect(buyer);
    const connectedERC721Facet = await erc721Facet.connect(buyer);

    let beforeBalance = await connectedGhstContract.balanceOf(ghstWhale)
    console.log('before balance:', beforeBalance.toString())

      // await connectedGhstContract.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);

    const erc721Listing = await connectedERC721Facet.getERC721Listings(2, 'listed', 5);
    console.log("ERC721 Listings: ", erc721Listing.toString());

    // const execute721Listing = await connectedERC721Facet.executeERC721Listing(76327);
    // console.log("ERC721 Executed: ", execute721Listing);

  });
});
