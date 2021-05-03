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
      gameFacet,
      owner,
      buyer,
      aavegotchiOwner,
      ghstWhale,
      daoAddress,
      rarityFarmingAddress,
      pixelCraftAddress,
      playerRewardAddress;

  before(async function() {
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    ghstWhale = '0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC';
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
    daoAddress = '0xb208f8BB431f580CC4b216826AFfB128cd1431aB';
    rarityFarmingAddress = '0x27DF5C6dcd360f372e23d5e63645eC0072D0C098';
    pixelCraftAddress = '0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64';

    // //must match with listId, if listId is sold or cancelled this address must change to match whatever new listId is entered
    // playerRewardAddress = '0x67FdBb7326a6de4194b1DfEe2E1E212952F0092B';

    await agip6Project();

    buyer = await ethers.getSigner(ghstWhale);

    gameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress, buyer);
    erc721Facet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress, buyer);
    erc1155Facet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress, buyer);


  });

  it.only("Should check fees amount", async function(){
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    });

    ghstERC20 = await ethers.getContractAt('ERC20Token', maticGhstAddress, buyer);

    buyer = await ethers.getSigner(ghstWhale);

    // const connectedGhstContract = await ghstERC20.connect(buyer);
    // const connectedERC721Facet = await erc721Facet.connect(buyer);

    let before721Balance = await ghstERC20.balanceOf(ghstWhale);
    console.log('before 721 balance:', before721Balance.toString());

    let beforeDaoBalance = await ghstERC20.balanceOf(daoAddress);
    console.log('before dao balance:', beforeDaoBalance.toString());
    let beforeRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    console.log('before rarity balance:', beforeRarityBalance.toString());
    let beforePixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    console.log('before pixel balance:', beforePixelBalance.toString());
    // let beforePlayerBalance = await ghstERC20.balanceOf(playerRewardAddress);
    // console.log('before balance:', beforePlayerBalance.toString());


    let revenueShares = await gameFacet.revenueShares();
    console.log("Revenue Shares: ", revenueShares);

    await ghstERC20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);
    let allowance = await ghstERC20.allowance(ghstWhale, aavegotchiDiamondAddress);
    // console.log("Allowance: ", allowance.toString());

    const erc721Listing = await erc721Facet.getERC721Listings(2, 'listed', 5);
    // console.log("ERC721 Listings: ", erc721Listing.toString());

    //may need to find different listingID from erc721Listing if fails
    const execute721Listing = await erc721Facet.executeERC721Listing(76586);
    // console.log("ERC721 Executed: ", execute721Listing);

    let after721Balance = await ghstERC20.balanceOf(ghstWhale);
    console.log('after 721 balance:', after721Balance.toString());
    let priceOfListing = await (before721Balance.toString()) - (after721Balance.toString());
    console.log("Price of Listing: ", priceOfListing);


    let afterDaoBalance = await ghstERC20.balanceOf(daoAddress);
    console.log('After dao balance:', afterDaoBalance.toString());
    // let afterRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    // console.log('After rarity balance:', afterRarityBalance.toString());
    let afterPixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    console.log('After pixel balance:', afterPixelBalance.toString());
    // let afterPlayerBalance = await ghstERC20.balanceOf(playerRewardAddress);
    // console.log('After balance:', afterPlayerBalance.toString());

    let daoPercentage = await ((afterDaoBalance.toString()) - (beforeDaoBalance.toString()))/priceOfListing;
    console.log("Dao Percentage: ", daoPercentage);

    let pixelPercentage = await ((afterPixelBalance.toString()) - (beforePixelBalance.toString()))/priceOfListing;
    console.log("PixelCraft Percentage: ", pixelPercentage);

    // let rarityPercentage = await ((afterRarityBalance.toString()) - (beforeRarityBalance.toString()))/priceOfListing;
    // console.log("Rarity Farming Percentage: ", rarityPercentage);
  });
});
