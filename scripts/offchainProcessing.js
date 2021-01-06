// setData - all set info
// equipped - an array of wearableIds
// traits - traits to modify with sets
// rarityScore - rarityScore to modify with sets
function modifyWithAavegotchiSets (setData, equipped, traits, rarityScore) {
  rarityScore = Number(rarityScore)
  traits = traits.map(v => Number(v))
  const getEquipmentIds = (acc, value) => {
    if (Number(value) > 0) {
      acc.push(Number(value))
    }
    return acc
  }
  equipped = equipped.reduce(getEquipmentIds, [])
  let numWearableIds = 0
  let setFound = null
  for (const wearableSet of setData) {
    const setWearableIds = wearableSet.wearableIds.reduce(getEquipmentIds, [])
    if (setWearableIds.every(wearableId => equipped.includes(wearableId)) && setWearableIds.length > numWearableIds) {
      numWearableIds = setWearableIds.length
      setFound = {
        name: wearableSet.name,
        wearableIds: setWearableIds,
        traitsBonuses: wearableSet.traitsBonuses.map(v => Number(v)),
        allowedCollaterals: wearableSet.allowedCollaterals.map(v => Number(v))
      }
    }
  }
  if (setFound != null) {
    rarityScore += Number(setFound.traitsBonuses[0])
    for (let i = 1; i < 5; i++) {
      const traitBonus = Number(setFound.traitsBonuses[i])
      const oldTraitValue = traits[i - 1]
      const finalTraitValue = traits[i - 1] + traitBonus
      traits[i - 1] = finalTraitValue
      // rarity score is more if trait is farther away from 50
      // rarity score is less if trait is closer to 50
      const rarityScoreChange = Math.abs(finalTraitValue - 50) - Math.abs(oldTraitValue - 50)
      rarityScore += rarityScoreChange
    }
  }

  return [setFound, traits, rarityScore]
}

exports.modifyWithAavegotchiSets = modifyWithAavegotchiSets
