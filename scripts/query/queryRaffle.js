/* global ethers */
/* eslint-disable  prefer-const */

async function main () {
  let raffleContract = await ethers.getContractAt('RafflesContract', '0x6c723cac1E35FE29a175b287AE242d424c52c1CE')
  // let stats = await raffleContract.ticketStats(3, { gasLimit: 200000000000 })
  let stats = await raffleContract.ticketStats(3)
  console.log(stats)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
