/* global ethers hre */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let signer
  let tx
  let receipt
  let ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
  const owner = await ownershipFacet.owner()
  const accounts = await ethers.getSigners()
  const devAccountAddress = await accounts[0].getAddress()
  console.log('Diamond owner:', owner)
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

  ownershipFacet = ownershipFacet.connect(signer)
  console.log('Transferring ownership of diamond:', diamondAddress, 'to', devAccountAddress)
  tx = await ownershipFacet.transferOwnership(devAccountAddress)
  console.log('Transaction hash: ' + tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`)
  }
  console.log('Transaction complete')

  const dao = await ethers.getContractAt('DAOFacet', diamondAddress)

  // champions
  const champs = ['0x256530ce969f76EcE1cf66998aef0eAB6a940fA8',
    '0x3477823dc687e24147494b910b367CC85298DF8C',
    '0x115B65464043E9d0aD7422F95D1398b593c0Efd3',
    '0x7887829d28c2dc8C22BdFBa8325B14C2453cB4B6',
    '0x33F8F9dBF8ac7c47561BC3085A2137F4B1E62d3b']
  const quantities = [1, 1, 1, 1]
  const fullsets = [72, 73, 74, 75]

  console.log('Sending to the champions')
  for (let j = 0; j < champs.length; j++) {
    tx = await dao.mintItems(champs[j], fullsets, quantities)
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Not Sent: ${tx.hash}`)
    }
    console.log('Minted items', fullsets, 'and sent to', champs[j], 'at txn', tx.hash, j)
  }

  const recipients = ['0xF23f6Bd1a912c34D1d06C3989441D88Ec0204917',
    '0xe25b8Fa6E21f67F8dcccf1222D23Faf6f2e84A2f',
    '0xE707B57fc50B6C87A1Fd938B22DDd31225329d67',
    '0x3b486D3B5DedD0f87C6A58A2217CDC305Cd43a1b',
    '0x269e07Eac18b3681F3447263C28A766457Ff074B',
    '0x37eC905B4b508292C63A294C648a346413167EAF',
    '0x7C8263E38a6c0168015169A6B6f86EEf1f271d71',
    '0xEe6B77Ae75831d3696C2F91285614Ec7E492fB97',
    '0x8CDC596cB3526E2645ecE3BB7639BD095ed394Be',
    '0x436Bb9e1f02C9cA7164afb5753C03c071430216d',
    '0xb97ba0483F265B13CdA929070e09b9bc5a1F44D8',
    '0xDAef18B9b2E300Bf0C48D61f468dBae056053A02',
    '0xd2Da3A07Bf4Cd039D5f36D22F22b6Fe04bD56A86',
    '0x73e342982D5E02BC981c23413c5B5eA0bFa86dAa',
    '0x301a4125ae628984FA2B419EE8FB527A4873312e',
    '0x468eD2605e35c529d3dB7e61714bd6BdbB0571f5',
    '0x2c96108aB531c96989110C2A7506a4B0B68AE2A4',
    '0x291B1EbAF6c7B2b6a03581765b75f4bF55178383',
    '0xe839e6c6ac1cc105b23ec37fb2297d32fd5dcc92',
    '0x8dEBC343a259253Aa43Be5E47eB58a9e668E3cE2',
    '0x244FE02FBCf4dB4Ad96063B161F00e444FC54011',
    '0xDCd050FAd8eaef5DC11BD25E92014D21dCADA74D',
    '0xbf547518196c5194cbaf170e556dd595fadec34f',
    '0x0B000fD71Ec63066FEA195B1E724Ec8Aa52E9Bb8',
    '0x949Ea7852411F9C680f2cF3B63Ec41C51d7fA130',
    '0x36c1F88c4C1B540A3b5a3f9e8A0cd6F4f134aE42',
    '0x42c149107739AdCedE14Cf4b7b2C8573524a6040',
    '0x9a7bfFD0e6B4D5ffcb9bf3462eB375682a2073cb',
    '0xB270C422E3757463E58D1A1B423D91935Ef85dCc',
    '0xD7b2879C8922cd704E41E8CC1f18f6994D6B7C36',
    '0x69aC8b337794dAD862C691b00ccc3a89F1F3293d',
    '0x8eda9B461df12AcBBBeaad6591C5c6B96DA6B71D',
    '0x66633Cc6B84CD127A0bb84864c1a4eA0172469A6',
    '0x2CD61418C3d3d38Da2313dAB3ab64CD549d7B71e',
    '0xDc877A64812887ad8Aa4e53F5E0F7c2BdD62f53e',
    '0xab4787b17BfB2004C4B074Ea64871dfA238bd50c',
    '0x2FE1f1843fF87F529BEa00bc21Df8E0469053602',
    '0xC7ee509425388D7Bef92418b881576A1654D2105',
    '0xF7B10D603907658F690Da534E9b7dbC4dAB3E2D6',
    '0xc20122E283E1FFeB56fF6d77e739637D5eB03193',
    '0x92b83C2a7d211E9DEE19c270e462B091300A2fA0',
    '0xdDA56C4A6257664D87C6B5ECf01e33C6af74dcB9',
    '0x44bC008896076226ba6d5292721239B281dDF970',
    '0x40CF6bb888ca670e20139b1caA0BA0996f65371c',
    '0x4c39185a078B5666C372538231cB793A0928807b',
    '0x609949cCF906303Cfd4f2a8365Cc78a987284Fc7',
    '0xEBd54fD116D961C3bb9FB0999C1223066Aabae6c',
    '0xB37795f39c546D3511ba061d04783d987D1259a4',
    '0x7fCc3B4a05826c14afaFe6830F3511E9DDE48171',
    '0xb2993F007d2aBaECBb7C3529d78c5de0f1214888',
    '0x1FE6A806E0A9858359E16C58e4f84C790171596b',
    '0x77884B7aEaCcbf1B8A0C5a33E254391b9B49eA8e',
    '0x1C3134b83489053347099dD24c1550aa47a75006',
    '0xab8140174c6e46d78bed397b96da352ea38c2821',
    '0xa1cB3089eA47fFB4A70d66C283063f13E45cF859',
    '0x2fd0476478C01D0472b264e27F9D3C1b30DAda2A',
    '0xC36210AcFD04479aab24b10fcE6EE73F671CeeAc',
    '0xDDaf0EdA222845ecC24866E12017DB2f9a9A8D3b',
    '0x830e5d68e076F9074112013e187936aFE89cfc00',
    '0xB0d6A6a75396aAb4a9e82fB7c0F7822dA7e2A54a',
    '0x00ff6b7D26407A46Af2b631b4fa452a036d027E5',
    '0x6b0ABF7fcaa10EBAd592409d931571306B875CF4',
    '0x5346AFB94c08AC53dc8a18aa318Cf0383826eD68',
    '0x74C224e438445fDBB1382f71f7a861DB9a35e6D5',
    '0x222e859Cb744eBA5Dcaf5224f52b69Cb1bD72456',
    '0x4176D5d5813Bb33f1761dbEF41107Ec1728062f6',
    '0x6ea24f3cDDDF5B88F90B73A2d7df7ad9C0f9BEC4',
    '0x7E4724C60718A9F87CE51bcF8812Bf90D0b7B9Db',
    '0xDab13d338973daB9c4545D9f92D5D11cD3e1E6cD',
    '0x6Fa565DbD0FBbBb2aD7b0c5Ba31730AE09209610',
    '0x6a9F813fb3e6a8f7013dabD1695bAE1d49aE8481',
    '0x5285D6879f1de2fFf759E705B9DC89C3b841DbaB',
    '0xfdE0690222D27DA2677873a801C79241d6ad626c',
    '0x6e0FC44CcE1B49323185138217649B5E8996A159',
    '0x0236C75860d07e8d5aDD17C88B9DAc04472C2295',
    '0xE805Ff9b9bf7fbfd9EbE13379fC8E470025da0C7',
    '0x3E86eAC93A2dbB4faEB8709d77d451aeDA710eF9',
    '0x33D7ee674AA6A8CEdfA30fD8635091395BE3DA58',
    '0xB3895d9431Ca1f7D3B745398c42Ca6bbF5A280Ff',
    '0xE163c763Bdc10990185E61cF5e18C985939b8643']

  const wearableIds = [
    ...Array(25).fill(72),
    ...Array(5).fill(73),
    ...Array(15).fill(74),
    ...Array(35).fill(75)
  ]
  // console.log(wearableIds)

  for (let i = 0; i < recipients.length; i++) {
    const tx = await dao.mintItems(recipients[i], [wearableIds[i]], [1])
    const receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Not Sent: ${tx.hash}`)
    }
    console.log('Minted item', wearableIds[i], 'and sent to', recipients[i], 'at txn', tx.hash, i)
  }

  ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
  console.log('Transferring ownership of diamond:', diamondAddress, 'to', owner)
  tx = await ownershipFacet.transferOwnership(owner)
  console.log('Transaction hash: ' + tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`)
  }
  console.log('Transaction complete')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
