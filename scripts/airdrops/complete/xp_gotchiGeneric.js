/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')
const { dinoswapSigProp:aavegotchis } = require('../../../data/airdrops/DinoSwapSigProp.tsx')

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
  const gameManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119" //await (await ethers.getContractAt('DAOFacet', diamondAddress)).gameManager()
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

  const dao = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)

  const maxProcess = 500
  const xpAmount = 10

  console.log(`Sending ${xpAmount} XP to ${aavegotchis.length} Aavegotchis!`)

  // group the data
  let txData = []
  let txGroup = []
  let tokenIdsNum = 0
  for (const gotchiID of aavegotchis) {
      if (maxProcess < tokenIdsNum + 1) {
        txData.push(txGroup)
        txGroup = []
        tokenIdsNum = 0
      }
      txGroup.push(gotchiID)
      tokenIdsNum += 1
    }

    if (tokenIdsNum > 0) {
      txData.push(txGroup)
      txGroup = []
      tokenIdsNum = 0
    }


    txData = txData.splice(2,4)
    

  // send transactions
  let addressIndex = 0
  for (const txGroup of txData) {

    console.log('tx group:',txGroup)

   const tokenIds = txGroup

    console.log(`Sending ${xpAmount} XP to ${tokenIds.length} Aavegotchis `)
    
    const tx = await dao.grantExperience(tokenIds, Array(tokenIds.length).fill(xpAmount))
    let receipt = await tx.wait()
    console.log('Gas used:', strDisplay(receipt.gasUsed))
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`)
    }
    console.log('Airdropped XP to Aaavegotchis. Last address:', tokenIds[tokenIds.length-1])
    console.log('A total of', tokenIds.length, 'Aavegotchis')
    console.log('Current address index:', addressIndex)
    console.log('')
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
