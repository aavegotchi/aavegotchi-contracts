const collaterals = [
  {
    name: "GHST",
    kovanAddress: "",
    mainnetAddress: "",
    maticAddress: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    hardhatAddress: "",
    primaryColor: "#FF7D00",
    secondaryColor: "#F9D792",
    cheekColor: "#F4AF24",
    svgId: 0,
    eyeShapeSvgId: 16,
    modifiers: [0, 0, -1, 0, 0, 0],
    conversionRate: 50000 // 1 DAI equals 1 GHST
  }
];

function getCollaterals(network, ghstAddress) {
  const collateralTypes = [];
  for (const collateralType of collaterals) {
    const collateralTypeInfo = {
      primaryColor:
        "0x" + collateralType.primaryColor.slice(1),
      secondaryColor:
        "0x" + collateralType.secondaryColor.slice(1),
      cheekColor:
        "0x" + collateralType.cheekColor.slice(1),
      svgId: collateralType.svgId,
      eyeShapeSvgId: collateralType.eyeShapeSvgId,
      // modifiers: eightBitArrayToUint(collateralType.modifiers),
      modifiers: collateralType.modifiers,
      conversionRate: collateralType.conversionRate,
      delisted: false
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
