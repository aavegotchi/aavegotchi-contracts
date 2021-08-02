/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { rarityRoundOne, kinshipRoundOne, xpRoundOne } = require('../../data/rarityFarmingRoundOne.tsx')

const {rarityRoundRewards, kinshipRoundRewards, xpRoundRewards} = require("../../data/rarityFarmingRoundRewards.tsx")


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
  } else {
    throw Error('Incorrect network selected')
  }

  const maxProcess = 500

  const finalRewards = {}
  //First iterate through all of the rewards and add them up by Gotchi ID

  for (let index = 0; index < 5000; index++) {
    const rarityGotchiID = rarityRoundOne[index];
    const kinshipGotchiID = kinshipRoundOne[index]
    const xpGotchiID = xpRoundOne[index]
 
    const rarityReward = rarityRoundRewards[index]
    const kinshipReward = kinshipRoundRewards[index]
    const xpReward = xpRoundRewards[index]
 
    //Add Rarity
    if (finalRewards[rarityGotchiID]) finalRewards[rarityGotchiID] += Number(rarityReward)
    else {
      finalRewards[rarityGotchiID] = Number(rarityReward)
    }
    
 
    //Add Kinship
    if (finalRewards[kinshipGotchiID]) finalRewards[kinshipGotchiID] += Number(kinshipReward)
    else {
      finalRewards[kinshipGotchiID] = Number(kinshipReward)
   }
    
    //Add XP
    if (finalRewards[xpGotchiID]) finalRewards[xpGotchiID] += Number(xpReward)
    else {
      finalRewards[xpGotchiID] = Number(xpReward)
    }
   
 
  }
 

  

  let totalGhstSent = ethers.BigNumber.from(0)


  // group the data
  const txData = []
  let txGroup = []
  let tokenIdsNum = 0
  for (const gotchiID of Object.keys(finalRewards)) {

    let amount = finalRewards[gotchiID]
    let parsedAmount = ethers.BigNumber.from(ethers.utils.parseEther(amount.toString()))
    let finalParsed = parsedAmount.toString()

      if (maxProcess < tokenIdsNum + 1) {
        txData.push(txGroup)
        txGroup = []
        tokenIdsNum = 0
      }

      txGroup.push({
        tokenID:gotchiID,
        amount:amount,
        parsedAmount: finalParsed
      })
      tokenIdsNum += 1
    }

    if (tokenIdsNum > 0) {
      txData.push(txGroup)
      txGroup = []
      tokenIdsNum = 0
    }


  // send transactions
  let currentIndex = 0

  for (const txGroup of txData) {

    let tokenIds = []
    let amounts = []

    txGroup.forEach(sendData => {
      tokenIds.push(sendData.tokenID)
      amounts.push(sendData.parsedAmount)
     // console.log(`Sending ${sendData.parsedAmount} to ${sendData.tokenID}`)
    });

    let totalAmount = amounts.reduce((prev, curr) => {
      return ethers.BigNumber.from(prev).add(ethers.BigNumber.from(curr))
    })

    totalGhstSent = totalGhstSent.add(totalAmount)

    
    console.log(`Sending ${ethers.utils.formatEther(totalAmount)} GHST to ${tokenIds.length} Gotchis` )
  
    //  console.log('token ids:',tokenIds)
     // console.log('amounts:',amounts)
  
     
     
     const escrowFacet = await ethers.getContractAt("EscrowFacet")
  
     const tx = await escrowFacet.batchDepositGHST(tokenIds,amounts)
     let receipt = await tx.wait()
     console.log('Gas used:', strDisplay(receipt.gasUsed))
     if (!receipt.status) {
       throw Error(`Error:: ${tx.hash}`)
     }
 
  
      let receipt = await tx.wait()
      console.log('Gas used:', strDisplay(receipt.gasUsed))
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`)
      }
    

  
    

    
   /* const tx = await dao.grantExperience(tokenIds, Array(tokenIds.length).fill(xpAmount), { gasLimit: 20000000 })
    let receipt = await tx.wait()
    console.log('Gas used:', strDisplay(receipt.gasUsed))
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Airdropped XP to Aaavegotchis. Last address:', tokenIds[tokenIds.length-1])
    console.log('A total of', tokenIds.length, 'Aavegotchis')
    console.log('Current address index:', addressIndex)
    console.log('')
    */
  }

  console.log('Total GHST Sent:',ethers.utils.formatEther(totalGhstSent))
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
