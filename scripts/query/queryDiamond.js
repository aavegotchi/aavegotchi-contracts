/* global ethers hre */
/* eslint-disable  prefer-const */

// Function to fetch logs in smaller block ranges
async function fetchLogsInRange(contract, eventName, fromBlock, toBlock, step = 7000) {
  // let events = [];
  let eventCount = 0;
  for (let start = fromBlock; start <= toBlock; start += step) {
    const end = Math.min(start + step - 1, toBlock);
    const filter = contract.filters[eventName]();
    try {
      const logs = await contract.queryFilter(filter, start, end);
      eventCount += logs.length;
      // events = events.concat(logs);
    } catch (error) {
      console.error(`Error fetching logs from block ${start} to ${end}:`, error);
    }
  }
  return eventCount;
  // return events;
}

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const operations = [
    {operation: "Pet", facet: "LibAavegotchi", event: "AavegotchiInteract"},
    {operation: "Equip", facet: "LibItemsEvents", event: "EquipWearables"},
    {operation: "Lend", facet: "LibGotchiLending", event: "GotchiLendingAdd"},
    {operation: "Feed", facet: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", event: "UseConsumables"},
    {operation: "Rename", facet: "AavegotchiGameFacet", event: "SetAavegotchiName"},
    {operation: "Spend Points", facet: "AavegotchiGameFacet", event: "SpendSkillpoints"},
    {operation: "Respec", facet: "AavegotchiGameFacet", event: "ResetSkillpoints"},
    {operation: "Sell", facet: "ERC721MarketplaceFacet", event: "ERC721ListingAdd"},
    {operation: "Spirit Force - Increase", facet: "CollateralFacet", event: "IncreaseStake"},
    {operation: "Spirit Force - Decrease", facet: "CollateralFacet", event: "DecreaseStake"},
    // {operation: "Sacrifice", facet: "", event: "decreaseAndDestroy"}, // Transfer, DecreaseStake
    // {operation: "Gift", facet: "", event: "Transfer"}, // ERC721
    // {operation: "Auction", facet: "", event: "Auction_Initialized"}, // GBM
    // {operation: "Download image", facet: "", event: ""},
  ]

  // const startBlock = 11516320
  // const startBlock = 39165012 // forge diamond deployment
  const startBlock = 45901146 // first upgrade of new diamond owner
  const currentBlock = 59070724//await ethers.provider.getBlockNumber(); // Latest block
  console.log(`Current Block: ${currentBlock}`);

  let diamond
  for (const {facet,event, operation} of operations) {
    diamond = await ethers.getContractAt(facet, aavegotchiDiamondAddress)
    console.log(`Start of querying ${operation}....`);
    const startTime = Date.now()
    // const eventCount = await fetchLogsInRange(diamond, event, currentBlock - 10000, currentBlock);
    const eventCount = await fetchLogsInRange(diamond, event, startBlock, currentBlock);
    console.log(`End of querying ${operation}.... `, `Duration: ${(Date.now()-startTime) / 1000} seconds`);
    console.log(`Total number of ${operation}: ${eventCount}`);
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
