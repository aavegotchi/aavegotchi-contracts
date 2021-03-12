/* global ethers hre */

require('dotenv').config()

async function main () {
  const aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  const vouchersAbi = [
    'event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)',
    'event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)',
    'function balanceOfAll(address _owner) external view returns (uint256[] memory balances_)'
  ]

  const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_URL)

  const vouchersContract = await ethers.getContractAt(vouchersAbi, '0xe54891774EED9277236bac10d82788aee0Aed313', ethereumProvider)
  let vounchersFilter = vouchersContract.filters.TransferSingle()
  let transfers = await vouchersContract.queryFilter(vounchersFilter, 11230220)

  let owners = new Map()
  const itemMapping = new Map()
  for (let i = 0; i < 54; i++) {
    itemMapping.set(i.toString(), i + 1)
  }
  // console.log('mapping size:', itemMapping.size)
  // const keys = [...itemMapping.keys()]
  // const length = keys.length
  // console.log('keys length:', length)
  // for (let i = 0; i < length; i++) {
  //   console.log(keys[i] + '|' + itemMapping.get(keys[i]))
  // }

  function addTransferInfo (to, from, id, value) {
    id = id.toString()
    let toItems = owners.get(to)
    if (toItems === undefined) {
      toItems = new Map()
      owners.set(to, toItems)
    }
    let fromItems = owners.get(from)
    if (fromItems === undefined) {
      fromItems = new Map()
      owners.set(from, fromItems)
    }

    const toItemBalance = toItems.get(id)
    if (toItemBalance === undefined) {
      toItems.set(id, value)
    } else {
      toItems.set(id, toItemBalance.add(value))
    }

    const fromItemBalance = fromItems.get(id)
    if (fromItemBalance === undefined) {
      fromItems.set(id, value.mul(-1))
    } else {
      fromItems.set(id, fromItemBalance.sub(value))
    }
  }

  for (const transfer of transfers) {
    addTransferInfo(transfer.args._to, transfer.args._from, transfer.args._id, transfer.args._value)
  }

  vounchersFilter = vouchersContract.filters.TransferBatch()
  transfers = await vouchersContract.queryFilter(vounchersFilter, 11230220)
  for (const transfer of transfers) {
    const ids = transfer.args._ids
    const values = transfer.args._values
    for (let i = 0; i < ids.length; i++) {
      addTransferInfo(transfer.args._to, transfer.args._from, ids[i], values[i])
    }
  }
  const newOwners = new Map()
  // console.log('start:', owners.size)

  // remove owners that have not values
  for (const [owner, items] of owners.entries()) {
    for (const value of items.values()) {
      if (value.gt(0)) {
        const newItems = new Map()
        for (const [id, itemValue] of items.entries()) {
          if (itemValue.gt(0)) {
            newItems.set(id, itemValue)
          }
        }
        newOwners.set(owner, newItems)
        break
      }
    }
  }
  owners = newOwners
  // console.log('end:', owners.size)

  const addOwners = []
  let addOwnersBatch = []
  addOwners.push(addOwnersBatch)
  let count = 0
  for (const [owner, items] of owners.entries()) {
    if ([
      ethers.constants.AddressZero,
      '0x144d196Bf99a4EcA33aFE036Da577d7D66583DB6',
      '0xAFFF04FbFe54Cc985E25493A8F9D7114012D6d6F'
    ].includes(owner)) {
      continue
    }
    if (count === 10) {
      addOwnersBatch = []
      addOwners.push(addOwnersBatch)
      count = 0
    }
    count++
    const ids = []
    const values = []
    for (const [id, value] of items.entries()) {
      ids.push(itemMapping.get(id))
      // ids.push(id)
      values.push(value)
    }
    const addOwner = {
      owner: owner,
      ids: ids,
      values: values
    }
    addOwnersBatch.push(addOwner)
  }

  // console.log(JSON.stringify(addOwners, null, 2))
  // let totalOwners = 0
  // for (const batch of addOwners) {
  //   totalOwners += batch.length
  // }
  // console.log(totalOwners)
  // console.log(addOwners.length)

  // let count2 = 0
  // for (const addOwnerBatch of addOwners) {
  //   for (const addOwner of addOwnerBatch) {
  //     console.log('Count: ', count2)
  //     count2++
  //     const balanceItems = await vouchersContract.balanceOfAll(addOwner.owner)
  //     for (let itemId = 0; itemId < balanceItems.length; itemId++) {
  //       let ownerItemBalance = ethers.BigNumber.from('0')
  //       const id = itemId.toString()
  //       const index = addOwner.ids.indexOf(id)
  //       if (index !== -1) {
  //         ownerItemBalance = ethers.BigNumber.from(addOwner.values[index])
  //       }
  //       if (!ownerItemBalance.eq(0) && !balanceItems[itemId].eq(0)) {
  //         console.log(addOwner.owner, id, balanceItems[itemId].toString(), ownerItemBalance.toString())
  //       }
  //       if (!balanceItems[itemId].eq(ownerItemBalance)) {
  //         console.log('missmatch')
  //         console.log(addOwner.ids)
  //         throw Error('mismatch')
  //       }
  //     }
  //   }
  // }

  const voucherMigration = await ethers.getContractAt('VoucherMigrationFacet', aavegotchiDiamondAddress)
  let sendCount = 0
  for (const batch of addOwners) {
    sendCount++
    console.log('Send count: ', sendCount, 'Total:', batch.length)
    console.log('First address:', batch[0].owner)
    console.log(JSON.stringify(batch, null, 2))
    const tx = await voucherMigration.migrateVouchers(batch, { gasLimit: 19000000 })
    console.log('migration tx:', tx.hash)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Migration batch failed: ${tx.hash}`)
    }
  }
  console.log('Migration success!')

  // console.log(owners.size)

  // console.log(owners)
  // console.log(owners.size)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
