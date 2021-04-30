/* global describe it before ethers */
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');

const { agip6Project } = require('../scripts/upgrades/upgrade-agip6.js');

describe("Fees", async function(){
  this.timeout(300000);

  let aavegotchiDiamondAddress,
      maticGhstAddress,
      ghstERC20,
      erc721Facet,
      erc1155Facet,
      owner,
      buyer,
      aavegotchiOwner,
      ghstWhale;

  before(async function() {
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    ghstWhale = '0x20eC02894D748C59c01B6bF08FE283D7bB75A5d2';
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';

    await agip6Project();

    erc721Facet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress);
    erc1155Facet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress);


  });

  it.only("Should check fees amount", async function(){
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    });

    ghstERC20 = await ethers.getContractAt('ERC20Token', maticGhstAddress);

    buyer = await ethers.getSigner(ghstWhale);

    const connectedGhstContract = await ghstERC20.connect(buyer);
    const connectedERC721Facet = await erc721Facet.connect(buyer);

    let beforeBalance = await connectedGhstContract.balanceOf(ghstWhale)
    console.log('before balance:', beforeBalance.toString())

    await connectedGhstContract.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);
    let allowance = await connectedGhstContract.allowance(ghstWhale, aavegotchiDiamondAddress);
    console.log("Allowance: ", allowance.toString());

    const erc721Listing = await erc721Facet.getERC721Listings(2, 'listed', 5);
    console.log("ERC721 Listings: ", erc721Listing.toString());

    //may need to find different listingID from erc721Listing if fails
    const execute721Listing = await erc721Facet.executeERC721Listing(76705);
    console.log("ERC721 Executed: ", execute721Listing);

  });
});
