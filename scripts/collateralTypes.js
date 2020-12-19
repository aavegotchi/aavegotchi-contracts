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
    eyeShapeSvgId: 16,
    modifiers: [1, 0, 0, 0, 0, 0],
    conversionRate: 1 // 1 DAI equals 1 DAI
  },
  {
    name: 'aWETH',
    kovanAddress: '0xe2735Adf49D06fBC2C09D9c0CFfbA5EF5bA35649',
    mainnetAddress: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
    primaryColor: '#64438E',
    secondaryColor: '#EDD3FD',
    cheekColor: '#F696C6',
    svgId: 1,
    eyeShapeSvgId: 17,
    modifiers: [0, 1, 0, 0, 0, 0],
    conversionRate: 647 // 647 DAI = 1 ETH
  },
  {
    name: 'aAAVE',
    kovanAddress: '0x76c6D190639a946E894D4A480806EB1D18391E01',
    mainnetAddress: '0xFFC97d72E13E01096502Cb8Eb52dEe56f74DAD7B',
    primaryColor: '#0FA9C9',
    secondaryColor: '#CFEEF4',
    cheekColor: '#F696C6',
    svgId: 2,
    eyeShapeSvgId: 18,
    modifiers: [0, 0, 1, 0, 0, 0],
    conversionRate: 85 // 30 DAI = 1 LEND
  },

  {
    name: 'aLINK',
    kovanAddress: '0x9246CF386f1D38b80C92245c1bA2A3d0a013ceE0',
    mainnetAddress: '0xa06bC25B5805d5F8d82847D191Cb4Af5A3e873E0',
    primaryColor: '#0000B9',
    secondaryColor: '#D4DEF8',
    cheekColor: '#F696C6',
    svgId: 3,
    eyeShapeSvgId: 19,
    modifiers: [0, 0, 0, 1, 0, 0],
    conversionRate: 13
  },

  // {
  //   name: 'aSNX',
  //   kovanAddress: '',
  //   mainnetAddress: '',
  //   primaryColor: '#0E0C15',
  //   secondaryColor: '#DCDCDC',
  //   cheekColor: '#F696C6',
  //   svgId: 4,
  //   eyeShapeSvgId: 21,
  //   modifiers: [-1, 0, 0, 0, 0, 0],
  //   conversionRate: 30
  // },

  {
    name: 'aUSDT',
    kovanAddress: '0x29a63BE19cC7e1e6bfbeDeC08961b4A3285579C8',
    mainnetAddress: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
    primaryColor: '#282473',
    secondaryColor: '#B6D9FC',
    cheekColor: '#F696C6',
    svgId: 5,
    eyeShapeSvgId: 22,
    modifiers: [0, -1, 0, 0, 0, 0],
    conversionRate: 1
  },

  {
    name: 'aUSDC',
    kovanAddress: '0x32A4f93ffbb63213fB8c57b0b0E8Ea09698F3741',
    mainnetAddress: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
    primaryColor: '#2664BA',
    secondaryColor: '#D4E0F1',
    cheekColor: '#F696C6',
    svgId: 6,
    eyeShapeSvgId: 23,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 1 // 1 DAI = 1 USDC
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
    }
    item.collateralTypeInfo = collateralTypeInfo
    collateralTypes.push(item)
  }

  return collateralTypes
}

exports.getCollaterals = getCollaterals
