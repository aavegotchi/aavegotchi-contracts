/* eslint-disable  prefer-const */

const fs = require('fs')

const badges = []

badge('175_uniclyBaadge')

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
