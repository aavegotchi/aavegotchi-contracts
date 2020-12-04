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

  { // first collateral item is empty
    name: '',
    kovanAddress: '',
    mainnetAddress: '',
    primaryColor: '#000000',
    secondaryColor: '#000000',
    cheekColor: '#000000',
    svgId: 0,
    eyeShapeSvgId: 0,
    modifiers: [0, 0, 0, 0, 0, 0],
    conversionRate: 0
  },
  {
    name: 'aDAI',
    kovanAddress: '0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a',
    mainnetAddress: '',
    primaryColor: '#FF7D00',
    secondaryColor: '#F9D792',
    cheekColor: '#F4AF24',
    svgId: 0,
    eyeShapeSvgId: 16,
    modifiers: [1, 0, 0, 0, 0, 0],
    conversionRate: 1 // 1 DAI equals 1 DAI
  },
  {
    name: 'aETH',
    kovanAddress: '0xD483B49F2d55D2c53D32bE6efF735cB001880F79',
    mainnetAddress: '',
    primaryColor: '#64438E',
    secondaryColor: '#EDD3FD',
    cheekColor: '#F696C6',
    svgId: 1,
    eyeShapeSvgId: 17,
    modifiers: [0, 1, 0, 0, 0, 0],
    conversionRate: 3000 // 3000 DAI = 1 ETH
  },
  {
    name: 'aLEND',
    kovanAddress: '0xcba131c7fb05fe3c9720375cd86c99773faabf23',
    mainnetAddress: '',
    primaryColor: '#0FA9C9',
    secondaryColor: '#CFEEF4',
    cheekColor: '#F696C6',
    svgId: 2,
    eyeShapeSvgId: 18,
    modifiers: [0, 0, 1, 0, 0, 0],
    conversionRate: 30 // 30 DAI = 1 LEND
  },

  {
    name: 'aLINK',
    kovanAddress: '0xEC23855Ff01012E1823807CE19a790CeBc4A64dA',
    mainnetAddress: '',
    primaryColor: '#0000B9',
    secondaryColor: '#D4DEF8',
    cheekColor: '#F696C6',
    svgId: 3,
    eyeShapeSvgId: 19,
    modifiers: [0, 0, 0, 1, 0, 0],
    conversionRate: 1000
  },

  {
    name: 'aSNX',
    kovanAddress: '0xb4D480f963f4F685F1D51d2B6159D126658B1dA8',
    mainnetAddress: '',
    primaryColor: '#0E0C15',
    secondaryColor: '#DCDCDC',
    cheekColor: '#F696C6',
    svgId: 4,
    eyeShapeSvgId: 21,
    modifiers: [-1, 0, 0, 0, 0, 0],
    conversionRate: 30
  },

  {
    name: 'aTUSD',
    kovanAddress: '0x4c76f1b48316489e8a3304db21cdaec271cf6ec3',
    mainnetAddress: '',
    primaryColor: '#282473',
    secondaryColor: '#B6D9FC',
    cheekColor: '#F696C6',
    svgId: 5,
    eyeShapeSvgId: 22,
    modifiers: [0, -1, 0, 0, 0, 0],
    conversionRate: 100
  },

  {
    name: 'aUSDC',
    kovanAddress: '0x02F626c6ccb6D2ebC071c068DC1f02Bf5693416a',
    mainnetAddress: '',
    primaryColor: '#2664BA',
    secondaryColor: '#D4E0F1',
    cheekColor: '#F696C6',
    svgId: 6,
    eyeShapeSvgId: 23,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 500 // 500 DAI = 1 USDC
  }

  /* REN
{
  name: 'aLINK',
  kovanAddress: '0xEC23855Ff01012E1823807CE19a790CeBc4A64dA',
  mainnetAddress: '',
  primaryColor: '#0000B9',
  secondaryColor: '#D4DEF8',
  cheekColor: '#F696C6',
  svgId: 3,
  eyeShapeSvgId: 19
},
*/

  /* {
         name: "aUSDT",
         kovanAddress: "0xA01bA9fB493b851F4Ac5093A324CB081A909C34B",
         mainnetAddress: "",
         primaryColor: "",
         secondaryColor: "",
    cheekColor: '#F696C6',
    svgId:,
    eyeShapeSvgId:
     },
     */
  /* {
         name: "aBAT",
         kovanAddress: "0x5ad67de6Fb697e92a7dE99d991F7CdB77EdF5F74",
         mainnetAddress: "",
         primaryColor: "",
         secondaryColor: "",
    cheekColor: '#F696C6',
    svgId:,
    eyeShapeSvgId:
     },
     */

  // Mainnet only
  /* {
        name:"aYFI",
        kovanAddress:"",
        mainnetAddress:"0x12e51E77DAAA58aA0E9247db7510Ea4B46F9bEAd",
        primaryColor:"#0074F9",
        secondaryColor:"#C8E1FD",
    cheekColor: '#F696C6',
    svgId: 10,
    eyeShapeSvgId:
    }
    */
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
      conversionRate: collateralType.conversionRate
    }
    const item = {}
    if (network === 'kovan') {
      item.collateralType = collateralType.kovanAddress
    } else if (network === 'hardhat') {
      item.collateralType = ghstAddress
    } else if (network === 'mainnet') {
      item.collateralType = collateralType.mainnetAddress
    }
    item.collateralTypeInfo = collateralTypeInfo
    collateralTypes.push(item)
  }

  return collateralTypes
}

exports.getCollaterals = getCollaterals
