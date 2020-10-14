/* global ethers */
// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line no-unused-vars
// const bre = require('@nomiclabs/buidler')
// const { ethers } = require('ethers')
// import { ethers } from 'ethers'

const diamond = require('diamond-util')
// const diamond = require('./index.js')

// const diamond = require('./diamond-util.js')

async function main () {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await bre.run('compile');

  const accounts = await ethers.getSigners()
  const account = await accounts[0].getAddress()
  console.log('Account: ' + account)
  console.log('---')

  // kovan
  const aavegotchiDiamondAddress = '0xF70406a9a17d8262E6de256D51cAF58Af8BBa8A2'
  // Function: 0x3878bcdc portalAavegotchisSVG(uint256)
  // const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamondAddress)
  // console.log(await diamondLoupeFacet.facets())
  const aavegotchiFacet = await ethers.getContractAt('AavegotchiFacet', aavegotchiDiamondAddress)
  console.log(await aavegotchiFacet.collaterals())

  const oldAddress = '0xa2facD0F9Ef0Bb75cFc64Ad692F79378b5C3673a'
//   const newAddress = '0xcba131c7fb05fe3c9720375cd86c99773faabf23'
//   const result = await aavegotchiFacet.removeCollateralType(oldAddress, { gasLimit: 500000 })
//   console.log(await result.wait())
  // console.log(result)
//   const result = await aavegotchiFacet.addCollateralTypes([
//     {
//         collateralType: 'newAddress',
//         primaryColor: '0x0FA9C9',
//         secondaryColor: '0xCFEEF4',
//         cheekColor: '0xf696c6',
//         svgId: 4
//     }
//   ])
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
