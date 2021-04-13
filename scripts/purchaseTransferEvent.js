/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  let aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  console.log(aavegotchiDiamondAddress)



  const trackedToken = await ethers.getContractAt('ShopFacet', aavegotchiDiamondAddress)
  console.log('Getting pool transfers in')
  let trackedTokenFilter = trackedToken.filters.PurchaseTransferItemsWithGhst()
  const trackedTokenTransfersIn = await trackedToken.queryFilter(trackedTokenFilter, 13000000)

  let uniqueAddresses = [];
  let uniqueItemIds = [];
  let item159Count = 0;
  let item160Count = 0;


  trackedTokenTransfersIn.forEach((event) => {

    //console.log('event:',event)
    const args = event.args

    if (!uniqueAddresses.includes(args._buyer)) {
      uniqueAddresses.push(args._buyer)
    }
  //  console.log('args',args)

    if (!uniqueItemIds.includes(args._itemIds)) {
      uniqueItemIds.push(args._itemIds)
    }

    event.args._itemIds.forEach((ids) => {
      if (ids.toString() === "160" || ids.toString() === "159") {
        console.log('event:',args._buyer, ids.toString(), event.transactionHash)

        if (uniqueAddresses.includes(args._buyer) && ids.toString() === "159") {
          item159Count++;
        } else if (uniqueAddresses.includes(args._buyer) && ids.toString() === "160") {
          item160Count++;
        }
      }
    });
  });

  //counter for times itemsIds have been purchased by uniqueAddress
  const itemPurchaseCount = uniqueItemIds.reduce((counts, value) => {
    const valueCount = (counts[ value ] === undefined ? 0 : counts[ value ])

    return { ...counts, ...{ [value] : valueCount + 1 } }

  }, {});

  for(const value in itemPurchaseCount) {
    console.log(`${ value } occours ${ itemPurchaseCount[value] } time(s)` );
  }

  console.log('Item 159 count: ', item159Count);
  console.log('Item 160 count: ', item160Count);
  console.log('# Unique Addresses:',uniqueAddresses.length);
  console.log('# Unique Items:',uniqueItemIds.length);
  // console.log('Items Array:',uniqueItemIds.toString());


//  console.log('transfera:',trackedTokenTransfersIn)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
