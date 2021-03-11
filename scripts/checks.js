/* global ethers hre */

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)
  const collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamondAddress)

  const diamondCreationBlock = 11516320
  const filter = collateralFacet.filters.IncreaseStake()
  const events = await collateralFacet.queryFilter(filter, diamondCreationBlock)
  for (const event of events) {
    console.log(event.args._tokenId.toString(), 'Amount increased:', event.args._stakeAmount.toString())
  }

  // const tokenIds = [7392, 4846, 3994, 2340, 1434, 1148, 969]
  // for (const tokenId of tokenIds) {
  //   const gotchi = await aavegotchiFacet.getAavegotchi(tokenId)
  //   console.log(gotchi)
  // }

  // const endBlock = 11516320 + ((11847048 - 11516320) / 2)

  // const abi = ['event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)']
  // const erc721 = await ethers.getContractAt(abi, aavegotchiDiamondAddress)
  // const filter = erc721.filters.Transfer(null, ethers.constants.AddressZero)
  // const transfers = await erc721.queryFilter(filter, diamondCreationBlock, endBlock)
  // const numTransfers = transfers.length
  // console.log('First batch transfers: ', numTransfers)
  // const users = new Set()
  // for (const transfer of transfers) {
  //   users.add(transfer.args._to)
  // }

  // for (let tokenId = 0; tokenId < 10000; tokenId++) {
  //   if (tokenId % 100 === 0) {
  //     console.log(tokenId)
  //   }
  //   let owner
  //   try {
  //     owner = await aavegotchiFacet.ownerOf(tokenId)
  //   } catch (err) {
  //     console.log('Token with error: ', tokenId)
  //     console.log(err)
  //     continue
  //   }

  //   const ownerTokenIds = await aavegotchiFacet.tokenIdsOfOwner(owner)
  //   let found = false
  //   for (const [index, ownerTokenId] of ownerTokenIds.entries()) {
  //     if (ownerTokenId === tokenId) {
  //       found = true
  //       const indexTokenId = await aavegotchiFacet.tokenOfOwnerByIndex(owner, index)
  //       if (!indexTokenId.eq(tokenId)) {
  //         console.log('Owner ', owner, ' token array does not match. Index position:', index, ' | with tokenId:', tokenId)
  //       }
  //       break
  //     }
  //   }
  //   if (found === false) {
  //     console.log('owner: ', owner, ' | With not found tokenId: ', tokenId)
  //   }
  // }

  //   const diamondCreationBlock = 11516320
  //   const endBlock = 11516320 + ((11847048 - 11516320) / 2)

  //   const abi = ['event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)']
  //   const erc721 = await ethers.getContractAt(abi, aavegotchiDiamondAddress)
  //   const filter = erc721.filters.Transfer()
  //   let transfers = await erc721.queryFilter(filter, diamondCreationBlock, endBlock)
  //   let numTransfers = transfers.length
  //   console.log('First batch transfers: ', numTransfers)
  //   const users = new Set()
  //   for (const transfer of transfers) {
  //     users.add(transfer.args._to)
  //   }
  //   transfers = await erc721.queryFilter(filter, endBlock)
  //   console.log('Second batch transfers: ', transfers.length)
  //   numTransfers += transfers.length
  //   console.log('Total transfers: ', numTransfers)
  //   for (const transfer of transfers) {
  //     users.add(transfer.args._to)
  //   }
  //   console.log(users.size)

  //   const aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamondAddress)

//   let count = 0
//   for (const user of users) {
//     count++
//     if (count % 100 === 0) {
//       console.log(count)
//     }
//     const tokenIds = await aavegotchiFacet.tokenIdsOfOwner(user)
//     for (const tokenId of tokenIds) {
//       const owner = await aavegotchiFacet.ownerOf(tokenId)
//       if (user !== owner) {
//         console.log('--------------')
//         console.log('Mismatch tokenId')
//         console.log('TokenId:', tokenId.toString())
//         console.log('User:', user, ' | Owner:', owner)
//       }
//     }
//   }
  // console.log(users)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
