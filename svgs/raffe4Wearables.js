/* eslint-disable  prefer-const */

const fs = require('fs')

const wearables = []
const sleeves = []

wearable('130_Fireball'),
wearable('131_DragonHorns'),
wearable('132_DragonWings'),
wearable('133_PointyHorns'), // Body wearable but not sleeves
wearable('134_L2Sign'),
bodyWearable('135_PolygonShirt'),
wearable('136_PolygonCap'),
wearable('137_VoteSign'),
bodyWearable('138_SnapshotShirt'),
wearable('139_SnapshotHat'),
wearable('140_ElfEars'),
wearable('141_GemstoneRing'),
wearable('142_PrincessTiara'),
wearable('143_GoldNecklace'),
wearable('144_PrincessHair'),
wearable('145_GodliLocks'), // MISSING GODLI LOCKS
wearable('146_ImperialMoustache'),
wearable('147_TinyCrown'),
wearable('148_RoyalScepter'),
wearable('149_RoyalCrown'),
bodyWearable('150_RoyalRobes'),
wearable('151_CommonRofl'),
wearable('152_UncommonRofl'), // MISSING 152_UncommonRofl
wearable('153_RareRofl'), // MISSING 153_RareRofl
wearable('154_LegendaryRofl'), // MISSING 154_LegendaryRofl
wearable('155_MythicalRofl'),
wearable('156_GodlikeRofl'),
wearable('157_LilPumpDrink'),
wearable('158_LilPumpGoatee'),
wearable('159_LilPumpShades'),
bodyWearable('160_LilPumpThreads'),
wearable('161_LilPumpDreads')

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
  wearables.push(svg)
}

function bodyWearable (name) {
  let svg = readSvg(name)
  // console.log(name, svg.length)
  const id = name.slice(0, name.indexOf('_'))
  wearables.push(svg)
  const leftSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-up">' + readSvg(`${name}LeftUp`) + '</g>'
  const leftSleeves = '<g class="gotchi-sleeves gotchi-sleeves-left gotchi-sleeves-down">' + readSvg(`${name}Left`) + '</g>'
  const rightSleevesUp = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-up">' + readSvg(`${name}RightUp`) + '</g>'
  const rightSleeves = '<g class="gotchi-sleeves gotchi-sleeves-right gotchi-sleeves-down">' + readSvg(`${name}Right`) + '</g>'
  svg = '<g>' + leftSleevesUp + leftSleeves + rightSleevesUp + rightSleeves + '</g>'
  sleeves.push({ id: id, svg: svg })
}

exports.wearablesSvgs = wearables
exports.sleevesSvgs = sleeves
