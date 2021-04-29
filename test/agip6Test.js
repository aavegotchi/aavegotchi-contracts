/* global describe it before ethers */
const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');

const { agip6Project } = require('../scripts/upgrades/upgrade-agip6.js');

describe("Fees", async() => {
  let aavegotchiDiamondAddress,
      erc721Facet,
      erc1155Facet,
      owner,
      aavegotchiOwner,
      ghstWhale;

  before(async() => {
    // aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
    // ghstWhale = '0x41c63953aA3E69aF424CE6873C60BA13857b31bB';

    await agip6Project();

    // erc721Facet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress);
    // erc1155Facet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress);
    //
    // await hre.network.provider.request({
    //   method: 'hardhat_impersonateAccount',
    //   params: [ghstWhale]
    // });
  });

  it.only("Should check fees amount", async() => {
    // buyer = await ethers.getSigner(ghstWhale);
    // const connectederc721Facet = await erc721Facet.connect(buyer);
    //
    // const execute721Listing = await connectederc721Facet.executeERC721Listing(4652);

    // console.log("ERC721 Executed: ", execute721Listing);
    console.log("hello");
  });
});
