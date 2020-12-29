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
  const aavegotchiDiamondAddress = '0xDdC64462aEBA340cBE52E2B64eef20D0B23B5126'
  // Function: 0x3878bcdc portalAavegotchisSVG(uint256)
  // const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamondAddress)
  // console.log(await diamondLoupeFacet.facets())
  // const ownershipFacet = await ethers.getContractAt('OwnershipFacet', aavegotchiDiamondAddress)
  // console.log(await ownershipFacet.owner())

  await diamond.upgrade({
    diamondAddress: aavegotchiDiamondAddress,
    diamondCut: [
      // AavegotchiFacet -----------------------------------
      // [
      //   'AavegotchiFacet',
      //   diamond.FacetCutAction.Add,
      //   [
      //     'modifiedTraitsAndRarityScore(uint256)',
      //     'interact(uint256[])'
      //   ]
      // ],
      [
        'AavegotchiFacet',
        diamond.FacetCutAction.Replace,
        [
          'allAavegotchisOfOwner(address)'
        ]
      ]
      /// ///////////////////////////////////////////////////
      // ItemsFacet
      // [
      //   'ItemsFacet',
      //   diamond.FacetCutAction.Add,
      //   [
      //     'useConsumable(uint256,uint256[],uint256[])'
      //   ]
      // ],
      /// ///////////////////////////////////////////////////
      // Remove functions
      // [
      //   '',
      //   diamond.FacetCutAction.Remove,
      //   [
      //     'useConsumable(uint256,uint256)',
      //     'interact(uint256)',
      //     'modifiedRarityScore(uint256)'
      //   ]
      // ]
    ],
    txArgs: { gasLimit: 500000 }
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
