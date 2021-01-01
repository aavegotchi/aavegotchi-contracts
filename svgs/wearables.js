const fs = require('fs')

const wearablesSvgs = [
  wearable('0_Void'),
  wearable('1_CamoHat'),
  wearable('2_CamoPants'), // body but doesn't have sleeves
  wearable('3_MK2Grenade'),
  wearable('4_SnowCamoHat'),
  wearable('5_SnowCamoPants'), // body but no sleeves
  wearable('6_M67Grenade'),
  wearable('7_MarineCap'),
  bodyWearable('8_MarineJacket'), // bodyWearable("8_MarineJacket"),
  wearable('9_WalkieTalkie'),
  wearable('10_LinkWhiteHat'),
  bodyWearable('11_MessDress'), // bodyWearable("11_MessDress"),
  wearable('12_LinkBubbly'),
  wearable('13_SergeyBeard'),
  wearable('14_SergeyEyes'),
  bodyWearable('15_RedPlaid'), // bodyWearable("15_RedPlaid"),
  bodyWearable('16_BluePlaid'), //  bodyWearable("16_BluePlaid"),
  wearable('17_LinkCube'),
  wearable('18_AaveHeroMask'),
  bodyWearable('19_AaveHeroShirt'), // bodyWearable("19_AaveHeroShirt"),
  wearable('20_AavePlush'),
  wearable('21_CaptainAaveMask'),
  bodyWearable('22_CaptainAaveSuit'), // bodyWearable("22_CaptainAaveSuit"),
  wearable('23_CaptainAaveShield'),
  wearable('24_ThaaveHelmet'),
  wearable('25_ThaaveSuit'), // bodyWearable("25_ThaaveSuit"),
  wearable('26_ThaaveHammer'),
  wearable('27_MarcHair'),
  bodyWearable('28_MarcOutfit'), // bodyWearable("28_MarcOutfit"),
  wearable('29_REKTSign'),
  wearable('30_JordanHair'),
  bodyWearable('31_JordanSuit'), // bodyWearable("31_JordanSuit"),
  wearable('32_AaveFlag'),
  wearable('33_StaniHair'),
  wearable('34_StaniVest'), // bodyWearable("34_StaniVest"),
  wearable('35_AaveBoat'),
  wearable('36_ETHMaxiGlasses'),
  bodyWearable('37_ETHTShirt'),
  wearable('38_32ETHCoin'),
  wearable('39_FoxyMask'),
  wearable('40_FoxyTail'),
  wearable('41_TrezorWallet'),
  wearable('42_NogaraEagleMask'),
  bodyWearable('43_NogaraEagleArmor'),
  wearable('44_DAOEgg'),
  wearable('45_ApeMask'),
  bodyWearable('46_HalfRektShirt'),
  wearable('47_WaifuPillow'),
  wearable('48_XibotMohawk'),
  wearable('49_CoderdanShades'),
  bodyWearable('50_GldnXrossRobe'),
  wearable('51_MudgenDiamond'),
  wearable('52_GalaxyBrain'),
  wearable('53_AllSeeingEyes'),
  bodyWearable('54_LlamacornShirt'),

  // For testing only
  wearable('55_HawaiianShirt'), // bodyWearable("36_HawaiianShirt"),
  // wearable('37_FarmerHat'),
  // wearable('38_FarmerPants'), // body but no sleeves
  // wearable('39_FarmerStick'),
  wearable('56_SantaGotchiHat')
]

function stripSvg (svg) {
  // removes svg tag
  if (svg.includes('viewBox')) {
    svg = svg.slice(svg.indexOf('>') + 1)
    svg = svg.replace('</svg>', '')
  }
  return svg
}

function readSvg (name) {
  return stripSvg(fs.readFileSync(`./svgs/svgItems/${name}.svg`, 'utf8'))
}

function wearable (name) {
  const svg = readSvg(name)
  // svg = `<g>${svg}</g>`
  return svg
}

function bodyWearable (name) {
  let svg = readSvg(name)
  const leftSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' + readSvg(`${name}LeftUp`) + '</g>'
  const leftSleeves = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' + readSvg(`${name}Left`) + '</g>'
  const rightSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' + readSvg(`${name}RightUp`) + '</g>'
  const rightSleeves = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' + readSvg(`${name}Right`) + '</g>'
  svg = '<g>' + svg + leftSleevesUp + leftSleeves + rightSleevesUp + rightSleeves + '</g>'
  return svg
}

exports.wearablesSvgs = wearablesSvgs
