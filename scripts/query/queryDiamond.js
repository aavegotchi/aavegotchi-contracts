/* global ethers hre */
/* eslint-disable  prefer-const */

async function main () {
  // const startBlock, endBlock = 11516320
  // sale: 14505312
  // const startBlock, endBlock = 14502311
  const startBlock = 14500311
  const endBlock = 14568502
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let events = []
  let diamond
  diamond = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamondAddress)
  let filter
  filter = diamond.filters.ERC721ListingAdd()
  let results
  results = await diamond.queryFilter(filter, startBlock, endBlock)

  const tokenId = 4849

  for (const result of results) {
    if (result.args.erc721TokenId.eq(tokenId)) {
      events.push([result.blockNumber, 'Add Listing', result.args.listingId.toString(), result.args.seller])
    }
  }

  let diamond3
  let listingId
  diamond3 = await ethers.getContractAt('LibERC721Marketplace', aavegotchiDiamondAddress)
  listingId = 81123
  filter = diamond3.filters.ERC721ListingCancelled(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingCancelled', listingId, ''])
  }

  filter = diamond3.filters.ERC721ListingRemoved(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingRemoved', listingId, ''])
  }

  listingId = 81124
  filter = diamond3.filters.ERC721ListingCancelled(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingCancelled', listingId, ''])
  }

  filter = diamond3.filters.ERC721ListingRemoved(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingRemoved', listingId, ''])
  }

  listingId = 81152
  filter = diamond3.filters.ERC721ListingCancelled(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingCancelled', listingId, ''])
  }

  filter = diamond3.filters.ERC721ListingRemoved(listingId)
  results = await diamond3.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'ERC721ListingRemoved', listingId, ''])
  }

  let diamond2
  diamond2 = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamondAddress)
  filter = diamond2.filters.EquipWearables(tokenId)
  results = await diamond2.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'Equip', JSON.stringify(result.args._oldWearables, null, 0), JSON.stringify(result.args._newWearables, null, 0)])
  }

  diamond2 = await ethers.getContractAt('LibERC1155', aavegotchiDiamondAddress)
  filter = diamond2.filters.TransferToParent(null, tokenId)
  results = await diamond2.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'TransferToParent', result.args._tokenTypeId.toString(), result.args._value.toString()])
  }

  diamond2 = await ethers.getContractAt('LibERC1155', aavegotchiDiamondAddress)
  filter = diamond2.filters.TransferFromParent(null, tokenId)
  results = await diamond2.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    events.push([result.blockNumber, 'TransferFromParent', result.args._tokenTypeId.toString(), result.args._value.toString()])
  }

  // filter = diamond2.filters.TransferSingle()
  // results = await diamond2.queryFilter(filter, startBlock, endBlock)
  // for (const result of results) {
  //   if (result.args._id.eq(39) || result.args._id.eq(76) || result.args._id.eq(40)) {
  //     events.push([result.blockNumber, 'TransferSingle', result.args._from, result.args._to, result.args._id.toString(), result.args._value.toString()])
  //   }
  // }

  // filter = diamond2.filters.TransferBatch()
  // results = await diamond2.queryFilter(filter, startBlock, endBlock)
  // for (const result of results) {
  //   for (const id of result.args._ids) {
  //     if (id.eq(39) || id.eq(76) || id.eq(40)) {
  //       const ids = result.args._ids.map(value => value.toString())
  //       const values = result.args._values.map(value => value.toString())
  //       events.push([result.blockNumber, 'TransferBatch', result.args._from, result.args._to, ids, values])
  //       break
  //     }
  //   }
  // }

  filter = diamond.filters.ERC721ExecutedListing()
  results = await diamond.queryFilter(filter, startBlock, endBlock)
  for (const result of results) {
    if (result.args.erc721TokenId.eq(tokenId)) {
      events.push([result.blockNumber, 'Exec Listing', result.args.listingId.toString(), result.args.seller, result.args.buyer])
    }
  }

  events.sort((a, b) => {
    const blockNumberA = a[0]
    const blockNumberB = b[0]
    // console.log(blockNumberA, blockNumberB)
    if (blockNumberA > blockNumberB) {
      return 1
    } else if (blockNumberA < blockNumberB) {
      return -1
    }
    return 0
  })
  events = events.map(value => [value[0].toString(), ...value.slice(1)])
  for (const event of events) {
    console.log(JSON.stringify(event, null, 0))
  }

  // diamond = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)
  // const result = await diamond.getAavegotchi(7401)
  // console.log(result)

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
  // results = await diamond.queryFilter(filter, startBlock, endBlock)
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
  // const results = await diamond.queryFilter(filter, startBlock, endBlock)
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
  // const results = await erc721Marketplace.queryFilter(filter, startBlock, endBlock)
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
  // const executions = await erc721Marketplace.queryFilter(executeListingFilter, startBlock, endBlock)
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
