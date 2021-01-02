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
  wearable('55_AagentHeadset'),
  bodyWearable('56_AagentShirt'),
  wearable('57_AagentShades'),
  wearable('58_AagentPistol'),
  wearable('59_AagentFedoraHat'),
  wearable('60_WizardHat'),
  wearable('61_WizardHatLegendary'),
  wearable('62_WizardHatMythical'),
  wearable('63_WizardHatGodlike'),
  wearable('64_WizardStaff'),
  wearable('65_WizardStaffLegendary'),
  wearable('66_FutureWizardVisor'),
  wearable('67_FarmerStrawHat'),
  wearable('68_FarmerJeans'), // Body but no sleeves
  wearable('69_FarmerPitchfork'),
  wearable('70_FarmerHandsaw'),
  wearable('71_SantagotchiHat'),
  wearable('72_JaayHairpiece'),
  wearable('73_JaayGlasses'),
  bodyWearable('74_JaayHaoSuit'),
  wearable('75_OKexSign'),
  wearable('76_BigGHSTToken'),
  wearable('77_BitcoinBeanie'),
  wearable('78_SkaterJeans'), // Body but no sleeves
  wearable('79_Skateboard'),
  wearable('80_SushiHeadband'),
  wearable('81_SushiRobe'), // Body but not sleeves
  wearable('82_SushiRoll'),
  wearable('83_SushiKnife'),
  wearable('84_GentlemanHat'),
  bodyWearable('85_GentlemanSuit'),
  wearable('86_GentlemanMonocle'),
  wearable('87_MinerHelmet'),
  wearable('88_MinerJeans'), // Body but no sleeves
  wearable('89_MinerPickaxe'),
  wearable('90_PajamaHat'),
  bodyWearable('91_PajamaPants'),
  wearable('92_BedtimeMilk'),
  wearable('93_FluffyBlanket'),
  wearable('94_RunnerSweatband'),
  wearable('95_RunnerShorts'), // Body but no sleeves
  wearable('96_WaterBottle'),
  wearable('97_PillboxHat'),
  wearable('98_LadySkirt'), // Body but no sleeves
  wearable('99_LadyParasol'),
  wearable('100_LadyClutch'),
  wearable('101_WitchHat'),
  bodyWearable('102_WitchCape'),
  wearable('103_WitchWand'),
git 
  // For testing only
  wearable('105_HawaiianShirt') // bodyWearable("36_HawaiianShirt"),
  // wearable('37_FarmerHat'),
  // wearable('38_FarmerPants'), // body but no sleeves
  // wearable('39_FarmerStick'),
  // wearable('71_SantaGotchiHat')
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
