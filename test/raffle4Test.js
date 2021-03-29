/* global describe it before ethers */
/* eslint-disable  prefer-const */

const { expect } = require('chai')

const { itemTypes } = require('../scripts/raffle4ItemTypes.js')

describe('Test Raffle4', function () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const raffleContractAddress = '0x6c723cac1E35FE29a175b287AE242d424c52c1CE'
  let itemsFacet
  let svgFacet
  let raffleContract

  before(async function () {
    svgFacet = await ethers.getContractAt('SvgFacet', diamondAddress)
    itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', diamondAddress)
    raffleContract = await ethers.getContractAt('RafflesContract', raffleContractAddress)
  })
  it('Test item quantities', async function () {
    let bals = await itemsFacet.itemBalances(raffleContractAddress)
    for (const itemType of itemTypes) {
      let foundItem = false
      for (const bal of bals) {
        if (bal.itemId.eq(itemType.svgId)) {
          foundItem = true
          let quantity
          if (itemType.svgId === 161) {
            quantity = 3
          } else if ([160, 159, 158, 157].includes(itemType.svgId)) {
            quantity = itemType.maxQuantity / 2
          } else {
            quantity = itemType.maxQuantity
          }
          expect(bal.balance).to.equal(quantity)
          break
        }
      }
      expect(foundItem).to.equal(true)
    }
  })
  it('Test item SVG', async function () {
    svg = await svgFacet.getItemSvg(154)
    console.log(svg)
    console.log()

    svg = await svgFacet.getItemSvg(155)
    console.log(svg)
    console.log()
    svg = await svgFacet.getItemSvg(156)
    console.log(svg)
    console.log()
    svg = await svgFacet.getItemSvg(157)
    console.log(svg)
    console.log()
    // svg = await svgFacet.getItemSvg(161)
    // console.log(svg)
  })
})
