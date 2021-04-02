
/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

// const { aragonBatch1, aragonAddresses } = require('../../data/airdrops/aragon.tsx')

// const { snapshot1Addresses, snapshot1Batch1, snapshot1Batch2 } = require('../../data/airdrops/snapshot1.tsx')

const { snapshot2Addresses, snapshot2Batch1, snapshot2Batch2 } = require('../../data/airdrops/snapshot2.tsx')

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let ownershipFacet
  const owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  console.log(owner)
  let signer
  const accounts = await ethers.getSigners()
  const devAccount = await accounts[0].getAddress()
  const testing = ['hardhat', 'localhost'].includes(hre.network.name)
  if (testing) {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [owner]
    })
    signer = await ethers.provider.getSigner(owner)
  } else if (hre.network.name === 'matic') {
    signer = new LedgerSigner(ethers.provider)
  } else {
    throw Error('Incorrect network selected')
  }
  ownershipFacet = (await ethers.getContractAt('OwnershipFacet', diamondAddress)).connect(signer)
  // const tx = await ownershipFacet.transferOwnership(devAccount)
  // const receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Error:: ${tx.hash}`)
  // }

  // complete!
  // Airdrop 1: Aragon
  // const addresses = aragonAddresses
  // const data = aragonBatch1
  // const xpPerGotchi = 250

  // complete!
  // Airdrop 2: Snapshot 1 Batch 1
  // const addresses = snapshot1Addresses
  // const data = snapshot1Batch1
  // const xpPerGotchi = 20

  // complete!
  // Airdrop 3: Snapshot 1 Batch 2
  // const addresses = snapshot1Addresses
  // const data = snapshot1Batch2
  // const xpPerGotchi = 20

  // complete!
  // Airdrop 4: Snapshot 2 Batch 1
  // const addresses = snapshot2Addresses
  // const data = snapshot2Batch1
  // const xpPerGotchi = 20

  // complete!
  // Airdrop 5: Snapshot 2 Batch 2
  // const addresses = snapshot2Addresses
  // const data = snapshot2Batch2
  // const xpPerGotchi = 20

  console.log('address length:', addresses.length)
  console.log('users length:', data.data.users.length)

  /* PARAMS */

  const dao = await ethers.getContractAt('DAOFacet', diamondAddress)
  // let start = false

  for (let index = 0; index < addresses.length; index++) {
    const ownerAddress = addresses[index]

    // if (ownerAddress === '0x491895e540a3c46d4596482824183bf11d527868') {
    //   start = true
    //   continue
    // }
    // if (start === false) {
    //   continue
    // }

    const found = data.data.users.find((obj) => {
      return obj.id.toLowerCase() === ownerAddress.toLowerCase()
    })

    const tokenIDs = []
    const xp = []

    if (found) {
      found.gotchisOwned.forEach((gotchi) => {
        tokenIDs.push(gotchi.id)
        xp.push(xpPerGotchi)
      })

      if (tokenIDs.length > 0) {
        const tx = await dao.grantExperience(tokenIDs, xp, { gasLimit: 15000000 })
        let receipt = await tx.wait()
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`)
        }

        console.log(`${index} | ${xpPerGotchi} Experience granted to ${tokenIDs.length} Aavegotchis owned by ${addresses[index]}. TXID: ${tx.hash}`)
      }
    }
  }
  if (testing === false) {
    console.log('Transferring ownership of diamond:', diamondAddress, 'to', owner)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    const tx = await ownershipFacet.transferOwnership('0x02491D37984764d39b99e4077649dcD349221a62')
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Error: ${tx.hash}`)
    }
    console.log('Transfer complete')
  }
}

//  });
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
