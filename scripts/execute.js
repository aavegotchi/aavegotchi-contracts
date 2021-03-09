
/* global ethers */

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  const diamond = await ethers.getContractAt('ERC1155MarketplaceFacet', diamondAddress)

  // executed: const listingIds = [179, 201, 409, 765, 1055, 1120, 1174, 1522, 2038, 2052, 2227, 2240, 2245, 2459, 3417, 3437, 3452, 3481, 3503, 4412, 4446]
  // executed: const listingIds = [4707, 4778, 4801, 4834, 6593, 7022, 10513, 10517, 10519, 10521]
  // const listingIds = [14987]
  const listingIds = [1273, 14733]
  const tx = await diamond.cancelERC1155Listings(listingIds)
  console.log('Execute tx:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`execution failed: ${tx.hash}`)
  }
  console.log('Execution complete: ', tx.hash)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
