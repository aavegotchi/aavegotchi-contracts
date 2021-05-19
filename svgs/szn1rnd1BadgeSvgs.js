/* eslint-disable  prefer-const */

const fs = require('fs')

const badges = []

badge('163_szn1rnd1top10rarity')
badge('164_szn1rnd1top10kinship')
badge('165_szn1rnd1top10xp')
badge('166_szn1rnd1top100rarity')
badge('167_szn1rnd1top100kinship')
badge('168_szn1rnd1top100xp')

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
