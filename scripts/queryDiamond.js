/* global ethers hre */

async function main () {
  const diamondCreationBlock = 11516320
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let diamond
  diamond = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)
  const result = await diamond.getAavegotchi(7401)
  console.log(result)

  // const erc1155Marketplace = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress)
  // const itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamondAddress)
  // for (let i = 0; i < 35000; i++) {
  //   if (i % 100 === 0) {
  //     console.log(i)
  //   }
  //   const result = await erc1155Marketplace.getERC1155Listing(i)
  //   if (result.sold === false && result.cancelled === false) {
  //     if (result.quantity.eq(0)) {
  //       console.log('Open listing has quantity as 0. ListingId:', result.listingId.toString())
  //     } else {
  //       const amount = await itemsFacet.balanceOf(result.seller, result.erc1155TypeId)
  //       if (result.quantity.gt(amount)) {
  //         console.log('Open listing quantity greater than users balance. ListingId: ', result.listingId.toString())
  //         console.log(result.quantity.toString(), ' and ', amount.toString())
  //       }
  //     }
  //   }
  // }

  // diamond = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress)
  // let filter
  // filter = diamond.filters.ERC1155ListingAdd()
  // let results
  // results = await diamond.queryFilter(filter, diamondCreationBlock)
  // let count = 0
  // for (const result of results) {
  //   count++
  //   if (result.args.erc1155TypeId.eq(65)) {
  //     console.log(result.args)
  //   }
  // }
  // console.log(count)

  // diamond = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamondAddress)
  // const result1 = await diamond.getERC1155Listing(1273)
  // console.log(result1)
  // console.log(result1.erc1155TypeId.toString())

  // diamond = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamondAddress)
  // const result2 = await diamond.balanceOf('0xa9bA6A24C6aeA0612d044c8Bd6727F694c84D3Ab', 65)
  // console.log(result2.toString())

  // diamond = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress)
  // for (let i = 20000; i < 20661; i++) {
  //   if (i % 500 === 0) {
  //     console.log(i)
  //   }
  //   const result = await diamond.getAavegotchiListing(i)
  //   if (result.listing_.cancelled === true || !result.listing_.timePurchased.eq(0)) {
  //     continue
  //   } else {
  //     if (result.listing_.seller !== result.aavegotchiInfo_.owner) {
  //       console.log('Listing ID:', result.listing_.listingId.toString(), ' | TokenId:', result.listing_.erc721TokenId.toString())
  //     }
  //   }
  // }

  // const result = await diamond.getAavegotchiListing(2038)
  // console.log(result)

  // console.log(result)

  // diamond = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)
  // const result = await diamond.getAavegotchi(805)

  // console.log(result)

  // const diamond = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamondAddress)
  // const filter = diamond.filters.SetAavegotchiName()
  // const results = await diamond.queryFilter(filter, diamondCreationBlock)
  // const name = 'CASPER THE FRIENDLY GHOST'
  // for (const result of results) {
  //   // console.log(result.args._tokenId.toString(), result.args._oldName, result.args._newName)
  //   if (result.args._oldName.match(/casper/i) || result.args._newName.match(/casper/i)) {
  //     console.log(result.args._tokenId.toString(), ' | ', "'" + result.args._oldName + "'", ',', "'" + result.args._newName + "'")
  //   }
  // }

  // const value = await diamond.aavegotchiNameAvailable('CASPER THE FRIENDLY GHOST')
  // console.log(value)

  // let diamond = await ethers.getContractAt('VrfFacet', aavegotchiDiamondAddress)
  // const tx = await diamond.drawRandomNumber(3323)
  // await tx.wait()

  // diamond = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)
  // const g = await diamond.getAavegotchi(3323)
  // console.log(g)
  // 2575
  // const tokenId = ethers.BigNumber.from('2575')
  // const erc721Marketplace = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress)
  // const filter = erc721Marketplace.filters.ERC721ListingAdd()
  // const results = await erc721Marketplace.queryFilter(filter, diamondCreationBlock)
  // for (const result of results) {
  //   if (result.args.erc721TokenId.eq(tokenId)) {
  //     const listing = await erc721Marketplace.getERC721Listing(result.args.listingId)
  //     console.log(listing)
  //     console.log(ethers.utils.formatEther(listing.priceInWei))
  //   }
  // }
  // console.log(executions)
  // const execution = executions[0]
  // console.log(ethers.utils.formatEther(execution.args.priceInWei))
  // console.log(executions)

  // const userAddress = '0x2A8D763a923d546E0A73c954A08BE37978E380CC'
  // const erc721Marketplace = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress)
  // // const executeListingFilter = erc721Marketplace.filters.ERC721ExecutedListing()
  // const executions = await erc721Marketplace.queryFilter(executeListingFilter, diamondCreationBlock)
  // for (const execution of executions) {
  //   if (execution.args.buyer === userAddress) {
  //     console.log(execution)
  //     console.log(ethers.utils.formatEther(execution.args.priceInWei))
  //   }
  // }
  // console.log(executions)
  // const execution = executions[0]
  // console.log(ethers.utils.formatEther(execution.args.priceInWei))
  // console.log(executions)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
