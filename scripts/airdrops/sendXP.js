const { ethers } = require("hardhat");
const hre = require("hardhat");


const {aragonBatch1, aragonAddresses} = require('../../data/airdrops/aragon.tsx')

const {snapshot1Addresses, snapshot1Batch1, snapshot1Batch2} = require('../../data/airdrops/snapshot1.tsx')

const {snapshot2Addresses, snapshot2Batch1, snapshot2Batch2} = require('../../data/airdrops/snapshot2.tsx')

async function main(){
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()

  //Setup

  //For testing. For prod change to Ledger Signer
  console.log('impersonating')
     await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner]
    })
    const signer = ethers.provider.getSigner(owner)
 
    /*Aragon*/
  //  const addresses = aragonAddresses
  //  const data = aragonBatch1

    //Snapshot 1
    const addresses = snapshot1Addresses
   // const data = snapshot1Batch1
    const data = snapshot1Batch2

    //Snapshot 2
   // const addresses = snapshot2Addresses
   // const data = snapshot2Batch1
   // const data = snapshot2Batch2

    

    console.log('address length:',addresses.length)
    console.log('users length:',data.data.users.length)
 

  /*PARAMS*/

  const xpPerGotchi = 250

  const dao = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)

  for (let index = 0; index < addresses.length; index++) {
    const ownerAddress = addresses[index];
  
    const found = data.data.users.find((obj) => {
      return obj.id.toLowerCase() === ownerAddress.toLowerCase()
    })


      let tokenIDs = []
      let xp = []

      if (found) {
        found.gotchisOwned.forEach((gotchi) => {
          tokenIDs.push(gotchi.id)
          xp.push(xpPerGotchi)
      });

      if (tokenIDs.length > 0) {
        const tx =  await dao.grantExperience(tokenIDs,xp)
        await tx.wait()

        console.log(`${xpPerGotchi} Experience granted to ${tokenIDs.length} Aavegotchis owned by ${addresses[index]}. TXID: ${tx.hash}`)
      }
  
      }

    
      
    
    
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
  