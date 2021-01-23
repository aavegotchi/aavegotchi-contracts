/* global ethers */
// 0, DAI Collateral
// 1, ETH Collateral
// 2, LEND Collateral
// 3, LINK Collateral
// 4, SNX Collateral
// 5, TUSD Collateral
// 6, USDC Collateral
// 7, YFI Collateral
// 8, REN Collateral

// Total length: 9

const collaterals = [
  {
    name: 'aDAI',
    kovanAddress: '0xdcf0af9e59c002fa3aa091a46196b37530fd48a8',
    mainnetAddress: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
    primaryColor: '#FF7D00',
    secondaryColor: '#F9D792',
    cheekColor: '#F4AF24',
    svgId: 0,
    eyeShapeSvgId: 18,
    modifiers: [1, 0, 0, 0, 0, 0],
    conversionRate: 1 // 1 DAI equals 1 DAI
  },
  {
    name: 'aWETH',
    kovanAddress: '0x87b1f4cf9bd63f7bbd3ee1ad04e8f52540349347',
    mainnetAddress: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
    primaryColor: '#64438E',
    secondaryColor: '#EDD3FD',
    cheekColor: '#F696C6',
    svgId: 1,
    eyeShapeSvgId: 19,
    modifiers: [0, 1, 0, 0, 0, 0],
    conversionRate: 731 // 647 DAI = 1 ETH
  },
  {
    name: 'aAAVE',
    kovanAddress: '0x6d93ef8093f067f19d33c2360ce17b20a8c45cd7',
    mainnetAddress: '0xFFC97d72E13E01096502Cb8Eb52dEe56f74DAD7B',
    primaryColor: '#B6509E',
    secondaryColor: '#CFEEF4',
    cheekColor: '#F696C6',
    svgId: 2,
    eyeShapeSvgId: 17,
    modifiers: [0, 0, 1, 0, 0, 0],
    conversionRate: 87 // 30 DAI = 1 LEND
  },

  {
    name: 'aLINK',
    kovanAddress: '0xed9044ca8f7cace8eaccd40367cf2bee39ed1b04',
    mainnetAddress: '0xa06bC25B5805d5F8d82847D191Cb4Af5A3e873E0',
    primaryColor: '#0000B9',
    secondaryColor: '#D4DEF8',
    cheekColor: '#F696C6',
    svgId: 3,
    eyeShapeSvgId: 20,
    modifiers: [0, 0, 0, 1, 0, 0],
    conversionRate: 12
  },

  {
    name: 'aUSDT',
    kovanAddress: '0xff3c8bc103682fa918c954e84f5056ab4dd5189d',
    mainnetAddress: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
    primaryColor: '#26a17b',
    secondaryColor: '#aedcce',
    cheekColor: '#F696C6',
    svgId: 4,
    eyeShapeSvgId: 0,
    modifiers: [0, -1, 0, 0, 0, 0],
    conversionRate: 1
  },

  {
    name: 'aUSDC',
    kovanAddress: '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0',
    mainnetAddress: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
    primaryColor: '#2664BA',
    secondaryColor: '#D4E0F1',
    cheekColor: '#F696C6',
    svgId: 5,
    eyeShapeSvgId: 21,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 1 // 1 DAI = 1 USDC
  },
  {
    name: 'aTUSD',
    kovanAddress: '0x39914adbe5fdbc2b9adeede8bcd444b20b039204',
    mainnetAddress: '0x101cc05f4A51C0319f570d5E146a8C625198e636',
    primaryColor: '#282473',
    secondaryColor: '#489ff8',
    cheekColor: '#F696C6',
    svgId: 8,
    eyeShapeSvgId: 24,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 1 // 1 DAI = 1 USDC
  },
  {
    name: 'aUNI',
    kovanAddress: '0x54DB4508e4043af82d21501d0643D63F5eB4d12C',
    mainnetAddress: '0xB9D7CB55f463405CDfBe4E90a6D2Df01C2B92BF1',
    primaryColor: '#FF2A7A',
    secondaryColor: '#FFC3DF',
    cheekColor: '#F696C6',
    svgId: 6,
    eyeShapeSvgId: 23,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 4 // 1 DAI = 1 USDC
  },
  {
    name: 'aYFI',
    kovanAddress: '0xf6c7282943beac96f6c70252ef35501a6c1148fe',
    mainnetAddress: '0x5165d24277cD063F5ac44Efd447B27025e888f37',
    primaryColor: '#0074F9',
    secondaryColor: '#C8E1FD',
    cheekColor: '#F696C6',
    svgId: 7,
    eyeShapeSvgId: 22,
    modifiers: [0, 0, 0, 1, 0, 0],
    conversionRate: 21772 // 1 DAI = 1 USDC
  }

]

function eightBitArrayToUint (array) {
  const uint = []
  for (const num of array) {
    const value = ethers.BigNumber.from(num).toTwos(8)
    uint.unshift(value.toHexString().slice(2))
  }
  return ethers.BigNumber.from('0x' + uint.join(''))
}

function getCollaterals (network, ghstAddress) {
  const collateralTypes = []
  for (const collateralType of collaterals) {
    const collateralTypeInfo = {
      primaryColor:
        '0x' + collateralType.primaryColor.slice(1),
      secondaryColor:
        '0x' + collateralType.secondaryColor.slice(1),
      cheekColor:
        '0x' + collateralType.cheekColor.slice(1),
      svgId: collateralType.svgId,
      eyeShapeSvgId: collateralType.eyeShapeSvgId,
      modifiers: eightBitArrayToUint(collateralType.modifiers),
      conversionRate: collateralType.conversionRate,
      delisted: false
    }
    const item = {}
    if (network === 'kovan') {
      item.collateralType = collateralType.kovanAddress
    } else if (network === 'hardhat') {
      item.collateralType = ghstAddress
    } else if (network === 'mainnet') {
      item.collateralType = collateralType.mainnetAddress
    } else if (network === 'mumbai') {
      item.collateralType = collateralType.mainnetAddress
    }

    item.collateralTypeInfo = collateralTypeInfo
    collateralTypes.push(item)
  }

  return collateralTypes
}

exports.getCollaterals = getCollaterals
