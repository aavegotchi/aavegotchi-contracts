/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

const {addUniclyBaadge} = require('../addItemTypes/addUniclyBaadge')


const {uniclyBadgeGotchisOwned:data} = require('../../data/airdrops/uniclyBadge.tsx')

function addCommas (nStr) {
  nStr += ''
  const x = nStr.split('.')
  let x1 = x[0]
  const x2 = x.length > 1 ? '.' + x[1] : ''
  var rgx = /(\d+)(\d{3})/
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  }
  return x1 + x2
}

function strDisplay (str) {
  return addCommas(str.toString())
}

async function main () {

//  ADD THE UNICLY BADGE
//await addUniclyBaadge()

console.log('Sending Rewards!')

  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const gameManager = await (await ethers.getContractAt('DAOFacet', diamondAddress)).gameManager()
  console.log(gameManager)
  let signer
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [gameManager]
    })
    signer = await ethers.provider.getSigner(gameManager)
    

  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider,"hid","m/44'/60'/2'/0/0")
    console.log('signer:',signer)
  } else {
    throw Error('Incorrect network selected')
  }

  //STEP ZERO: CHOOSE BATCH SIZE
  const finalRewards = {}
  let maxProcess = 100
  
  //STEP ONE: INPUT THE BADGE IDS
  let badgeIds = [175]

  //STEP TWO: GET THE WINNERS (IN ORDER OF BADGE IDS)
  let awardsArray = [data.data.users]

  let tokenIds = []
  let _ids = []
  let _values = []

  //STEP THREE: COMBINE ALL OF THE WINNERS INTO A SINGLE OBJECT
  awardsArray.forEach((winnersArray, index) => {
    console.log('winners array:',winnersArray)
    let badgeId = badgeIds[index]
    for (let index = 0; index < winnersArray.length; index++) {
      const gotchiObject = winnersArray[index];
      const gotchisOwned = gotchiObject.gotchisOwned

      console.log('gotchis owned:',gotchisOwned)

      gotchisOwned.forEach((gotchiIdObj) => {

        finalRewards[gotchiIdObj.id] = [badgeId]
      });
    
       
    }

  });

  console.log('final rewards:',finalRewards)

  //STEP FOUR: SEPARATE THE DATA INTO THREE GROUPS 
  Object.keys(finalRewards).forEach((key) => {
    let values = finalRewards[key]
    tokenIds.push(key)
    _ids.push(values)
    _values.push(Array(values.length).fill(1))
  });


//STEP FIVE: BATCH THE DATA FOR TRANSACTION
  const txData = []
  
  let txGroup = []
  let tokenIdsNum = 0

  for (let index = 0; index < tokenIds.length; index++) {
      if (maxProcess < tokenIdsNum + 1) {
        txData.push(txGroup)
        txGroup = []
        tokenIdsNum = 0
      }

      txGroup.push({
        index
      })
      tokenIdsNum += 1
    }

    if (tokenIdsNum > 0) {
      txData.push(txGroup)
      txGroup = []
      tokenIdsNum = 0
    }

    const itemsTransferFacet = await ethers.getContractAt("ItemsTransferFacet",diamondAddress,signer)

    //STEP SIX: ITERATE THROUGH EACH BATCH AND TRANSFER 
    for (const [i, txGroup] of txData.entries()) {

    //Batch Info
    let batchBeginning = txGroup[0].index
    let batchEnd = txGroup[txGroup.length-1].index
    let batchTokenIds = tokenIds.slice(batchBeginning,batchEnd+1)
    let batchBadgeIds = _ids.slice(batchBeginning,batchEnd+1)
    let batchBadgeValues = _values.slice(batchBeginning,batchEnd+1)

    console.log('token ids:',batchTokenIds)
    console.log('badge ids:',batchBadgeIds)
    console.log('values:',batchBadgeValues)

    const itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",diamondAddress)
   


    console.log(`Sending Batch ${i} to tokenIDs ${batchBeginning}-${batchEnd}`)
   
    //Transaction
      const tx = await itemsTransferFacet.batchBatchTransferToParent(gameManager,diamondAddress,batchTokenIds,batchBadgeIds, batchBadgeValues)
      console.log('Tx hash:',tx.hash)
      let receipt = await tx.wait()
      console.log('Batch complete! Gas used:', strDisplay(receipt.gasUsed))
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`)
      }

      if (testing) {

        const balance = await itemsFacet.balanceOfToken(diamondAddress,batchTokenIds[0],batchBadgeIds[0][0])

        console.log(`Balance of tokenID ${batchTokenIds[0]} for badge ${batchBadgeIds[0][0]} is: ${balance.toString()}`)

        const balances = await itemsFacet.itemBalances(gameManager)
        balances.forEach((item) => {
          console.log(`Balance of ${item.itemId} after sending Batch ${i} is ${item.balance.toString()}`)
        });


      }

    
      
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
