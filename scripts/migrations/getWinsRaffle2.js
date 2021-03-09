/* global ethers */

async function getEntrantWins (rafflesContract, raffleId, entrant, raffleInfo) {
  const [, raffleItems, randomNumber] = raffleInfo
  const entries = await rafflesContract.getEntries(raffleId, entrant)
  const winsInfo = []
  for (const [entryIndex, entry] of entries.entries()) {
    if (entry.prizesClaimed) {
      return []
    }
    const raffleItem = raffleItems[entry.raffleItemIndex]
    const raffleItemPrizes = raffleItem.raffleItemPrizes
    for (const [raffleItemPrizeIndex, raffleItemPrize] of raffleItemPrizes.entries()) {
      const winningPrizeNumbers = []
      for (let prizeNumber = 0; prizeNumber < raffleItemPrize.prizeQuantity; prizeNumber++) {
        let ticketNumber = ethers.utils.solidityKeccak256(['uint256', 'uint24', 'uint256', 'uint256'], [randomNumber, entry.raffleItemIndex, raffleItemPrizeIndex, prizeNumber])
        ticketNumber = ethers.BigNumber.from(ticketNumber).mod(raffleItem.totalEntered)
        if (ticketNumber.gte(entry.rangeStart) && ticketNumber.lt(entry.rangeEnd)) {
          winningPrizeNumbers.push(prizeNumber)
        }
      }
      if (winningPrizeNumbers.length > 0 && raffleItemPrize.prizeAddress === '0xe54891774EED9277236bac10d82788aee0Aed313') {
        // Ticket numbers are numbers between 0 and raffleItem.totalEntered - 1 inclusive.
        // Winning ticket numbers are ticket numbers that won one or more prizes
        // Prize numbers are numbers between 0 and raffleItemPrize.prizeQuanity - 1 inclusive.
        // Prize numbers are used to calculate ticket numbers
        // Winning prize numbers are prize numbers used to calculate winning ticket numbers
        winsInfo.push({
          prizeAddress: raffleItemPrize.prizeAddress,
          quantity: winningPrizeNumbers.length, // // winning prize numbers (The length of the array is the number of prizes won)
          prizeId: raffleItemPrize.prizeId.toString() // ERC1155 type id (ERC1155 type of prize)
        })
      }
    }
  }
  return winsInfo
}

exports.getEntrantWins = getEntrantWins
