let sideViewDimensions = [
  {
    name: 'Camo Hat',
    itemId: 1,
    side: 'back',
    dimensions: { x: 15, y: 2, width: 34, height: 12 }
  },
  {
    name: 'Camo Hat',
    itemId: 1,
    side: 'left',
    dimensions: { x: 14, y: 2, width: 30, height: 12 }
  },
  {
    name: 'Camo Hat',
    itemId: 1,
    side: 'right',
    dimensions: { x: 20, y: 2, width: 30, height: 12 }
  },
  {
    name: 'Camo Pants',
    itemId: 2,
    side: 'back',
    dimensions: { x: 15, y: 41, width: 34, height: 14 }
  }

]

sideViewDimensions = sideViewDimensions.map(value => {
  delete value.name
  return value
})

// console.log(sideViewDimensions)

exports.sideViewDimensions = sideViewDimensions
