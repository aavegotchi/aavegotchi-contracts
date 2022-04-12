/* eslint-disable  prefer-const */

const fs = require("fs");

export const baadges = [
  badge("Aavegotchi-RF-SZN2-Trophy-RARITY-1ST"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-1ST"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-1ST"),
  badge("Aavegotchi-RF-SZN2-Trophy-RARITY-2ND"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-2ND"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-2ND"),
  badge("Aavegotchi-RF-SZN2-Trophy-RARITY-3RD"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-3RD"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-3RD"),
  badge("Aavegotchi-RF-SZN2-Baadges-PLAAYER-RAANKED"),

  badge("Aavegotchi-RF-SZN2-Baadges-ROOKIE-OF-THE-YEAR"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-1ST"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-1ST"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-2ND"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-2ND"),
  badge("Aavegotchi-RF-SZN2-Trophy-KINSHIP-ROOKIE-3RD"),
  badge("Aavegotchi-RF-SZN2-Trophy-XP-ROOKIE-3RD"),

  badge("Aavegotchi-RF-SZN2-Baadges-RARITY-T10"),
  badge("Aavegotchi-RF-SZN2-Baadges-KINSHIP-T10"),
  badge("Aavegotchi-RF-SZN2-Baadges-XP-T10"),
  badge("Aavegotchi-RF-SZN2-Baadges-RARITY-T100"),
  badge("Aavegotchi-RF-SZN2-Baadges-KINSHIP-T100"),
  badge("Aavegotchi-RF-SZN2-Baadges-XP-T100"),

  badge("Aavegotchi-RF-SZN2-Baadges-XP-ROOKIE-T10"),
  badge("Aavegotchi-RF-SZN2-Baadges-KINSHIP-ROOKIE-T10"),
  badge("Aavegotchi-RF-SZN2-Baadges-XP-ROOKIE-T100"),
  badge("Aavegotchi-RF-SZN2-Baadges-KINSHIP-ROOKIE-T100"),
];

function stripSvg(svg: string) {
  // removes svg tag
  if (svg.includes("viewBox")) {
    svg = svg.slice(svg.indexOf(">") + 1);
    svg = svg.replace("</svg>", "");
  }
  return svg;
}

function readSvg(name: string) {
  return stripSvg(fs.readFileSync(`./svgs/baadges/${name}.svg`, "utf8"));
}

function badge(name: string) {
  const svg = readSvg(name);
  return svg;
}
