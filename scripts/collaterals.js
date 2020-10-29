const collaterals = [
  {
    name: 'aETH',
    kovanAddress: '0xD483B49F2d55D2c53D32bE6efF735cB001880F79',
    mainnetAddress: '',
    primaryColor: '#64438E',
    secondaryColor: '#EDD3FD',
    cheekColor: '#f696c6',
    svgId: 3,
    eyeShapeSvgId: 17
  },
  {
    name: 'aDAI',
    kovanAddress: '0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a',
    mainnetAddress: '',
    primaryColor: '#FF7D00',
    secondaryColor: '#F9D792',
    cheekColor: '#f4af24',
    svgId: 2,
    eyeShapeSvgId: 16
  },
  {
    name: 'aUSDC',
    kovanAddress: '0x02F626c6ccb6D2ebC071c068DC1f02Bf5693416a',
    mainnetAddress: '',
    primaryColor: '#2664BA',
    secondaryColor: '#D4E0F1',
    cheekColor: '#f696c6',
    svgId: 9,
    eyeShapeSvgId: 23
  },
  {
    name: 'aSNX',
    kovanAddress: '0xb4D480f963f4F685F1D51d2B6159D126658B1dA8',
    mainnetAddress: '',
    primaryColor: '#0E0C15',
    secondaryColor: '#DCDCDC',
    cheekColor: '#f696c6',
    svgId: 7,
    eyeShapeSvgId: 21
  },
  {
    name: 'aTUSD',
    kovanAddress: '0x4c76f1b48316489e8a3304db21cdaec271cf6ec3',
    mainnetAddress: '',
    primaryColor: '#282473',
    secondaryColor: '#B6D9FC',
    cheekColor: '#f696c6',
    svgId: 8,
    eyeShapeSvgId: 22
  },
  /* {
         name: "aUSDT",
         kovanAddress: "0xA01bA9fB493b851F4Ac5093A324CB081A909C34B",
         mainnetAddress: "",
         primaryColor: "",
         secondaryColor: "",
    cheekColor: '#f696c6',
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
    cheekColor: '#f696c6',
    svgId:,
    eyeShapeSvgId:
     },
     */
  {
    name: 'aLINK',
    kovanAddress: '0xEC23855Ff01012E1823807CE19a790CeBc4A64dA',
    mainnetAddress: '',
    primaryColor: '#0000B9',
    secondaryColor: '#D4DEF8',
    cheekColor: '#f696c6',
    svgId: 5,
    eyeShapeSvgId: 19
  },
  {
    name: 'aLEND',
    kovanAddress: '0xcba131c7fb05fe3c9720375cd86c99773faabf23',
    mainnetAddress: '',
    primaryColor: '#0FA9C9',
    secondaryColor: '#CFEEF4',
    cheekColor: '#f696c6',
    svgId: 4,
    eyeShapeSvgId: 18
  }

  // Mainnet only
  /* {
        name:"aYFI",
        kovanAddress:"",
        mainnetAddress:"0x12e51E77DAAA58aA0E9247db7510Ea4B46F9bEAd",
        primaryColor:"#0074F9",
        secondaryColor:"#C8E1FD",
    cheekColor: '#f696c6',
    svgId: 10,
    eyeShapeSvgId:
    }
    */
]

function getCollaterals (network, ghstAddress) {
  const collateralTypes = []
  for (const collateralType of collaterals) {
    const item = {
      primaryColor:
        '0x' + collateralType.primaryColor.slice(1),
      secondaryColor:
        '0x' + collateralType.secondaryColor.slice(1),
      cheekColor:
        '0x' + collateralType.cheekColor.slice(1),
      svgId: collateralType.svgId,
      eyeShapeSvgId: collateralType.eyeShapeSvgId
    }
    if (network === 'kovan') {
      item.collateralType = collateralType.kovanAddress
    } else if (network === 'hardhat') {
      item.collateralType = ghstAddress
    } else if (network === 'mainnet') {
      item.collateralType = collateralType.mainnetAddress
    }
    collateralTypes.push(item)
  }
  return collateralTypes
}

exports.getCollaterals = getCollaterals
