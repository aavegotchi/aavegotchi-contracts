/* eslint-disable  prefer-const */

const fs = require('fs')

const badges = []

badge('169_szn1rnd2top10rarity')
badge('170_szn1rnd2top10kinship')
badge('171_szn1rnd2top10xp')
badge('172_szn1rnd2top100rarity')
badge('173_szn1rnd2top100kinship')
badge('174_szn1rnd2top100xp')

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

function badge (name) {
  const svg = readSvg(name)
  badges.push(svg)
}

exports.badgeSvgs = badges
