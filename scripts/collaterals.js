const collaterals = [
  {
    name: 'aETH',
    kovanAddress: '0xD483B49F2d55D2c53D32bE6efF735cB001880F79',
    mainnetAddress: '',
    primaryColor: '#64438E',
    secondaryColor: '#EDD3FD',
    cheekColor: '#3f696c6'
  },
  {
    name: 'aDAI',
    kovanAddress: '0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a',
    mainnetAddress: '',
    primaryColor: '#FF7D00',
    secondaryColor: '#F9D792',
    cheekColor: '#f4af24'
  },
  {
    name: 'aUSDC',
    kovanAddress: '0x02F626c6ccb6D2ebC071c068DC1f02Bf5693416a',
    mainnetAddress: '',
    primaryColor: '#2664BA',
    secondaryColor: '#D4E0F1',
    cheekColor: '#3f696c6'
  },
  {
    name: 'aSNX',
    kovanAddress: '0xb4D480f963f4F685F1D51d2B6159D126658B1dA8',
    mainnetAddress: '',
    primaryColor: '#0E0C15',
    secondaryColor: '#DCDCDC',
    cheekColor: '#3f696c6'
  },
  {
    name: 'aTUSD',
    kovanAddress: '0xA79383e0d2925527ba5Ec1c1bcaA13c28EE00314',
    mainnetAddress: '',
    primaryColor: '#282473',
    secondaryColor: '#B6D9FC',
    cheekColor: '#3f696c6'
  },
  /* {
         name: "aUSDT",
         kovanAddress: "0xA01bA9fB493b851F4Ac5093A324CB081A909C34B",
         mainnetAddress: "",
         primaryColor: "",
         secondaryColor: "",
     },
     */
  /* {
         name: "aBAT",
         kovanAddress: "0x5ad67de6Fb697e92a7dE99d991F7CdB77EdF5F74",
         mainnetAddress: "",
         primaryColor: "",
         secondaryColor: "",
     },
     */
  {
    name: 'aLINK',
    kovanAddress: '0xEC23855Ff01012E1823807CE19a790CeBc4A64dA',
    mainnetAddress: '',
    primaryColor: '#0000B9',
    secondaryColor: '#D4DEF8',
    cheekColor: '#3f696c6'
  },
  {
    name: 'aLEND',
    kovanAddress: '0xa2facD0F9Ef0Bb75cFc64Ad692F79378b5C3673a',
    mainnetAddress: '',
    primaryColor: '#0FA9C9',
    secondaryColor: '#CFEEF4',
    cheekColor: '#3f696c6'
  }

  // Mainnet only
  /* {
        name:"aYFI",
        kovanAddress:"",
        mainnetAddress:"0x12e51E77DAAA58aA0E9247db7510Ea4B46F9bEAd",
        primaryColor:"#0074F9",
        secondaryColor:"#C8E1FD",
    }
    */
]

function getCollaterals (network) {
  const collateralTypes = []
  for (const collateralType of collaterals) {
    const item = {
      primaryColor:
      '0x' + collateralType.primaryColor.slice(1),
      secondaryColor:
      '0x' + collateralType.secondaryColor.slice(1)
    }
    if (network === 'kovan' || network === 'buidlerevm') {
      item.collateralType = collateralType.kovanAddress
    } else if (network === 'mainnet') {
      item.collateralType = collateralType.mainnetAddress
    }
    collateralTypes.push(item)
  }
  return collateralTypes
}

exports.getCollaterals = getCollaterals
