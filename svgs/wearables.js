const fs = require('fs')

const wearablesSvgs = [
  wearable("0_Void"),
  wearable("1_CamoHat"),
  wearable("2_CamoPants"), //body but doesn't have sleeves
  wearable("3_MK2Grenade"),
  wearable("4_SnowCamoHat"),
  wearable("5_SnowCamoPants"), //body but no sleeves
  wearable("6_M67Grenade"),
  wearable("7_MarineCap"),
  wearable("8_MarineJacket"), // bodyWearable("8_MarineJacket"),
  wearable("9_WalkieTalkie"),
  wearable("10_LinkWhiteHat"),
  wearable("11_MessDress"), // bodyWearable("11_MessDress"),
  wearable("12_LinkBubbly"),
  wearable("13_SergeyBeard"),
  wearable("14_SergeyEyes"),
  wearable("15_RedPlaid"), // bodyWearable("15_RedPlaid"),
  wearable("16_BluePlaid"),  //  bodyWearable("16_BluePlaid"),
  wearable("17_LinkCube"),
  wearable("18_AaveHeroMask"),
  wearable("19_AaveHeroShirt"), //bodyWearable("19_AaveHeroShirt"),
  wearable("20_AavePlush"),
  wearable("21_CaptainAaveMask"),
  wearable("22_CaptainAaveSuit"), //bodyWearable("22_CaptainAaveSuit"),
  wearable("23_CaptainAaveShield"),
  wearable("24_ThaaveHelmet"),
  wearable("25_ThaaveSuit"),//bodyWearable("25_ThaaveSuit"),
  wearable("26_ThaaveHammer"),
  wearable("27_MarcHair"),
  wearable("28_MarcOutfit"), //bodyWearable("28_MarcOutfit"),
  wearable("29_REKTSign"),
  wearable("30_JordanHair"),
  wearable("31_JordanSuit"),//bodyWearable("31_JordanSuit"),
  wearable("32_AaveFlag"),
  wearable("33_StaniHair"),
  wearable("34_StaniVest"), //bodyWearable("34_StaniVest"),
  wearable("35_AaveBoat"),
  wearable("36_HawaiianShirt"), //bodyWearable("36_HawaiianShirt"),
  wearable("37_FarmerHat"),
  wearable("38_FarmerPants"), //body but no sleeves
  wearable("39_FarmerStick")
]

function stripSvg(svg) {
  svg = svg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"  xmlns:v="https://vecta.io/nano">', '')
  svg = svg.replace('</svg>', '')
  return svg
}

function readSvg(name) {
  return stripSvg(fs.readFileSync(`./svgs/svgItems/${name}.svg`, 'utf8'))
}

function wearable(name) {
  return '<g class="gotchi-wearable">' + readSvg(name) + '</g>'
}

function bodyWearable(name, sleevesUp, sleevesDown) {
  body = readSvg(name)
  sleevesUp = readSvg(sleevesUp)
  sleevesUp = '<g class="gotchi-sleevesUp">' + sleevesUp + '</g>'
  sleevesDown = readSvg(sleevesDown)
  sleevesDown = '<g class="gotchi-sleevesDown">' + sleevesDown + '</g>'
  return '<g class="gotchi-wearable">' + body + sleevesUp + sleevesDown + '</g>'
}

exports.wearablesSvgs = wearablesSvgs
