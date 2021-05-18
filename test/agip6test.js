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
      pixelCraftAddress;

  before(async function() {
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    ghstWhale = '0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC';
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';
    daoAddress = '0xb208f8BB431f580CC4b216826AFfB128cd1431aB';
    rarityFarmingAddress = '0x27DF5C6dcd360f372e23d5e63645eC0072D0C098';
    pixelCraftAddress = '0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64';


    await agip6Project();

    buyer = await ethers.getSigner(ghstWhale);

    gameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress, buyer);
    erc721Facet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress, buyer);
    erc1155Facet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress, buyer);
    ghstERC20 = await ethers.getContractAt('ERC20Token', maticGhstAddress, buyer);

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    });

  });

  it.only("Should check erc721 fees amount", async function(){


    // const connectedGhstContract = await ghstERC20.connect(buyer);
    // const connectedERC721Facet = await erc721Facet.connect(buyer);

    let beforeWhaleBalance = await ghstERC20.balanceOf(ghstWhale);
    console.log('before whale balance:', beforeWhaleBalance.toString());

    let beforeDaoBalance = await ghstERC20.balanceOf(daoAddress);
    console.log('before dao balance:', beforeDaoBalance.toString());
    let beforeRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    console.log('before rarity balance:', beforeRarityBalance.toString());
    let beforePixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    console.log('before pixel balance:', beforePixelBalance.toString());


    let revenueShares = await gameFacet.revenueShares();
    console.log("Revenue Shares: ", revenueShares);

    await ghstERC20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);
    // await ghstERC20.allowance(ghstWhale, aavegotchiDiamondAddress);

    const erc721Listings = await erc721Facet.getERC721Listings(2, 'listed', 5);
    const listing = erc721Listings[0].listingId.toString()


    //may need to find different listingID from erc721Listing if fails
    await erc721Facet.executeERC721Listing(listing);

    let afterWhaleBalance = await ghstERC20.balanceOf(ghstWhale);
    console.log('after whale balance:', afterWhaleBalance.toString());
    let priceOfListing = await (beforeWhaleBalance.toString()) - (afterWhaleBalance.toString());
    console.log("Price of Listing: ", priceOfListing);


    let afterDaoBalance = await ghstERC20.balanceOf(daoAddress);
    console.log('After dao balance:', afterDaoBalance.toString());
    let afterRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    console.log('After rarity balance:', afterRarityBalance.toString());
    let afterPixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    console.log('After pixel balance:', afterPixelBalance.toString());

    let daoPercentage = await ((afterDaoBalance.toString()) - (beforeDaoBalance.toString()))/priceOfListing;
    console.log("Dao Percentage: ", daoPercentage);
    expect(daoPercentage.toFixed(6)).to.equal('0.010000');
    let doaBalanceTestIncrease = afterDaoBalance - beforeDaoBalance;
    let doaIncrease = priceOfListing * daoPercentage;
    expect(doaBalanceTestIncrease.toString()).to.equal(doaIncrease.toString());
    expect(doaIncrease + Number(beforeDaoBalance.toString())).to.equal(Number(afterDaoBalance.toString()));

    let pixelPercentage = await ((afterPixelBalance.toString()) - (beforePixelBalance.toString()))/priceOfListing;
    console.log("PixelCraft Percentage: ", pixelPercentage);
    expect(pixelPercentage.toFixed(6)).to.equal('0.020000');
    let pixelIncrease = priceOfListing * pixelPercentage;
    expect(pixelIncrease + Number(beforePixelBalance.toString())).to.equal(Number(afterPixelBalance.toString()));

    let rarityPercentage = await ((afterRarityBalance.toString()) - (beforeRarityBalance.toString()))/priceOfListing;
    console.log("Rarity Farming Percentage: ", rarityPercentage);
    expect(rarityPercentage.toFixed(6)).to.equal('0.005000');
    let rarityIncrease = priceOfListing * rarityPercentage;
    expect(rarityIncrease + Number(beforeRarityBalance.toString())).to.equal(Number(afterRarityBalance.toString()));

    let totalFeePercentage = daoPercentage + pixelPercentage + rarityPercentage;
    console.log("Total Fee Percentage: ", totalFeePercentage);
    expect(totalFeePercentage.toFixed(3)).to.equal('0.035');
  });

  it.only("Should check erc1155 fees amount", async function(){
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    });

    ghstERC20 = await ethers.getContractAt('ERC20Token', maticGhstAddress, buyer);

    buyer = await ethers.getSigner(ghstWhale);

    let beforeWhaleBalance = await ghstERC20.balanceOf(ghstWhale);
    console.log('before whale balance:', beforeWhaleBalance.toString());

    let beforeDaoBalance = await ghstERC20.balanceOf(daoAddress);
    // console.log('before dao balance:', beforeDaoBalance.toString());
    let beforeRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    // console.log('before rarity balance:', beforeRarityBalance.toString());
    let beforePixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    // console.log('before pixel balance:', beforePixelBalance.toString());


    await ghstERC20.approve(aavegotchiDiamondAddress, ethers.constants.MaxUint256);
    const erc1155Listings = await erc1155Facet.getERC1155Listings(0, 'listed', 10);

    const erc1155Listing = erc1155Listings[0].listingId.toString()
    // console.log("ERC1155 Listings: ", erc1155Listing.toString());

    await erc1155Facet.executeERC1155Listing(erc1155Listing, 1, erc1155Listings[0].priceInWei.toString());


    let afterWhaleBalance = await ghstERC20.balanceOf(ghstWhale);
    console.log('after whale balance:', afterWhaleBalance.toString());
    let priceOfListing = await (beforeWhaleBalance.toString()) - (afterWhaleBalance.toString());
    console.log("Price of Listing: ", priceOfListing);


    let afterDaoBalance = await ghstERC20.balanceOf(daoAddress);
    // console.log('After dao balance:', afterDaoBalance.toString());
    let afterRarityBalance = await ghstERC20.balanceOf(rarityFarmingAddress);
    // console.log('After rarity balance:', afterRarityBalance.toString());
    let afterPixelBalance = await ghstERC20.balanceOf(pixelCraftAddress);
    // console.log('After pixel balance:', afterPixelBalance.toString());

    let daoPercentage = await (afterDaoBalance - beforeDaoBalance)/priceOfListing;
    expect(daoPercentage.toFixed(6)).to.equal('0.010000');
    let doaBalanceTestIncrease = afterDaoBalance - beforeDaoBalance;
    let doaIncrease = priceOfListing * daoPercentage;
    expect(doaBalanceTestIncrease.toString()).to.equal(doaIncrease.toString());
    expect(doaIncrease + Number(beforeDaoBalance.toString())).to.equal(Number(afterDaoBalance.toString()));
    console.log("Dao Increase: ", doaIncrease);
    console.log("Dao Percentage: ", daoPercentage.toFixed(6));

    let pixelPercentage = await (afterPixelBalance - beforePixelBalance)/priceOfListing;
    expect(pixelPercentage.toFixed(6)).to.equal('0.020000');
    let pixelIncrease = priceOfListing * pixelPercentage;
    expect(pixelIncrease + Number(beforePixelBalance.toString())).to.equal(Number(afterPixelBalance.toString()));

    let rarityPercentage = await (afterRarityBalance - beforeRarityBalance)/priceOfListing;
    expect(rarityPercentage.toFixed(6)).to.equal('0.005000');
    let rarityIncrease = priceOfListing * rarityPercentage;
    expect(rarityIncrease + Number(beforeRarityBalance.toString())).to.equal(Number(afterRarityBalance.toString()));

    let totalFeePercentage = daoPercentage + pixelPercentage + rarityPercentage;
    console.log("Total Fee Percentage: ", totalFeePercentage);
    expect(totalFeePercentage.toFixed(3)).to.equal('0.035');
  });
});
