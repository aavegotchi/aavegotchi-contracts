const collaterals = [
  {
    name: "amDAI",
    kovanAddress: "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8",
    mainnetAddress: "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
    maticAddress: "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
    primaryColor: "#FF7D00",
    secondaryColor: "#F9D792",
    cheekColor: "#F4AF24",
    svgId: 0,
    eyeShapeSvgId: 18,
    modifiers: [1, 0, 0, 0, 0, 0],
    conversionRate: 1, // 1 DAI equals 1 DAI
  },
  {
    name: "amWETH",
    kovanAddress: "0x87b1f4cf9bd63f7bbd3ee1ad04e8f52540349347",
    mainnetAddress: "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e",
    maticAddress: "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390",
    primaryColor: "#000000",
    secondaryColor: "#FBDFEB",
    cheekColor: "#F696C6",
    svgId: 9,
    eyeShapeSvgId: 19,
    modifiers: [0, 1, 0, 0, 0, 0],
    conversionRate: 3150, // 2537 DAI = 1 ETH
  },
  {
    name: "amAAVE",
    kovanAddress: "0x6d93ef8093f067f19d33c2360ce17b20a8c45cd7",
    mainnetAddress: "0xFFC97d72E13E01096502Cb8Eb52dEe56f74DAD7B",
    maticAddress: "0x1d2a0E5EC8E5bBDCA5CB219e649B565d8e5c3360",
    primaryColor: "#B6509E",
    secondaryColor: "#CFEEF4",
    cheekColor: "#F696C6",
    svgId: 2,
    eyeShapeSvgId: 17,
    modifiers: [0, 0, 1, 0, 0, 0],
    conversionRate: 399,
  },
  {
    name: "amUSDT",
    kovanAddress: "0xff3c8bc103682fa918c954e84f5056ab4dd5189d",
    mainnetAddress: "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811",
    maticAddress: "0x60D55F02A771d515e077c9C2403a1ef324885CeC",
    primaryColor: "#26a17b",
    secondaryColor: "#aedcce",
    cheekColor: "#F696C6",
    svgId: 4,
    eyeShapeSvgId: 20,
    modifiers: [0, -1, 0, 0, 0, 0],
    conversionRate: 1,
  },
  {
    name: "amUSDC",
    kovanAddress: "0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0",
    mainnetAddress: "0xBcca60bB61934080951369a648Fb03DF4F96263C",
    maticAddress: "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
    primaryColor: "#2664BA",
    secondaryColor: "#D4E0F1",
    cheekColor: "#F696C6",
    svgId: 5,
    eyeShapeSvgId: 21,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 1, // 1 DAI = 1 USDC
  },
  {
    name: "amWBTC",
    kovanAddress: "0x62538022242513971478fcC7Fb27ae304AB5C29F",
    mainnetAddress: "0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656",
    maticAddress: "0x5c2ed810328349100A66B82b78a1791B101C9D61",
    primaryColor: "#FF5E00",
    secondaryColor: "#FFCAA2",
    cheekColor: "#F696C6",
    svgId: 10,
    eyeShapeSvgId: 22,
    modifiers: [0, 1, 0, 0, 0, 0],
    conversionRate: 46550,
  },
  {
    name: "amWMATIC",
    kovanAddress: "",
    mainnetAddress: "",
    maticAddress: "0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4",
    primaryColor: "#824EE2",
    secondaryColor: "#E6DCF9",
    cheekColor: "#F696C6",
    svgId: 11,
    eyeShapeSvgId: 23,
    modifiers: [0, 0, 0, 1, 0, 0],
    conversionRate: 2,
  },
  /*
  {
    name: "amGHST",
    kovanAddress: "0x3F382DbD960E3a9bbCeaE22651E88158d2791550",
    mainnetAddress: "0x3F382DbD960E3a9bbCeaE22651E88158d2791550",
    maticAddress: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    primaryColor: "#FA34F3",
    secondaryColor: "#FED2FC",
    cheekColor: "#FA34F3",
    svgId: 12,
    eyeShapeSvgId: 24,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 2.2, // 2 DAI equals 1 GHST
  },
  */
];

const testCollaterals = [
  {
    name: "GHST",
    kovanAddress: "",
    mainnetAddress: "",
    maticAddress: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    primaryColor: "#FF7D00",
    secondaryColor: "#F9D792",
    cheekColor: "#F4AF24",
    svgId: 0,
    eyeShapeSvgId: 1,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 50000, // 1 DAI equals 1 GHST
  },
];

function getCollaterals(network, ghstAddress) {
  const testing = ["hardhat", "localhost"].includes(network);
  const collateralArr = testing ? testCollaterals : collaterals;
  const collateralTypes = [];
  for (const collateralType of collateralArr) {
    const collateralTypeInfo = {
      primaryColor: "0x" + collateralType.primaryColor.slice(1),
      secondaryColor: "0x" + collateralType.secondaryColor.slice(1),
      cheekColor: "0x" + collateralType.cheekColor.slice(1),
      svgId: collateralType.svgId,
      eyeShapeSvgId: collateralType.eyeShapeSvgId,
      modifiers: collateralType.modifiers,
      conversionRate: collateralType.conversionRate,
      delisted: false,
    };
    const item = {};
    if (network === "kovan") {
      item.collateralType = collateralType.kovanAddress;
    } else if (network === "hardhat") {
      item.collateralType = ghstAddress;
    } else if (network === "mainnet") {
      item.collateralType = collateralType.mainnetAddress;
    } else if (network === "matic") {
      item.collateralType = collateralType.maticAddress;
    }
    item.collateralTypeInfo = collateralTypeInfo;
    collateralTypes.push(item);
  }

  return collateralTypes;
}

exports.getCollaterals = getCollaterals;
